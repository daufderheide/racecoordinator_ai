/**
 * Utility function for natural sort comparison of strings.
 * Compares strings alphanumerically, treating numeric parts as numbers.
 * 
 * Example: ['item2', 'item10', 'item1'] sorts to ['item1', 'item2', 'item10']
 * instead of the lexicographic ['item1', 'item10', 'item2']
 */
export function naturalSortCompare(a: string, b: string): number {
  // Extract numeric parts for natural sorting
  const regex = /(\d+|\D+)/g;
  const aParts = a.match(regex) || [a];
  const bParts = b.match(regex) || [b];

  for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
    const aPart = aParts[i];
    const bPart = bParts[i];

    const aNum = parseInt(aPart, 10);
    const bNum = parseInt(bPart, 10);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      // Both are numbers, compare numerically
      if (aNum !== bNum) {
        return aNum - bNum;
      }
    } else {
      // At least one is not a number, compare as strings (case-insensitive)
      const cmp = aPart.localeCompare(bPart, undefined, { sensitivity: 'base' });
      if (cmp !== 0) {
        return cmp;
      }
    }
  }

  return aParts.length - bParts.length;
}
