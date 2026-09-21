import { type TileCoord, OMNITILE_VALUE } from '@/entities/board';

/**
 * Validates whether a given combination of tile coordinates remains a valid sum-to-10 move.
 */
export function isHintComboValid(combo: TileCoord[], matrix: number[][]): boolean {
  if (!combo || combo.length === 0) return false;
  let regularSum = 0;
  let omniCount = 0;
  for (let i = 0; i < combo.length; i++) {
    const t = combo[i]!;
    const val = matrix[t.row]?.[t.col] ?? 0;
    if (val <= 0) return false;
    if (val === OMNITILE_VALUE) {
      omniCount++;
    } else {
      regularSum += val;
    }
  }
  if (omniCount > 0) {
    return regularSum <= 10;
  }
  return regularSum === 10;
}
