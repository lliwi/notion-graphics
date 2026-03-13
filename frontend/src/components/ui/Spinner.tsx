export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin ${className}`}
    />
  );
}
