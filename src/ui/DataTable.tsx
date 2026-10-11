import type { ReactNode } from "react";
import { cx } from "./cx";

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Value to show. Defaults to row[key]. */
  render?: (row: T) => ReactNode;
  /** "end" for numbers: right-aligned, tabular figures. */
  align?: "start" | "end";
  /** Any width utility, e.g. "w-30" or "w-[30%]". Omit to share the rest. */
  width?: string;
  /** Muted secondary text, e.g. a source or note column. */
  muted?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Accessible name of the table, e.g. "People". */
  label: string;
  /** Highlights one row (mode tint + leading bar). */
  selectedKey?: string | null;
  /** Makes rows clickable; Enter / Space work too. */
  onRowClick?: (row: T) => void;
  /** Leading # column. */
  rowNumbers?: boolean;
  /** Shown when there are no rows. */
  empty?: ReactNode;
  className?: string;
}

/**
 * The product grid: 26px header, 30px rows, hairlines, numbers right-aligned.
 * A real <table>, so screen readers announce rows and columns. Put it in a
 * scrolling parent; the header sticks.
 */
/* Leading bar of the selected row; drawn on its first cell, which paints over the row. */
const bar = "shadow-[inset_3px_0_0_var(--color-mode-solid)]";

export function DataTable<T>({ columns, rows, rowKey, label, selectedKey, onRowClick, rowNumbers, empty, className }: DataTableProps<T>) {
  const value = (row: T, c: Column<T>) => c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "");
  return (
    <table aria-label={label} className={cx("w-full table-fixed border-collapse bg-surface text-ui", className)}>
      <colgroup>
        {rowNumbers && <col className="w-10" />}
        {columns.map((c) => <col key={c.key} className={c.width} />)}
      </colgroup>
      <thead className="sticky top-0 z-10">
        <tr data-grid-head className="h-grid-head bg-grid-header text-caption font-semibold whitespace-nowrap text-fg-secondary shadow-[inset_0_-1px_0_var(--color-grid-line-col)]">
          {rowNumbers && <th scope="col" className="ps-3.75 pe-2 text-end font-semibold"><span aria-hidden>#</span><span className="sr-only">Row</span></th>}
          {columns.map((c, i) => (
            <th key={c.key} scope="col" data-grid-col={i > 0 || undefined}
              className={cx("truncate px-3 font-semibold", c.align === "end" ? "text-end" : "text-start",
                i === 0 && !rowNumbers && "ps-3.75", i > 0 && "border-s border-grid-line-col")}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody data-grid-body>
        {rows.map((row, r) => {
          const key = rowKey(row);
          const on = key === selectedKey;
          return (
            <tr key={key} aria-selected={onRowClick ? on : undefined} data-selected={on || undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick && (() => onRowClick(row))}
              onKeyDown={onRowClick && ((e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(row); } })}
              className={cx("h-grid-row border-b border-grid-line",
                onRowClick && "cursor-pointer",
                on ? "bg-mode-soft" : onRowClick && "hover:bg-hover")}>
              {rowNumbers && <td className={cx("ps-3.75 pe-2 text-end text-caption text-fg-tertiary tabular-nums", on && bar)}>{r + 1}</td>}
              {columns.map((c, i) => (
                <td key={c.key} data-grid-col={i > 0 || undefined}
                  className={cx("truncate px-3",
                    c.align === "end" ? "text-end tabular-nums" : "text-start",
                    c.muted ? "text-caption text-fg-tertiary" : "text-fg-primary",
                    i === 0 && !rowNumbers && "ps-3.75", i === 0 && !rowNumbers && on && bar, i > 0 && "border-s border-grid-line")}>
                  {value(row, c)}
                </td>
              ))}
            </tr>
          );
        })}
        {!rows.length && (
          <tr><td colSpan={columns.length + (rowNumbers ? 1 : 0)} className="px-3.75 py-4 text-caption text-fg-tertiary">{empty ?? "Nothing here yet."}</td></tr>
        )}
      </tbody>
    </table>
  );
}
