export type SortDir = "asc" | "desc";

export interface SortState<K extends string = string> {
  key: K;
  dir: SortDir;
}

const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

/** Sorting is a display projection: returns a new array, never mutates stored order. */
export function sortBy<T, K extends string>(
  items: readonly T[],
  sort: SortState<K> | null,
  read: (item: T, key: K) => string,
): T[] {
  if (!sort) return [...items];
  const dir = sort.dir === "desc" ? -1 : 1;
  return [...items].sort((a, b) => collator.compare(read(a, sort.key), read(b, sort.key)) * dir);
}

/** Header click cycle: none → asc → desc → none. */
export function nextSort<K extends string>(current: SortState<K> | null, key: K): SortState<K> | null {
  if (!current || current.key !== key) return { key, dir: "asc" };
  return current.dir === "asc" ? { key, dir: "desc" } : null;
}
