'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Save, Eye, EyeOff, Code, FileText, FolderOpen, GitBranch, GitCommit, 
         Bold, Italic, Link, List, ListOrdered, Heading1, Heading2, Heading3,
         Quote, CodeSquare, Table, Image as ImageIcon, Undo, Redo, Sparkles, Info } from 'lucide-react';
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
    return () => setMounted(false);
  }, []);

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
        console.error('Save API error:', errorData);
        
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
        
        throw new Error(errorData.error || 'Failed to save file');
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
      
      let codeContext = '';
      if (needsCodeSearch) {
        // Add searching indicator
        setAiChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: '🔍 Söker i kodbasen...'
        }]);

        try {
          // Extract search terms (component names, features, etc)
          const searchTerms = userMessage
            .replace(/kolla i kodbasen och|skapa en instruktion för|how to|find/gi, '')
            .trim();

          // Use semantic search to find relevant code
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
            
            // Update message to show search completed
            setAiChatHistory(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { 
                role: 'assistant', 
                content: `✅ Hittade ${searchResults.results.length} relevanta kodfiler. Analyserar...`
              };
              return updated;
            });
          }
        } catch (searchError) {
          console.error('Code search error:', searchError);
          codeContext = '\n(Kodbasökning misslyckades, fortsätter med tillgänglig kontext)\n';
        }
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
${needsCodeSearch ? 
  'Baserat på kodbasen ovan, skapa detaljerad dokumentation som förklarar hur funktionen/komponenten fungerar. Inkludera praktiska steg-för-steg instruktioner.' : 
  'Omskriv markdown-dokumentationen baserat på användarens instruktion.'
}
- Tänk på sidans syfte och funktioner
- Anpassa språket till målgruppen
- Använd konkreta exempel från RPAC-kontexten när det är relevant
- Behåll eller förbättra strukturen (rubriker, listor, steg)
- Var tydlig och actionorienterad
${needsCodeSearch ? '- Förklara baserat på faktisk implementation i koden\n- Inkludera exakta komponentnamn, props och metoder som används' : ''}

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
        
        // Remove the "searching" message and add success
        setAiChatHistory(prev => {
          const filtered = prev.filter(msg => !msg.content.includes('🔍 Söker') && !msg.content.includes('Hittade'));
          return [...filtered, { 
            role: 'assistant', 
            content: `✅ Dokumentet har uppdaterats!

${needsCodeSearch ? '📝 Baserat på kodbasanalys:\n- Analyserade relevanta komponenter\n- Extraherade faktisk implementation\n- Skapade instruktioner från verklig kod\n\n' : ''}Ändringar:
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
        const filtered = prev.filter(msg => !msg.content.includes('🔍 Söker') && !msg.content.includes('Hittade'));
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
              <h2 className="text-lg font-semibold text-gray-900">Redigera hjälpfil</h2>
              <p className="text-sm text-gray-600">{fileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
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
                          <p className="text-[#3D4A2B] font-medium">Omskrivning:</p>
                          <p>• "Gör texten mer kortfattad"</p>
                          <p>• "Förenkla språket för nybörjare"</p>
                        </div>
                        <div>
                          <p className="text-[#3D4A2B] font-medium">Kodbasanalys:</p>
                          <p>• "Kolla i kodbasen hur väderwidgeten fungerar"</p>
                          <p>• "Hitta och beskriv ResourceListView-komponenten"</p>
                          <p>• "Leta upp hur man sparar en resurs"</p>
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
