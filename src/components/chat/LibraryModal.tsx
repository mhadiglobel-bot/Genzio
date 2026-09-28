import React, { useState, useRef } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Search,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Code,
  Sparkles,
  Trash2,
  Check,
  Paperclip,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { LibraryFile, ChatAttachment } from '../../types';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: LibraryFile[];
  onSaveFiles: (files: LibraryFile[]) => void;
  onInsertPrompt?: (promptText: string) => void;
  onAttachFilesToComposer?: (attachments: ChatAttachment[]) => void;
  initialMode?: 'manage' | 'select';
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  files,
  onSaveFiles,
  onInsertPrompt,
  onAttachFilesToComposer,
  initialMode = 'manage',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Prompts');
  const [newType, setNewType] = useState<'prompt' | 'snippet' | 'document'>('prompt');
  const [newContent, setNewContent] = useState('');

  const uploadInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filterTabs = [
    { id: 'All', label: 'All Files' },
    { id: 'document', label: 'Documents' },
    { id: 'image', label: 'Images' },
    { id: 'spreadsheet', label: 'Spreadsheets' },
    { id: 'pdf', label: 'PDFs' },
    { id: 'prompt', label: 'Prompts & Templates' },
  ];

  const filteredFiles = files.filter((file) => {
    const matchesFilter =
      activeFilter === 'All'
        ? true
        : activeFilter === 'prompt'
        ? file.type === 'prompt' || file.type === 'snippet'
        : file.type === activeFilter;

    if (!matchesFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      file.name.toLowerCase().includes(q) ||
      (file.description && file.description.toLowerCase().includes(q)) ||
      (file.content && file.content.toLowerCase().includes(q))
    );
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    const newFiles: LibraryFile[] = Array.from(uploaded).map((file, idx) => {
      let type: LibraryFile['type'] = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) type = 'pdf';
      else if (
        file.type.includes('spreadsheet') ||
        file.type.includes('excel') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.xlsx')
      ) {
        type = 'spreadsheet';
      }

      return {
        id: `lib-file-${Date.now()}-${idx}`,
        name: file.name,
        type,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        description: `Uploaded from local device (${type})`,
      };
    });

    onSaveFiles([...newFiles, ...files]);
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newTemplate: LibraryFile = {
      id: `lib-tmpl-${Date.now()}`,
      name: newTitle.trim(),
      type: newType,
      size: `${(new Blob([newContent]).size / 1024).toFixed(1)} KB`,
      uploadedAt: 'Today',
      description: `Saved template in ${newCategory}`,
      content: newContent,
      category: newCategory,
    };

    onSaveFiles([newTemplate, ...files]);
    setNewTitle('');
    setNewContent('');
    setIsAddingTemplate(false);
  };

  const handleDeleteFile = (id: string) => {
    onSaveFiles(files.filter((f) => f.id !== id));
    setSelectedIds((prev) => prev.filter((i) => i !== id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleAttachSelectedToComposer = () => {
    if (selectedIds.length === 0) return;
    const selectedFiles = files.filter((f) => selectedIds.includes(f.id));

    const attachments: ChatAttachment[] = selectedFiles.map((f) => ({
      id: `att-lib-${f.id}`,
      name: f.name,
      size: f.size,
      type: f.type,
      content: f.content,
    }));

    onAttachFilesToComposer?.(attachments);
    onClose();
  };

  const getFileIcon = (type: LibraryFile['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-pink-400" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-400" />;
      case 'snippet':
        return <Code className="w-4 h-4 text-cyan-400" />;
      case 'prompt':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      {/* Hidden Upload Input */}
      <input
        type="file"
        ref={uploadInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.json"
      />

      <div className="relative w-full max-w-3xl rounded-2xl bg-[#0b0f19] border border-slate-700/80 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">Genzio File & Prompt Library</h3>
              <p className="text-xs text-slate-400">Store, search, and reuse documents, spreadsheets, images, and templates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Files</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingTemplate(!isAddingTemplate)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Template</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#080b12]">
          {/* Search Field */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library files..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Add Template Inline Form */}
          {isAddingTemplate && (
            <form onSubmit={handleCreateTemplate} className="p-4 rounded-xl bg-[#0e1422] border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Create Custom Template</span>
                <div className="flex gap-1">
                  {(['prompt', 'snippet', 'document'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                        newType === t ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Template Title (e.g., Code Review Checklist, RFC Outline)"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                required
              />

              <textarea
                rows={3}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Template instruction or prompt content..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none font-mono"
                required
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTemplate(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-lg bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 cursor-pointer"
                >
                  Save to Library
                </button>
              </div>
            </form>
          )}

          {/* Files List */}
          {filteredFiles.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-3">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No files found in this category.</p>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Upload your first file
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredFiles.map((file) => {
                const isSelected = selectedIds.includes(file.id);
                return (
                  <div
                    key={file.id}
                    onClick={() => toggleSelect(file.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 group ${
                      isSelected
                        ? 'bg-cyan-950/20 border-cyan-400/60 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                        : 'bg-[#0e1422]/70 hover:bg-[#121929] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                            {file.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{file.size}</span>
                            <span>•</span>
                            <span>{file.uploadedAt}</span>
                          </div>
                        </div>
                      </div>

                      {/* Select indicator */}
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                            : 'border-slate-700 group-hover:border-slate-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {file.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">{file.description}</p>
                    )}

                    {/* Quick Action Bar on Card */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                      <span className="text-[10px] font-mono uppercase text-slate-500">{file.type}</span>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {file.content && onInsertPrompt && (
                          <button
                            type="button"
                            onClick={() => {
                              onInsertPrompt(file.content!);
                              onClose();
                            }}
                            className="px-2 py-0.5 rounded text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                          >
                            Insert
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id)}
                          title="Delete file"
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Multi-attach controls */}
        <div className="px-6 py-3.5 bg-[#080b12] border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {selectedIds.length > 0 ? (
              <span className="text-cyan-300 font-semibold">{selectedIds.length} item(s) selected</span>
            ) : (
              <span>Click items to select and attach</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {onAttachFilesToComposer && (
              <button
                type="button"
                onClick={handleAttachSelectedToComposer}
                disabled={selectedIds.length === 0}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Add to Composer ({selectedIds.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
