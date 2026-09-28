import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Paperclip,
  Brain,
  ChevronDown,
  ChevronRight,
  Globe,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { GenzioLogo } from '../common/GenzioLogo';
import { AnimatedGLogo } from '../common/AnimatedGLogo';
import { AssistantMessageActions } from './AssistantMessageActions';
import { UserMessageActions } from './UserMessageActions';
import { PromptBlock } from './PromptBlock';
import { GeneratedImageCard } from './GeneratedImageCard';
import { ThinkingStatus } from './ThinkingStatus';
import { ExecutionProgressView } from './ExecutionProgressView';
import { ImageLightboxModal } from './ImageLightboxModal';
import { CodeBlock } from './CodeBlock';

interface ChatMessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onStop?: () => void;
  onRegenerate?: () => void;
  onShare?: () => void;
  onLike?: (liked: boolean | null) => void;
  onEditUserMessage?: () => void;
  isHighlighted?: boolean;
  onToast?: (message: string) => void;
  onGenerateImage?: (prompt: string) => void;
  onRegenerateImage?: (prompt: string) => void;
  onEditImage?: (imageUrl: string, prompt: string) => void;
}

/**
 * Normalizes raw Markdown output from LLM:
 * - Unescapes asterisks (\*\* -> **) and underscores (\_ -> _) so bold/italic parse properly.
 * - Trims unparsed spaces inside bold marks (** text ** -> **text**).
 * - Fixes escaped hashtags at start of line (\# -> #).
 * - Collapses consecutive horizontal rules into a single rule.
 */
function preprocessMarkdown(raw: string): string {
  if (!raw) return '';
  let text = raw;
  text = text.replace(/\\\*/g, '*');
  text = text.replace(/\\_/g, '_');
  text = text.replace(/^\\#/gm, '#');
  text = text.replace(/\*\*\s+([^*\n]+?)\s+\*\*/g, '**$1**');
  text = text.replace(/(?<!\*)\*\s+([^*\n]+?)\s+\*(?!\*)/g, '*$1*');
  text = text.replace(/(?:\n\s*(?:---|\*\*\*|___)\s*){2,}/g, '\n\n---\n\n');
  return text;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isStreaming = false,
  onStop,
  onRegenerate,
  onShare,
  onLike,
  onEditUserMessage,
  isHighlighted = false,
  onToast,
  onGenerateImage,
  onRegenerateImage,
  onEditImage,
}) => {
  const isAssistant = message.role === 'assistant';
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // =========================================================================
  // USER MESSAGE (Clean Readable Text Aligned Right + User Action Controls)
  // =========================================================================
  if (!isAssistant) {
    return (
      <>
        {/* Lightbox Modal */}
        <ImageLightboxModal
          imageUrl={activeLightboxImage}
          onClose={() => setActiveLightboxImage(null)}
        />

        <div
          id={`message-${message.id}`}
          className={`w-full py-2.5 flex justify-end group transition-all duration-200 ${
            isHighlighted ? 'bg-cyan-500/10 ring-1 ring-cyan-400/60 rounded-2xl' : ''
          }`}
        >
          <div className="max-w-[88%] sm:max-w-[80%] md:max-w-[72%] flex flex-col items-end gap-1">
            {/* User Attachments Display */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2 mb-0.5">
                {message.attachments.map((att) => (
                  <div
                    key={att.id}
                    className={`flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-[#1e1f20] border border-[#333538] text-xs text-slate-200 shadow-sm transition-all ${
                      att.dataUrl && (att.fileCategory === 'image' || att.dataUrl.startsWith('data:image/'))
                        ? 'cursor-pointer hover:border-cyan-400/50 hover:bg-[#25272a]'
                        : ''
                    }`}
                    onClick={() => {
                      if (att.dataUrl && (att.fileCategory === 'image' || att.dataUrl.startsWith('data:image/'))) {
                        setActiveLightboxImage(att.dataUrl);
                      }
                    }}
                  >
                    {att.dataUrl && (att.fileCategory === 'image' || att.dataUrl.startsWith('data:image/')) ? (
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                      />
                    ) : att.fileCategory === 'pdf' ? (
                      <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : att.fileCategory === 'spreadsheet' || att.fileCategory === 'sheet' || att.fileCategory === 'csv' ? (
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Paperclip className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                    <div className="min-w-0 pr-1">
                      <div className="font-medium text-[11px] truncate text-slate-100 max-w-[140px] sm:max-w-[180px]">
                        {att.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {att.pageCount ? `${att.pageCount} pages • ` : ''}
                        {att.size}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* Clean User Message Text Bubble */}
          <div
            className="rounded-2xl px-4 py-2.5 text-[15px] sm:text-[16px] leading-relaxed break-words shadow-sm select-text border border-white/[0.04]"
            style={{
              backgroundColor: 'var(--surface-secondary)',
              color: 'var(--text-primary)',
            }}
          >
            {message.content}
          </div>

          {/* User Actions: [Edit Prompt] [Copy] [Regenerate] */}
          <UserMessageActions
            messageId={message.id}
            content={message.content}
            isStreaming={isStreaming}
            onEditPrompt={onEditUserMessage}
            onRegenerate={onRegenerate}
            onToast={onToast}
          />
        </div>
      </div>
    </>
    );
  }

  // =========================================================================
  // ASSISTANT MESSAGE (Single Logo + Clean Lifecycle: Thinking -> Stream -> Final)
  // =========================================================================
  return (
    <div
      id={`message-${message.id}`}
      className={`w-full py-3.5 transition-all duration-200 ${
        isHighlighted ? 'bg-cyan-500/10 ring-1 ring-cyan-400/60 rounded-2xl' : ''
      }`}
    >
      <div className="w-full flex items-start gap-3 sm:gap-4">
        {/* Exactly ONE Single Genzio Fluid Orb Avatar for the entire assistant message */}
        <div className="shrink-0 mt-0.5 select-none" id={`assistant-avatar-${message.id}`}>
          <AnimatedGLogo size="small" isThinking={isStreaming && !message.content} />
        </div>

        {/* Message Content Canvas (Reused across Thinking -> Streaming -> Complete) */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Subtle Fallback Notice if triggered */}
          {message.fallbackNotice && (
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 select-none">
              <Sparkles className="w-3 h-3 text-cyan-400/70 shrink-0" aria-hidden="true" />
              <span>{message.fallbackNotice}</span>
            </div>
          )}

          {/* Error Card: Rendered inside the same assistant container */}
          {message.error && !message.content && (
            <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-3 text-sm text-red-200 flex items-center justify-between gap-3 select-none">
              <div className="space-y-0.5">
                <p className="font-medium text-xs text-red-300">Unable to generate response</p>
                <p className="text-[11px] text-red-400/80">{message.error}</p>
              </div>
            </div>
          )}

          {/* Web Search Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5 pb-1">
              <div className="w-full flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 font-mono select-none">
                <Globe className="w-3 h-3" aria-hidden="true" />
                <span>Sources:</span>
              </div>
              {message.citations.map((c, idx) => (
                <a
                  key={idx}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1e1f20] border border-[#333538] text-[11px] text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] transition-colors"
                >
                  <ExternalLink className="w-2.5 h-2.5 text-cyan-400" aria-hidden="true" />
                  <span className="truncate max-w-[160px]">{c.title || c.domain}</span>
                </a>
              ))}
            </div>
          )}

          {/* Generated Real Image Card */}
          {message.generatedImage && (
            <GeneratedImageCard
              imageUrl={message.generatedImage.imageUrl}
              prompt={message.generatedImage.prompt}
              aspectRatio={message.generatedImage.aspectRatio}
              modelUsed={message.generatedImage.modelUsed}
              revisedPrompt={message.generatedImage.revisedPrompt}
              onRegenerate={onRegenerateImage}
              onToast={onToast}
            />
          )}

          {/* Dedicated Prompt Block if structured */}
          {message.promptData && (
            <PromptBlock
              prompt={message.promptData.prompt}
              category={message.promptData.category || message.promptType || 'image'}
              targetModel={message.promptData.targetModel}
              title={message.promptData.title}
              onGenerateImage={onGenerateImage}
              onToast={onToast}
            />
          )}

          {/* Real Execution Progress System (Observational Real Timer, Real Events, Expandable Steps) */}
          {(isStreaming || message.executionData || message.toolStatus) && !message.generatedImage && (
            <ExecutionProgressView
              executionData={message.executionData}
              toolStatus={message.toolStatus}
              isStreaming={isStreaming}
              error={message.error}
              hasContent={!!message.content}
              onStop={onStop}
            />
          )}

          {/* Markdown Content (Streaming & Final response in the exact same container) */}
          {message.content && (
            <div className="genzio-markdown text-[15px] sm:text-[16px] text-[#d6d9dc] leading-[1.75] select-text">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1({ children }) {
                    return (
                      <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-6 mb-3 first:mt-0 leading-snug">
                        {children}
                      </h1>
                    );
                  },
                  h2({ children }) {
                    return (
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-5 mb-2.5 first:mt-0 leading-snug">
                        {children}
                      </h2>
                    );
                  },
                  h3({ children }) {
                    return (
                      <h3 className="text-base sm:text-lg font-semibold text-slate-100 mt-4 mb-2 first:mt-0 leading-snug">
                        {children}
                      </h3>
                    );
                  },
                  h4({ children }) {
                    return (
                      <h4 className="text-[15px] sm:text-base font-semibold text-slate-200 mt-3.5 mb-1.5 first:mt-0 leading-snug">
                        {children}
                      </h4>
                    );
                  },
                  h5({ children }) {
                    return (
                      <h5 className="text-sm sm:text-[15px] font-semibold text-slate-300 mt-3 mb-1 first:mt-0">
                        {children}
                      </h5>
                    );
                  },
                  h6({ children }) {
                    return (
                      <h6 className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider mt-2.5 mb-1 first:mt-0">
                        {children}
                      </h6>
                    );
                  },
                  p({ children }) {
                    return (
                      <p className="my-3.5 leading-[1.75] text-[#d6d9dc] first:mt-0 last:mb-0">
                        {children}
                      </p>
                    );
                  },
                  strong({ children }) {
                    return <strong className="font-semibold text-white">{children}</strong>;
                  },
                  em({ children }) {
                    return <em className="italic text-slate-200">{children}</em>;
                  },
                  del({ children }) {
                    return <del className="line-through text-slate-400">{children}</del>;
                  },
                  ol({ children }) {
                    return (
                      <ol className="list-decimal pl-6 my-3.5 space-y-1.5 text-[#d6d9dc] marker:text-slate-400 marker:font-medium">
                        {children}
                      </ol>
                    );
                  },
                  ul({ children }) {
                    return (
                      <ul className="list-disc pl-6 my-3.5 space-y-1.5 text-[#d6d9dc] marker:text-slate-400">
                        {children}
                      </ul>
                    );
                  },
                  li({ children }) {
                    return (
                      <li className="leading-[1.7] text-[#d6d9dc] pl-1">
                        {children}
                      </li>
                    );
                  },
                  hr() {
                    return <hr className="my-6 border-0 h-px bg-white/10" />;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-3 border-cyan-400/80 pl-4 py-1.5 my-4 text-slate-300 italic bg-white/[0.02] rounded-r-lg">
                        {children}
                      </blockquote>
                    );
                  },
                  code({ className, children, ...props }: any) {
                    const match = /language-([\w-]+)/.exec(className || '');
                    const isInline = !match && typeof children === 'string' && !children.includes('\n');

                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-md bg-[#222428] text-cyan-300 font-mono text-[13px] border border-[#34373d] font-medium"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    const codeString = String(children).replace(/\n$/, '');
                    const rawLang = match ? match[1].toLowerCase() : 'code';

                    // Detect Prompt Codeblocks
                    if (
                      rawLang === 'prompt' ||
                      rawLang === 'image-prompt' ||
                      rawLang === 'midjourney' ||
                      rawLang === 'dalle' ||
                      rawLang === 'dall-e' ||
                      rawLang === 'imagen'
                    ) {
                      return (
                        <PromptBlock
                          prompt={codeString}
                          category="image"
                          targetModel={rawLang.toUpperCase()}
                          onGenerateImage={onGenerateImage}
                          onToast={onToast}
                        />
                      );
                    }

                    if (
                      rawLang === 'video-prompt' ||
                      rawLang === 'sora' ||
                      rawLang === 'veo' ||
                      rawLang === 'flow' ||
                      rawLang === 'runway'
                    ) {
                      return (
                        <PromptBlock
                          prompt={codeString}
                          category={rawLang as any}
                          targetModel={rawLang.toUpperCase()}
                          onToast={onToast}
                        />
                      );
                    }

                    return <CodeBlock language={rawLang} value={codeString} />;
                  },
                  pre({ children }) {
                    return <div className="my-4 select-text">{children}</div>;
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-4 rounded-xl border border-[#2d3035] bg-[#16181b] shadow-md">
                        <table className="min-w-full divide-y divide-[#2d3035] text-sm text-left">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  thead({ children }) {
                    return (
                      <thead className="bg-[#1f2226] text-slate-200 text-xs font-semibold uppercase tracking-wider">
                        {children}
                      </thead>
                    );
                  },
                  tbody({ children }) {
                    return <tbody className="divide-y divide-[#24272c]">{children}</tbody>;
                  },
                  th({ children }) {
                    return (
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-200 uppercase tracking-wider">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return <td className="px-4 py-2.5 text-xs text-slate-300">{children}</td>;
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/40 hover:decoration-cyan-400 transition-colors font-medium inline-flex items-center gap-1"
                      >
                        <span>{children}</span>
                      </a>
                    );
                  },
                  input(props: any) {
                    if (props.type === 'checkbox') {
                      return (
                        <input
                          type="checkbox"
                          disabled
                          className="mr-2 rounded border-[#383b40] text-cyan-400 accent-cyan-500 cursor-default align-middle"
                          {...props}
                        />
                      );
                    }
                    return <input {...props} />;
                  },
                }}
              >
                {preprocessMarkdown(message.content)}
              </ReactMarkdown>

              {/* Streaming typewriter pulse block */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle rounded-xs shadow-[0_0_8px_rgba(0,240,255,0.7)]" />
              )}
            </div>
          )}

          {/* Real Assistant Actions Toolbar: [Copy] [Like] [Dislike] [Regenerate] [Read Aloud] [Share] [More...] */}
          {!isStreaming && (
            <AssistantMessageActions
              messageId={message.id}
              content={message.content}
              isStreaming={isStreaming}
              liked={message.liked}
              error={message.error}
              generatedImage={message.generatedImage}
              citationsCount={message.citations?.length || 0}
              modelUsed={message.model}
              onLike={onLike}
              onRegenerate={onRegenerate}
              onShare={onShare}
              onToast={onToast}
              onEditImage={onEditImage}
              onRegenerateImage={onRegenerateImage}
            />
          )}
        </div>
      </div>
    </div>
  );
};
