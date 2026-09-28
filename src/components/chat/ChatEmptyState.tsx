import React from 'react';
import { ChatComposer } from './ChatComposer';
import { ChatAttachment, ReasoningLevel } from '../../types';
import { AnimatedGLogo } from '../common/AnimatedGLogo';
import { AnimatedHeroText } from './AnimatedHeroText';
import { TimeBasedGreeting } from './TimeBasedGreeting';

interface ChatEmptyStateProps {
  onSendMessage: (
    content: string,
    attachments: ChatAttachment[],
    options?: { webSearch?: boolean; reasoning?: boolean }
  ) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  onOpenLibrary: () => void;
  reasoningLevel: ReasoningLevel;
  onSelectReasoningLevel: (level: ReasoningLevel) => void;
  enterToSend?: boolean;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  onOpenLibrary,
  reasoningLevel,
  onSelectReasoningLevel,
  enterToSend = true,
}) => {
  return (
    <div
      id="chat-empty-state"
      className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 text-center max-w-3xl mx-auto w-full animate-in fade-in select-none my-auto"
    >
      {/* Brand Logo & Dynamic Conversational Hero Area */}
      <div className="relative mb-5 sm:mb-8 flex flex-col items-center w-full">
        {/* Responsive Animated G Emblem Logo (84px mobile, 116px desktop) */}
        <div className="relative mb-3.5 sm:mb-6 flex items-center justify-center">
          <div className="sm:hidden">
            <AnimatedGLogo size={84} showGlow={true} />
          </div>
          <div className="hidden sm:block">
            <AnimatedGLogo size={116} showGlow={true} />
          </div>
        </div>

        {/* 1) Main Animated Typewriter Area (Short, natural, human-readable sentences in Inter) */}
        <div className="w-full max-w-[700px] px-2">
          <AnimatedHeroText />
        </div>

        {/* 2) Time-Based Greeting Line (12–16px spacing below headline) */}
        <div className="mt-2.5 sm:mt-3.5">
          <TimeBasedGreeting />
        </div>
      </div>

      {/* 3) Centered Composer with Premium Animated Neon RGB Rainbow Gradient Glow */}
      <ChatComposer
        onSendMessage={onSendMessage}
        onStopStreaming={onStopStreaming}
        isStreaming={isStreaming}
        onOpenLibrary={onOpenLibrary}
        reasoningLevel={reasoningLevel}
        onSelectReasoningLevel={onSelectReasoningLevel}
        isCentered={true}
        neonGlow={true}
        enterToSend={enterToSend}
      />
    </div>
  );
};
