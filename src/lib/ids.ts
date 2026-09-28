/** Sequential, collision-free codes (e.g. BUG-102) instead of random numbers. */
export function nextSeq(prefix: string, existingCodes: Array<string | undefined>): string {
  let max = 0;
  for (const c of existingCodes) {
    if (!c || !c.startsWith(`${prefix}-`)) continue;
    const m = c.match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}
