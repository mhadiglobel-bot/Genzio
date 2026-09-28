import React, { useState } from 'react';
import { X, Folder, Plus, Trash2, ArrowRight, Sparkles, FileText, Check } from 'lucide-react';

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  chatCount: number;
  tags: string[];
  updatedAt: number;
}

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProjectTag?: (tag: string) => void;
}

const STORAGE_KEY = 'genzio_projects_v1';

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  onSelectProjectTag,
}) => {
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'proj_1',
        name: 'Genzio AI Core',
        description: 'Design system, fluid brand identity, and streaming conversational models.',
        chatCount: 4,
        tags: ['Production', 'UI/UX', 'AI'],
        updatedAt: Date.now(),
      },
      {
        id: 'proj_2',
        name: 'Product Roadmap & Engineering',
        description: 'Multi-modal workspace, automated reminders, and scheduled tasks.',
        chatCount: 2,
        tags: ['Roadmap', 'Backend'],
        updatedAt: Date.now() - 86400000,
      },
    ];
  });

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const saveProjects = (updated: ProjectItem[]) => {
    setProjects(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newProject: ProjectItem = {
      id: `proj_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Custom Genzio workspace project',
      chatCount: 0,
      tags: tags.length > 0 ? tags : ['General'],
      updatedAt: Date.now(),
    };

    const updated = [newProject, ...projects];
    saveProjects(updated);
    setName('');
    setDescription('');
    setTagInput('');
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    saveProjects(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#18191a] border border-[#2e3033] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#26282b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Genzio Projects</h2>
              <p className="text-xs text-slate-400">Group conversations, files, and custom context by initiative</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#25272a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Workspaces ({projects.length})
            </span>
            <button
              type="button"
              onClick={() => setIsCreating(!isCreating)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium border border-purple-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Cancel' : 'New Project'}</span>
            </button>
          </div>

          {/* Create form */}
          {isCreating && (
            <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-[#202225] border border-[#2f3236] space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mobile App Redesign"
                  className="w-full px-3 py-2 bg-[#141517] border border-[#33363a] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Goals and instructions for this workspace..."
                  className="w-full px-3 py-2 bg-[#141517] border border-[#33363a] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Engineering, Design, Q3"
                  className="w-full px-3 py-2 bg-[#141517] border border-[#33363a] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          )}

          {/* Project Cards */}
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="p-4 rounded-2xl bg-[#1f2023] border border-[#2d2f33] hover:border-[#3a3d42] transition-colors flex items-start justify-between gap-4 group"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">{proj.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#27292d] text-slate-400">
                      {proj.chatCount} chats
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectProjectTag?.(proj.name);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#2b2d31] hover:bg-[#35383e] text-purple-300 text-xs font-medium transition-colors"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(proj.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
