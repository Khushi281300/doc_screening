import React, { useEffect, useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2, Info, Copy, Check, Sun, Moon, Shield } from 'lucide-react';

export const cx = (...a) => a.filter(Boolean).join(' ');

export function Modal({ open, onClose, title, subtitle, icon: Icon, children, footer, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={cx('modal fade-up', width)} role="dialog" aria-modal="true">
        <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-3 bg-surface/50">
          <div className="flex items-start gap-3 min-w-0">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={19} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground leading-tight tracking-tight">{title}</h3>
              {subtitle && <p className="help mt-1 leading-snug">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm -mr-2 text-muted-foreground hover:text-foreground p-1.5 rounded-lg" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-3.5 border-t border-border bg-surface/80 rounded-b-2xl flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Spinner({ size = 15, className }) {
  return <Loader2 size={size} className={cx('spin', className)} />;
}

export function Alert({ kind = 'info', children, className }) {
  const map = {
    info: ['bg-primary-soft border-primary/30 text-primary', Info],
    success: ['bg-success-soft border-success-border text-success', CheckCircle2],
    warning: ['bg-warning-soft border-warning-border text-warning', AlertCircle],
    danger: ['bg-danger-soft border-danger-border text-danger', AlertCircle],
  };
  const [cls, Icon] = map[kind] || map.info;
  return (
    <div className={cx('flex items-start gap-3 rounded-xl border px-4 py-3 text-[13px] leading-relaxed', cls, className)}>
      <Icon size={17} className="shrink-0 mt-[2px]" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Field({ label, hint, children, className }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="help mt-1.5">{hint}</p>}
    </div>
  );
}

export function Empty({ icon: Icon, title, body, action }) {
  return (
    <div className="border border-dashed border-border rounded-2xl p-10 text-center bg-card/40">
      {Icon && (
        <div className="w-12 h-12 mx-auto rounded-2xl bg-secondary text-primary border border-border flex items-center justify-center mb-3.5 shadow-sm">
          <Icon size={22} />
        </div>
      )}
      <div className="text-base font-bold text-foreground">{title}</div>
      {body && <p className="help mt-1.5 max-w-md mx-auto leading-relaxed">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, tone = 'neutral', icon: Icon }) {
  const tones = {
    neutral: 'text-foreground',
    primary: 'text-primary',
    danger: 'text-danger',
    warning: 'text-warning',
    shield: 'text-shield',
    success: 'text-success',
  };

  const iconTones = {
    neutral: 'bg-secondary text-muted-foreground border-border',
    primary: 'bg-primary-soft text-primary border-primary/20',
    danger: 'bg-danger-soft text-danger border-danger-border',
    warning: 'bg-warning-soft text-warning border-warning-border',
    shield: 'bg-shield-soft text-shield border-shield-border',
    success: 'bg-success-soft text-success border-success-border',
  };

  return (
    <div className="card p-5 flex items-start justify-between gap-4 transition hover:border-border-strong group">
      <div className="min-w-0">
        <div className="section-title text-[11px]">{label}</div>
        <div className={cx('text-3xl font-extrabold mt-2 tracking-tight leading-none', tones[tone])}>
          {value ?? '—'}
        </div>
        {sub && <div className="help mt-2.5 font-medium text-[12px]">{sub}</div>}
      </div>
      {Icon && (
        <div className={cx('w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105', iconTones[tone])}>
          <Icon size={19} />
        </div>
      )}
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      onClick={copy}
      title={copied ? 'Copied to clipboard' : 'Copy'}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-primary transition px-1.5 py-0.5 rounded border border-transparent hover:border-border bg-transparent hover:bg-secondary cursor-pointer"
    >
      {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || localStorage.getItem('chronicle-theme') || 'dark';
  });

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('chronicle-theme', next);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to Executive Day Mode' : 'Switch to Cyber Command Dark Mode'}
      className="btn btn-ghost btn-sm p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-primary" />}
    </button>
  );
}

export const fmtDate = (iso, withTime = true) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

export const fmtBytes = (n) => {
  if (!n && n !== 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

export const short = (h, n = 12) => (h ? `${h.slice(0, n)}…${h.slice(-6)}` : '—');

export { statusPill as STATUS_PILL_FN, statusLabel, actionPill, actionLabel, tamperPill, tamperLabel, docTypeLabel, roleInfo } from '../labels';
