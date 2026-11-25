/** Word and paragraph counting for the writing editor. Pure. */

/** Words = whitespace-separated tokens that contain a letter or digit. Hyphenated words count as 1. */
export function wordCount(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

/** Paragraphs = non-empty lines (on a phone, one Enter usually starts a new paragraph). */
export function paragraphCount(text: string): number {
  if (!text) return 0;
  return text.split(/\n+/).filter((l) => l.trim().length > 0).length;
}

export function minWordsFor(task: 'task1' | 'task2' | 'paragraph'): number {
  return task === 'task1' ? 150 : task === 'task2' ? 250 : 150;
}

/** "1 word", "3 words", "0 words". Irregular plurals can be passed explicitly. */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;
}

/** Part 2 cue card: the "and explain …" line is shown without a bullet point, like on a real card. */
export function splitCueBullets(bullets: readonly string[]): { points: string[]; explain: string[] } {
  const isExplain = (b: string) => /^and\s+explain\b/i.test(b.trim());
  return { points: bullets.filter((b) => !isExplain(b)), explain: bullets.filter(isExplain) };
}
