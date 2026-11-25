/** Speaking recordings auto-delete 24 hours after recording (user decision 2026-11-25). Pure. */
export const RECORDING_TTL_MS = 24 * 60 * 60 * 1000;

export function expiresAtFor(createdAt: number): number {
  return createdAt + RECORDING_TTL_MS;
}

export function isExpired(r: { expiresAt: number }, now: number): boolean {
  return now >= r.expiresAt;
}

/** "Deletes in 5 h", "Deletes in 40 min", "Deleted". */
export function expiryLabel(r: { expiresAt: number; audioDeleted?: boolean }, now: number): string {
  if (r.audioDeleted || isExpired(r, now)) return 'Audio deleted after 24 h';
  const min = Math.ceil((r.expiresAt - now) / 60000);
  if (min < 60) return `Audio deletes in ${min} min`;
  return `Audio deletes in ${Math.ceil(min / 60)} h`;
}

/** Preferred MediaRecorder mime types, in order (iOS Safari supports audio/mp4). */
export const RECORDING_MIME_CANDIDATES = ['audio/mp4', 'audio/mp4;codecs=mp4a.40.2', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];

export function pickMimeType(isSupported: (t: string) => boolean): string | null {
  for (const t of RECORDING_MIME_CANDIDATES) if (isSupported(t)) return t;
  return null;
}

export function extensionForMime(mime: string): string {
  if (mime.includes('mp4') || mime.includes('aac')) return 'm4a';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  return 'audio';
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
