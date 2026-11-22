import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { parseMarkdownBlocks } from '../utils/helyumeLogic';

interface MarkdownRendererProps {
  content: string;
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const full = match[0];
    if (full.startsWith('**') && full.endsWith('**')) {
      tokens.push(
        <strong key={`b-${keyCounter++}`} className="font-semibold text-white">
          {full.slice(2, -2)}
        </strong>
      );
    } else if (full.startsWith('`') && full.endsWith('`')) {
      tokens.push(
        <code
          key={`c-${keyCounter++}`}
          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-fuchsia-200"
        >
          {full.slice(1, -1)}
        </code>
      );
    } else if (match[2] && match[3]) {
      tokens.push(
        <a
          key={`a-${keyCounter++}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-fuchsia-300 underline decoration-fuchsia-400/50 underline-offset-2 hover:text-fuchsia-200"
        >
          {match[2]}
        </a>
      );
    }
    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures in restricted frames
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-[#0d0818]">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-slate-400">
        <span className="font-mono uppercase tracking-wider">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-[13px] leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const blocks = parseMarkdownBlocks(content);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-slate-200">
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          const Tag = block.level === 1 ? 'h2' : block.level === 2 ? 'h3' : 'h4';
          const sizeClass =
            block.level === 1
              ? 'text-lg font-bold text-white'
              : block.level === 2
                ? 'text-base font-semibold text-white'
                : 'text-[15px] font-semibold text-fuchsia-200';
          return (
            <Tag key={idx} className={`${sizeClass} pt-1`}>
              {renderInlineFormatting(block.text)}
            </Tag>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          const listStyle = block.ordered ? 'list-decimal' : 'list-disc';
          return (
            <ListTag key={idx} className={`${listStyle} space-y-1.5 pl-5 text-slate-200`}>
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {renderInlineFormatting(item)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === 'code') {
          return <CodeBlock key={idx} language={block.language} code={block.code} />;
        }

        return (
          <p key={idx} className="whitespace-pre-wrap leading-relaxed">
            {renderInlineFormatting(block.text)}
          </p>
        );
      })}
    </div>
  );
};
