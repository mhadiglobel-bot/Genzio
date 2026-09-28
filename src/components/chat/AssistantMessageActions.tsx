import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Share2,
  Download,
  Pencil,
  MoreHorizontal,
  FileText,
  FileCode,
  Info,
  ExternalLink,
  Sparkles,
  Loader2,
  BookmarkPlus,
  AlertCircle,
  X,
} from 'lucide-react';
import { speechService } from '../../services/speechService';
import { storageService } from '../../services/storageService';
import { GeneratedImageData } from '../../types';

export interface AssistantMessageActionsProps {
  messageId: string;
  content: string;
  isStreaming?: boolean;
  liked?: boolean | null;
  error?: string;
  generatedImage?: GeneratedImageData;
  citationsCount?: number;
  modelUsed?: string;
  onLike?: (liked: boolean | null) => void;
  onRegenerate?: () => void;
  onShare?: () => void;
  onToast?: (message: string) => void;
  onEditImage?: (imageUrl: string, prompt: string) => void;
  onRegenerateImage?: (prompt: string) => void;
}

interface ActionTooltipProps {
  label: string;
  shortcut?: string;
}

const ActionTooltip: React.FC<ActionTooltipProps> = ({ label, shortcut }) => (
  <div
    role="tooltip"
    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex group-focus-visible:flex items-center gap-1.5 px-2 py-1 bg-[#12151a] text-slate-200 text-[11px] font-medium rounded-md shadow-xl border border-[#2e323b] whitespace-nowrap pointer-events-none z-40 transition-all duration-150 animate-in fade-in zoom-in-95"
  >
    <span>{label}</span>
    {shortcut && <span className="text-[10px] text-slate-400 font-mono">({shortcut})</span>}
    {/* Arrow indicator */}
    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-[#12151a]" />
  </div>
);

export const AssistantMessageActions: React.FC<AssistantMessageActionsProps> = ({
  messageId,
  content,
  isStreaming = false,
  liked = null,
  error,
  generatedImage,
  citationsCount = 0,
  modelUsed,
  onLike,
  onRegenerate,
  onShare,
  onToast,
  onEditImage,
  onRegenerateImage,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRegeneratingLocal, setIsRegeneratingLocal] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isDislikeFeedbackOpen, setIsDislikeFeedbackOpen] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const dislikeMenuRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const copyPromptTimeoutRef = useRef<number | null>(null);

  // Subscribe to speech synthesis state for this message
  useEffect(() => {
    const unsubscribe = speechService.subscribe((state) => {
      setIsSpeaking(state.activeMessageId === messageId && state.isPlaying);
    });
    return () => {
      unsubscribe();
    };
  }, [messageId]);

  // Clear regenerating state when streaming completes or new content arrives
  useEffect(() => {
    if (!isStreaming) {
      setIsRegeneratingLocal(false);
    }
  }, [isStreaming]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
      if (dislikeMenuRef.current && !dislikeMenuRef.current.contains(e.target as Node)) {
        setIsDislikeFeedbackOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (copyPromptTimeoutRef.current) clearTimeout(copyPromptTimeoutRef.current);
    };
  }, []);

  // Determine Message Type
  const isImageResponse = !!generatedImage;
  const isErrorResponse = !!error && !content;
  const hasCodeBlocks = /```[\s\S]*?```/.test(content);

  // 1. Copy Action
  const handleCopy = async () => {
    const textToCopy = content || error || '';
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
      onToast?.('Response copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text:', err);
      onToast?.('Failed to copy text');
    }
  };

  // 1b. Copy Prompt Action for Images
  const handleCopyPrompt = async () => {
    const promptText = generatedImage?.prompt || '';
    if (!promptText) return;
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPrompt(true);
      if (copyPromptTimeoutRef.current) clearTimeout(copyPromptTimeoutRef.current);
      copyPromptTimeoutRef.current = window.setTimeout(() => setCopiedPrompt(false), 2000);
      onToast?.('Prompt copied to clipboard');
    } catch (err) {
      console.error('Failed to copy prompt:', err);
      onToast?.('Failed to copy prompt');
    }
  };

  // 2. Like Action
  const handleLike = () => {
    if (isStreaming) return;
    setIsDislikeFeedbackOpen(false);
    const nextVal = liked === true ? null : true;
    onLike?.(nextVal);
    if (nextVal === true) {
      onToast?.('Feedback saved: Good response');
    }
  };

  // 3. Dislike Action with Quick Feedback Popover
  const handleDislike = () => {
    if (isStreaming) return;
    if (liked === false) {
      // Toggle off
      onLike?.(null);
      setIsDislikeFeedbackOpen(false);
      return;
    }
    // Set to disliked and open quick feedback
    onLike?.(false);
    setIsDislikeFeedbackOpen(true);
    onToast?.('Feedback saved: Response disliked');
  };

  const handleSelectDislikeReason = (reason: string) => {
    setFeedbackSubmitted(reason);
    setIsDislikeFeedbackOpen(false);
    onToast?.(`Feedback recorded: ${reason}`);
    try {
      // Store negative feedback record for diagnostics
      const feedbackLogs = JSON.parse(localStorage.getItem('genzio_feedback_logs') || '[]');
      feedbackLogs.push({
        messageId,
        type: 'dislike',
        reason,
        timestamp: Date.now(),
        preview: (content || error || '').slice(0, 120),
      });
      localStorage.setItem('genzio_feedback_logs', JSON.stringify(feedbackLogs.slice(-100)));
    } catch (e) {
      // ignore
    }
  };

  // 4. Regenerate Action
  const handleRegenerate = () => {
    if (isStreaming) return;
    if (isImageResponse && generatedImage?.prompt && onRegenerateImage) {
      onRegenerateImage(generatedImage.prompt);
      return;
    }
    if (!onRegenerate) return;
    setIsRegeneratingLocal(true);
    if (speechService.getActiveMessageId() === messageId) {
      speechService.stop();
    }
    onRegenerate();
  };

  // 5. Read Aloud Action (Web Speech API)
  const handleToggleSpeech = () => {
    if (isStreaming || !content) return;
    speechService.toggleReadAloud(messageId, content, {
      onError: () => {
        onToast?.('Speech playback is unavailable.');
      },
    });
  };

  // 6. Share Action (Web Share or Copy Link/Snippet)
  const handleShare = async () => {
    if (isStreaming) return;
    if (onShare) {
      onShare();
      return;
    }

    const shareTitle = isImageResponse ? 'Genzio AI Generated Image' : 'Genzio AI Response';
    const shareText = isImageResponse ? generatedImage?.prompt || '' : content || '';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        });
        onToast?.('Shared successfully');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Copy shareable formatted text
    try {
      await navigator.clipboard.writeText(shareText);
      onToast?.('Shareable response copied to clipboard');
    } catch {
      onToast?.('Unable to share at this time');
    }
  };

  // 7. Download Image (For Generated Images)
  const handleDownloadImage = () => {
    if (!generatedImage?.imageUrl) return;
    try {
      const link = document.createElement('a');
      link.href = generatedImage.imageUrl;
      const cleanName = (generatedImage.prompt || 'genzio_image').slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `${cleanName}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onToast?.('Image download started');
    } catch (e) {
      console.error('Download error:', e);
      onToast?.('Failed to download image');
    }
  };

  // 8. Export as Markdown (.md)
  const handleExportMarkdown = () => {
    setIsMoreOpen(false);
    try {
      const header = `---
type: genzio-assistant-response
messageId: ${messageId}
date: ${new Date().toISOString()}
model: ${modelUsed || 'Genzio AI'}
---

`;
      const blob = new Blob([header + (content || error || '')], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `genzio-response-${messageId.slice(0, 8)}.md`;
      link.click();
      URL.revokeObjectURL(url);
      onToast?.('Exported response as Markdown');
    } catch (e) {
      console.error(e);
      onToast?.('Failed to export markdown');
    }
  };

  // 9. Export as Plain Text (.txt)
  const handleExportPlainText = () => {
    setIsMoreOpen(false);
    try {
      const cleanText = speechService.cleanTextForSpeech(content || error || '');
      const blob = new Blob([cleanText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `genzio-response-${messageId.slice(0, 8)}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      onToast?.('Exported response as Text');
    } catch (e) {
      console.error(e);
      onToast?.('Failed to export text');
    }
  };

  // 10. Edit Image Handler
  const handleEditImagePrompt = () => {
    if (generatedImage && onEditImage) {
      onEditImage(generatedImage.imageUrl, generatedImage.prompt);
    } else {
      onToast?.('Edit prompt loaded in input');
    }
  };

  // Compute Statistics for Stats View
  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = content ? content.length : 0;
  const estimatedTokens = Math.round(charCount / 4);

  if (isStreaming && !content) {
    return null;
  }

  // =========================================================================
  // RENDER: ERROR RESPONSE ACTION ROW
  // =========================================================================
  if (isErrorResponse) {
    return (
      <div
        id={`assistant-actions-${messageId}`}
        role="toolbar"
        aria-label="Assistant error actions"
        className="flex items-center flex-wrap gap-1.5 pt-2 text-slate-400 select-none transition-opacity duration-200"
      >
        {/* Retry / Regenerate */}
        {onRegenerate && (
          <button
            type="button"
            id={`btn-retry-${messageId}`}
            onClick={handleRegenerate}
            disabled={isStreaming || isRegeneratingLocal}
            className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 border border-rose-500/30 transition-all duration-150 cursor-pointer text-xs font-medium focus-visible:ring-1 focus-visible:ring-rose-400"
            aria-label="Retry generation"
          >
            {isRegeneratingLocal ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-300" aria-hidden="true" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform duration-200 text-rose-300" aria-hidden="true" />
            )}
            <span>Retry</span>
            <ActionTooltip label="Retry generating response" />
          </button>
        )}

        {/* Copy Error */}
        <button
          type="button"
          id={`btn-copy-err-${messageId}`}
          onClick={handleCopy}
          className="group relative p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#22242a] transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-cyan-400"
          aria-label={copied ? 'Copied error message' : 'Copy error details'}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
          ) : (
            <Copy className="w-3.5 h-3.5 group-hover:text-slate-100" aria-hidden="true" />
          )}
          <ActionTooltip label={copied ? 'Copied!' : 'Copy error message'} />
        </button>

        {/* Share Error */}
        <button
          type="button"
          id={`btn-share-err-${messageId}`}
          onClick={handleShare}
          className="group relative p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#22242a] transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-cyan-400"
          aria-label="Share error details"
        >
          <Share2 className="w-3.5 h-3.5 group-hover:text-slate-100" aria-hidden="true" />
          <ActionTooltip label="Share error details" />
        </button>
      </div>
    );
  }

  // =========================================================================
  // RENDER: GENERATED IMAGE ACTION ROW
  // =========================================================================
  if (isImageResponse) {
    return (
      <div
        id={`assistant-actions-${messageId}`}
        role="toolbar"
        aria-label="Generated image actions"
        className="flex items-center flex-wrap gap-1 pt-1.5 text-slate-400 select-none transition-opacity duration-200 relative"
      >
        {/* 1. Download Full Image */}
        <button
          type="button"
          id={`btn-download-img-${messageId}`}
          onClick={handleDownloadImage}
          className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1e2128] hover:bg-[#262a33] text-slate-200 hover:text-white border border-[#2f333d] transition-all duration-150 cursor-pointer text-xs font-medium focus-visible:ring-1 focus-visible:ring-cyan-400 shadow-sm"
          aria-label="Download image"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
          <span>Download</span>
          <ActionTooltip label="Download high-res PNG" />
        </button>

        {/* 2. Copy Prompt */}
        <button
          type="button"
          id={`btn-copy-prompt-${messageId}`}
          onClick={handleCopyPrompt}
          className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1e2128] hover:bg-[#262a33] text-slate-300 hover:text-white border border-[#2f333d] transition-all duration-150 cursor-pointer text-xs font-medium focus-visible:ring-1 focus-visible:ring-cyan-400 shadow-sm"
          aria-label={copiedPrompt ? 'Prompt copied' : 'Copy prompt text'}
        >
          {copiedPrompt ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" aria-hidden="true" />
              <span>Copy Prompt</span>
            </>
          )}
          <ActionTooltip label={copiedPrompt ? 'Copied prompt!' : 'Copy prompt'} />
        </button>

        {/* 3. Regenerate Image */}
        {(onRegenerate || onRegenerateImage) && (
          <button
            type="button"
            id={`btn-regen-img-${messageId}`}
            onClick={handleRegenerate}
            disabled={isStreaming || isRegeneratingLocal}
            className="group relative p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#22242a] transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:opacity-40"
            aria-label="Regenerate image"
          >
            {isRegeneratingLocal ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-rotate-45 transition-transform duration-200" aria-hidden="true" />
            )}
            <ActionTooltip label="Regenerate artwork" />
          </button>
        )}

        {/* 4. Edit Prompt */}
        <button
          type="button"
          id={`btn-edit-img-${messageId}`}
          onClick={handleEditImagePrompt}
          className="group relative p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-[#22242a] transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400"
          aria-label="Edit image prompt"
        >
          <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
          <ActionTooltip label="Edit prompt" />
        </button>

        {/* 5. Share */}
        <button
          type="button"
          id={`btn-share-img-${messageId}`}
          onClick={handleShare}
          className="group relative p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-[#22242a] transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-purple-400"
          aria-label="Share image"
        >
          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
          <ActionTooltip label="Share image" />
        </button>

        {/* 6. Like */}
        <button
          type="button"
          id={`btn-like-img-${messageId}`}
          onClick={handleLike}
          className={`group relative p-1.5 sm:p-2 rounded-lg transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-pink-400 ${
            liked === true
              ? 'text-pink-400 bg-pink-500/15 border border-pink-500/30'
              : 'text-slate-400 hover:text-slate-100 hover:bg-[#22242a]'
          }`}
          aria-label={liked === true ? 'Remove like' : 'Like this image'}
          aria-pressed={liked === true}
        >
          <ThumbsUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${liked === true ? 'fill-pink-400/20' : ''}`} aria-hidden="true" />
          <ActionTooltip label={liked === true ? 'Liked' : 'Like image'} />
        </button>

        {/* 7. Dislike */}
        <button
          type="button"
          id={`btn-dislike-img-${messageId}`}
          onClick={handleDislike}
          className={`group relative p-1.5 sm:p-2 rounded-lg transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-rose-400 ${
            liked === false
              ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-100 hover:bg-[#22242a]'
          }`}
          aria-label={liked === false ? 'Remove dislike' : 'Dislike this image'}
          aria-pressed={liked === false}
        >
          <ThumbsDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${liked === false ? 'fill-rose-400/20' : ''}`} aria-hidden="true" />
          <ActionTooltip label={liked === false ? 'Disliked' : 'Dislike image'} />
        </button>
      </div>
    );
  }

  // =========================================================================
  // RENDER: STANDARD TEXT & CODE ASSISTANT ACTION ROW
  // =========================================================================
  return (
    <div
      id={`assistant-actions-${messageId}`}
      role="toolbar"
      aria-label="Assistant response actions"
      className="flex items-center flex-wrap gap-1 pt-1 text-slate-400 select-none transition-opacity duration-200 relative group/actions"
    >
      {/* 1. Copy Action */}
      <button
        type="button"
        id={`btn-copy-${messageId}`}
        onClick={handleCopy}
        disabled={!content}
        className="group relative p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#22242a] transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:opacity-40"
        aria-label={copied ? 'Copied to clipboard' : 'Copy response text'}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" aria-hidden="true" />
        ) : (
          <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:text-slate-200" aria-hidden="true" />
        )}
        <ActionTooltip label={copied ? 'Copied!' : 'Copy'} />
      </button>

      {/* 2. Like Action */}
      <button
        type="button"
        id={`btn-like-${messageId}`}
        onClick={handleLike}
        disabled={isStreaming}
        className={`group relative p-1.5 sm:p-2 rounded-lg transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-pink-400 disabled:opacity-40 ${
          liked === true
            ? 'text-pink-400 bg-pink-500/15 border border-pink-500/30'
            : 'text-slate-400 hover:text-slate-100 hover:bg-[#22242a]'
        }`}
        aria-label={liked === true ? 'Remove like feedback' : 'Like this response'}
        aria-pressed={liked === true}
      >
        <ThumbsUp
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${liked === true ? 'fill-pink-400/20' : ''}`}
          aria-hidden="true"
        />
        <ActionTooltip label={liked === true ? 'Good response' : 'Like'} />
      </button>

      {/* 3. Dislike Action */}
      <div className="relative" ref={dislikeMenuRef}>
        <button
          type="button"
          id={`btn-dislike-${messageId}`}
          onClick={handleDislike}
          disabled={isStreaming}
          className={`group relative p-1.5 sm:p-2 rounded-lg transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-rose-400 disabled:opacity-40 ${
            liked === false
              ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-100 hover:bg-[#22242a]'
          }`}
          aria-label={liked === false ? 'Remove dislike feedback' : 'Dislike this response'}
          aria-pressed={liked === false}
        >
          <ThumbsDown
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${liked === false ? 'fill-rose-400/20' : ''}`}
            aria-hidden="true"
          />
          <ActionTooltip label={liked === false ? 'Bad response' : 'Dislike'} />
        </button>

        {/* Quick Dislike Feedback Popover */}
        {isDislikeFeedbackOpen && (
          <div className="absolute left-0 bottom-full mb-2 w-64 bg-[#14171d] border border-[#2d323c] rounded-xl shadow-2xl p-3 z-50 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#252932]">
              <span className="font-semibold text-slate-200">Provide feedback</span>
              <button
                type="button"
                onClick={() => setIsDislikeFeedbackOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#1f232b] cursor-pointer"
                aria-label="Close feedback modal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">What went wrong with this response?</p>
            <div className="space-y-1.5">
              {[
                { id: 'inaccurate', label: 'Inaccurate or factually incorrect' },
                { id: 'unhelpful', label: 'Not helpful or missed intent' },
                { id: 'format', label: 'Poor formatting or bad code syntax' },
                { id: 'too_long', label: 'Too verbose or repetitive' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectDislikeReason(item.label)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white bg-[#1a1e26] hover:bg-[#242934] transition-colors cursor-pointer text-[11px] border border-transparent hover:border-[#383e4c]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Regenerate Action */}
      {onRegenerate && (
        <button
          type="button"
          id={`btn-regenerate-${messageId}`}
          onClick={handleRegenerate}
          disabled={isStreaming || isRegeneratingLocal}
          className="group relative p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-[#22242a] transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:opacity-40"
          aria-label="Regenerate response"
        >
          {isRegeneratingLocal ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-rotate-45 transition-transform duration-200" aria-hidden="true" />
          )}
          <ActionTooltip label="Regenerate response" />
        </button>
      )}

      {/* 5. Read Aloud Action */}
      <button
        type="button"
        id={`btn-read-aloud-${messageId}`}
        onClick={handleToggleSpeech}
        disabled={isStreaming || !content}
        className={`group relative p-1.5 sm:p-2 rounded-lg transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-purple-400 disabled:opacity-40 ${
          isSpeaking
            ? 'text-cyan-400 bg-cyan-500/15 border border-cyan-500/30'
            : 'text-slate-400 hover:text-slate-100 hover:bg-[#22242a]'
        }`}
        aria-label={isSpeaking ? 'Stop reading aloud' : 'Read response aloud'}
        aria-pressed={isSpeaking}
      >
        {isSpeaking ? (
          <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-pulse" aria-hidden="true" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:text-slate-200" aria-hidden="true" />
        )}
        <ActionTooltip label={isSpeaking ? 'Stop speaking' : 'Read aloud'} />
      </button>

      {/* 6. Share Action */}
      <button
        type="button"
        id={`btn-share-${messageId}`}
        onClick={handleShare}
        disabled={isStreaming}
        className="group relative p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-[#22242a] transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-purple-400 disabled:opacity-40"
        aria-label="Share response"
      >
        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:text-slate-200" aria-hidden="true" />
        <ActionTooltip label="Share response" />
      </button>

      {/* 7. More Menu Dropdown */}
      <div className="relative" ref={moreMenuRef}>
        <button
          type="button"
          id={`btn-more-${messageId}`}
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`group relative p-1.5 sm:p-2 rounded-lg transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-cyan-400 ${
            isMoreOpen
              ? 'text-cyan-400 bg-[#22242a]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-[#22242a]'
          }`}
          aria-label="More actions"
          aria-haspopup="true"
          aria-expanded={isMoreOpen}
        >
          <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
          <ActionTooltip label="More options" />
        </button>

        {isMoreOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute left-0 bottom-full mb-2 w-52 bg-[#14171d] border border-[#2d323c] rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95"
          >
            {/* Export as Markdown */}
            <button
              type="button"
              role="menuitem"
              onClick={handleExportMarkdown}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#222733] transition-colors cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export as Markdown (.md)</span>
            </button>

            {/* Export as Plain Text */}
            <button
              type="button"
              role="menuitem"
              onClick={handleExportPlainText}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#222733] transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export as Text (.txt)</span>
            </button>

            {/* Copy Raw Markdown */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                handleCopy();
                setIsMoreOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#222733] transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Raw Markdown</span>
            </button>

            <div className="my-1 border-t border-[#232731]" />

            {/* Word & Token Stats */}
            <div className="px-3 py-1.5 text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span>{wordCount} words</span>
              <span className="text-slate-600">•</span>
              <span>~{estimatedTokens} tokens</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
