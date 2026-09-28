import React from 'react';
import { X, Sparkles, Check, Zap, Brain, Shield, ShieldCheck } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#1e1f20] border border-[#333538] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#2d2e30] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Gemini Advanced
              </h2>
              <p className="text-xs text-blue-400 font-medium">Next-generation AI capabilities</p>
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

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-[#131314] border border-[#333538] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Gemini 2.5 Pro Ultra</span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">Active & Included</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Experience the 1M+ token context window, deep multi-step reasoning, multimodal image processing, and code compilation right in your browser.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              'Gemini 2.5 Pro with deep reasoning & code intelligence',
              'Real-time Web Search Grounding',
              'Unlimited File & Image attachments',
              'AI Image Generation with Imagen 3',
              'Interactive Notebooks & Study Hub',
              'High-fidelity Voice Dictation & Audio Readout',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-200">
                <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl transition-all cursor-pointer"
          >
            Continue with Gemini Pro
          </button>
        </div>
      </div>
    </div>
  );
};
