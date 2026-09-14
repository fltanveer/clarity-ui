import { useRef, useState } from "react";
import {
  Check, ChevronDown, Columns3, Download, Filter, Group, Lock, Maximize2, Menu, Minimize2,
  Plus, RefreshCw, Search, Settings, SplitSquareHorizontal, Trash2, Upload, X,
} from "lucide-react";
import { POV_AXES, initialPov, type PovAxis, type PovValue } from "../lib/pov";
import { DEFAULT_COLUMNS, type DisplaySettings, type GridColumn, type GridMode } from "./types";
import { MenuDivider, MenuItem, Popover } from "./Popover";
import { ChromeButton, Pipe } from "./controls";
import { cx } from "../lib/cx";

/* ── Row 3a · action toolbar ─────────────────────────────────────────────── */
/*
 * MODE-coloured bar (FD-6 closed: S2 solid). Authoring (+ Add member) appears
 * only where the MODE gate allows it. The collapse control lives here because
 * this bar survives the collapse — the undo is never hidden with what it hid.
 */
export function ActionToolbar({ canAuthor, onGridMode, chromeCollapsed, onChromeCollapsed }: {
  canAuthor: boolean;
  onGridMode: (m: Exclude<GridMode, null>) => void;
  chromeCollapsed: boolean;
  onChromeCollapsed: (c: boolean) => void;
}) {
  const [actions, setActions] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <div className="on-bar flex h-row-toolbar shrink-0 items-center gap-2 border-b border-mode-ink bg-mode-solid px-edge">
      {canAuthor && (
        <ChromeButton variant="bar" className="border-on-bar-edge-strong font-semibold">
          <Plus size={14} aria-hidden /> Add member
        </ChromeButton>
      )}
      <ChromeButton ref={ref} variant="bar" aria-haspopup="menu" aria-expanded={actions} onClick={() => setActions((a) => !a)}>
        Actions <ChevronDown size={13} aria-hidden />
      </ChromeButton>
      <Popover anchorRef={ref} open={actions} onClose={() => setActions(false)} label="Actions" className="w-44 py-1">
        <MenuItem onSelect={() => { setActions(false); onGridMode("reorder"); }}><Menu size={13} aria-hidden /> Reorder</MenuItem>
        <MenuDivider />
        <MenuItem tone="danger" onSelect={() => { setActions(false); onGridMode("delete"); }}><Trash2 size={13} aria-hidden /> Bulk delete</MenuItem>
      </Popover>
      <ChromeButton variant="bar"><Download size={14} aria-hidden /> Export</ChromeButton>
      <div className="ms-auto flex gap-1.5">
        <ChromeButton variant="bar" aria-label="Import" className="w-8 px-0"><Upload size={14} aria-hidden /></ChromeButton>
        <ChromeButton variant="bar" aria-label="Refresh" className="w-8 px-0"><RefreshCw size={14} aria-hidden /></ChromeButton>
        <ChromeButton variant="bar" className="w-8 px-0"
          onClick={() => onChromeCollapsed(!chromeCollapsed)}
          aria-label={chromeCollapsed ? "Expand header" : "Collapse header"}
          aria-keyshortcuts="Control+Shift+F"
          title={`${chromeCollapsed ? "Expand" : "Collapse"} header (Ctrl+Shift+F)`}>
          {chromeCollapsed ? <Minimize2 size={14} aria-hidden /> : <Maximize2 size={14} aria-hidden />}
        </ChromeButton>
      </div>
    </div>
  );
}

/* ── grid mode bar · replaces the action toolbar in reorder / bulk delete ── */
/*
 * The chrome changes colour because the rules changed. Same on-colour buttons
 * as the action bar — a mode bar is the action bar wearing a different colour.
 */
export function GridModeBar({ kind, count, onSave, onCancel }: {
  kind: Exclude<GridMode, null>; count: number; onSave: () => void; onCancel: () => void;
}) {
  const reorder = kind === "reorder";
  const disabled = !reorder && count === 0;
  return (
    <div role="region" aria-label={reorder ? "Reorder mode" : "Bulk delete mode"}
      className={cx("on-bar flex h-row-toolbar shrink-0 items-center gap-2 px-edge text-fg-on-accent",
        reorder ? "bg-warning-solid" : "bg-danger-solid")}>
      <span className="flex items-center gap-1.5 text-caption font-bold tracking-label">
        {reorder ? <Menu size={13} aria-hidden /> : <Trash2 size={13} aria-hidden />}
        {reorder ? "REORDER MODE" : "BULK DELETE"}
      </span>
      <span className="text-caption">
        — {reorder ? "Drag a row, or focus its handle and use ↑ ↓" : "Select the members to delete"}
      </span>
      {!reorder && <span role="status" className="text-caption font-semibold">{count} selected</span>}
      <span className="flex-1" />
      <ChromeButton variant="bar" onClick={onCancel}><X size={12} aria-hidden /> Cancel</ChromeButton>
      <ChromeButton variant="bar" onClick={onSave} disabled={disabled} className="border-on-bar-edge-strong bg-on-bar-hover font-semibold">
        {reorder ? <><Check size={13} aria-hidden /> Save order</> : <><Trash2 size={13} aria-hidden /> Delete {count}</>}
      </ChromeButton>
    </div>
  );
}

/* ── Row 3b · view toolbar ───────────────────────────────────────────────── */
export function ViewToolbar({ query, onQuery, display, onDisplay, columns, onColumns }: {
  query: string;
  onQuery: (q: string) => void;
  display: DisplaySettings;
  onDisplay: (d: DisplaySettings) => void;
  columns: { visible: GridColumn[]; available: GridColumn[] };
  onColumns: (c: { visible: GridColumn[]; available: GridColumn[] }) => void;
}) {
  const [colsOpen, setColsOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const colsRef = useRef<HTMLButtonElement>(null);
  const displayRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="flex h-row-toolbar shrink-0 items-center gap-2 border-b border-line-subtle bg-shell px-edge">
      <label className="flex h-button w-50 items-center gap-1.5 rounded-control border border-line-control bg-surface hover:border-line-control-hover px-2.5">
        <Search size={13} aria-hidden className="shrink-0 text-fg-tertiary" />
        <span className="sr-only">Search members</span>
        <input type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search members"
          className="min-w-0 flex-1 bg-transparent text-caption outline-none placeholder:text-fg-tertiary" />
      </label>
      {/* Filter, Group by and Split are prototype stubs: rendered for layout parity, not wired. */}
      <ChromeButton className="bg-surface px-2"><Filter size={14} aria-hidden /> Filter</ChromeButton>
      <ChromeButton className="bg-surface px-2"><Group size={14} aria-hidden /> Group by</ChromeButton>
      <ChromeButton ref={colsRef} className="bg-surface px-2" aria-haspopup="dialog" aria-expanded={colsOpen} onClick={() => setColsOpen((o) => !o)}>
        <Columns3 size={14} aria-hidden /> Columns
      </ChromeButton>
      <ChromeButton className="bg-surface px-2"><SplitSquareHorizontal size={14} aria-hidden /> Split</ChromeButton>
      <ChromeButton ref={displayRef} className="bg-surface px-2" aria-haspopup="menu" aria-expanded={displayOpen} onClick={() => setDisplayOpen((o) => !o)}>
        <Settings size={14} aria-hidden /> Display <ChevronDown size={12} aria-hidden />
      </ChromeButton>

      <Popover anchorRef={displayRef} open={displayOpen} onClose={() => setDisplayOpen(false)} label="Display" className="min-w-45 py-1">
        {([["rowNumbers", "Row numbers"], ["gridlines", "Gridlines"], ["zebra", "Banded rows"]] as const).map(([k, label]) => (
          <MenuItem key={k} checked={display[k]} onSelect={() => onDisplay({ ...display, [k]: !display[k] })}>
            <span className="grid w-3.5 place-items-center">{display[k] && <Check size={13} aria-hidden />}</span>
            {label}
          </MenuItem>
        ))}
      </Popover>
      <Popover anchorRef={colsRef} open={colsOpen} onClose={() => setColsOpen(false)} role="dialog" label="Columns"
        className="flex max-h-110 w-78 flex-col overflow-hidden">
        <ColumnPicker columns={columns} onColumns={onColumns} onClose={() => { setColsOpen(false); colsRef.current?.focus(); }} />
      </Popover>
    </div>
  );
}

/*
 * Column picker — the assign/unassign grammar: visible columns carry × to
 * remove, available columns carry a checkbox to add. Freeze is a boundary
 * (radio), not a per-column flag. The first column is locked visible.
 */
function ColumnPicker({ columns, onColumns, onClose }: {
  columns: { visible: GridColumn[]; available: GridColumn[] };
  onColumns: (c: { visible: GridColumn[]; available: GridColumn[] }) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [freeze, setFreeze] = useState<string | null>("name");
  const { visible, available } = columns;
  const match = (c: GridColumn) => c.label.toLowerCase().includes(q.trim().toLowerCase());
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 1 || j >= visible.length || i < 1) return;
    const next = [...visible];
    next.splice(j, 0, next.splice(i, 1)[0]);
    onColumns({ visible: next, available });
    requestAnimationFrame(() => document.getElementById(`col-grip-${next[j].id}`)?.focus());
  };
  const rowClass = "flex min-h-7 items-center gap-2 border-b border-grid-line px-2 text-ui last:border-b-0";

  return (
    <>
      <div className="shrink-0 px-2.5 pt-2.5">
        <div className="mb-2 flex items-center gap-1.5">
          <p className="flex-1 text-ui font-semibold">Columns</p>
          <ChromeButton variant="icon" onClick={onClose} aria-label="Close column settings"><X size={13} aria-hidden /></ChromeButton>
        </div>
        <label className="mb-2.5 flex h-7 items-center gap-1.5 rounded-control border border-line-control bg-surface hover:border-line-control-hover px-2">
          <Search size={12} aria-hidden className="text-fg-tertiary" />
          <span className="sr-only">Search columns</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search columns"
            className="min-w-0 flex-1 bg-transparent text-caption outline-none placeholder:text-fg-tertiary" />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5">
        <p className="flex items-baseline gap-1.5 pb-1 text-micro tracking-eyebrow text-fg-tertiary uppercase">
          Visible columns <span className="text-caption tracking-[0] normal-case">{visible.length}</span>
        </p>
        <ul className="mb-3 overflow-hidden rounded-control border border-line-strong bg-surface">
          {visible.map((c, i) => match(c) && (
            <li key={c.id} className={rowClass}>
              <span className="w-4 text-end text-caption text-fg-tertiary tabular-nums">{i + 1}</span>
              {i === 0 ? <span className="w-4" /> : (
                <button id={`col-grip-${c.id}`} type="button"
                  aria-label={`Reorder ${c.label}, position ${i + 1} of ${visible.length}. Use up and down arrow keys.`}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") { e.preventDefault(); move(i, -1); }
                    if (e.key === "ArrowDown") { e.preventDefault(); move(i, 1); }
                  }}
                  className="grid w-4 cursor-grab place-items-center rounded-chip text-fg-icon">
                  <Menu size={11} aria-hidden />
                </button>
              )}
              <span className="min-w-0 flex-1 truncate">{c.label}</span>
              <label className="grid w-10 place-items-center">
                <input type="radio" name="freeze" checked={freeze === c.id} onChange={() => setFreeze(c.id)}
                  aria-label={`Freeze columns up to ${c.label}`} className="accent-mode-solid" />
              </label>
              <span className="grid w-5 place-items-center">
                {i === 0
                  ? <Lock size={11} aria-label="Always visible" className="text-fg-icon" />
                  : <button type="button" onClick={() => onColumns({ visible: visible.filter((x) => x.id !== c.id), available: [c, ...available] })}
                      aria-label={`Remove ${c.label}`} className="grid size-5 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover">
                      <X size={11} aria-hidden />
                    </button>}
              </span>
            </li>
          ))}
        </ul>
        <label className="flex items-center gap-2 px-2 pb-2.5 text-caption text-fg-tertiary">
          <input type="radio" name="freeze" checked={freeze === null} onChange={() => setFreeze(null)} className="accent-mode-solid" />
          No frozen columns
        </label>

        <p className="flex items-baseline gap-1.5 pb-1 text-micro tracking-eyebrow text-fg-tertiary uppercase">
          Available columns <span className="text-caption tracking-[0] normal-case">{available.length}</span>
        </p>
        <ul className="mb-2.5 overflow-hidden rounded-control border border-line-strong bg-surface">
          {available.filter(match).map((c) => (
            <li key={c.id} className={rowClass}>
              <label className="flex flex-1 cursor-pointer items-center gap-2">
                <input type="checkbox" checked={false} className="accent-mode-solid"
                  onChange={() => onColumns({ visible: [...visible, c], available: available.filter((x) => x.id !== c.id) })} />
                <span className="text-fg-secondary">{c.label}</span>
              </label>
            </li>
          ))}
          {!available.filter(match).length && (
            <li className="px-2 py-2.5 text-caption text-fg-tertiary">{q ? `No columns match “${q}”.` : "All columns are visible."}</li>
          )}
        </ul>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 border-t border-line-subtle bg-shell-alt px-2.5 py-2">
        <ChromeButton className="h-6" onClick={() => { onColumns(DEFAULT_COLUMNS); setFreeze("name"); setQ(""); }}>
          <RefreshCw size={11} aria-hidden /> Reset to default
        </ChromeButton>
        <span className="flex-1" />
        <ChromeButton variant="primary" className="h-6" onClick={onClose}>Done</ChromeButton>
      </div>
    </>
  );
}

/* ── POV bar · context, not filters ──────────────────────────────────────── */
/*
 * Survives chrome collapse: hiding controls costs a click; hiding context lets
 * someone read USD as EUR. Controls fold, context stays.
 */
export function PovBar() {
  const [pov, setPov] = useState(initialPov);
  return (
    <div className="no-scrollbar flex h-row-toolbar shrink-0 items-center gap-1.5 overflow-x-auto border-b border-line-subtle bg-surface px-edge">
      {POV_AXES.map((axis, i) => (
        <span key={axis.id} className="contents">
          {i > 0 && <Pipe className="mx-0.5 h-5.5" />}
          <PovSelect axis={axis} value={pov[axis.id]} onChange={(v) => setPov((p) => ({ ...p, [axis.id]: v }))} />
        </span>
      ))}
    </div>
  );
}

function PovSelect({ axis, value, onChange }: { axis: PovAxis; value: PovValue; onChange: (v: PovValue) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLButtonElement>(null);
  const view = axis.views.find((v) => v.id === value.viewId) ?? axis.views[0];
  const query = q.trim().toLowerCase();
  const memberHits = (v: (typeof axis.views)[number]) => v.members.filter((m) => m.toLowerCase().includes(query));
  const views = query ? axis.views.filter((v) => v.name.toLowerCase().includes(query) || memberHits(v).length) : axis.views;
  const display = value.memberId ? `${view.name} · ${value.memberId}` : view.name;

  return (
    <>
      <button ref={ref} type="button" aria-haspopup="dialog" aria-expanded={open}
        onClick={() => { setQ(""); setOpen((o) => !o); }}
        aria-label={`${axis.label}: ${display}${value.memberId ? ", narrowed to one member" : ""}`}
        /* Borderless at rest: context reads as current state, not a form. The
           chevron plus a hover/open fill mark it as a control. */
        className={cx("flex h-pov shrink-0 cursor-pointer flex-col items-start justify-center rounded-control px-2 text-start hover:bg-hover",
          open && "bg-hover")}>
        <span aria-hidden className="text-micro tracking-eyebrow whitespace-nowrap text-fg-tertiary uppercase">{axis.label}</span>
        <span aria-hidden className="flex min-w-0 items-center gap-1">
          <span className="max-w-42 truncate text-ui font-semibold text-mode-ink">{display}</span>
          {/* A narrowed context is visible on the bar, not only in the panel. */}
          {value.memberId && <span className="rounded-chip border border-mode-solid px-1 text-micro font-bold text-mode-ink">1</span>}
          <ChevronDown size={13} className="shrink-0 text-fg-tertiary" />
        </span>
      </button>
      <Popover anchorRef={ref} open={open} onClose={() => setOpen(false)} role="dialog" label={axis.label}
        className="flex max-h-90 w-65 flex-col overflow-hidden">
        <div className="shrink-0 p-2 pb-1.5">
          <label className="flex h-7 items-center gap-1.5 rounded-control border border-line-control bg-surface hover:border-line-control-hover px-2">
            <Search size={12} aria-hidden className="text-fg-tertiary" />
            <span className="sr-only">Search {axis.label}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${axis.label.toLowerCase()}`}
              className="min-w-0 flex-1 bg-transparent text-caption outline-none placeholder:text-fg-tertiary" />
          </label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {views.map((v) => {
            const current = v.id === view.id;
            return (
              <div key={v.id} className="mb-1">
                <button type="button" onClick={() => onChange({ viewId: v.id, memberId: null })}
                  className={cx("flex w-full cursor-pointer items-center gap-2 rounded-chip px-1.5 py-1 text-start text-ui",
                    current ? "bg-mode-soft font-semibold text-mode-ink" : "hover:bg-hover")}>
                  <span className="min-w-0 flex-1 truncate">{v.name}</span>
                  <span className="text-caption font-normal text-fg-tertiary tabular-nums">{v.members.length}</span>
                </button>
                {/* Members show for the selected view only, so the picker never becomes a tree. */}
                {current && (
                  <fieldset className="mt-0.5 ps-2">
                    <legend className="sr-only">Members of {v.name}</legend>
                    {[null, ...(query ? memberHits(v) : v.members)].map((m) => (
                      <label key={m ?? "__all"} className={cx("flex cursor-pointer items-center gap-2 px-1.5 py-0.5 text-caption",
                        value.memberId === m ? "font-semibold text-mode-ink" : "text-fg-secondary")}>
                        <input type="radio" name={`pov-${axis.id}`} checked={value.memberId === m}
                          onChange={() => onChange({ viewId: v.id, memberId: m })} className="accent-mode-solid" />
                        {m ?? `All (${v.members.length})`}
                      </label>
                    ))}
                  </fieldset>
                )}
              </div>
            );
          })}
          {!views.length && <p className="px-1.5 py-2.5 text-caption text-fg-tertiary">No match for “{q}”.</p>}
        </div>
      </Popover>
    </>
  );
}
