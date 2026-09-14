import type { HTMLAttributes, ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { SortState } from "../lib/sort";
import { cx } from "../lib/cx";

/*
 * Grid primitives. Frames adopt these, never author their own (Spec §3).
 * Header and body cells read the same width tokens, so columns cannot drift.
 */

export const colWidth = {
  index: "w-col-index",
  grip: "w-col-grip",
  members: "w-col-members",
  toggle: "w-col-toggle",
  access: "w-col-access",
  qty: "w-col-qty",
  action: "w-col-action",
  region: "w-col-region",
} as const;

/**
 * A frame. Frames always sit side by side on one parent grid and adopt its rows
 * via subgrid — so title band, filter band and grid head line up across the
 * divider whatever their content (R3). Children must be exactly: TitleBand,
 * FilterBand, GridHead, body.
 */
export function Pane({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cx(
        "flex min-h-0 min-w-0 flex-1 flex-col bg-surface",
        "row-span-4 grid grid-rows-subgrid",
        className,
      )}
      {...rest}
    />
  );
}

/** Scrolling body: the fourth and last subgrid row of a Pane. */
export function PaneBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("min-h-0 flex-1 overflow-auto", className)} {...rest} />;
}

/** Title band: pane name, count, pane actions. Grows and wraps rather than clipping. */
export function TitleBand({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-assign-band shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-subtle px-3 py-1.5">
      {children}
    </div>
  );
}

/** Filter band: the pane's filters. Same min-height as TitleBand on both frames (R3). */
export function FilterBand({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-assign-band shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-line-subtle bg-canvas px-3 py-1.5">
      {children}
    </div>
  );
}

export function PaneTitle({ children, count }: { children: ReactNode; count?: ReactNode }) {
  return (
    <h2 className="flex items-baseline gap-2">
      <span className="text-caption font-semibold tracking-label text-fg-secondary uppercase">{children}</span>
      {count != null && <span className="text-caption text-fg-tertiary tabular-nums">{count}</span>}
    </h2>
  );
}

export function GridHead({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex h-head shrink-0 items-center gap-2 border-b border-line-strong bg-subtle px-3 text-caption font-semibold text-fg-secondary"
    >
      {children}
    </div>
  );
}

export function HeadCell({ className, children }: { className?: string; children?: ReactNode }) {
  return <span className={cx("shrink-0", className)}>{children}</span>;
}

export interface SortHeaderProps<K extends string> {
  sortKey: K;
  sort: SortState<K> | null;
  onSort: (key: K) => void;
  children: ReactNode;
  className?: string;
}

/**
 * Direction carried by an arrow plus screen-reader text, never colour alone.
 * Rows are list items, not a table, so there is no aria-sort to carry it.
 */
export function SortHeader<K extends string>({ sortKey, sort, onSort, children, className }: SortHeaderProps<K>) {
  const on = sort?.key === sortKey;
  return (
    <span className={cx("flex min-w-0", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cx(
          "-mx-1 flex h-control-sm min-w-0 cursor-pointer items-center gap-1 rounded-sm px-1 hover:bg-hover",
          on && "text-fg-primary",
        )}
      >
        <span className="truncate">{children}</span>
        {on && <span className="sr-only">, sorted {sort.dir === "asc" ? "ascending" : "descending"}</span>}
        {on && (sort.dir === "asc"
          ? <ArrowUp size={12} strokeWidth={2} aria-hidden className="shrink-0" />
          : <ArrowDown size={12} strokeWidth={2} aria-hidden className="shrink-0" />)}
      </button>
    </span>
  );
}

export function RowIndex({ n }: { n: number | null }) {
  return (
    <span className={cx(colWidth.index, "shrink-0 text-end text-caption text-fg-tertiary tabular-nums")}>
      {n ?? ""}
    </span>
  );
}
