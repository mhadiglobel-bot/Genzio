import React, { useState } from 'react';
import { X, BookOpen, Plus, FileText, Trash2, ArrowRight, Save, Sparkles } from 'lucide-react';

interface Notebook {
  id: string;
  title: string;
  updatedAt: number;
  content: string;
}

interface NotebooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (text: string) => void;
}

const STORAGE_KEY = 'genzio_gemini_notebooks';

export const NotebooksModal: React.FC<NotebooksModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
}) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'nb-1',
        title: 'Project Architecture Notes',
        updatedAt: Date.now(),
        content: 'Key goals:\n1. Maintain clean modular React components\n2. Real-time Gemini API integration with streaming responses\n3. Responsive Gemini dark workspace UI',
      },
    ];
  });

  const [activeNotebookId, setActiveNotebookId] = useState<string>(notebooks[0]?.id || '');
  const [newTitle, setNewTitle] = useState('');

  if (!isOpen) return null;

  const saveNotebooks = (updated: Notebook[]) => {
    setNotebooks(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newNb: Notebook = {
      id: `nb_${Date.now()}`,
      title: newTitle.trim(),
      updatedAt: Date.now(),
      content: '',
    };

    const updated = [newNb, ...notebooks];
    saveNotebooks(updated);
    setActiveNotebookId(newNb.id);
    setNewTitle('');
  };

  const handleDeleteNotebook = (id: string) => {
    const updated = notebooks.filter((n) => n.id !== id);
    saveNotebooks(updated);
    if (activeNotebookId === id) {
      setActiveNotebookId(updated[0]?.id || '');
    }
  };

  const handleUpdateContent = (content: string) => {
    const updated = notebooks.map((n) =>
      n.id === activeNotebookId ? { ...n, content, updatedAt: Date.now() } : n
    );
    saveNotebooks(updated);
  };

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#1e1f20] border border-[#333538] rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2e30]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Gemini Notebooks</h2>
              <p className="text-xs text-slate-400">Organize research, scratchpads, and project documentation</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#2a2b2d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two Column Workspace */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Notebook List */}
          <div className="w-64 border-r border-[#2d2e30] bg-[#171718] p-3 flex flex-col">
            {/* Create notebook input */}
            <form onSubmit={handleCreateNotebook} className="mb-3 flex gap-1.5">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New notebook..."
                className="flex-1 bg-[#131314] border border-[#333538] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-1">
              {notebooks.map((nb) => (
                <div
                  key={nb.id}
                  onClick={() => setActiveNotebookId(nb.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer group transition-colors ${
                    activeNotebookId === nb.id
                      ? 'bg-[#282a2c] text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#212224]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{nb.title}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotebook(nb.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {notebooks.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  No notebooks yet
                </div>
              )}
            </div>
          </div>

          {/* Right Editor Area */}
          <div className="flex-1 p-4 flex flex-col bg-[#1e1f20]">
            {activeNotebook ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-[#2d2e30] mb-3">
                  <h3 className="font-semibold text-white text-sm">
                    {activeNotebook.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeNotebook.content.trim()) {
                        onInsertToChat(`Here are my notes on "${activeNotebook.title}":\n\n${activeNotebook.content}\n\nPlease summarize and answer my questions based on these notes.`);
                        onClose();
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze in Chat</span>
                  </button>
                </div>

                <textarea
                  value={activeNotebook.content}
                  onChange={(e) => handleUpdateContent(e.target.value)}
                  placeholder="Type or paste your research notes, outlines, code snippets, or ideas here..."
                  className="flex-1 bg-transparent text-slate-200 text-sm focus:outline-none resize-none leading-relaxed"
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Select or create a notebook to start writing
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
