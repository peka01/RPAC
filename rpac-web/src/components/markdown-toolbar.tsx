'use client';

import { 
  Bold, Italic, List, ListOrdered, Link as LinkIcon, 
  Heading1, Heading2, Quote, Code, Eye, EyeOff, Image as ImageIcon, 
  Table as TableIcon, X
} from 'lucide-react';
import { useState, useRef } from 'react';
import { t } from '@/lib/locales';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';

interface MarkdownToolbarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  helpText?: string;
}

export default function MarkdownToolbar({
  value,
  onChange,
  placeholder = '',
  rows = 10,
  label,
  helpText
}: MarkdownToolbarProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = 
      value.substring(0, start) + 
      before + 
      textToInsert + 
      after + 
      value.substring(end);
    
    onChange(newText);

    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length;
      textareaRef.setSelectionRange(newCursorPos, newCursorPos);
      textareaRef.focus();
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const newText = 
      value.substring(0, start) + 
      text + 
      value.substring(start);
    
    onChange(newText);

    setTimeout(() => {
      const newPos = start + text.length;
      textareaRef.setSelectionRange(newPos, newPos);
      textareaRef.focus();
    }, 0);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `content-${Date.now()}.${fileExt}`;
      const filePath = `community-content/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      // Insert image markdown at cursor
      const imageMarkdown = `\n![${file.name.replace(/\.[^/.]+$/, '')}](${publicUrl})\n`;
      insertAtCursor(imageMarkdown);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Kunde inte ladda upp bilden. Försök igen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
    // Reset input so same file can be selected again
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const insertTable = () => {
    // Create table header
    const headers = Array(tableCols).fill('Kolumn').map((h, i) => `${h} ${i + 1}`).join(' | ');
    const separator = Array(tableCols).fill('---').join(' | ');
    
    // Create table rows (each row on its own line)
    const rows = Array(tableRows)
      .fill(null)
      .map((_, rowIndex) => {
        const cells = Array(tableCols)
          .fill('Data')
          .map((d, colIndex) => `${d} ${rowIndex + 1}.${colIndex + 1}`)
          .join(' | ');
        return `| ${cells} |`;
      })
      .join('\n');
    
    const tableMarkdown = `\n\n| ${headers} |\n| ${separator} |\n${rows}\n\n`;
    insertAtCursor(tableMarkdown);
    setShowTableDialog(false);
  };

  const tools = [
    {
      icon: Heading1,
      label: 'Rubrik 1',
      action: () => insertAtCursor('\n# Rubrik\n')
    },
    {
      icon: Heading2,
      label: 'Rubrik 2',
      action: () => insertAtCursor('\n## Underrubrik\n')
    },
    {
      icon: Bold,
      label: 'Fetstil',
      action: () => insertMarkdown('**', '**', 'fetstil')
    },
    {
      icon: Italic,
      label: 'Kursiv',
      action: () => insertMarkdown('*', '*', 'kursiv')
    },
    {
      icon: List,
      label: 'Punktlista',
      action: () => insertAtCursor('\n- Punkt 1\n- Punkt 2\n- Punkt 3\n')
    },
    {
      icon: ListOrdered,
      label: 'Numrerad lista',
      action: () => insertAtCursor('\n1. Första\n2. Andra\n3. Tredje\n')
    },
    {
      icon: Quote,
      label: 'Citat',
      action: () => insertAtCursor('\n> Citat eller viktig information\n')
    },
    {
      icon: LinkIcon,
      label: 'Länk',
      action: () => insertMarkdown('[', '](https://exempel.se)', 'länktext')
    },
    {
      icon: ImageIcon,
      label: 'Infoga bild',
      action: () => imageInputRef.current?.click(),
      isSpecial: true
    },
    {
      icon: TableIcon,
      label: 'Infoga tabell',
      action: () => setShowTableDialog(true),
      isSpecial: true
    },
    {
      icon: Code,
      label: 'Kod',
      action: () => insertMarkdown('`', '`', 'kod')
    }
  ];

  return (
    <div className="w-full">
      {/* Hidden file input for image uploads */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {label && (
        <label className="block text-sm font-semibold mb-2 text-gray-900">
          {label}
        </label>
      )}

      {/* Toolbar */}
      <div className="border-2 border-[#5C6B47] rounded-t-xl bg-gray-50 px-2 py-2 flex items-center gap-1 flex-wrap">
        {tools.map((tool, index) => (
          <button
            key={index}
            type="button"
            onClick={tool.action}
            disabled={uploadingImage && tool.isSpecial}
            className={`p-2 hover:bg-white rounded-lg transition-colors group relative ${
              uploadingImage && tool.isSpecial
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-[#3D4A2B]'
            } ${tool.isSpecial ? 'bg-[#5C6B47]/10' : ''}`}
            title={tool.label}
          >
            <tool.icon size={18} className={uploadingImage && tool.isSpecial ? 'animate-pulse' : ''} />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {tool.label}
              {uploadingImage && tool.isSpecial && ' (Laddar upp...)'}
            </span>
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Preview Toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold ${
            showPreview 
              ? 'bg-[#3D4A2B] text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title={showPreview ? 'Visa redigerare' : 'Visa förhandsgranskning'}
        >
          {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
          <span className="hidden sm:inline">
            {showPreview ? 'Redigera' : 'Förhandsgranska'}
          </span>
        </button>
      </div>

      {/* Editor / Preview */}
      <div className="border-2 border-t-0 border-[#5C6B47] rounded-b-xl">
        {showPreview ? (
          <div className="p-4 bg-white min-h-[200px] prose prose-sm max-w-none">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-gray-400 italic">Ingen text att förhandsgranska...</p>
            )}
          </div>
        ) : (
          <textarea
            ref={setTextareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className="w-full px-4 py-3 focus:outline-none font-mono text-sm resize-y"
            style={{ minHeight: '200px' }}
          />
        )}
      </div>

      {/* Help Text */}
      {helpText && !showPreview && (
        <div className="mt-2 text-xs text-gray-500 flex items-start gap-2">
          <span>💡</span>
          <span>{helpText}</span>
        </div>
      )}

      {/* Quick Reference */}
      {!showPreview && (
        <details className="mt-2 text-xs text-gray-600">
          <summary className="cursor-pointer hover:text-[#3D4A2B] font-semibold">
            📖 Snabbguide för formattering
          </summary>
          <div className="mt-2 space-y-1 pl-4">
            <div><code className="bg-gray-100 px-1 rounded"># Text</code> = Stor rubrik</div>
            <div><code className="bg-gray-100 px-1 rounded">## Text</code> = Mindre rubrik</div>
            <div><code className="bg-gray-100 px-1 rounded">**text**</code> = <strong>Fetstil</strong></div>
            <div><code className="bg-gray-100 px-1 rounded">*text*</code> = <em>Kursiv</em></div>
            <div><code className="bg-gray-100 px-1 rounded">- Text</code> = Punktlista</div>
            <div><code className="bg-gray-100 px-1 rounded">1. Text</code> = Numrerad lista</div>
            <div><code className="bg-gray-100 px-1 rounded">&gt; Text</code> = Citat</div>
            <div><code className="bg-gray-100 px-1 rounded">[text](url)</code> = Länk</div>
            <div><code className="bg-gray-100 px-1 rounded">![alt](url)</code> = Bild</div>
            <div><code className="bg-gray-100 px-1 rounded">| A | B |</code> = Tabell</div>
          </div>
        </details>
      )}

      {/* Upload Status */}
      {uploadingImage && (
        <div className="mt-2 px-3 py-2 bg-[#5C6B47]/10 border border-[#5C6B47]/30 rounded-lg text-sm text-gray-700 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#5C6B47] border-t-transparent"></div>
          <span>Laddar upp bild...</span>
        </div>
      )}

      {/* Table Dialog */}
      {showTableDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TableIcon size={24} className="text-[#5C6B47]" />
                Skapa tabell
              </h3>
              <button
                onClick={() => setShowTableDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Rows */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Antal rader
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTableRows(Math.max(1, tableRows - 1))}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-lg transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tableRows}
                    onChange={(e) => setTableRows(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-center text-lg font-semibold focus:border-[#5C6B47] focus:outline-none"
                  />
                  <button
                    onClick={() => setTableRows(Math.min(20, tableRows + 1))}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Columns */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Antal kolumner
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTableCols(Math.max(1, tableCols - 1))}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-lg transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tableCols}
                    onChange={(e) => setTableCols(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-center text-lg font-semibold focus:border-[#5C6B47] focus:outline-none"
                  />
                  <button
                    onClick={() => setTableCols(Math.min(10, tableCols + 1))}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <div className="text-xs text-gray-600 mb-2 font-semibold">Förhandsvisning:</div>
                <div className="overflow-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#5C6B47]/10">
                        {Array(tableCols).fill(null).map((_, i) => (
                          <th key={i} className="border border-gray-300 px-2 py-1 font-semibold">
                            Kolumn {i + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array(tableRows).fill(null).map((_, rowIdx) => (
                        <tr key={rowIdx}>
                          {Array(tableCols).fill(null).map((_, colIdx) => (
                            <td key={colIdx} className="border border-gray-300 px-2 py-1">
                              Data {rowIdx + 1}.{colIdx + 1}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Info */}
              <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                💡 Tabellen infogas med exempeldata som du kan redigera direkt i texten
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTableDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Avbryt
              </button>
              <button
                onClick={insertTable}
                className="flex-1 px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <TableIcon size={18} />
                Infoga tabell
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

