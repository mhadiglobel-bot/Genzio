import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Zap, Cpu, Rabbit, ChevronDown, Check } from 'lucide-react';
import { GENZIO_MODELS, getModelConfig, ModelConfig } from '../../config/models';

interface ModelSelectorDropdownProps {
  selectedModel: string;
  onSelectModel: (modelName: string) => void;
  disabled?: boolean;
}

const MODEL_ICONS: Record<string, React.ElementType> = {
  'space-bunny-alpha': Rabbit,
  'genzio-advanced': Sparkles,
  'genzio-balanced': Sparkles,
  'genzio-fast': Zap,
  'genzio-lite': Cpu,
};

const SHORT_DESCRIPTIONS: Record<string, string> = {
  'space-bunny-alpha': 'OpenRouter Stealth Model',
  'genzio-advanced': 'Best for complex tasks',
  'genzio-balanced': 'Speed & reasoning balance',
  'genzio-fast': 'Fast everyday responses',
  'genzio-lite': 'Lightweight tasks',
};

export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  selectedModel,
  onSelectModel,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel: ModelConfig = getModelConfig(selectedModel);
  const CurrentIcon = MODEL_ICONS[currentModel.id] || Sparkles;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
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

  return (
    <div className="relative inline-block text-left select-none" ref={dropdownRef} id="header-model-selector">
      {/* Compact Top-Right Header Trigger Button */}
      <button
        type="button"
        id="model-selector-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Select AI Model"
        className={`flex items-center gap-1.5 sm:gap-2 h-9 px-2.5 sm:px-3 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer shadow-xs select-none ${
          isOpen
            ? 'bg-white/[0.08] text-white shadow-[0_0_16px_rgba(0,240,255,0.12)]'
            : 'bg-white/[0.035] hover:bg-white/[0.07] text-slate-200 hover:text-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <CurrentIcon className={`w-3.5 h-3.5 ${currentModel.colorAccent.textClass} shrink-0`} />
        <span className="font-semibold text-slate-100 hidden sm:inline">{currentModel.displayName}</span>
        <span className="font-semibold text-slate-100 sm:hidden">{currentModel.displayName.replace('Genzio ', '')}</span>
        <ChevronDown
          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-cyan-400' : 'group-hover:text-slate-200'
          }`}
        />
      </button>

      {/* Compact Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          id="model-selector-dropdown-menu"
          className="absolute top-full right-0 mt-2 w-72 rounded-2xl bg-[#14161c]/98 border border-white/[0.05] shadow-2xl z-50 p-1.5 space-y-1 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 select-none">
            <span className="font-medium text-slate-300">Model Selection</span>
            <span className="text-[10px] text-slate-500">AI Intelligence</span>
          </div>

          <div className="space-y-0.5 pt-0.5">
            {GENZIO_MODELS.map((model) => {
              const isSelected =
                model.id === currentModel.id ||
                model.displayName.toLowerCase() === currentModel.displayName.toLowerCase();
              const Icon = MODEL_ICONS[model.id] || Sparkles;
              const shortDesc = SHORT_DESCRIPTIONS[model.id] || model.role;
              const badgeLabel =
                model.id === 'space-bunny-alpha'
                  ? 'OpenRouter'
                  : model.id === 'genzio-advanced'
                  ? 'Pro'
                  : model.id === 'genzio-balanced'
                  ? 'Balanced'
                  : model.id === 'genzio-fast'
                  ? 'Fast'
                  : 'Lite';

              return (
                <button
                  key={model.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  id={`model-option-${model.id}`}
                  onClick={() => {
                    onSelectModel(model.displayName);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer group ${
                    isSelected
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${model.colorAccent.iconBgClass}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs leading-none text-slate-100 group-hover:text-white">
                          {model.displayName}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                            model.id === 'genzio-advanced'
                              ? 'bg-cyan-500/15 text-cyan-300'
                              : model.id === 'genzio-fast'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-emerald-500/15 text-emerald-300'
                          }`}
                        >
                          {badgeLabel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-1 truncate">
                        {shortDesc}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
