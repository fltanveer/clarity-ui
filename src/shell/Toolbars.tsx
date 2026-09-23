import { useRef, useState } from "react";
import {
  Boxes, Check, ChevronDown, Columns3, Download, Filter, Group, Lock, Maximize2, Menu, Minimize2,
  Plus, RefreshCw, Search, Settings, SplitSquareHorizontal, Trash2, Upload, X,
} from "lucide-react";
import { POV_AXES, initialPov, type PovAxis, type PovValue } from "../lib/pov";
import { ViewList, type ViewListItem } from "../components/ViewList";
import { Checkbox } from "../components/Checkbox";
import { controlClass } from "../components/ConfigFields";
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
  /* The panel edits a draft: choosing a view or ticking members changes nothing
     until Apply, so a half-made point of view never queries anything. */
  const [pick, setPick] = useState(false);
  const [draftView, setDraftView] = useState(value.viewId);
  const [draftMembers, setDraftMembers] = useState<string[]>(value.memberIds);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLButtonElement>(null);

  const viewOf = (id: string) => axis.views.find((v) => v.id === id) ?? axis.views[0];
  const view = viewOf(value.viewId);
  const draft = viewOf(draftView);
  const items: ViewListItem[] = axis.views.map((v) => ({
    id: v.id, name: v.name, folder: v.folder ?? null, kind: v.kind, system: v.system,
  }));
  const shown = draft.members.filter((m) => m.toLowerCase().includes(q.trim().toLowerCase()));
  const all = draftMembers.length === 0;

  const begin = () => {
    setPick(false); setQ("");
    setDraftView(value.viewId); setDraftMembers(value.memberIds);
    setOpen(true);
  };
  const close = () => { setOpen(false); setPick(false); setQ(""); };
  /* Back to the axis default: its first view, every member. Applied like any other choice. */
  const atDefault = draftView === axis.views[0].id && draftMembers.length === 0;
  const reset = () => { setDraftView(axis.views[0].id); setDraftMembers([]); setPick(false); setQ(""); };
  const apply = () => {
    onChange({ viewId: draftView, memberIds: draftMembers.length === draft.members.length ? [] : draftMembers });
    close();
    ref.current?.focus();
  };

  return (
    <>
      <button ref={ref} type="button" aria-haspopup="dialog" aria-expanded={open}
        onClick={() => (open ? close() : begin())}
        aria-label={`${axis.label}: ${view.name}${value.memberIds.length ? `, ${value.memberIds.length} of ${view.members.length} members` : ""}`}
        /* Borderless at rest: context reads as current state, not a form. The
           chevron plus a hover/open fill mark it as a control. */
        className={cx("flex h-pov shrink-0 cursor-pointer flex-col items-start justify-center rounded-control px-2 text-start hover:bg-hover",
          open && "bg-hover")}>
        <span aria-hidden className="text-micro tracking-eyebrow whitespace-nowrap text-fg-tertiary uppercase">{axis.label}</span>
        <span aria-hidden className="flex min-w-0 items-center gap-1">
          <span className="max-w-42 truncate text-ui font-semibold text-mode-ink">{view.name}</span>
          {/* A narrowed context is visible on the bar, not only in the panel. */}
          {Boolean(value.memberIds.length) && (
            <span className="rounded-chip border border-mode-solid px-1 text-micro font-bold text-mode-ink tabular-nums">
              {value.memberIds.length}
            </span>
          )}
          <ChevronDown size={13} className="shrink-0 text-fg-tertiary" />
        </span>
      </button>

      <Popover anchorRef={ref} open={open} onClose={close} role="dialog" label={axis.label}
        className="flex max-h-[min(32rem,calc(100vh-8rem))] w-80 flex-col overflow-hidden bg-surface">
        <div className="flex h-row-toolbar shrink-0 items-center border-b border-line-subtle bg-surface px-3">
          <h3 className="text-caption font-semibold tracking-label text-fg-tertiary uppercase">{axis.label}</h3>
        </div>

        {/* Which view, then which of its members: one panel, two steps.
            The view control is the search: open it and type to filter the list. */}
        <div className="shrink-0 border-b border-line-subtle px-3 py-2.5">
          <span className="mb-1 block text-caption font-medium text-fg-secondary">View</span>
          <div className="relative">
            <Boxes size={14} aria-hidden className={cx("pointer-events-none absolute start-2.5 top-1/2 -translate-x-0 -translate-y-1/2",
              pick ? "text-mode-ink" : "text-fg-tertiary")} />
            {pick ? (
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={draft.name}
                aria-label="Search views" aria-expanded
                onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setPick(false); setQ(""); } }}
                className={cx(controlClass, "h-control-form border-mode-solid ps-8 pe-8")} />
            ) : (
              <button type="button" onClick={() => { setPick(true); setQ(""); }} aria-expanded={false}
                className={cx(controlClass, "flex h-control-form cursor-pointer items-center ps-8 pe-8 text-start font-semibold")}>
                <span className="min-w-0 flex-1 truncate">{draft.name}</span>
              </button>
            )}
            <button type="button" onClick={() => { setPick((o) => !o); setQ(""); }}
              aria-label={pick ? "Close the view list" : "Choose a view"}
              className="absolute end-1.5 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover hover:text-fg-primary">
              <ChevronDown size={14} aria-hidden className={cx("transition-transform ease-standard", pick && "rotate-180")} />
            </button>
          </div>
        </div>

        {!pick && (
          <div className="shrink-0 border-b border-line-subtle px-3 py-2.5">
            <label className="flex h-control-form items-center gap-1.5 rounded-control border border-line-control bg-surface px-2.5 hover:border-line-control-hover">
              <Search size={13} aria-hidden className="shrink-0 text-fg-tertiary" />
              <span className="sr-only">Search members of {draft.name}</span>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members"
                className="min-w-0 flex-1 bg-transparent text-ui outline-none placeholder:text-fg-tertiary [&::-webkit-search-cancel-button]:hidden" />
            </label>
          </div>
        )}

        {pick ? (
          /* The one shared view list, so a view reads the same here as everywhere. */
          <div className="min-h-0 flex-1 overflow-y-auto py-1.5">
            <ViewList items={items} activeId={draftView} query={q}
              countOf={(v) => viewOf(v.id).members.length}
              onPick={(id) => { setDraftView(id); setDraftMembers([]); setPick(false); setQ(""); }} />
          </div>
        ) : (
          <>
            <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line-subtle bg-shell px-3">
              <label className="flex cursor-pointer items-center gap-2 text-caption text-fg-secondary">
                <Checkbox checked={all} indeterminate={!all && draftMembers.length < draft.members.length}
                  onChange={() => setDraftMembers([])} aria-label={`Every member of ${draft.name}`} />
                Every member
              </label>
              <span className="ms-auto text-caption text-fg-tertiary tabular-nums">
                {draftMembers.length ? `${draftMembers.length} selected` : `${draft.members.length} members`}
              </span>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto py-1">
              {shown.map((m) => {
                const on = draftMembers.includes(m);
                return (
                  <li key={m}>
                    <label className={cx("flex h-9 cursor-pointer items-center gap-2 px-3 text-ui",
                      on ? "bg-mode-soft font-semibold text-mode-ink" : "text-fg-primary hover:bg-hover")}>
                      <Checkbox checked={on} onChange={(e) =>
                        setDraftMembers((ms) => (e.target.checked ? [...ms, m] : ms.filter((x) => x !== m)))} />
                      <span className="min-w-0 flex-1 truncate">{m}</span>
                    </label>
                  </li>
                );
              })}
              {!shown.length && <li className="px-3 py-3 text-ui text-fg-tertiary">No members match “{q}”.</li>}
            </ul>
          </>
        )}

        <div className="flex shrink-0 items-center gap-2 border-t border-line-subtle bg-shell px-3 py-2">
          <ChromeButton className="h-control-h bg-surface px-2.5" disabled={atDefault} onClick={reset}
            title={`Back to ${axis.views[0].name}, every member`}>
            <RefreshCw size={12} aria-hidden /> Reset
          </ChromeButton>
          <span className="min-w-0 flex-1 truncate text-caption text-fg-tertiary">
            {draftMembers.length ? `${draftMembers.length} of ${draft.members.length}` : "Every member"}
          </span>
          <ChromeButton className="h-control-h bg-surface px-3" onClick={close}>Cancel</ChromeButton>
          <ChromeButton variant="primary" onClick={apply}>Apply</ChromeButton>
        </div>
      </Popover>
    </>
  );
}
