import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ReasoningLevel } from '../../types';

interface ReasoningOption {
  id: ReasoningLevel;
  label: string;
  description: string;
}

const REASONING_OPTIONS: ReasoningOption[] = [
  { id: 'auto', label: 'Auto', description: 'Automatically chooses depth' },
  { id: 'low', label: 'Low', description: 'Fast answers' },
  { id: 'medium', label: 'Medium', description: 'Balanced' },
  { id: 'high', label: 'High', description: 'Deeper reasoning' },
  { id: 'extra_high', label: 'Extra High', description: 'Complex tasks' },
  { id: 'max', label: 'Max', description: 'Maximum supported reasoning' },
];

interface ReasoningLevelSelectorProps {
  currentLevel: ReasoningLevel;
  onSelectLevel: (level: ReasoningLevel) => void;
  disabled?: boolean;
}

export const ReasoningLevelSelector: React.FC<ReasoningLevelSelectorProps> = ({
  currentLevel,
  onSelectLevel,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentOption = REASONING_OPTIONS.find((opt) => opt.id === currentLevel) || REASONING_OPTIONS[2];

  const handleSelect = (level: ReasoningLevel) => {
    onSelectLevel(level);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center select-none">
      {/* Popover above the composer button */}
      {isOpen && (
        <div
          id="reasoning-speed-popover"
          role="listbox"
          aria-label="Speed and Reasoning levels"
          className="absolute bottom-full right-0 mb-2 w-56 bg-[#181a1d] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
        >
          {/* Popover Header */}
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 tracking-wide select-none border-b border-white/5 mb-1">
            Speed / Reasoning
          </div>

          {/* Options: Auto, Low, Medium, High, Extra High, Max */}
          <div className="space-y-0.5">
            {REASONING_OPTIONS.map((opt) => {
              const isSelected = currentLevel === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  id={`reasoning-option-${opt.id}`}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex flex-col pr-2">
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal opacity-80">{opt.description}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Compact Reasoning Button inside composer: e.g. [ High ▾ ] */}
      <button
        ref={buttonRef}
        type="button"
        id="composer-reasoning-btn"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Reasoning speed: ${currentOption.label}`}
        title={`Reasoning speed: ${currentOption.label} (Click to change)`}
        className={`h-7 sm:h-8 px-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          isOpen
            ? 'bg-white/15 text-white border border-white/15'
            : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span>{currentOption.label}</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
};
