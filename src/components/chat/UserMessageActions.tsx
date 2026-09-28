import React, { useState, useRef, useEffect } from 'react';
import {
  Pencil,
  Copy,
  Check,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export interface UserMessageActionsProps {
  messageId: string;
  content: string;
  isStreaming?: boolean;
  onEditPrompt?: () => void;
  onRegenerate?: () => void;
  onToast?: (message: string) => void;
}

export const UserMessageActions: React.FC<UserMessageActionsProps> = ({
  messageId,
  content,
  isStreaming = false,
  onEditPrompt,
  onRegenerate,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRegeneratingLocal, setIsRegeneratingLocal] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      setIsRegeneratingLocal(false);
    }
  }, [isStreaming]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // 1. Real Copy User Text
  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
      onToast?.('User message copied');
    } catch (err) {
      console.error('Failed to copy user prompt:', err);
      onToast?.('Failed to copy user message');
    }
  };

  // 2. Real Edit Prompt
  const handleEdit = () => {
    if (isStreaming || !onEditPrompt) return;
    onEditPrompt();
  };

  // 3. Real Regenerate from this User message
  const handleRegenerate = () => {
    if (isStreaming || !onRegenerate) return;
    setIsRegeneratingLocal(true);
    onRegenerate();
  };

  return (
    <div
      id={`user-actions-${messageId}`}
      role="toolbar"
      aria-label="User message actions"
      className="flex items-center gap-1 mt-1 text-slate-400 select-none opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150"
    >
      {/* 1. Edit Prompt Button */}
      {onEditPrompt && (
        <button
          type="button"
          id={`btn-edit-prompt-${messageId}`}
          onClick={handleEdit}
          disabled={isStreaming}
          className="p-1 sm:p-1.5 rounded-lg hover:bg-[#282a2c] text-slate-400 hover:text-slate-100 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-pink-500/50 disabled:opacity-40 disabled:cursor-not-allowed group relative"
          title="Edit Prompt"
          aria-label="Edit this prompt"
        >
          <Pencil className="w-3.5 h-3.5 group-hover:text-pink-300" aria-hidden="true" />
        </button>
      )}

      {/* 2. Copy Button */}
      <button
        type="button"
        id={`btn-user-copy-${messageId}`}
        onClick={handleCopy}
        disabled={!content}
        className="p-1 sm:p-1.5 rounded-lg hover:bg-[#282a2c] text-slate-400 hover:text-slate-100 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-40 disabled:cursor-not-allowed group relative"
        title={copied ? 'Copied' : 'Copy'}
        aria-label={copied ? 'Copied prompt to clipboard' : 'Copy user prompt'}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" aria-hidden="true" />
        )}
      </button>

      {/* 3. Regenerate Button */}
      {onRegenerate && (
        <button
          type="button"
          id={`btn-user-regenerate-${messageId}`}
          onClick={handleRegenerate}
          disabled={isStreaming || isRegeneratingLocal}
          className="p-1 sm:p-1.5 rounded-lg hover:bg-[#282a2c] text-slate-400 hover:text-slate-100 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-40 disabled:cursor-not-allowed group relative"
          title="Regenerate"
          aria-label="Regenerate response from this prompt"
        >
          {isRegeneratingLocal ? (
            <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-45 transition-transform" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
};
