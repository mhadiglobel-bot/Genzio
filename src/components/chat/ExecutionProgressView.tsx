import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Check, Square, AlertCircle, Globe, FileText, Search, Sparkles, Terminal, Cpu } from 'lucide-react';
import { ExecutionProgressData, ExecutionActivityItem, ExecutionPhase } from '../../types';

interface ExecutionProgressViewProps {
  executionData?: ExecutionProgressData;
  toolStatus?: string;
  isStreaming?: boolean;
  error?: string;
  hasContent?: boolean;
  onStop?: () => void;
  className?: string;
}

export function formatElapsedTime(seconds: number): string {
  if (seconds < 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

export const ExecutionProgressView: React.FC<ExecutionProgressViewProps> = ({
  executionData,
  toolStatus,
  isStreaming = false,
  error,
  hasContent = false,
  onStop,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const startTimeRef = useRef<number>(executionData?.startTime || Date.now());

  const isComplete = executionData?.isComplete || (!isStreaming && !error);
  const isStopped = executionData?.isStopped;
  const isError = executionData?.isError || !!error;

  // Sync start time
  useEffect(() => {
    if (executionData?.startTime) {
      startTimeRef.current = executionData.startTime;
    }
  }, [executionData?.startTime]);

  // Wall-clock Elapsed Time Timer
  useEffect(() => {
    if (isComplete || isStopped || isError) {
      if (executionData?.endTime && executionData?.startTime) {
        setElapsed(Math.max(1, Math.round((executionData.endTime - executionData.startTime) / 1000)));
      } else if (executionData?.elapsedSeconds !== undefined) {
        setElapsed(executionData.elapsedSeconds);
      }
      return;
    }

    const calcElapsed = () => {
      const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(seconds);
    };

    calcElapsed();
    const interval = setInterval(calcElapsed, 1000);
    return () => clearInterval(interval);
  }, [isComplete, isStopped, isError, executionData?.endTime, executionData?.startTime, executionData?.elapsedSeconds]);

  // 600ms Delay threshold before showing Working UI for super-fast simple answers
  useEffect(() => {
    if (hasContent && elapsed === 0 && !toolStatus && !executionData?.activities.length) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [hasContent, elapsed, toolStatus, executionData?.activities.length]);

  if (!isVisible && !hasContent && elapsed === 0 && !toolStatus) {
    return null;
  }

  // Derive active status label
  const activeLabel = toolStatus || executionData?.currentLabel || (isStreaming ? 'Thinking' : 'Prepared response');

  // Derive activity history items
  const activities: ExecutionActivityItem[] = executionData?.activities || [];

  // Determine Icon for Phase
  const getPhaseIcon = (type: ExecutionPhase) => {
    switch (type) {
      case 'searching_web':
      case 'reviewing_sources':
        return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
      case 'reading_document':
      case 'processing_attachment':
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'analyzing_image':
      case 'generating_image':
        return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
      case 'using_tool':
        return <Terminal className="w-3.5 h-3.5 text-purple-400" />;
      case 'reasoning':
        return <Cpu className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Search className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Status Header Text
  const renderHeaderTitle = () => {
    if (isStopped) {
      return `Stopped after ${formatElapsedTime(elapsed)}`;
    }
    if (isError) {
      return `Failed after ${formatElapsedTime(elapsed)}`;
    }
    if (isComplete || (!isStreaming && hasContent)) {
      return `Worked for ${formatElapsedTime(elapsed)}`;
    }
    return `Working • ${formatElapsedTime(elapsed)}`;
  };

  return (
    <div className={`my-1.5 text-xs text-slate-300 font-sans select-none ${className}`}>
      {/* Header Bar */}
      <div className="inline-flex items-center gap-2 py-1 px-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all">
        {/* Pulsing indicator during active execution */}
        {isStreaming && !isComplete && !isStopped && !isError ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
          </span>
        ) : isError ? (
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-slate-500/80 shrink-0" />
        )}

        {/* Working / Worked for Title */}
        <span className="font-semibold text-slate-200 tracking-tight">
          {renderHeaderTitle()}
        </span>

        {/* Active phase text during execution */}
        {isStreaming && !isComplete && !isStopped && !isError && (
          <span className="text-slate-400 font-normal pl-1 border-l border-white/10 transition-opacity duration-200">
            {activeLabel}
          </span>
        )}

        {/* Chevron Expand Toggle */}
        {activities.length > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
            title={isExpanded ? 'Collapse activity' : 'Expand activity details'}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        )}

        {/* Functional Stop Control */}
        {isStreaming && !isComplete && !isStopped && onStop && (
          <button
            type="button"
            onClick={onStop}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-[11px] font-medium transition-all ml-1.5 cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </button>
        )}
      </div>

      {/* Expandable Activity Step List */}
      {isExpanded && activities.length > 0 && (
        <div className="mt-2 ml-1 pl-3 border-l-2 border-cyan-500/30 space-y-1.5 py-1 animate-in fade-in duration-150">
          {activities.map((act) => (
            <div key={act.id} className="flex items-center gap-2 text-[11px] text-slate-300">
              {act.status === 'completed' ? (
                <div className="p-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                  <Check className="w-3 h-3" />
                </div>
              ) : act.status === 'failed' ? (
                <div className="p-0.5 rounded-full bg-rose-500/10 text-rose-400">
                  <AlertCircle className="w-3 h-3" />
                </div>
              ) : (
                <div className="p-0.5 rounded-full bg-cyan-500/10 text-cyan-400 animate-pulse">
                  {getPhaseIcon(act.type)}
                </div>
              )}
              <span className={`font-medium ${act.status === 'active' ? 'text-cyan-300 font-semibold' : 'text-slate-300'}`}>
                {act.label}
              </span>
              {act.details && <span className="text-slate-500">({act.details})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
