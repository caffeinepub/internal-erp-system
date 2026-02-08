export type SortDirection = 'asc' | 'desc';

export function compareStrings(a: string, b: string, direction: SortDirection = 'asc'): number {
  const result = a.localeCompare(b);
  return direction === 'asc' ? result : -result;
}

export function compareNumbers(a: number, b: number, direction: SortDirection = 'asc'): number {
  const result = a - b;
  return direction === 'asc' ? result : -result;
}

export function compareBigInts(a: bigint, b: bigint, direction: SortDirection = 'asc'): number {
  const result = a < b ? -1 : a > b ? 1 : 0;
  return direction === 'asc' ? result : -result;
}

export function compareDates(a: Date | bigint, b: Date | bigint, direction: SortDirection = 'asc'): number {
  const aTime = typeof a === 'bigint' ? Number(a) : a.getTime();
  const bTime = typeof b === 'bigint' ? Number(b) : b.getTime();
  const result = aTime - bTime;
  return direction === 'asc' ? result : -result;
}

export function applySortAfterFilter<T>(
  items: T[],
  sortField: string,
  direction: SortDirection,
  compareFn: (a: T, b: T) => number
): T[] {
  return [...items].sort(compareFn);
}
