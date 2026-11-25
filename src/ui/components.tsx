/** Shared UI building blocks. */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Skill } from '../data';
import { SKILL_LABEL } from '../logic/plan';
import { Icon, skillVar, tint } from './Icon';
import { goBack } from '../app/router';

export function Screen({ children, full }: { children: ReactNode; full?: boolean }) {
  return <main className={`screen${full ? ' full' : ''}`}>{children}</main>;
}

export function LargeHeader({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <header className="header">
      <div className="titles">
        <h1 className="large-title">{title}</h1>
        {subtitle && <p className="subhead">{subtitle}</p>}
      </div>
      {right && <div className="side right">{right}</div>}
    </header>
  );
}

export function InlineHeader({ title, backTo, backLabel = 'Back', right }: { title: string; backTo: string; backLabel?: string; right?: ReactNode }) {
  return (
    <header className="header inline">
      <div className="side">
        <button className="back-btn" onClick={() => goBack(backTo)} aria-label={`Back to ${backLabel}`}>
          <Icon name="back" size={24} /> {backLabel}
        </button>
      </div>
      <div className="titles">
        <h1 className="title">{title}</h1>
      </div>
      <div className="side right">{right}</div>
    </header>
  );
}

export function FullTop({ onClose, title, right }: { onClose: () => void; title?: ReactNode; right?: ReactNode }) {
  return (
    <div className="fullscreen-top">
      <button className="icon-btn" onClick={onClose} aria-label="Close">
        <Icon name="close" />
      </button>
      <div className="spacer" style={{ textAlign: 'center', fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ minWidth: 44, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

export function SkillTile({ skill, size = 36 }: { skill: Skill; size?: number }) {
  return (
    <span className="tile" style={{ background: tint(skillVar(skill)), color: skillVar(skill), width: size, height: size }}>
      <Icon name={skill} size={Math.round(size * 0.55)} />
    </span>
  );
}

export function SkillChip({ skill, label }: { skill: Skill; label?: string }) {
  return (
    <span className="skill-chip" style={{ background: tint(skillVar(skill)), color: skillVar(skill) }}>
      <Icon name={skill} size={14} /> {label ?? SKILL_LABEL[skill]}
    </span>
  );
}

export function Row({ title, subtitle, value, onClick, left, chevron = true, danger }: {
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  onClick?: () => void;
  left?: ReactNode;
  chevron?: boolean;
  danger?: boolean;
}) {
  return (
    <button className="list-row" onClick={onClick} disabled={!onClick} style={danger ? { color: 'var(--danger)' } : undefined}>
      {left}
      <span className="main">
        <span style={{ display: 'block' }}>{title}</span>
        {subtitle && <span className="subhead" style={{ display: 'block' }}>{subtitle}</span>}
      </span>
      {value !== undefined && <span className="value">{value}</span>}
      {chevron && onClick && <Icon name="chevron" size={18} className="chev" />}
    </button>
  );
}

/** Modal bottom sheet with grabber; drag the grabber down to dismiss. */
export function Sheet({ open, onClose, title, children, left, right, dirty }: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  /** Ask before closing when there are unsaved changes. */
  dirty?: boolean;
}) {
  const [dy, setDy] = useState(0);
  const startY = useRef<number | null>(null);
  useEffect(() => {
    if (!open) setDy(0);
  }, [open]);
  if (!open) return null;
  const close = () => {
    if (dirty && !window.confirm('Discard changes?')) {
      setDy(0);
      return;
    }
    onClose();
  };
  return (
    <>
      <div className="backdrop" onClick={close} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} style={dy ? { transform: `translateY(${dy}px)` } : undefined}>
        <div
          className="grab"
          onTouchStart={(e) => (startY.current = e.touches[0].clientY)}
          onTouchMove={(e) => startY.current !== null && setDy(Math.max(0, e.touches[0].clientY - startY.current))}
          onTouchEnd={() => {
            startY.current = null;
            if (dy > 100) close();
            else setDy(0);
          }}
        >
          <span />
        </div>
        <div className="sheet-head">
          <div style={{ minWidth: 72 }}>{left ?? <button className="btn plain" onClick={close}>Close</button>}</div>
          <div className="t">{title}</div>
          <div style={{ minWidth: 72, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label?: string }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string | number>({ value, options, onChange, wrap, label }: {
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  wrap?: boolean;
  label?: string;
}) {
  return (
    <div className={`chips${wrap ? ' wrap' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} role="radio" aria-checked={o.value === value} className={`chip${o.value === value ? ' on' : ''}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span />
    </label>
  );
}

export function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button className={`checkrow${checked ? ' on' : ''}`} role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)}>
      <span className="box">{checked && <Icon name="check" size={16} stroke={2.5} />}</span>
      <span>{children}</span>
    </button>
  );
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 999, format }: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
}) {
  return (
    <span className="stepper">
      <button aria-label="Decrease" onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}>−</button>
      <span className="v mono">{format ? format(value) : value}</span>
      <button aria-label="Increase" onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}>+</button>
    </span>
  );
}

export function Ring({ value, size = 44, stroke = 5, color = 'var(--accent)', label }: { value: number; size?: number; stroke?: number; color?: string; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} className="ring" role="img" aria-label={label}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - v)} strokeLinecap="round" />
    </svg>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <div style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  );
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="empty stack" style={{ alignItems: 'center' }}>
      <p>{text}</p>
      {action}
    </div>
  );
}

export const BAND_OPTIONS = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

export function BandPicker({ value, onChange, allowNone = true, options = BAND_OPTIONS }: { value: number | null; onChange: (v: number | null) => void; allowNone?: boolean; options?: number[] }) {
  return (
    <div className="score-chips" role="radiogroup">
      {allowNone && (
        <button className={`chip${value === null ? ' on' : ''}`} onClick={() => onChange(null)} role="radio" aria-checked={value === null}>
          –
        </button>
      )}
      {options.map((b) => (
        <button key={b} className={`chip${value === b ? ' on' : ''}`} onClick={() => onChange(b)} role="radio" aria-checked={value === b}>
          {b.toFixed(1)}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="footnote">{hint}</span>}
    </div>
  );
}
