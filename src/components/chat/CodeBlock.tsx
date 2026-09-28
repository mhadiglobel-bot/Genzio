import React, { useState } from 'react';
import { Check, Copy, Terminal, WrapText } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  language?: string;
  value: string;
  isStreaming?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language = 'typescript',
  value,
  isStreaming,
}) => {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const cleanLang = language.replace('language-', '').toLowerCase() || 'text';

  return (
    <div className="relative my-4 rounded-xl border border-slate-800/90 bg-[#080c14] overflow-hidden text-xs font-mono group shadow-lg select-text">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d121d] border-b border-slate-800/80 text-slate-400 select-none">
        <div className="flex items-center gap-2 select-none">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider select-none">
            {cleanLang}
          </span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-sans font-medium text-cyan-400 bg-cyan-950/60 rounded border border-cyan-500/30 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Generating
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 select-none">
          <button
            type="button"
            onClick={() => setWrapLines(!wrapLines)}
            title="Toggle Line Wrap"
            className={`p-1.5 rounded-md transition-colors text-[11px] font-sans font-medium cursor-pointer ${
              wrapLines
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <WrapText className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors text-[11px] font-sans font-medium cursor-pointer select-none"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" aria-hidden="true" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Syntax Highlighting Area */}
      <div className="overflow-x-auto text-[13px] leading-6 font-mono selection:bg-cyan-500/30">
        <SyntaxHighlighter
          language={cleanLang}
          style={vscDarkPlus}
          wrapLongLines={wrapLines}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: '#080c14',
            fontSize: '13px',
            lineHeight: '1.6',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'inherit',
            },
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
