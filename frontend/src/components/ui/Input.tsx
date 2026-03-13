import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs text-text-muted uppercase tracking-wider font-mono">
          {label}
        </label>
      )}
      <input
        className={`bg-surface-2 border ${error ? 'border-red-500' : 'border-border'} rounded-md px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
