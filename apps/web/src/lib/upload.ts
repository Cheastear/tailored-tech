export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export function rejectOversized(files: File[]): { valid: File[]; rejected: File[] } {
  const valid: File[] = [];
  const rejected: File[] = [];
  for (const f of files) {
    (f.size > MAX_FILE_SIZE ? rejected : valid).push(f);
  }
  return { valid, rejected };
}
