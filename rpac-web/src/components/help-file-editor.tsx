'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Save, Eye, EyeOff, Code, FileText, FolderOpen, GitBranch, GitCommit, 
         Bold, Italic, Link, List, ListOrdered, Heading1, Heading2, Heading3,
         Quote, CodeSquare, Table, Image as ImageIcon, Undo, Redo, Sparkles, Info, Map, Plus, Trash2, Edit, Check, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SecureOpenAIService } from '@/lib/openai-worker-service';
import { getAllUIVariables, type UITextVariable } from '@/lib/extract-ui-variables';

interface HelpFileEditorProps {
  filePath: string;
  initialContent: string;
  onClose: () => void;
  onSave?: (content: string) => void;
  pageContext?: {
    route?: string;
    pageTitle?: string;
    features?: string[];
    components?: string[];
  };
}

export default function HelpFileEditor({ filePath, initialContent, onClose, onSave, pageContext }: HelpFileEditorProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'mappings' | 'krister'>('editor');
  const [content, setContent] = useState(initialContent);
  const [showPreview, setShowPreview] = useState(true);
  const [fileName, setFileName] = useState(filePath.split('/').pop() || 'help.md');
  const [targetBranch, setTargetBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('Update help content');
  const [isSaving, setIsSaving] = useState(false);
  const [showFileOps, setShowFileOps] = useState(false);
  const [newFilePath, setNewFilePath] = useState(filePath);
  const [mounted, setMounted] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // AI assistant state
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [aiModifiedContent, setAiModifiedContent] = useState<string | null>(null);
  const [showAIChanges, setShowAIChanges] = useState(false);
  const [showDiffView, setShowDiffView] = useState(false);
  
  // Context browser state
  const [showContextBrowser, setShowContextBrowser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'sv' | 'en'>('sv');

  // Route mappings state
  const [routeMappings, setRouteMappings] = useState<Array<{route: string; params: string; helpFile: string}>>([]);
  const [editingMapping, setEditingMapping] = useState<number | null>(null);
  const [newMapping, setNewMapping] = useState({route: '', params: '', helpFile: ''});

  // KRISter system prompt state
  const [kristerPrompt, setKristerPrompt] = useState('');
  const [kristerPromptOriginal, setKristerPromptOriginal] = useState('');
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [promptSaveStatus, setPromptSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isLearning, setIsLearning] = useState(false);
  const [learnStatus, setLearnStatus] = useState<'idle' | 'learning' | 'success' | 'error'>('idle');
  const [learnedFilesCount, setLearnedFilesCount] = useState(0);

  // Dragging and resizing state
  const [position, setPosition] = useState({ x: window.innerWidth * 0.025, y: window.innerHeight * 0.025 });
  const [size, setSize] = useState({ width: window.innerWidth * 0.95, height: window.innerHeight * 0.95 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

  useEffect(() => {
    setMounted(true);
    loadRouteMappings();
    return () => setMounted(false);
  }, []);

  // Load KRISter prompt when switching to that tab
  useEffect(() => {
    if (activeTab === 'krister' && !kristerPrompt && !isLoadingPrompt) {
      loadKRISterPrompt();
    }
  }, [activeTab]);

  // Load route mappings from API/help loader
  const loadRouteMappings = async () => {
    try {
      const response = await fetch('/api/help-mappings');
      if (response.ok) {
        const data = await response.json();
        setRouteMappings(data.mappings || []);
      }
    } catch (error) {
      console.error('Failed to load route mappings:', error);
      // Load default mappings from krister-help-loader.ts logic
      setRouteMappings(getDefaultMappings());
    }
  };

  // Load KRISter system prompt
  const loadKRISterPrompt = async () => {
    setIsLoadingPrompt(true);
    try {
      const response = await fetch('/api/krister-prompt');
      if (response.ok) {
        const data = await response.json();
        setKristerPrompt(data.prompt || getDefaultKRISterPrompt());
        setKristerPromptOriginal(data.prompt || getDefaultKRISterPrompt());
      } else {
        // Fallback to default
        const defaultPrompt = getDefaultKRISterPrompt();
        setKristerPrompt(defaultPrompt);
        setKristerPromptOriginal(defaultPrompt);
      }
    } catch (error) {
      console.error('Failed to load KRISter prompt:', error);
      const defaultPrompt = getDefaultKRISterPrompt();
      setKristerPrompt(defaultPrompt);
      setKristerPromptOriginal(defaultPrompt);
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  // Save KRISter system prompt
  const saveKRISterPrompt = async () => {
    setPromptSaveStatus('saving');
    try {
      const token = process.env.NEXT_PUBLIC_ADMIN_HELP_EDIT_TOKEN || 
                    localStorage.getItem('admin_token');
      
      const response = await fetch('/api/krister-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: kristerPrompt,
          token 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setKristerPromptOriginal(kristerPrompt);
        setPromptSaveStatus('saved');
        console.log('[KRISter Prompt] Saved successfully. Commit:', data.commit);
        setTimeout(() => setPromptSaveStatus('idle'), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[KRISter Prompt] Save failed:', response.status, errorData);
        setPromptSaveStatus('error');
        setTimeout(() => setPromptSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to save KRISter prompt:', error);
      setPromptSaveStatus('error');
      setTimeout(() => setPromptSaveStatus('idle'), 3000);
    }
  };

  // Learn from help documentation
  const learnFromHelpDocs = async () => {
    setIsLearning(true);
    setLearnStatus('learning');
    setLearnedFilesCount(0);
    
    try {
      // Fetch all help files from GitHub
      const response = await fetch('/api/help/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'scan_and_update',
          includeAll: true 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLearnedFilesCount(data.filesProcessed || 0);
        setLearnStatus('success');
        
        // Reload the prompt to show updated knowledge
        await loadKRISterPrompt();
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setLearnStatus('idle');
          setLearnedFilesCount(0);
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Learn API error:', response.status, errorData);
        setLearnStatus('error');
        setTimeout(() => setLearnStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error learning from help docs:', error);
      setLearnStatus('error');
      setTimeout(() => setLearnStatus('idle'), 3000);
    } finally {
      setIsLearning(false);
    }
  };

  // Get default KRISter prompt from openai-worker-service.ts
  const getDefaultKRISterPrompt = () => {
    return `Du är KRISter, en svensk AI-assistent för samhällsberedskap och självförsörjning. Du hjälper användare med Beready-appen.

BEREADY-APPENS FUNKTIONER:
1. MITT HEM (Individuell beredskap):
   - Hemprofil: Hushållsstorlek, plats, husdjur
   - Resurslager: Hantera mat, vatten, mediciner, verktyg (MSB-baserat)
     * Lägg till resurser från MSB-katalogen eller egna
     * Dela resurser med dina samhällen (dela-knappen på varje resurs)
   - Odlingsplanering: Skapa odlingsplaner för självförsörjning
   - Odlingskalender: Månatliga sådd/skörd-uppgifter per klimatzon

2. LOKALT (Samhällesfunktioner):
   - Hitta/gå med i lokala samhällen baserat på postnummer
   - Se delade resurser från medlemmar (fliken "Delade från medlemmar")
   - Be om/begära resurser som andra delat
   - Chatt med samhällsmedlemmar
   - Samhällsresurser: Gemensam utrustning (pumpar, generatorer, etc)
   - Hjälpförfrågningar: Be om hjälp eller erbjud hjälp

3. REGIONALT (Länsnivå):
   - Regional översikt för hela länet (t.ex. Kronobergs län, Skåne län)
   - Statistik: Aktiva samhällen, totalt antal medlemmar, genomsnittlig beredskapspoäng
   - Ser alla lokala samhällen i länet med medlemsantal och resurser
   - Information från Länsstyrelsen (länk till officiell länssida)
   - Officiella krisresurser: Krisinformation.se, MSB.se, SMHI.se
   - Samordning mellan samhällen i samma län

4. INSTÄLLNINGAR:
   - Hemprofil, platsinfo, notifieringar

🎯 HUR-GÖR-JAG FRÅGOR (KRITISKT VIKTIGT!):
När användaren frågar "hur gör jag...", "hur delar jag...", "hur går jag med...", "hur skapar jag..." eller liknande:

**ANVÄND ALLTID HJÄLPDOKUMENTATION SOM SINGLE SOURCE OF TRUTH!**

Hjälpdokumentation laddas automatiskt baserat på sidkontext via t('krister.context_help.{topic}').
Du ska CITERA/ÅTERGE innehållet från hjälpdokumenten, inte skriva egna instruktioner.

KORREKT PROCESS:
1. Identifiera vilken hjälpdokumentation som är relevant (baserat på användarens fråga och nuvarande sida)
2. Ge svaret DIREKT från hjälpdokumentationen med fullständiga steg
3. Använd hjälptextens exakta instruktioner - citera dem ordagrant
4. Formatera tydligt med numrerade steg

EXEMPEL:
Fråga: "Hur delar jag resurser?" (användaren är på Mitt hem → Resurser)
✅ Använd innehållet från hjälpdokumentet (som redan är laddat i kontexten) och ge fullständiga steg:
"Så här delar du en resurs med ditt samhälle:
1. Gå till **Mitt hem** → **Resurser** (din personliga inventering)
2. Hitta resursen du vill dela
3. Klicka på dela-ikonen (📤) på resurskortet
4. Välj vilket samhälle du vill dela med
..." (resten från hjälpdokumentet)

REGEL: Hjälpdokumenten är SINGLE SOURCE OF TRUTH!
Ge FULLSTÄNDIGA svar från dokumentationen - användaren ska inte behöva klicka igen.

TONLÄGE OCH STIL:
- Du är en varm, hjälpsam kompis - INTE en "besserwisser"
- Använd vardagligt svenskt språk
- Gå DIREKT på svaret - ingen onödig bakgrundsinformation
- Fokusera på HANDLINGAR och KONKRETA TIPS
- Kort och kärnfullt - inga långa förklaringar

FEL: 
- Säg INTE "i Beready-appen" eller "använd appen" - användaren är redan här!
- Blanda ALDRIG språk! Endast SVENSKA i hela svaret - INGET engelska!
- Inga fraser som "Let me know", "I can help", "Feel free" etc.

Om användaren behöver byta sida/navigera: 
- Skriv sidan på svenska: "Mitt hem", "Lokalt", "Regionalt", "Inställningar"
- **VIKTIGT**: Formatera med fetstil och specifik text så systemet kan skapa automatiska åtgärdsknappar:
  ✅ "Gå till **Mitt hem**" → Skapar knapp "Gör det åt mig" som navigerar dit
  ✅ "Öppna **Lokalt**" → Skapar knapp "Gör det åt mig"
  ✅ "Gå till **Inställningar**" → Skapar knapp
  ✅ "Gå till **Odling**" → Navigerar till odlingssektionen`;
  };

  // Get default mappings based on current implementation
  const getDefaultMappings = () => {
    return [
      { route: '/', params: '', helpFile: 'dashboard.md' },
      { route: '/dashboard', params: '', helpFile: 'dashboard.md' },
      { route: '/individual', params: 'section=resources', helpFile: 'individual/resources.md' },
      { route: '/individual', params: 'section=cultivation', helpFile: 'individual/cultivation.md' },
      { route: '/individual', params: 'section=knowledge', helpFile: 'individual/knowledge.md' },
      { route: '/individual', params: 'section=coach', helpFile: 'individual/coach.md' },
      { route: '/local', params: 'tab=home', helpFile: 'local/home.md' },
      { route: '/local', params: 'tab=activity', helpFile: 'local/activity.md' },
      { route: '/local', params: 'tab=resources&resourceTab=shared', helpFile: 'local/resources-shared.md' },
      { route: '/local', params: 'tab=resources&resourceTab=owned', helpFile: 'local/resources-owned.md' },
      { route: '/local', params: 'tab=resources&resourceTab=help', helpFile: 'local/resources-help.md' },
      { route: '/local', params: 'tab=messages', helpFile: 'local/messages-community.md' },
      { route: '/local', params: 'tab=admin', helpFile: 'local/admin.md' },
      { route: '/local/discover', params: '', helpFile: 'local/discover.md' },
      { route: '/local/messages/direct', params: '', helpFile: 'local/messages-direct.md' },
      { route: '/regional', params: '', helpFile: 'regional/overview.md' },
      { route: '/settings', params: 'tab=profile', helpFile: 'settings/profile.md' },
      { route: '/settings', params: 'tab=security', helpFile: 'settings/security.md' },
      { route: '/settings', params: 'tab=notifications', helpFile: 'settings/notifications.md' },
      { route: '/settings', params: 'tab=privacy', helpFile: 'settings/privacy.md' },
      { route: '/settings', params: 'tab=preferences', helpFile: 'settings/preferences.md' },
      { route: '/super-admin', params: '', helpFile: 'admin/super-admin.md' },
      { route: '/auth/login', params: '', helpFile: 'auth/login.md' },
      { route: '/auth/register', params: '', helpFile: 'auth/register.md' },
    ];
  };

  // Save route mappings
  const saveRouteMappings = async () => {
    try {
      const response = await fetch('/api/help-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings: routeMappings })
      });
      if (response.ok) {
        alert('Route mappings sparade!');
      } else {
        alert('Fel vid sparande av mappings');
      }
    } catch (error) {
      console.error('Failed to save route mappings:', error);
      alert('Fel vid sparande av mappings');
    }
  };

  // Add new mapping
  const addMapping = () => {
    if (newMapping.route && newMapping.helpFile) {
      setRouteMappings([...routeMappings, { ...newMapping }]);
      setNewMapping({route: '', params: '', helpFile: ''});
    }
  };

  // Delete mapping
  const deleteMapping = (index: number) => {
    setRouteMappings(routeMappings.filter((_, i) => i !== index));
  };

  // Update mapping
  const updateMapping = (index: number, field: 'route' | 'params' | 'helpFile', value: string) => {
    const updated = [...routeMappings];
    updated[index] = { ...updated[index], [field]: value };
    setRouteMappings(updated);
  };

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const newX = Math.max(0, Math.min(window.innerWidth - size.width, position.x + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - size.height, position.y + deltaY));
      
      setPosition({ x: newX, y: newY });
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position, size]);

  // Handle resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = position.x;
      let newY = position.y;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(400, Math.min(window.innerWidth - position.x, resizeStart.width + deltaX));
      }
      if (resizeDirection.includes('w')) {
        const maxDelta = resizeStart.width - 400;
        const constrainedDelta = Math.min(deltaX, Math.min(maxDelta, resizeStart.posX));
        newWidth = resizeStart.width - constrainedDelta;
        newX = resizeStart.posX + constrainedDelta;
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(300, Math.min(window.innerHeight - position.y, resizeStart.height + deltaY));
      }
      if (resizeDirection.includes('n')) {
        const maxDelta = resizeStart.height - 300;
        const constrainedDelta = Math.min(deltaY, Math.min(maxDelta, resizeStart.posY));
        newHeight = resizeStart.height - constrainedDelta;
        newY = resizeStart.posY + constrainedDelta;
      }
      
      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, resizeDirection]);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({ 
      x: e.clientX, 
      y: e.clientY, 
      width: size.width, 
      height: size.height,
      posX: position.x,
      posY: position.y
    });
  };

  const toggleSection = (section: string) => {
    // No longer needed - removed expandedSections
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Insert text at cursor position
  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);
    const newContent = before + text + after;
    
    setContent(newContent);
    addToHistory(newContent);
    
    // Move cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // Insert variable reference at cursor
  const insertVariable = (variable: { key: string; value: string }) => {
    const variableRef = `{{${variable.key}}}`;
    insertAtCursor(variableRef);
  };

  // Replace variable references in preview
  const renderPreviewContent = (markdown: string) => {
    let processedMarkdown = markdown;
    
    // Replace all variable references with their values
    uiTextVariables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
      processedMarkdown = processedMarkdown.replace(regex, `**${variable.value}**`);
    });
    
    return processedMarkdown;
  };

  // Compute line-by-line diff for visualization
  const computeDiff = (original: string, modified: string) => {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    
    const diff: Array<{
      lineNum: number;
      original: string;
      modified: string;
      type: 'unchanged' | 'modified' | 'added' | 'removed';
    }> = [];
    
    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || '';
      const modLine = modifiedLines[i] || '';
      
      let type: 'unchanged' | 'modified' | 'added' | 'removed' = 'unchanged';
      
      if (origLine === modLine) {
        type = 'unchanged';
      } else if (!origLine && modLine) {
        type = 'added';
      } else if (origLine && !modLine) {
        type = 'removed';
      } else {
        type = 'modified';
      }
      
      diff.push({
        lineNum: i + 1,
        original: origLine,
        modified: modLine,
        type
      });
    }
    
    return diff;
  };

  // Get ALL UI text variables dynamically from sv.json
  const allUIVariables = getAllUIVariables();

  // UI text variables from sv.json (all extracted variables)
  const uiTextVariablesSv = allUIVariables;

  // UI text variables from en.json (using same for now since en.json doesn't exist)
  const uiTextVariablesEn = allUIVariables;

  // Select variables based on language
  const uiTextVariables = selectedLanguage === 'sv' ? uiTextVariablesSv : uiTextVariablesEn;

  // Filter variables based on search
  const filteredVariables = uiTextVariables.filter(v => 
    searchTerm === '' || 
    v.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by category
  const groupedVariables = filteredVariables.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {} as Record<string, typeof uiTextVariables>);

  // Insert markdown formatting at cursor
  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newContent = 
      content.substring(0, start) + 
      before + textToInsert + after + 
      content.substring(end);
    
    setContent(newContent);
    addToHistory(newContent);
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const addToHistory = (newContent: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setContent(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setContent(history[historyIndex + 1]);
    }
  };

  const handleSaveToGitHub = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/help/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: newFilePath,
          content,
          branch: targetBranch,
          message: commitMessage
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Save API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        // Show helpful message for missing GitHub token
        if (errorData.error?.includes('not configured')) {
          alert(
            'GitHub-integration ej konfigurerad\n\n' +
            'För att spara filer direkt till GitHub behöver du:\n' +
            '1. Skapa en GitHub Personal Access Token\n' +
            '2. Lägg till GITHUB_TOKEN i .env.local\n' +
            '3. Starta om dev-servern\n\n' +
            'Se docs/HELP_EDITOR_SETUP.md för instruktioner.\n\n' +
            'Alternativt: Kopiera texten manuellt och commita via Git.'
          );
          return;
        }
        
        throw new Error(errorData.error || errorData.details || 'Failed to save file');
      }

      const result = await response.json();
      console.log('Save successful:', result);
      alert('File saved successfully to ' + targetBranch);
      if (onSave) onSave(content);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save file: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIRewrite = async () => {
    if (!aiPrompt.trim()) {
      alert('Skriv in en instruktion för AI:n');
      return;
    }

    // Add user message to chat
    const userMessage = aiPrompt;
    setAiChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiPrompt('');
    setIsAIProcessing(true);

    try {
      // Check if user wants codebase search
      const needsCodeSearch = /kolla.*kodbas|sök.*kod|hitta.*komponent|leta.*fil|visa.*implementation|how.*implement|find.*code/i.test(userMessage);
      
      const codeContext = '';
      if (needsCodeSearch) {
        // Inform user that codebase search is not available in production
        setAiChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: 'ℹ️ Kodbasökning är inte tillgänglig i produktionsmiljön. AI kommer att svara baserat på tillgänglig kontext från sidan.'
        }]);
        
        // Note: Codebase search requires Node.js filesystem which isn't available in Edge runtime
        // Keeping this code commented for potential future implementation with a different approach
        /*
        try {
          const searchTerms = userMessage
            .replace(/kolla i kodbasen och|skapa en instruktion för|how to|find/gi, '')
            .trim();

          const searchResponse = await fetch('/api/codebase/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              query: searchTerms,
              fileTypes: ['tsx', 'ts', 'jsx', 'js'],
              maxResults: 5
            })
          });

          if (searchResponse.ok) {
            const searchResults = await searchResponse.json();
            codeContext = `
KODBASKONTEXT (från sökning):
${searchResults.results.map((r: any) => `
Fil: ${r.filePath}
Relevans: ${r.score}
\`\`\`${r.language || 'typescript'}
${r.content}
\`\`\`
`).join('\n')}
`;
          }
        } catch (searchError) {
          console.error('Code search error:', searchError);
        }
        */
      }

      // Build rich context for the AI
      const contextInfo = `
FILKONTEXT:
- Filnamn: ${fileName}
- Sökväg: ${filePath}
${pageContext?.route ? `- Rutt/Sida: ${pageContext.route}` : ''}
${pageContext?.pageTitle ? `- Sidtitel: ${pageContext.pageTitle}` : ''}

FUNKTIONER PÅ SIDAN:
${pageContext?.features ? pageContext.features.map(f => `- ${f}`).join('\n') : '- (Ingen information tillgänglig)'}

KOMPONENTER SOM ANVÄNDS:
${pageContext?.components ? pageContext.components.map(c => `- ${c}`).join('\n') : '- (Ingen information tillgänglig)'}

${codeContext}

APPLIKATIONSKONTEXT:
- Detta är hjälpdokumentation för RPAC (Rural Preparedness & Agriculture Community)
- RPAC hjälper användare med:
  * Odlingsplanering och självförsörjning
  * Resurshantering (mat, vatten, energi, hygien)
  * Lokal samhällsbyggande (samhällen/communities)
  * Krisförberedelse och långsiktig planering
  * Regional samordning av resurser
- Målgrupp: Svenska användare från nybörjare till experter inom odling och självförsörjning
- Användarroller: Individ, Lokal medlem/admin, Regional koordinator, Super admin
`;

      const fullPrompt = `${contextInfo}

NUVARANDE MARKDOWN-INNEHÅLL:
\`\`\`markdown
${content}
\`\`\`

ANVÄNDARENS INSTRUKTION:
${userMessage}

UPPGIFT:
Omskriv markdown-dokumentationen baserat på användarens instruktion.
- Tänk på sidans syfte och funktioner
- Anpassa språket till målgruppen
- Använd konkreta exempel från RPAC-kontexten när det är relevant
- Behåll eller förbättra strukturen (rubriker, listor, steg)
- Var tydlig och actionorienterad

Svara ENDAST med den omskrivna markdown-texten, inga förklaringar eller kommentarer.`;

      const response = await SecureOpenAIService.generatePersonalCoachResponse({
        userProfile: {
          id: 'editor-user',
          displayName: 'Help Editor',
          email: '',
          climateZone: 'zone_1_southern',
          experienceLevel: 'expert',
          gardenSize: 'medium'
        },
        userQuestion: fullPrompt,
        chatHistory: [],
        appContext: {
          currentPage: pageContext?.route || 'help-editor',
          helpDocumentation: {
            title: fileName,
            description: 'Editing help documentation'
          }
        }
      });
      
      if (response) {
        // Extract markdown from response (in case AI added explanations)
        const markdownMatch = response.match(/```markdown\n([\s\S]*?)\n```/);
        const cleanedResponse = markdownMatch ? markdownMatch[1] : response;
        
        // Store original content for diff highlighting
        setAiModifiedContent(content);
        setShowAIChanges(true);
        
        // Remove the info message and add success
        setAiChatHistory(prev => {
          const filtered = prev.filter(msg => !msg.content.includes('ℹ️ Kodbasökning'));
          return [...filtered, { 
            role: 'assistant', 
            content: `✅ Dokumentet har uppdaterats!

Ändringar:
- Omskriven baserat på din instruktion
- Strukturen har förbättrats
- Innehållet är anpassat för RPAC-kontexten

💡 Ändringar är markerade med gul bakgrund. Klicka "Acceptera ändringar" för att behålla dem.`
          }];
        });
        
        setContent(cleanedResponse);
        addToHistory(cleanedResponse);
      }
    } catch (error) {
      console.error('AI rewrite error:', error);
      setAiChatHistory(prev => {
        const filtered = prev.filter(msg => !msg.content.includes('ℹ️ Kodbasökning'));
        return [...filtered, { 
          role: 'assistant', 
          content: `❌ Fel: Kunde inte bearbeta texten med AI.

Felmeddelande: ${(error as Error).message}

Försök igen eller ändra din instruktion.`
        }];
      });
    } finally {
      setIsAIProcessing(false);
    }
  };

  const toolbarButtons: Array<
    { type: 'divider' } | 
    { icon: React.ComponentType<{ size?: number }>; label: string; action: () => void; disabled?: boolean }
  > = [
    { icon: Undo, label: 'Undo', action: undo, disabled: historyIndex === 0 },
    { icon: Redo, label: 'Redo', action: redo, disabled: historyIndex === history.length - 1 },
    { type: 'divider' },
    { icon: Bold, label: 'Bold', action: () => insertMarkdown('**', '**', 'bold text') },
    { icon: Italic, label: 'Italic', action: () => insertMarkdown('_', '_', 'italic text') },
    { icon: CodeSquare, label: 'Inline Code', action: () => insertMarkdown('`', '`', 'code') },
    { type: 'divider' },
    { icon: Heading1, label: 'Heading 1', action: () => insertMarkdown('# ', '', 'Heading 1') },
    { icon: Heading2, label: 'Heading 2', action: () => insertMarkdown('## ', '', 'Heading 2') },
    { icon: Heading3, label: 'Heading 3', action: () => insertMarkdown('### ', '', 'Heading 3') },
    { type: 'divider' },
    { icon: Link, label: 'Link', action: () => insertMarkdown('[', '](url)', 'link text') },
    { icon: ImageIcon, label: 'Image', action: () => insertMarkdown('![', '](url)', 'alt text') },
    { type: 'divider' },
    { icon: List, label: 'Bullet List', action: () => insertMarkdown('- ', '', 'list item') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertMarkdown('1. ', '', 'list item') },
    { icon: Quote, label: 'Quote', action: () => insertMarkdown('> ', '', 'quote') },
    { type: 'divider' },
    { icon: Code, label: 'Code Block', action: () => insertMarkdown('```\n', '\n```', 'code block') },
    { icon: Table, label: 'Table', action: () => insertMarkdown('| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |', '', '') },
  ];

  if (!mounted) return null;

  const editorContent = (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg shadow-2xl flex flex-col relative"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`
        }}
      >
        {/* Resize handles */}
        <div className="absolute top-0 left-0 right-0 h-1 cursor-n-resize" onMouseDown={handleResizeStart('n')} />
        <div className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize" onMouseDown={handleResizeStart('s')} />
        <div className="absolute left-0 top-0 bottom-0 w-1 cursor-w-resize" onMouseDown={handleResizeStart('w')} />
        <div className="absolute right-0 top-0 bottom-0 w-1 cursor-e-resize" onMouseDown={handleResizeStart('e')} />
        <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize" onMouseDown={handleResizeStart('nw')} />
        <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize" onMouseDown={handleResizeStart('ne')} />
        <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" onMouseDown={handleResizeStart('sw')} />
        <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" onMouseDown={handleResizeStart('se')} />

        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b border-gray-200 cursor-move select-none"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-3">
            <FileText className="text-[#3D4A2B]" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Hjälpfilsredigerare</h2>
              <p className="text-sm text-gray-600">{fileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'editor' && (
              <>
                <button
                  onClick={() => setShowContextBrowser(!showContextBrowser)}
                  className="px-3 py-2 text-sm bg-[#3D4A2B] text-white hover:bg-[#2A331E] rounded-lg flex items-center gap-2"
                >
                  <Info size={16} />
                  UI-Textvariabler
                </button>
                <button
                  onClick={() => setShowAIPrompt(!showAIPrompt)}
                  className="px-3 py-2 text-sm bg-[#5C6B47] text-white hover:bg-[#4A5239] rounded-lg flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  AI Omskrivning
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
                >
                  {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showPreview ? 'Dölj förhandsgranskning' : 'Visa förhandsgranskning'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-[#3D4A2B] text-[#3D4A2B] bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText size={16} />
            Redigera innehåll
          </button>
          <button
            onClick={() => setActiveTab('mappings')}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'mappings'
                ? 'border-[#3D4A2B] text-[#3D4A2B] bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Map size={16} />
            Rutt-mappningar
          </button>
          <button
            onClick={() => setActiveTab('krister')}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'krister'
                ? 'border-[#3D4A2B] text-[#3D4A2B] bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles size={16} />
            KRISter System Prompt
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 flex-wrap bg-gray-50">
          {toolbarButtons.map((btn, idx) => {
            if ('type' in btn && btn.type === 'divider') {
              return <div key={idx} className="w-px h-6 bg-gray-300 mx-1" />;
            }
            
            if ('icon' in btn) {
              const Icon = btn.icon;
              return (
                <button
                  key={idx}
                  onClick={btn.action}
                  disabled={btn.disabled}
                  title={btn.label}
                  className="p-2 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Icon size={18} />
                </button>
              );
            }
            
            return null;
          })}
        </div>

        {/* Editor/Preview Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* KRISter System Prompt Tab Content */}
          {activeTab === 'krister' ? (
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#3D4A2B] to-[#5C6B47] rounded-lg p-6 text-white shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles size={24} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">KRISter System Prompt</h2>
                      <p className="text-white/90 text-sm leading-relaxed">
                        Detta är den <strong>system prompt</strong> som KRISter använder när användare ställer frågor. 
                        Den definierar hur KRISter ska svara, vilken ton den ska använda, och framför allt hur den ska 
                        använda hjälpdokumentationen som <strong>SINGLE SOURCE OF TRUTH</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 space-y-1">
                      <p className="font-semibold">Så här fungerar systemet:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>System prompt definierar KRISters beteende och kunskapsområde</li>
                        <li>Hjälpdokumentation laddas dynamiskt baserat på användarens sida</li>
                        <li>KRISter ska ALLTID citera hjälpdokumentationen för "hur gör jag..."-frågor</li>
                        <li>Klicka <strong>"Lär från hjälpdokument"</strong> för att skanna alla hjälpfiler och uppdatera KRISters kunskapsbank</li>
                        <li>Ändringar här sparas och träder i kraft direkt</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Editor */}
                <div className="bg-white rounded-lg border-2 border-gray-200 shadow-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Code size={20} className="text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Redigera System Prompt</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {kristerPrompt !== kristerPromptOriginal && (
                        <span className="text-sm text-amber-600 font-medium">
                          Osparade ändringar
                        </span>
                      )}
                      <button
                        onClick={learnFromHelpDocs}
                        disabled={isLearning}
                        className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                          learnStatus === 'success'
                            ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                            : learnStatus === 'error'
                            ? 'bg-red-100 text-red-700 border-2 border-red-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                        }`}
                        title="Läs in all hjälpdokumentation och uppdatera KRISters kunskapsbank"
                      >
                        {isLearning ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            Läser in...
                          </>
                        ) : learnStatus === 'success' ? (
                          <>
                            <Check size={16} />
                            Lärt! ({learnedFilesCount} filer)
                          </>
                        ) : learnStatus === 'error' ? (
                          <>
                            <X size={16} />
                            Fel
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            Lär från hjälpdokument
                          </>
                        )}
                      </button>
                      <button
                        onClick={saveKRISterPrompt}
                        disabled={promptSaveStatus === 'saving' || kristerPrompt === kristerPromptOriginal}
                        className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                          promptSaveStatus === 'saved'
                            ? 'bg-green-100 text-green-700 border-2 border-green-300'
                            : kristerPrompt === kristerPromptOriginal
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-[#3D4A2B] text-white hover:bg-[#2D3A1B] shadow-md hover:shadow-lg'
                        }`}
                      >
                        {promptSaveStatus === 'saving' ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            Sparar...
                          </>
                        ) : promptSaveStatus === 'saved' ? (
                          <>
                            <Check size={16} />
                            Sparat!
                          </>
                        ) : promptSaveStatus === 'error' ? (
                          <>
                            <X size={16} />
                            Fel
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Spara ändringar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isLoadingPrompt ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3D4A2B] border-t-transparent mx-auto mb-4" />
                      <p className="text-gray-600">Laddar system prompt...</p>
                    </div>
                  ) : (
                    <textarea
                      value={kristerPrompt}
                      onChange={(e) => setKristerPrompt(e.target.value)}
                      className="w-full p-6 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:ring-inset min-h-[600px]"
                      placeholder="System prompt laddas..."
                      spellCheck={false}
                    />
                  )}
                </div>

                {/* Quick Tips */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5 shadow-sm">
                  <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <Sparkles size={18} />
                    Tips för att redigera system prompt
                  </h3>
                  <div className="text-sm text-green-800 space-y-2">
                    <p><strong>1. Håll funktionsbeskrivningar uppdaterade:</strong> När UI ändras, uppdatera "BEREADY-APPENS FUNKTIONER"</p>
                    <p><strong>2. Betona hjälpdokumentation:</strong> Avsnittet "HUR-GÖR-JAG FRÅGOR" är kritiskt - se till att KRISter vet att den MÅSTE använda hjälpdocs</p>
                    <p><strong>3. Konkreta exempel:</strong> Lägg till exempel på rätt/fel svar när du uppdaterar funktionalitet</p>
                    <p><strong>4. Testa ändringar:</strong> Efter att du sparat, testa att ställa en fråga till KRISter för att verifiera</p>
                  </div>
                </div>

                {/* Example Changes Box */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 shadow-sm">
                  <h3 className="font-bold text-purple-900 mb-3">📋 Exempel: Uppdatera när hjälpdokumentation ändras</h3>
                  <div className="text-sm text-purple-800 space-y-3">
                    <div className="bg-white rounded p-3 border border-purple-200">
                      <p className="font-semibold mb-1">Scenario:</p>
                      <p>Du uppdaterade <code>individual/resources.md</code> och ändrade stegen för att dela en resurs.</p>
                    </div>
                    <div className="bg-white rounded p-3 border border-purple-200">
                      <p className="font-semibold mb-1">Vad du måste göra:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Hitta avsnittet "BEREADY-APPENS FUNKTIONER" → "1. MITT HEM" i prompten ovan</li>
                        <li>Uppdatera texten under "Resurslager" för att matcha nya steg</li>
                        <li>Uppdatera exemplet under "HUR-GÖR-JAG FRÅGOR" om det är relevant</li>
                        <li>Klicka "Spara ändringar"</li>
                        <li>Testa att fråga KRISter "Hur delar jag en resurs?" för att verifiera</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'mappings' ? (
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Hantera rutt-mappningar</h2>
                  <p className="text-sm text-gray-600">
                    Konfigurerar vilka hjälpfiler som visas för olika sidor i applikationen.
                  </p>
                </div>

                {/* Add New Mapping Form */}
                <div className="bg-gradient-to-br from-[#F5F7F3] to-white rounded-lg border border-[#5C6B47]/20 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-[#3D4A2B]" />
                    Lägg till ny mappning
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rutt (route)
                      </label>
                      <input
                        type="text"
                        value={newMapping.route}
                        onChange={(e) => setNewMapping({ ...newMapping, route: e.target.value })}
                        placeholder="/dashboard"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parametrar (valfritt)
                      </label>
                      <input
                        type="text"
                        value={newMapping.params}
                        onChange={(e) => setNewMapping({ ...newMapping, params: e.target.value })}
                        placeholder="?tab=home"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hjälpfil
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMapping.helpFile}
                          onChange={(e) => setNewMapping({ ...newMapping, helpFile: e.target.value })}
                          placeholder="dashboard.md"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                        />
                        <button
                          onClick={addMapping}
                          disabled={!newMapping.route || !newMapping.helpFile}
                          className="px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2D3A1F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Lägg till
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mappings Table */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-[#3D4A2B]/5 to-[#5C6B47]/5 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Aktiva mappningar ({routeMappings.length})
                    </h3>
                    <button
                      onClick={saveRouteMappings}
                      className="px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2D3A1F] transition-colors flex items-center gap-2"
                    >
                      <Save size={16} />
                      Spara ändringar
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rutt
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Parametrar
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hjälpfil
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Åtgärder
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {routeMappings.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                              Inga mappningar ännu. Lägg till din första mappning ovan.
                            </td>
                          </tr>
                        ) : (
                          routeMappings.map((mapping, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              {editingMapping === index ? (
                                // Edit mode
                                <>
                                  <td className="px-6 py-4">
                                    <input
                                      type="text"
                                      value={mapping.route}
                                      onChange={(e) => updateMapping(index, 'route', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                                    />
                                  </td>
                                  <td className="px-6 py-4">
                                    <input
                                      type="text"
                                      value={mapping.params}
                                      onChange={(e) => updateMapping(index, 'params', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                                    />
                                  </td>
                                  <td className="px-6 py-4">
                                    <input
                                      type="text"
                                      value={mapping.helpFile}
                                      onChange={(e) => updateMapping(index, 'helpFile', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                                    />
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={() => setEditingMapping(null)}
                                      className="inline-flex items-center gap-1 px-3 py-1 text-sm text-[#3D4A2B] hover:bg-[#3D4A2B]/10 rounded transition-colors"
                                    >
                                      <Check size={14} />
                                      Klar
                                    </button>
                                  </td>
                                </>
                              ) : (
                                // View mode
                                <>
                                  <td className="px-6 py-4 text-sm font-medium">
                                    <a
                                      href={`${mapping.route}${mapping.params}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[#3D4A2B] hover:underline"
                                    >
                                      {mapping.route}
                                      <ExternalLink size={12} className="opacity-60" />
                                    </a>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    {mapping.params || <span className="text-gray-400 italic">–</span>}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    {mapping.helpFile}
                                  </td>
                                  <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                      onClick={() => setEditingMapping(index)}
                                      className="inline-flex items-center gap-1 px-3 py-1 text-sm text-[#3D4A2B] hover:bg-[#3D4A2B]/10 rounded transition-colors"
                                    >
                                      <Edit size={14} />
                                      Redigera
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Ta bort mappning för "${mapping.route}"?`)) {
                                          deleteMapping(index);
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <Trash2 size={14} />
                                      Ta bort
                                    </button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Om rutt-mappningar</h4>
                  <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                    <li><strong>Rutt:</strong> URL-mönster (t.ex. <code>/dashboard</code>, <code>/settings</code>)</li>
                    <li><strong>Parametrar:</strong> URL-parametrar för specifika vyer (t.ex. <code>?tab=home</code>)</li>
                    <li><strong>Hjälpfil:</strong> Sökväg till markdown-fil i <code>/public/help/</code> (utan <code>.md</code>)</li>
                    <li>Ändringar sparas när du klickar på "Spara ändringar"</li>
                    <li>KRISter-hjälpsystemet läser dessa mappningar för att visa rätt hjälp</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
          {/* AI Writing Assistant Sidebar */}
          {showAIPrompt && (
            <div className="w-96 border-r border-gray-200 flex flex-col bg-gradient-to-b from-[#F5F7F3] to-[#FAFBF9]">
              {/* Header */}
              <div className="p-4 border-b border-[#5C6B47]/20 bg-[#3D4A2B]/5">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                  <Sparkles size={18} className="text-[#3D4A2B]" />
                  AI Skrivassistent
                </h3>
                <p className="text-xs text-gray-600">Få hjälp att förbättra och omskriva dokumentationen</p>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {aiChatHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles size={48} className="mx-auto text-[#707C5F] mb-3" />
                    <p className="text-sm text-gray-600 mb-2">Börja en konversation med AI-assistenten</p>
                    <div className="text-xs text-gray-500 space-y-1 max-w-xs mx-auto text-left bg-white/50 rounded-lg p-3">
                      <p className="font-semibold mb-2">💡 Exempel på instruktioner:</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[#3D4A2B] font-medium">Exempel på frågor:</p>
                          <p>• "Gör texten mer kortfattad"</p>
                          <p>• "Förenkla språket för nybörjare"</p>
                          <p>• "Lägg till mer detaljer om denna funktion"</p>
                          <p>• "Omformulera för en mer formell ton"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  aiChatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-[#3D4A2B]/10 border border-[#3D4A2B]/20 ml-8'
                          : 'bg-white border border-gray-200 mr-8'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <div className={`text-xs font-semibold ${
                          msg.role === 'user' ? 'text-[#3D4A2B]' : 'text-gray-700'
                        }`}>
                          {msg.role === 'user' ? '👤 Du' : '🤖 AI-assistent'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                
                {/* Processing indicator */}
                {isAIProcessing && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 mr-8">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#3D4A2B] border-t-transparent" />
                      <span className="text-sm text-gray-600">AI tänker...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-[#5C6B47]/20 bg-white">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Beskriv hur AI ska hjälpa dig, t.ex. 'Gör texten mer lättläst' eller 'Lägg till fler exempel'..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent resize-none mb-2"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleAIRewrite();
                    }
                  }}
                  disabled={isAIProcessing}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    💡 Tryck <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Ctrl+Enter</kbd>
                  </p>
                  <button
                    onClick={handleAIRewrite}
                    disabled={isAIProcessing || !aiPrompt.trim()}
                    className="px-4 py-2 text-sm bg-[#3D4A2B] text-white hover:bg-[#2A331E] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isAIProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                        Bearbetar...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Skicka
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Variable Picker Sidebar */}
          {showContextBrowser && (
            <div className="w-96 border-r border-gray-200 flex flex-col bg-gray-50">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-semibold text-gray-900 flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2">
                    <Info size={18} className="text-[#3D4A2B]" />
                    UI-Textvariabler
                  </span>
                  <span className="text-xs font-normal text-gray-500">
                    {uiTextVariables.length} tillgängliga
                  </span>
                </h3>
                <p className="text-xs text-gray-600 mb-3">Dubbelklicka för att infoga vid markören</p>
                
                {/* Language Selector */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600 block mb-1">Språk / Language:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedLanguage('sv')}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                        selectedLanguage === 'sv'
                          ? 'bg-[#3D4A2B] text-white border-[#3D4A2B]'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      🇸🇪 Svenska
                    </button>
                    <button
                      onClick={() => setSelectedLanguage('en')}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                        selectedLanguage === 'en'
                          ? 'bg-[#3D4A2B] text-white border-[#3D4A2B]'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      🇬🇧 English
                    </button>
                  </div>
                </div>
                
                {/* Search */}
                <input
                  type="text"
                  placeholder={selectedLanguage === 'sv' ? 'Sök text, kategori...' : 'Search text, category...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                />
              </div>

              {/* Variables List */}
              <div className="flex-1 overflow-auto p-4">
                {Object.keys(groupedVariables).length === 0 ? (
                  <p className="text-sm text-gray-500 italic text-center mt-8">
                    Inga variabler hittades
                  </p>
                ) : (
                  Object.entries(groupedVariables).map(([category, variables]) => (
                    <div key={category} className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">
                          {(category === 'Knappar' || category === 'Buttons') && '🔘'}
                          {category === 'Navigation' && '🧭'}
                          {(category === 'Sidtitlar' || category === 'Page Titles') && '📄'}
                          {(category === 'UI-Element' || category === 'UI Elements') && '🎨'}
                          {(category === 'Användarroller' || category === 'User Roles') && '👤'}
                          {(category === 'Resurskategorier' || category === 'Resource Categories') && '📦'}
                          {(category === 'Erfarenhetsnivåer' || category === 'Experience Levels') && '⭐'}
                          {(category === 'Klimatzoner' || category === 'Climate Zones') && '🌡️'}
                          {category === 'Status' && '📊'}
                        </span>
                        {category}
                      </h4>
                      <div className="space-y-1">
                        {variables.map((variable, idx) => (
                          <button
                            key={idx}
                            onDoubleClick={() => insertVariable(variable)}
                            className="w-full text-left px-3 py-2 bg-white hover:bg-[#3D4A2B]/5 rounded-lg border border-gray-200 hover:border-[#3D4A2B] transition-colors group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-gray-900 truncate">
                                  {variable.value}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {variable.description}
                                </div>
                                <div className="text-xs text-[#5C6B47] font-mono mt-1">
                                  {`{{${variable.key}}}`}
                                </div>
                              </div>
                              <div className="text-xs text-gray-400 group-hover:text-[#3D4A2B] whitespace-nowrap">
                                {selectedLanguage === 'sv' ? 'Dubbelklicka' : 'Double-click'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Tips */}
              <div className="p-4 border-t border-gray-200 bg-[#3D4A2B]/5">
                <h4 className="text-xs font-semibold text-[#2A331E] mb-2 flex items-center gap-1">
                  <span>💡</span>
                  {selectedLanguage === 'sv' ? 'Så här använder du variablerna' : 'How to use variables'}
                </h4>
                {selectedLanguage === 'sv' ? (
                  <ul className="text-xs text-[#4A5239] space-y-1">
                    <li>• Placera markören i texten</li>
                    <li>• Dubbelklicka på variabel → infogar <code className="bg-[#5C6B47]/10 px-1 rounded">{`{{variabel}}`}</code></li>
                    <li>• I förhandsvisning → översätts till faktisk text</li>
                    <li>• Exempel: <code className="bg-[#5C6B47]/10 px-1 rounded">{`{{buttons.save}}`}</code> → <strong>Spara</strong></li>
                  </ul>
                ) : (
                  <ul className="text-xs text-[#4A5239] space-y-1">
                    <li>• Place cursor in text</li>
                    <li>• Double-click variable → inserts <code className="bg-[#5C6B47]/10 px-1 rounded">{`{{variable}}`}</code></li>
                    <li>• In preview → translates to actual text</li>
                    <li>• Example: <code className="bg-[#5C6B47]/10 px-1 rounded">{`{{buttons.save}}`}</code> → <strong>Save</strong></li>
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Editor */}
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col border-r border-gray-200`}>
            {/* AI Changes Banner */}
            {showAIChanges && aiModifiedContent && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles size={16} className="text-amber-600" />
                  <span className="text-amber-900 font-medium">
                    {showDiffView ? 'Jämför original (vänster) med AI-version (höger)' : 'AI-genererade ändringar'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDiffView(!showDiffView)}
                    className="px-3 py-1 text-xs bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 rounded flex items-center gap-1"
                  >
                    <Code size={14} />
                    {showDiffView ? 'Dölj jämförelse' : 'Visa jämförelse'}
                  </button>
                  <button
                    onClick={() => {
                      setContent(aiModifiedContent);
                      setShowAIChanges(false);
                      setAiModifiedContent(null);
                      setShowDiffView(false);
                    }}
                    className="px-3 py-1 text-xs bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 rounded"
                  >
                    Ångra
                  </button>
                  <button
                    onClick={() => {
                      setShowAIChanges(false);
                      setAiModifiedContent(null);
                      setShowDiffView(false);
                    }}
                    className="px-3 py-1 text-xs bg-amber-600 text-white hover:bg-amber-700 rounded"
                  >
                    Acceptera ändringar
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-auto relative">
              {showDiffView && aiModifiedContent ? (
                /* Diff View - Side by Side Comparison */
                <div className="flex flex-col h-full">
                  <div className="flex flex-1 overflow-hidden">
                    {/* Original (Before) */}
                    <div className="w-1/2 border-r border-gray-300 flex flex-col">
                      <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300 text-xs font-semibold text-gray-700">
                        📝 Original (före AI)
                      </div>
                      <div className="flex-1 overflow-auto">
                        {computeDiff(aiModifiedContent, content).map((line, idx) => (
                          <div
                            key={idx}
                            className={`px-3 py-0.5 font-mono text-xs leading-relaxed border-b border-gray-100 ${
                              line.type === 'removed' ? 'bg-red-50 text-red-900' :
                              line.type === 'modified' ? 'bg-yellow-50 text-yellow-900' :
                              'text-gray-700'
                            }`}
                          >
                            <span className="inline-block w-8 text-gray-400 select-none">{line.lineNum}</span>
                            <span className="whitespace-pre-wrap">{line.original || ' '}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Modified (After AI) */}
                    <div className="w-1/2 flex flex-col">
                      <div className="bg-emerald-100 px-3 py-1.5 border-b border-emerald-300 text-xs font-semibold text-emerald-900">
                        ✨ AI-version (efter AI)
                      </div>
                      <div className="flex-1 overflow-auto">
                        {computeDiff(aiModifiedContent, content).map((line, idx) => (
                          <div
                            key={idx}
                            className={`px-3 py-0.5 font-mono text-xs leading-relaxed border-b border-gray-100 ${
                              line.type === 'added' ? 'bg-green-50 text-green-900' :
                              line.type === 'modified' ? 'bg-yellow-50 text-yellow-900' :
                              'text-gray-700'
                            }`}
                          >
                            <span className="inline-block w-8 text-gray-400 select-none">{line.lineNum}</span>
                            <span className="whitespace-pre-wrap">{line.modified || ' '}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="border-t border-gray-300 bg-gray-50 px-4 py-2 flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-50 border border-green-200"></div>
                      <span className="text-gray-600">Tillagd rad</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-50 border border-red-200"></div>
                      <span className="text-gray-600">Borttagen rad</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-50 border border-yellow-200"></div>
                      <span className="text-gray-600">Ändrad rad</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-white border border-gray-200"></div>
                      <span className="text-gray-600">Oförändrad</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Normal Editor */
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    addToHistory(e.target.value);
                    // Clear AI highlighting when user edits
                    if (showAIChanges) {
                      setShowAIChanges(false);
                      setAiModifiedContent(null);
                      setShowDiffView(false);
                    }
                  }}
                  className={`w-full h-full p-4 font-mono text-sm resize-none focus:outline-none ${
                    showAIChanges ? 'bg-amber-50/30' : ''
                  }`}
                  placeholder="Skriv markdown här..."
                />
              )}
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className={`w-1/2 overflow-auto p-4 ${showAIChanges ? 'bg-amber-50/20' : 'bg-gray-50'}`}>
              {/* AI Changes Banner in Preview */}
              {showAIChanges && aiModifiedContent && (
                <div className="mb-4 p-3 bg-amber-100 border border-amber-300 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-900">
                      <p className="font-semibold mb-1">✨ AI har uppdaterat innehållet</p>
                      <p>Förhandsvisningen nedan visar de nya ändringarna. Klicka "Acceptera ändringar" ovan för att behålla dem, eller "Ångra" för att återgå till originalet.</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="prose prose-sm max-w-none 
                prose-headings:text-[#3D4A2B] prose-headings:font-semibold
                prose-h1:text-base prose-h1:mb-2 prose-h1:mt-0
                prose-h2:text-sm prose-h2:mt-4 prose-h2:mb-1.5 prose-h2:font-semibold
                prose-h3:text-sm prose-h3:mt-2 prose-h3:mb-1 prose-h3:font-medium
                prose-p:text-sm prose-p:text-gray-700 prose-p:my-1 prose-p:leading-relaxed
                prose-li:text-sm prose-li:text-gray-700 prose-li:my-0.5
                prose-ul:my-1.5 prose-ul:space-y-0.5
                prose-ol:my-1.5 prose-ol:space-y-0.5
                prose-a:text-[#3D4A2B] prose-a:underline prose-a:font-normal
                prose-strong:font-bold
                prose-code:text-xs prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{renderPreviewContent(content)}</ReactMarkdown>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Footer - Save Controls */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-start gap-4">
            {/* File Operations Toggle */}
            <button
              onClick={() => setShowFileOps(!showFileOps)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-2"
            >
              <FolderOpen size={16} />
              Filoperationer
            </button>

            <div className="flex-1 grid grid-cols-3 gap-3">
              {/* Commit Message */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Commit-meddelande
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                  placeholder="Beskriv ändringarna..."
                />
              </div>

              {/* Branch Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <GitBranch size={12} className="inline mr-1" />
                  Branch
                </label>
                <select
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                >
                  <option value="main">main</option>
                  <option value="development">development</option>
                  <option value="feature/help-updates">feature/help-updates</option>
                </select>
              </div>
            </div>

            {/* GitHub Integration Info */}
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
              <div className="flex items-start gap-2">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <div>
                  <strong>GitHub-integration:</strong> Kräver GITHUB_TOKEN i .env.local
                  <br />
                  <span className="text-blue-700">Se docs/HELP_EDITOR_SETUP.md för instruktioner</span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveToGitHub}
              disabled={isSaving || !commitMessage}
              className="px-6 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-end"
            >
              <GitCommit size={16} />
              {isSaving ? 'Sparar...' : 'Commit & Push'}
            </button>
          </div>

          {/* File Operations Panel */}
          {showFileOps && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
              <h3 className="text-sm font-semibold mb-3 text-gray-900">Filoperationer</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Filsökväg
                  </label>
                  <input
                    type="text"
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                    placeholder="rpac-web/public/help/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Filnamn
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                    placeholder="help-file.md"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Ändra filsökväg för att flytta/byta namn på filen vid nästa commit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render using portal to ensure it's at document body level, not inside Krister
  return ReactDOM.createPortal(editorContent, document.body);
}
