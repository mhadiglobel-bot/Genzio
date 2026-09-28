import React, { useState } from 'react';
import { X, Calendar, Clock, Bell, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ScheduledTask {
  id: string;
  title: string;
  time: string;
  repeat: 'once' | 'daily' | 'weekly';
  prompt: string;
  enabled: boolean;
}

interface ScheduledModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunScheduledPrompt: (prompt: string) => void;
}

const STORAGE_KEY = 'genzio_scheduled_tasks_v1';

export const ScheduledModal: React.FC<ScheduledModalProps> = ({
  isOpen,
  onClose,
  onRunScheduledPrompt,
}) => {
  const [tasks, setTasks] = useState<ScheduledTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'sch_1',
        title: 'Morning AI Briefing',
        time: '09:00 AM',
        repeat: 'daily',
        prompt: 'Provide a concise morning summary of key developer updates, system architecture trends, and productivity focus tips for today.',
        enabled: true,
      },
      {
        id: 'sch_2',
        title: 'Weekly Code Review & Refactoring Checklist',
        time: 'Friday 05:00 PM',
        repeat: 'weekly',
        prompt: 'Generate an actionable weekend code review and refactoring checklist focusing on TypeScript safety and performance.',
        enabled: true,
      },
    ];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newRepeat, setNewRepeat] = useState<'once' | 'daily' | 'weekly'>('daily');
  const [newPrompt, setNewPrompt] = useState('');

  if (!isOpen) return null;

  const saveTasks = (updated: ScheduledTask[]) => {
    setTasks(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) return;

    const newTask: ScheduledTask = {
      id: `sch_${Date.now()}`,
      title: newTitle.trim(),
      time: newTime || '10:00 AM',
      repeat: newRepeat,
      prompt: newPrompt.trim(),
      enabled: true,
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    setNewTitle('');
    setNewPrompt('');
    setIsAdding(false);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
    saveTasks(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#18191a] border border-[#2e3033] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#26282b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Scheduled Prompts & Reminders</h2>
              <p className="text-xs text-slate-400">Automate recurring queries, daily summaries, and scheduled AI actions</p>
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
              Active Schedules ({tasks.length})
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdding ? 'Cancel' : 'New Schedule'}</span>
            </button>
          </div>

          {/* Add form */}
          {isAdding && (
            <form onSubmit={handleAddTask} className="p-4 rounded-2xl bg-[#202225] border border-[#2f3236] space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Daily Standup Prep"
                  className="w-full px-3 py-2 bg-[#141517] border border-[#33363a] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Trigger Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="e.g. 09:00 AM"
                    className="w-full px-3 py-2 bg-[#141517] border border-[#33363a] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Frequency</label>
                  <select
                    value={newRepeat}
                    onChange={(e) => setNewRepeat(e.target.value as 'once' | 'daily' | 'weekly')}
                    className="w-full px-3 py-2 bg-[#141517] border border-[#33363a] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="once">Once</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Prompt to Run</label>
                <textarea
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  rows={3}
                  placeholder="The prompt that Genzio will execute at the scheduled time..."
                  className="w-full px-3 py-2 bg-[#141517] border border-[#33363a] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          )}

          {/* List of scheduled items */}
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-2xl bg-[#1f2023] border border-[#2d2f33] hover:border-[#3a3d42] transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate">{task.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                      {task.time} ({task.repeat})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {task.prompt}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onRunScheduledPrompt(task.prompt);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#2b2d31] hover:bg-[#34373d] text-cyan-300 text-[11px] font-medium transition-colors"
                    title="Run now in active chat"
                  >
                    Run Now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Delete"
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
