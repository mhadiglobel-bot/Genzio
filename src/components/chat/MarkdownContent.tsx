import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface MarkdownContentProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, isStreaming }) => {
  return (
    <div className="markdown-content text-slate-200 text-sm sm:text-base leading-relaxed space-y-3 font-sans break-words relative">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && typeof children === 'string' && !children.includes('\n');

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-[#111726] border border-slate-800 text-cyan-300 font-mono text-[13px] font-medium"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const codeString = String(children).replace(/\n$/, '');
            const language = match ? match[1] : 'typescript';

            return <CodeBlock language={language} value={codeString} isStreaming={isStreaming} />;
          },
          pre({ children }) {
            return <div className="my-3 select-text">{children}</div>;
          },
          h1({ children }) {
            return (
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-5 mb-2 font-display">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-4 mb-2 font-display">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base sm:text-lg font-semibold text-slate-100 mt-3 mb-1.5 font-display">
                {children}
              </h3>
            );
          },
          p({ children }) {
            return <p className="leading-7 text-slate-300 mb-2.5 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 space-y-1.5 my-2.5 text-slate-300">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 space-y-1.5 my-2.5 text-slate-300">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-6 text-slate-300">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-cyan-500/60 pl-4 py-1 my-3 text-slate-300 italic bg-cyan-950/10 rounded-r-lg">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-slate-800 bg-[#090d16]">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-[#0e1422] text-slate-200 border-b border-slate-800">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-4 py-3 font-semibold text-slate-200">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-3 border-t border-slate-800/60 text-slate-300">{children}</td>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/40 hover:decoration-cyan-400 transition-colors"
              >
                {children}
              </a>
            );
          },
          hr() {
            return <hr className="my-6 border-slate-800" />;
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
