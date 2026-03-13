'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface Props {
  embedToken: string;
  backendUrl: string;
}

export default function EmbedCodeBox({ embedToken, backendUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const embedUrl = `${backendUrl}/embed/${embedToken}`;
  const iframeCode = `<iframe src="${embedUrl}" width="600" height="400" frameborder="0"></iframe>`;

  const copy = async () => {
    await navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <p className="text-xs text-text-muted">
        URL directa:{' '}
        <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">
          {embedUrl}
        </a>
      </p>
    </div>
  );
}
