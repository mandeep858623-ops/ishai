import React, { useState } from 'react';
import { marked } from 'marked';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Parse code blocks with a custom splitter for interactive copy controls
  const renderFormattedContent = () => {
    // Check if the content has code blocks
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const matchIndex = match.index;
      // Preceding text before code block
      if (matchIndex > lastIndex) {
        const textBefore = content.substring(lastIndex, matchIndex);
        parts.push(
          <div
            key={`text-${lastIndex}`}
            className="superai-prose"
            dangerouslySetInnerHTML={{
              __html: marked.parse(textBefore, { breaks: true, gfm: true }) as string,
            }}
          />
        );
      }

      const lang = match[1] || 'code';
      const code = match[2];
      parts.push(<CodeBlock key={`code-${matchIndex}`} language={lang} code={code} />);

      lastIndex = matchIndex + match[0].length;
    }

    // Trailing text after last code block
    if (lastIndex < content.length) {
      const textAfter = content.substring(lastIndex);
      parts.push(
        <div
          key={`text-${lastIndex}`}
          className="superai-prose"
          dangerouslySetInnerHTML={{
            __html: marked.parse(textAfter, { breaks: true, gfm: true }) as string,
          }}
        />
      );
    }

    if (parts.length === 0) {
      return (
        <div
          className="superai-prose"
          dangerouslySetInnerHTML={{
            __html: marked.parse(content, { breaks: true, gfm: true }) as string,
          }}
        />
      );
    }

    return parts;
  };

  return <div className={`text-inherit leading-relaxed ${className}`}>{renderFormattedContent()}</div>;
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-zinc-800 bg-[#0d1117] text-zinc-100 shadow-md">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-b border-zinc-800/80 text-xs text-zinc-400 font-mono">
        <span className="uppercase tracking-wider font-semibold text-[11px] text-indigo-400">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
};
