import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, User, MessageSquare, Info } from 'lucide-react';
import { CustomInstructions } from '../../types';

interface CustomInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructions: CustomInstructions;
  onSave: (updated: CustomInstructions) => void;
}

export const CustomInstructionsModal: React.FC<CustomInstructionsModalProps> = ({
  isOpen,
  onClose,
  instructions,
  onSave,
}) => {
  const [aboutUser, setAboutUser] = useState(instructions.aboutUser);
  const [responsePreferences, setResponsePreferences] = useState(instructions.responsePreferences);
  const [enabled, setEnabled] = useState(instructions.enabled);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setAboutUser(instructions.aboutUser);
    setResponsePreferences(instructions.responsePreferences);
    setEnabled(instructions.enabled);
  }, [instructions, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      aboutUser: aboutUser.trim(),
      responsePreferences: responsePreferences.trim(),
      enabled,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-xl bg-[#0c101d] border border-cyan-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(0,240,255,0.15)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-pink-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">Custom Instructions</h3>
              <p className="text-slate-400 text-xs">Personalize how Genzio understands and responds to you</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Question 1: What would you like Genzio to know about you? */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <User className="w-4 h-4 text-cyan-400" />
              <span>What would you like Genzio to know about you to provide better responses?</span>
            </div>
            <textarea
              value={aboutUser}
              onChange={(e) => setAboutUser(e.target.value)}
              placeholder="e.g. I am a full-stack engineer working with TypeScript and Python. I live in San Francisco and prefer technical, production-grade solutions..."
              rows={4}
              className="w-full rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-400 text-slate-200 text-xs p-3.5 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 resize-none transition-all placeholder:text-slate-600 leading-relaxed"
            />
            <div className="text-[11px] text-slate-500">
              Mention your role, domain knowledge, location, or recurring project constraints.
            </div>
          </div>

          {/* Question 2: How would you like Genzio to respond? */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <MessageSquare className="w-4 h-4 text-pink-400" />
              <span>How would you like Genzio to respond?</span>
            </div>
            <textarea
              value={responsePreferences}
              onChange={(e) => setResponsePreferences(e.target.value)}
              placeholder="e.g. Be concise and direct. Provide clean code snippets without long conversational filler. When discussing architecture, highlight edge-cases and tradeoffs..."
              rows={4}
              className="w-full rounded-xl bg-slate-950/80 border border-slate-800 focus:border-pink-400 text-slate-200 text-xs p-3.5 focus:outline-none focus:ring-1 focus:ring-pink-400/50 resize-none transition-all placeholder:text-slate-600 leading-relaxed"
            />
            <div className="text-[11px] text-slate-500">
              Specify tone (formal, neutral, casual), detail level, coding styles, or preferred formats.
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">Enable for new chats</span>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                enabled ? 'bg-gradient-to-r from-cyan-500 to-pink-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
