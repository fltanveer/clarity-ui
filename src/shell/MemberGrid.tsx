import { Check, Lock, Menu, Settings } from "lucide-react";
import type { Member } from "../lib/members";
import type { DisplaySettings, GridColumn, GridMode } from "./types";
import { cx } from "../lib/cx";

export interface MemberGridProps {
  members: Member[];
  columns: GridColumn[];
  display: DisplaySettings;
  member: string | null;
  peek: string | null;
  onPeek: (id: string) => void;
  gridMode: GridMode;
  bulkSel: string[];
  onBulkSel: (ids: string[]) => void;
  onMove: (index: number, delta: number) => void;
  /** Row gear: MODEL opens member configuration, DATA shows the member in Properties. */
  onConfigure: (id: string) => void;
  /** Accessible verb for the gear, e.g. "Configure" or "Show properties for". */
  configureLabel: string;
  emptyMessage?: string;
  /** Accessible name of the list; the business noun, plural. */
  label?: string;
  /** Items that carry the Model role: a click chooses the Model, and there is nothing to configure. */
  onChoose?: (id: string) => void;
}

const COL_WIDTH: Record<string, string> = {
  code: "w-col-code", short: "w-30", type: "w-col-type", status: "w-col-status",
  desc: "w-60", region: "w-30", owner: "w-30", modified: "w-30", source: "w-30",
};

const extra: Record<string, (m: Member) => string> = {
  desc: (m) => m.description || "—",
  region: (m) => m.attrs?.["Company Region"] ?? "—",
  owner: () => "jack@clarityos",
  modified: () => "04 Feb 2026",
  source: (m) => (m.locked ? "System" : "User"),
};

/*
 * Folder-level centre: the members of the current view with their columns.
 * A row click INSPECTS (peek → drives properties); it never commits the member
 * or moves panes — only a left-pane click does. Without that rule the layout
 * would change every time someone scanned the grid.
 */
export function MemberGrid({ members, columns, display, member, peek, onPeek, gridMode, bulkSel, onBulkSel, onMove, onConfigure, configureLabel, emptyMessage, label = "Members", onChoose }: MemberGridProps) {
  const inspect = onChoose ?? onPeek;
  const deletable = members.filter((m) => !m.locked);
  const allSelected = bulkSel.length > 0 && bulkSel.length === deletable.length;

  const cell = (m: Member, c: GridColumn) => {
    if (c.id === "name") return <span className="min-w-0 flex-1 truncate">{m.name}</span>;
    if (c.id === "status") {
      return (
        <span className={cx(COL_WIDTH.status, "flex shrink-0 items-center gap-1.5 text-caption", m.locked ? "text-fg-tertiary" : "text-success-text")}>
          {m.locked ? <Lock size={11} aria-hidden /> : <Check size={12} aria-hidden />}
          {m.locked ? "System-defined" : "Active"}
        </span>
      );
    }
    /* Short Name is a display alias: blank falls back to Name / Code, marked so it never reads as typed. */
    if (c.id === "short" && !m.code) {
      return (
        <span title="No Short Name — falls back to Name / Code" className={cx(COL_WIDTH.short, "shrink-0 truncate text-caption text-fg-tertiary italic")}>
          {m.name}<span className="sr-only"> (fallback to Name / Code)</span>
        </span>
      );
    }
    /* A blank description is not supplied by the fixture: say so rather than show a dash that reads as a value. */
    if (c.id === "desc" && !m.description) {
      return <span className={cx(COL_WIDTH.desc, "shrink-0 truncate text-caption text-fg-tertiary italic")}>Not supplied</span>;
    }
    const value = c.id === "code" || c.id === "short" ? m.code : c.id === "type" ? m.type : extra[c.id]?.(m) ?? "—";
    return <span title={value} className={cx(COL_WIDTH[c.id] ?? "w-30", "shrink-0 truncate text-caption text-fg-tertiary")}>{value}</span>;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <div className="flex h-grid-head shrink-0 items-center gap-2.5 border-b border-grid-line-col bg-grid-header px-3 text-caption font-semibold whitespace-nowrap text-fg-secondary">
        <span className="grid w-6.5 shrink-0 place-items-center">
          {gridMode === "delete" ? (
            <input type="checkbox" checked={allSelected} disabled={!deletable.length}
              ref={(el) => { if (el) el.indeterminate = bulkSel.length > 0 && !allSelected; }}
              onChange={() => onBulkSel(allSelected ? [] : deletable.map((m) => m.id))}
              aria-label="Select all deletable members" className="accent-danger-solid" />
          ) : display.rowNumbers || gridMode === "reorder" ? (
            <span className="w-full text-end"><span aria-hidden>#</span><span className="sr-only">{gridMode === "reorder" ? "Order" : "Row number"}</span></span>
          ) : null}
        </span>
        {columns.map((c) => (
          <span key={c.id} className={cx("truncate", c.id === "name" ? "min-w-0 flex-1" : cx(COL_WIDTH[c.id] ?? "w-30", "shrink-0"))}>{c.label}</span>
        ))}
        <span className="w-5 shrink-0" />
      </div>

      <ul aria-label={label} className="min-h-0 flex-1 overflow-y-auto">
        {members.map((m, i) => {
          const committed = m.id === member;
          const inspected = m.id === peek;
          return (
            <li key={m.id}
              onClick={() => inspect(m.id)}
              aria-current={committed ? "true" : undefined}
              className={cx(
                "flex h-grid-row cursor-pointer items-center gap-2.5 border-s-[3px] px-3 text-ui text-fg-primary",
                display.gridlines && "border-b border-b-grid-line",
                committed ? "border-s-mode-solid" : "border-s-transparent",
                committed || inspected ? "bg-mode-soft" : display.zebra && i % 2 === 1 ? "bg-grid-container" : "bg-surface",
              )}>
              <span className="flex w-6.5 shrink-0 items-center justify-end gap-0.5 text-caption text-fg-tertiary tabular-nums">
                {gridMode === "delete" ? (
                  /* System-defined members carry no checkbox: a disabled box invites "select all" to mean something it cannot. */
                  m.locked
                    ? <Lock size={11} aria-label={`${m.name} cannot be deleted`} className="mx-auto text-fg-icon" />
                    : <input type="checkbox" checked={bulkSel.includes(m.id)} onClick={(e) => e.stopPropagation()}
                        onChange={() => onBulkSel(bulkSel.includes(m.id) ? bulkSel.filter((x) => x !== m.id) : [...bulkSel, m.id])}
                        aria-label={`Select ${m.name}`} className="mx-auto accent-danger-solid" />
                ) : gridMode === "reorder" ? (
                  <>
                    <button type="button" data-grip={m.id}
                      aria-label={`Reorder ${m.name}, position ${i + 1} of ${members.length}. Use up and down arrow keys.`}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp") { e.preventDefault(); onMove(i, -1); }
                        if (e.key === "ArrowDown") { e.preventDefault(); onMove(i, 1); }
                      }}
                      className="grid size-4 cursor-grab place-items-center rounded-chip text-fg-icon">
                      <Menu size={11} aria-hidden />
                    </button>
                    {i + 1}
                  </>
                ) : display.rowNumbers ? i + 1 : null}
              </span>
              {columns.map((c) => c.id === "name" ? (
                /* The name is the keyboard route to inspect a row. */
                <button key={c.id} type="button" onClick={(e) => { e.stopPropagation(); inspect(m.id); }}
                  aria-pressed={onChoose ? undefined : inspected}
                  className="min-w-0 flex-1 cursor-pointer truncate text-start">{m.name}</button>
              ) : <span key={c.id} className="contents">{cell(m, c)}</span>)}
              <span className="grid w-5 shrink-0 place-items-center">
                {gridMode !== "reorder" && !onChoose && (
                  <button type="button" aria-label={`${configureLabel} ${m.name}`} title={`${configureLabel} ${m.name}`}
                    onClick={(e) => { e.stopPropagation(); onConfigure(m.id); }}
                    className="grid size-5 cursor-pointer place-items-center rounded-chip text-fg-icon hover:bg-hover hover:text-fg-primary">
                    <Settings size={12} aria-hidden />
                  </button>
                )}
              </span>
            </li>
          );
        })}
        {!members.length && <li className="px-3 py-4.5 text-caption text-fg-tertiary">{emptyMessage ?? "Nothing in this view."}</li>}
      </ul>
    </div>
  );
}
