/** Simple 1.75-stroke line icons (SF-Symbols-like). */
import type { Skill } from '../data';

const P: Record<string, string> = {
  today: 'M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  words: 'M7 4h11a2 2 0 0 1 2 2v11M4 8h11a2 2 0 0 1 2 2v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8z',
  practice: 'M14 4l6 6-9 9H5v-6l9-9zM12 6l6 6',
  mistakes: 'M5 21V4M5 4h11l-2 4 2 4H5',
  progress: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  chevron: 'M9 6l6 6-6 6',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  listening: 'M4 15v-3a8 8 0 0 1 16 0v3M4 15a2 2 0 0 1 2-2h1v7H6a2 2 0 0 1-2-2v-3zM20 15a2 2 0 0 0-2-2h-1v7h1a2 2 0 0 0 2-2v-3z',
  reading: 'M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3V5zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7V5z',
  writing: 'M16 3l5 5L8 21H3v-5L16 3z',
  speaking: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  grammar: 'M4 19l5-14 5 14M6 14h6M16 13.5a3 3 0 1 1 0 .1V19',
  vocabulary: 'M7 4h11a2 2 0 0 1 2 2v11M4 8h11a2 2 0 0 1 2 2v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8z',
  test: 'M12 8v5l3 2M12 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 2h4',
  rest: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  play: 'M7 4l13 8-13 8V4z',
  pause: 'M7 4h3v16H7zM14 4h3v16h-3z',
  stop: 'M6 6h12v12H6z',
  share: 'M12 3v13M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  speaker: 'M4 9v6h4l5 4V5L8 9H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  star: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3z',
  link: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5',
  warning: 'M12 3l10 18H2L12 3zM12 10v5M12 18v.5',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  timer: 'M12 8v5l3 2M12 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 2h4',
  rules: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3z',
  backup: 'M12 16V4M7 9l5-5 5 5M4 14v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  quiz: 'M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V14M12 17.5v.5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  chain: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  edit: 'M16 3l5 5L8 21H3v-5L16 3z',
};

export function Icon({ name, size = 22, stroke = 1.75, className, label }: { name: string; size?: number; stroke?: number; className?: string; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <path d={P[name] ?? P.info} />
    </svg>
  );
}

export function skillVar(skill: Skill): string {
  return `var(--skill-${skill})`;
}

export function tint(color: string): string {
  return `color-mix(in srgb, ${color} var(--tint-pct), var(--surface))`;
}
