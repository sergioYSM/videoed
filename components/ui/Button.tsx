import { Loader2 } from 'lucide-react';
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const v: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:brightness-110',
  secondary: 'bg-surface-raised text-text hover:bg-surface-hover border border-border',
  ghost: 'text-text-muted hover:text-text hover:bg-surface-hover',
  danger: 'bg-danger text-bg hover:brightness-110',
};
const s = { sm: 'h-7 px-3 text-sm', md: 'h-8 px-4 text-base', lg: 'h-10 px-5 text-lg' };
export function Button({ variant = 'secondary', size = 'md', loading, children, className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof s; loading?: boolean }) {
  return (
    <button type="button" {...rest} aria-busy={loading || undefined} disabled={rest.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${v[variant]} ${s[size]} ${className}`}>
      {loading && <Loader2 size={14} className="animate-spin" aria-hidden />}{children}
    </button>
  );
}
export function IconButton({ label, active, children, className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} aria-pressed={active} {...rest}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40 ${active ? 'bg-surface-active text-accent' : 'text-text-muted hover:bg-surface-hover hover:text-text'} ${className}`}>
      {children}
    </button>
  );
}
export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-xs border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-2xs text-text-muted">{children}</kbd>;
}
