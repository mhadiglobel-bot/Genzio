import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Plus,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  FileCode,
  Paperclip,
  Mic,
  MicOff,
  X,
  BookOpen,
  Pencil,
} from 'lucide-react';
import { ChatAttachment, ReasoningLevel } from '../../types';
import { ReasoningLevelSelector } from './ReasoningLevelSelector';
import { NeonSearchBar } from './NeonSearchBar';

interface ChatComposerProps {
  onSendMessage: (
    content: string,
    attachments: ChatAttachment[],
    options?: { webSearch?: boolean; reasoning?: boolean; research?: boolean }
  ) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  onOpenLibrary: () => void;
  reasoningLevel: ReasoningLevel;
  onSelectReasoningLevel: (level: ReasoningLevel) => void;
  isCentered?: boolean;
  enterToSend?: boolean;
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
  /** Whether to show the animated neon RGB / rainbow gradient aura and border */
  neonGlow?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  onOpenLibrary,
  reasoningLevel,
  onSelectReasoningLevel,
  isCentered = false,
  enterToSend = true,
  editingMessage = null,
  onCancelEdit,
  neonGlow = isCentered,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [fileAcceptFilter, setFileAcceptFilter] = useState<string>('*/*');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync editing text when entering edit mode
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content);
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Place cursor at end of text
        textareaRef.current.setSelectionRange(
          editingMessage.content.length,
          editingMessage.content.length
        );
      }
    }
  }, [editingMessage]);

  const handleSubmit = () => {
    if (isStreaming) {
      onStopStreaming();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    onSendMessage(trimmed, attachments);

    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  };

  const handleCancelEditMode = () => {
    setText('');
    onCancelEdit?.();
  };

  // Controlled auto-expansion for textarea (up to max-height 140px, then internal scroll)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 24), 140);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [text]);

  // Click outside or Escape to close plus menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPlusMenuOpen(false);
      }
    };

    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlusMenuOpen]);

  // Web Speech Recognition for Voice Dictation
  const toggleVoiceDictation = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice dictation is not supported by your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && editingMessage) {
      e.preventDefault();
      handleCancelEditMode();
      return;
    }

    if (enterToSend) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    } else {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const triggerUpload = (acceptType: string) => {
    setFileAcceptFilter(acceptType);
    setIsPlusMenuOpen(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Process files via server pipeline
  const processSelectedFile = async (file: File) => {
    const tempId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isSheet =
      file.type.includes('spreadsheet') ||
      file.type.includes('csv') ||
      /\.(csv|xlsx|xls)$/i.test(file.name);

    const initialCategory = isImg
      ? 'image'
      : isPdf
      ? 'pdf'
      : isSheet
      ? 'spreadsheet'
      : 'document';

    // 1. Add temporary processing attachment item
    const initialAttachment: ChatAttachment = {
      id: tempId,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || 'application/octet-stream',
      fileCategory: initialCategory,
      status: 'processing',
    };

    setAttachments((prev) => [...prev, initialAttachment]);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const commaIdx = result.indexOf(',');
          resolve(commaIdx !== -1 ? result.slice(commaIdx + 1) : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Send to server processing endpoint
      const res = await fetch('/api/process-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          type: file.type || 'application/octet-stream',
          base64,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !data.file) {
        throw new Error(data.file?.errorMessage || data.error || 'File processing failed');
      }

      const processed = data.file;

      setAttachments((prev) =>
        prev.map((att) => {
          if (att.id === tempId) {
            return {
              ...att,
              dataUrl: processed.dataUrl,
              content: processed.extractedText,
              pageCount: processed.pageCount,
              status: processed.status === 'ready' ? 'ready' : 'error',
              errorMessage: processed.errorMessage,
            };
          }
          return att;
        })
      );
    } catch (err: any) {
      console.error(`Error processing file ${file.name}:`, err);
      setAttachments((prev) =>
        prev.map((att) => {
          if (att.id === tempId) {
            return {
              ...att,
              status: 'error',
              errorMessage: err.message || 'Processing failed. Please try again.',
            };
          }
          return att;
        })
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(processSelectedFile);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Clipboard Paste Support for Screenshots / Images
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          processSelectedFile(file);
        }
      }
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processSelectedFile);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const isAnyProcessing = attachments.some((att) => att.status === 'processing');
  const hasContent = (text.trim().length > 0 || attachments.length > 0) && !isAnyProcessing;

  return (
    <div
      id="chat-composer-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full ${
        isCentered ? 'max-w-2xl px-3 sm:px-4' : 'max-w-3xl lg:max-w-4xl px-3 sm:px-6 mx-auto'
      }`}
    >
      {/* Drag and Drop Zone Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 rounded-3xl border-2 border-dashed border-cyan-400 bg-cyan-950/80 backdrop-blur-md flex flex-col items-center justify-center text-cyan-200 gap-2 p-4 animate-in fade-in duration-150">
          <Paperclip className="w-8 h-8 text-cyan-400 animate-bounce" />
          <span className="font-semibold text-sm">Drop files here to attach</span>
          <span className="text-xs text-cyan-400/80">Supports PNG, JPG, PDF, CSV, TXT, MD</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        multiple
        accept={fileAcceptFilter}
      />

      {/* Editing Message Banner Indicator */}
      {editingMessage && (
        <div
          id="composer-editing-banner"
          className="flex items-center justify-between px-4 py-1.5 mb-1.5 rounded-xl bg-pink-950/40 border border-pink-500/30 text-xs text-pink-200 backdrop-blur-md animate-fadeIn select-none"
        >
          <div className="flex items-center gap-2">
            <Pencil className="w-3.5 h-3.5 text-pink-400 shrink-0" aria-hidden="true" />
            <span className="font-medium text-pink-300">Editing message</span>
          </div>
          <button
            type="button"
            onClick={handleCancelEditMode}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-pink-300 hover:text-white hover:bg-pink-900/30 transition-colors cursor-pointer text-[11px]"
            title="Cancel editing"
            aria-label="Cancel editing"
          >
            <X className="w-3 h-3" />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Modern Compact AI Composer: [ + ]  Message Genzio...  [High ▾] [Mic] [Send] */}
      {(() => {
        const composerBox = (
          <div
            className={`relative transition-all duration-200 shadow-2xl p-2 sm:p-2.5 flex flex-col gap-1.5 backdrop-blur-2xl ${
              neonGlow
                ? 'rounded-[calc(1rem-1.5px)] sm:rounded-[calc(1.5rem-1.5px)] border-0'
                : `rounded-2xl sm:rounded-3xl border border-white/[0.05] ${
                    editingMessage
                      ? 'border-pink-500/40 ring-1 ring-pink-500/30 shadow-[0_0_24px_rgba(236,72,153,0.12)]'
                      : hasContent
                      ? 'shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
                      : 'shadow-[0_8px_24px_rgba(0,0,0,0.3)]'
                  }`
            }`}
            style={{
              backgroundColor: 'var(--surface)',
            }}
          >
        {/* Compact Attachment Badges if any */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1 pt-0.5 pb-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className={`flex items-center gap-2 py-1.5 px-2.5 rounded-xl border text-xs shadow-sm transition-all ${
                  att.status === 'error'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : att.status === 'processing'
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200 animate-pulse'
                    : 'bg-[#141619] border-white/10 text-slate-200'
                }`}
              >
                {att.dataUrl && att.fileCategory === 'image' ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="w-6 h-6 rounded-md object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <span className="shrink-0">
                    {att.fileCategory === 'pdf' ? (
                      <FileText className="w-4 h-4 text-rose-400" />
                    ) : att.fileCategory === 'spreadsheet' || att.fileCategory === 'sheet' ? (
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Paperclip className="w-4 h-4 text-cyan-400" />
                    )}
                  </span>
                )}

                <div className="flex flex-col min-w-0">
                  <span className="max-w-[130px] sm:max-w-[160px] truncate text-[11px] font-medium leading-tight text-slate-100">
                    {att.name}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {att.status === 'processing' ? (
                      <span className="text-cyan-400 font-medium">Processing...</span>
                    ) : att.status === 'error' ? (
                      <span className="text-rose-400 font-medium">{att.errorMessage || 'Error'}</span>
                    ) : (
                      <>
                        {att.pageCount ? `${att.pageCount} pages • ` : ''}
                        {att.size}
                      </>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer shrink-0 ml-1"
                  title="Remove attachment"
                  aria-label="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Row: [ + ]  Message Genzio...  [High ▾] [Mic] [Send] */}
        <div className="flex items-end gap-1.5 sm:gap-2">
          {/* Plus / Attachments Button */}
          <div className="relative shrink-0 mb-0.5" ref={plusMenuRef}>
            <button
              type="button"
              id="composer-plus-btn"
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isPlusMenuOpen
                  ? 'bg-white text-black'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Add attachments"
              aria-label="Add attachments"
              aria-haspopup="menu"
              aria-expanded={isPlusMenuOpen}
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Plus Action Popup Menu */}
            {isPlusMenuOpen && (
              <div
                role="menu"
                id="composer-plus-menu"
                className="absolute bottom-full left-0 mb-2 w-52 bg-[#16181c] border border-white/10 rounded-2xl shadow-2xl p-1.5 space-y-0.5 text-xs text-slate-200 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
              >
                <button
                  type="button"
                  role="menuitem"
                  id="composer-upload-image"
                  onClick={() => triggerUpload('image/*')}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2.5 text-left cursor-pointer transition-colors text-slate-200 hover:text-white"
                >
                  <ImageIcon className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>Upload Image</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  id="composer-upload-pdf"
                  onClick={() => triggerUpload('.pdf,application/pdf')}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2.5 text-left cursor-pointer transition-colors text-slate-200 hover:text-white"
                >
                  <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Upload PDF</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  id="composer-upload-document"
                  onClick={() => triggerUpload('.txt,.md,.doc,.docx,.json,.ts,.js,.py')}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2.5 text-left cursor-pointer transition-colors text-slate-200 hover:text-white"
                >
                  <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Upload Document</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  id="composer-upload-spreadsheet"
                  onClick={() => triggerUpload('.csv,.xlsx,.xls,text/csv')}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2.5 text-left cursor-pointer transition-colors text-slate-200 hover:text-white"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Upload Spreadsheet</span>
                </button>

                <div className="h-px bg-white/5 my-1" />

                <button
                  type="button"
                  role="menuitem"
                  id="composer-open-library"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    onOpenLibrary();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2.5 text-left cursor-pointer transition-colors text-slate-200 hover:text-white"
                >
                  <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Add from Library</span>
                </button>
              </div>
            )}
          </div>

          {/* Text Input */}
          <div className="flex-1 min-w-0 py-1 px-1">
            <textarea
              ref={textareaRef}
              id="chat-message-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={editingMessage ? 'Edit your prompt...' : 'Message Genzio...'}
              rows={1}
              className="w-full bg-transparent border-0 text-slate-100 text-[15px] focus:outline-none resize-none px-1 placeholder:text-slate-500 leading-relaxed font-sans block scrollbar-thin"
              style={{ minHeight: '24px', maxHeight: '140px' }}
              aria-label={editingMessage ? 'Edit your message' : 'Message input'}
            />
          </div>

          {/* Right Action Controls: [High ▾] [Mic] [Send / Stop] */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 mb-0.5">
            {/* Reasoning / Speed Popover Button */}
            <ReasoningLevelSelector
              currentLevel={reasoningLevel}
              onSelectLevel={onSelectReasoningLevel}
            />

            {/* Voice Input Button */}
            <button
              type="button"
              id="composer-voice-btn"
              onClick={toggleVoiceDictation}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Voice dictation'}
              aria-label={isListening ? 'Stop voice recording' : 'Start voice dictation'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send or Stop Button */}
            {isStreaming ? (
              <button
                type="button"
                id="composer-stop-btn"
                onClick={onStopStreaming}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-md shrink-0"
                title="Stop generating"
                aria-label="Stop generating"
              >
                <Square className="w-3.5 h-3.5 fill-black" />
              </button>
            ) : (
              <button
                type="button"
                id="composer-send-btn"
                onClick={handleSubmit}
                disabled={!hasContent}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  hasContent
                    ? editingMessage
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white cursor-pointer shadow-md hover:scale-105'
                      : 'hover:opacity-90 text-black cursor-pointer shadow-md hover:scale-105'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: hasContent && !editingMessage ? 'var(--accent)' : undefined,
                  boxShadow: hasContent && !editingMessage ? 'var(--accent-glow)' : undefined,
                }}
                title={editingMessage ? 'Update and regenerate' : 'Send message'}
                aria-label={editingMessage ? 'Update and regenerate message' : 'Send message'}
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    );

    return neonGlow ? (
      <NeonSearchBar active={true} isFocused={isFocused}>
        {composerBox}
      </NeonSearchBar>
    ) : (
      composerBox
    );
  })()}

      {/* Minimal Footer Disclaimer */}
      <div className="text-center pt-1.5 text-[11px] text-slate-500 select-none">
        Genzio can make mistakes. Verify important info.
      </div>
    </div>
  );
};
