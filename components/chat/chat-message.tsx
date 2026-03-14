'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-4 p-6 ${
        role === 'assistant' ? 'bg-muted/50' : ''
      }`}
    >
      <div className="flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-green-600 text-white'
          }`}
        >
          {role === 'user' ? 'U' : 'AI'}
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap break-words">{content}</div>
        </div>
      </div>
      {role === 'assistant' && (
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
