'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface Props {
  embedToken: string;
  backendUrl: string;
}

export default function EmbedCodeBox({ embedToken, backendUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const embedUrl = `${backendUrl}/embed/${embedToken}`;
  const iframeCode = `<iframe src="${embedUrl}" style="width: 100%; height: 100%; border: none; background: transparent;" allowtransparency="true"></iframe>`;

  const copy = async () => {
    await navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(embedUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted uppercase font-mono tracking-wider">
          Código de embed
        </span>
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied ? '✓ Copiado' : 'Copiar'}
        </Button>
      </div>
      <textarea
        readOnly
        value={iframeCode}
        rows={3}
        className="w-full bg-surface-3 border border-border rounded-md px-3 py-2 text-xs text-text-muted font-mono resize-none focus:outline-none"
      />
      <div className="flex items-center gap-2">
        <p className="text-xs text-text-muted flex-1 min-w-0">
          URL directa:{' '}
          <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline truncate">
            {embedUrl}
          </a>
        </p>
        <Button variant="ghost" size="sm" onClick={copyUrl}>
          {copiedUrl ? '✓' : 'Copiar URL'}
        </Button>
      </div>
    </div>
  );
}
