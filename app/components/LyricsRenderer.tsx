'use client';

import ReactMarkdown from 'react-markdown';

export function LyricsRenderer({
  lyrics,
  compact = false,
}: {
  lyrics: string;
  compact?: boolean;
}) {
  return (
    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
      <ReactMarkdown
        components={{
          p: ({ node, ...props }) => (
            <p className={`text-purple-100 leading-relaxed ${compact ? 'mb-3' : 'mb-2'}`} {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1
              className={`font-bold text-pink-300 ${compact ? 'text-lg mt-4 mb-2' : 'text-xl mt-6 mb-3'}`}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className={`font-bold text-pink-300 ${compact ? 'text-md mt-3 mb-2' : 'text-lg mt-5 mb-2'}`}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className={`font-bold text-pink-200 ${compact ? 'text-sm mt-3 mb-1' : 'text-md mt-4 mb-2'}`}
              {...props}
            />
          ),
          br: ({ node, ...props }) => <br {...props} />,
        }}
      >
        {lyrics}
      </ReactMarkdown>
    </div>
  );
}
