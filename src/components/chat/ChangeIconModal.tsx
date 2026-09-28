import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Sparkles, Upload, Terminal, FileText, Search, MessageSquare, Check } from 'lucide-react';
import { ChatSession } from '../../types';

interface ChangeIconModalProps {
  chat: ChatSession;
  isOpen: boolean;
  onClose: () => void;
  onSaveIcon: (chatId: string, iconValue: string | undefined, iconCategory?: string) => void;
}

const PRESET_EMOJIS = ['💻', '📄', '🎨', '🔍', '⚡', '🚀', '💬', '🤖', '📚', '💡', '🎯', '🛠️', '✨', '🧠', '🌐', '📊'];

const ORB_PRESETS = [
  { id: 'orb:cyan', label: 'Cyan Orb', colorClass: 'bg-cyan-500 shadow-cyan-500/50' },
  { id: 'orb:pink', label: 'Pink Orb', colorClass: 'bg-pink-500 shadow-pink-500/50' },
  { id: 'orb:purple', label: 'Purple Orb', colorClass: 'bg-purple-500 shadow-purple-500/50' },
  { id: 'orb:emerald', label: 'Emerald Orb', colorClass: 'bg-emerald-500 shadow-emerald-500/50' },
];

export const ChangeIconModal: React.FC<ChangeIconModalProps> = ({
  chat,
  isOpen,
  onClose,
  onSaveIcon,
}) => {
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(chat.icon);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(chat.iconCategory || 'chat');
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(
    chat.icon && chat.icon.startsWith('data:image/') ? chat.icon : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to 64x64 thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 64, 64);
          const resizedBase64 = canvas.toDataURL('image/png', 0.8);
          setUploadedDataUrl(resizedBase64);
          setSelectedIcon(resizedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSaveIcon(chat.id, selectedIcon, selectedCategory);
    onClose();
  };

  const handleResetToDefault = () => {
    setSelectedIcon(undefined);
    setUploadedDataUrl(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#161719] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Change Chat Icon</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Target Chat Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {selectedIcon ? (
                selectedIcon.startsWith('data:image/') || selectedIcon.startsWith('http') ? (
                  <img src={selectedIcon} alt="Icon" className="w-full h-full object-cover" />
                ) : selectedIcon.startsWith('orb:') ? (
                  <span className={`w-3 h-3 rounded-full ${ORB_PRESETS.find(o => o.id === selectedIcon)?.colorClass || 'bg-cyan-400'} shadow-md`} />
                ) : (
                  <span className="text-base">{selectedIcon}</span>
                )
              ) : selectedCategory === 'coding' ? (
                <Terminal className="w-4 h-4 text-cyan-400" />
              ) : selectedCategory === 'doc' ? (
                <FileText className="w-4 h-4 text-amber-400" />
              ) : selectedCategory === 'image' ? (
                <ImageIcon className="w-4 h-4 text-pink-400" />
              ) : selectedCategory === 'research' ? (
                <Search className="w-4 h-4 text-purple-400" />
              ) : (
                <MessageSquare className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{chat.title}</p>
              <p className="text-[11px] text-slate-400">Select a custom icon or category badge</p>
            </div>
          </div>

          {/* Section 1: Categories */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-2">
              Category Preset
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'chat', label: 'General', icon: MessageSquare, color: 'text-slate-400' },
                { id: 'coding', label: 'Coding', icon: Terminal, color: 'text-cyan-400' },
                { id: 'doc', label: 'Doc', icon: FileText, color: 'text-amber-400' },
                { id: 'image', label: 'Image', icon: ImageIcon, color: 'text-pink-400' },
                { id: 'research', label: 'Research', icon: Search, color: 'text-purple-400' },
              ].map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = !selectedIcon && selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedIcon(undefined);
                      setSelectedCategory(cat.id);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${cat.color}`} />
                    <span className="text-[10px] font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Genzio Orbs */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-2">
              Genzio Glowing Orbs
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ORB_PRESETS.map((orb) => {
                const isSelected = selectedIcon === orb.id;
                return (
                  <button
                    key={orb.id}
                    type="button"
                    onClick={() => setSelectedIcon(orb.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${orb.colorClass} shadow-md shrink-0`} />
                    <span className="text-[11px] font-medium truncate">{orb.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Emoji Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-2">
              Emoji Icons
            </label>
            <div className="grid grid-cols-8 gap-1.5">
              {PRESET_EMOJIS.map((emoji) => {
                const isSelected = selectedIcon === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedIcon(emoji)}
                    className={`h-9 rounded-xl text-base flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border border-cyan-500/50 scale-105'
                        : 'bg-white/[0.03] hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Upload Custom Image */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-2">
              Upload Custom Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>{uploadedDataUrl ? 'Change Uploaded Image' : 'Choose PNG, JPG, or WEBP'}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-black/20">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Reset to Default
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Icon</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
