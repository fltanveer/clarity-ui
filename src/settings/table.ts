/*
 * Table style for every grid in the app. Applied two ways:
 *   - data-table-* attributes on <html>, read by CSS in theme.css (header,
 *     column lines, row lines, zebra on detail tables);
 *   - the starting Display settings of the main grid (row numbers, row
 *     lines, zebra), which people can still toggle per session.
 */

export type TableHeader = "tinted" | "plain" | "strong";
/** detail = lines on detail grids only (the ClarityOS default) · all · none. */
export type ColumnLines = "detail" | "all" | "none";

export interface TableStyle {
  header: TableHeader;
  columnLines: ColumnLines;
  rowLines: boolean;
  zebra: boolean;
  rowNumbers: boolean;
}

export const TABLE_PRESETS: Record<"standard" | "minimal" | "banded" | "spreadsheet", { label: string; hint: string; style: TableStyle }> = {
  standard: { label: "Standard", hint: "Tinted header, row lines, numbered.",
    style: { header: "tinted", columnLines: "detail", rowLines: true, zebra: false, rowNumbers: true } },
  minimal: { label: "Minimal", hint: "Plain header, row lines only, no numbers.",
    style: { header: "plain", columnLines: "none", rowLines: true, zebra: false, rowNumbers: false } },
  banded: { label: "Banded", hint: "Alternating row bands instead of lines.",
    style: { header: "tinted", columnLines: "none", rowLines: false, zebra: true, rowNumbers: true } },
  spreadsheet: { label: "Spreadsheet", hint: "Strong header, a line around every cell.",
    style: { header: "strong", columnLines: "all", rowLines: true, zebra: false, rowNumbers: true } },
};

export type TablePreset = keyof typeof TABLE_PRESETS;

export const DEFAULT_TABLE: TableStyle = TABLE_PRESETS.standard.style;

export const presetOf = (t: TableStyle): TablePreset | null =>
  (Object.keys(TABLE_PRESETS) as TablePreset[]).find((k) => JSON.stringify(TABLE_PRESETS[k].style) === JSON.stringify(t)) ?? null;

export function normalizeTable(raw: unknown): TableStyle {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const one = <T extends string>(v: unknown, all: readonly T[], d: T) => (all.includes(v as T) ? (v as T) : d);
  const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
  return {
    header: one(r.header, ["tinted", "plain", "strong"] as const, DEFAULT_TABLE.header),
    columnLines: one(r.columnLines, ["detail", "all", "none"] as const, DEFAULT_TABLE.columnLines),
    rowLines: bool(r.rowLines, DEFAULT_TABLE.rowLines),
    zebra: bool(r.zebra, DEFAULT_TABLE.zebra),
    rowNumbers: bool(r.rowNumbers, DEFAULT_TABLE.rowNumbers),
  };
}
