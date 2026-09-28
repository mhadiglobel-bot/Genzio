import React, { useState } from 'react';
import { X, GraduationCap, Sparkles, BookOpen, Calculator, FileCheck, Code2, ArrowRight } from 'lucide-react';

interface StudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (prompt: string) => void;
}

const STUDENT_TOOLS = [
  {
    id: 'math',
    title: 'Math & Step-by-Step Solver',
    desc: 'Break down calculus, algebra, statistics, and differential equations with crystal clear steps.',
    icon: Calculator,
    prompt: 'Can you solve this math problem step-by-step and explain each formula used: ',
    color: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
  {
    id: 'essay',
    title: 'Essay & Thesis Polisher',
    desc: 'Review academic papers for clarity, strong thesis statements, argument flow, and citations.',
    icon: FileCheck,
    prompt: 'Please review and critique this academic essay draft for thesis strength, logic, and clarity: ',
    color: 'from-purple-500/20 to-pink-500/20 text-pink-400 border-pink-500/30',
  },
  {
    id: 'code',
    title: 'CS & Algorithm Tutor',
    desc: 'Understand data structures, time complexity (Big-O), system design, and debug code.',
    icon: Code2,
    prompt: 'Can you explain the optimal algorithm and time complexity (Big-O) for: ',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'flashcards',
    title: 'Exam Prep & Flashcards',
    desc: 'Generate high-yield active recall quiz questions and concise flashcards on any subject.',
    icon: BookOpen,
    prompt: 'Create a comprehensive study guide with 10 high-yield active recall questions and answers for: ',
    color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  },
];

export const StudentsModal: React.FC<StudentsModalProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
}) => {
  const [customSubject, setCustomSubject] = useState('');

  if (!isOpen) return null;

  const handleStartCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSubject.trim()) {
      onSelectTopic(`I need help studying and learning the following topic thoroughly: ${customSubject.trim()}. Please act as my academic tutor and create a structured lesson with key concepts and practice problems.`);
      setCustomSubject('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#1e1f20] border border-[#333538] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2e30]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Students & Study Hub</h2>
              <p className="text-xs text-slate-400">AI-powered tutoring, problem solving, and exam preparation</p>
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Custom Subject Input */}
          <form onSubmit={handleStartCustom} className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              What subject or concept are you studying today?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="e.g., Organic Chemistry, Linear Algebra, Machine Learning..."
                className="flex-1 bg-[#131314] border border-[#333538] focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!customSubject.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Study</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Study Tools */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Specialized Study Modes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STUDENT_TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      onSelectTopic(tool.prompt);
                      onClose();
                    }}
                    className={`p-4 rounded-2xl bg-[#131314] hover:bg-[#282a2c] border ${tool.color} text-left transition-all duration-200 group flex flex-col justify-between cursor-pointer`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className="w-4 h-4" />
                        <span className="font-semibold text-sm text-white group-hover:text-blue-400 transition-colors">
                          {tool.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-blue-400 font-medium">
                      <span>Launch mode</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
