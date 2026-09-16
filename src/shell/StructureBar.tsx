import { useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Lock, Menu, Pencil, Plus, Trash2 } from "lucide-react";
import {
  BOTTOM_TABS, CLOSED_DOMAINS, NON_DELETABLE_STRUCTURES, isAddToken, isPipe, plusLabel, type WorkspaceId,
} from "../lib/nav";
import { MenuDivider, MenuItem, Popover } from "./Popover";
import { DeleteStructureDialog, EditStructureDialog } from "./StructureDialogs";
import { Pipe } from "./controls";
import { cx } from "../lib/cx";

export interface StructureBarProps {
  workspace: WorkspaceId;
  domain: string | null;
  structure: string | null;
  onStructure: (s: string) => void;
  canAuthor: boolean;
  l100: boolean;
}

/*
 * Row 5 · structures of the ACTIVE DOMAIN. Tabs hang from the top edge, flush
 * to the work surface. [+ Add · ☰] sit outside the scrollport. Alt+PgUp /
 * Alt+PgDn switch tabs (Spec 110 §6.1); ←/→ move within the tab list.
 */
export function StructureBar({ workspace, domain, structure, onStructure, canAuthor, l100 }: StructureBarProps) {
  const raw = domain ? BOTTOM_TABS[domain] ?? [] : [];
  /* Renames and deletions made here, keyed Domain:Structure (the structure id stays the original name). */
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [removed, setRemoved] = useState<string[]>([]);
  const key = (t: string) => `${domain}:${t}`;
  const labelOf = (t: string) => labels[key(t)] ?? t;
  const items = raw.filter((t) => !isAddToken(t) && (isPipe(t) || !removed.includes(key(t))))
    /* Drop pipes left dangling at either end or doubled up by a deletion. */
    .filter((t, i, a) => !isPipe(t) || (i > 0 && i < a.length - 1 && !isPipe(a[i - 1])));
  const tabs = items.filter((t) => !isPipe(t));
  const hasAdd = raw.some(isAddToken);
  const addLabel = plusLabel(workspace, domain);
  const stripRef = useRef<HTMLDivElement>(null);
  const [allOpen, setAllOpen] = useState(false);
  const allRef = useRef<HTMLButtonElement>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const closed = domain ? CLOSED_DOMAINS.has(domain) : false;

  const scroll = (dir: number) => stripRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" });
  const onKeyDown = (e: KeyboardEvent) => {
    const i = tabs.indexOf(structure ?? "");
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = tabs[(i + d + tabs.length) % tabs.length];
    onStructure(next);
    document.getElementById(`structure-tab-${next}`)?.focus();
  };

  return (
    <div className="flex h-row-structure shrink-0 items-center gap-2 border-t border-line-subtle bg-shell-alt px-edge">
      <div className="me-1.5 flex shrink-0 items-center gap-0.5">
        {/* At L100 structure management leads; closed domains stay sealed. */}
        {l100 && domain && !CLOSED_DOMAINS.has(domain) && (
          <button type="button" className="flex h-[1.375rem] cursor-pointer items-center gap-1 rounded-control px-2 text-caption font-semibold whitespace-nowrap text-fg-secondary hover:bg-hover">
            <Plus size={12} aria-hidden /> Add / Manage
          </button>
        )}
        {canAuthor && hasAdd && addLabel && (
          <button type="button" className="flex h-[1.375rem] cursor-pointer items-center gap-1 rounded-control px-2 text-caption font-medium whitespace-nowrap text-fg-secondary hover:bg-hover">
            <Plus size={12} aria-hidden /> {addLabel}
          </button>
        )}
        <button ref={allRef} type="button" aria-label="All structures" aria-haspopup="menu" aria-expanded={allOpen}
          onClick={() => setAllOpen((o) => !o)}
          className="grid size-[1.375rem] cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover">
          <Menu size={14} aria-hidden />
        </button>
        <Popover anchorRef={allRef} open={allOpen} onClose={() => setAllOpen(false)} placement="top-start" label="All structures" className="min-w-48 py-1">
          {tabs.length ? tabs.map((t) => (
            <MenuItem key={t} checked={t === structure} onSelect={() => { onStructure(t); setAllOpen(false); }}>{labelOf(t)}</MenuItem>
          )) : <p className="px-3 py-1.5 text-caption text-fg-tertiary">No structures defined</p>}
        </Popover>
      </div>

      <div ref={stripRef} role="tablist" aria-label="Structures" onKeyDown={onKeyDown}
        className="no-scrollbar flex h-full min-w-0 flex-1 items-stretch gap-0.5 overflow-x-auto">
        {tabs.length === 0 ? (
          <span className="ps-tab-inset text-caption text-fg-tertiary">No structures defined for this domain</span>
        ) : items.map((t, i) => isPipe(t)
          ? <Pipe key={`p${i}`} className="mx-1" />
          : <StructureTab key={t} name={t} label={labelOf(t)} on={t === structure} onSelect={() => onStructure(t)}
              system={NON_DELETABLE_STRUCTURES.has(key(t))} canAuthor={canAuthor}
              onEdit={() => setEditing(t)} onDelete={() => setConfirm(t)} />)}
      </div>

      <div className="flex shrink-0 gap-0.5">
        <button type="button" onClick={() => scroll(-1)} aria-label="Scroll structures left"
          className="grid size-6 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover">
          <ChevronLeft size={14} aria-hidden />
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label="Scroll structures right"
          className="grid size-6 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover">
          <ChevronRight size={14} aria-hidden />
        </button>
      </div>

      {editing && domain && (
        <EditStructureDialog domain={domain} name={labelOf(editing)} system={NON_DELETABLE_STRUCTURES.has(key(editing))}
          closed={closed} description={descriptions[key(editing)] ?? ""}
          siblings={tabs.filter((t) => t !== editing).map(labelOf)}
          onCancel={() => setEditing(null)}
          onSave={({ name: next, description }) => {
            setLabels((l) => ({ ...l, [key(editing)]: next }));
            setDescriptions((d) => ({ ...d, [key(editing)]: description }));
            setEditing(null);
          }} />
      )}
      {confirm && domain && (
        <DeleteStructureDialog domain={domain} name={labelOf(confirm)}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const left = tabs.filter((t) => t !== confirm);
            setRemoved((r) => [...r, key(confirm)]);
            if (confirm === structure && left[0]) onStructure(left[0]);
            setConfirm(null);
          }} />
      )}
    </div>
  );
}

function StructureTab({ name, label, on, onSelect, system, canAuthor, onEdit, onDelete }: {
  name: string; label: string; on: boolean; onSelect: () => void; system: boolean;
  canAuthor: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const caretRef = useRef<HTMLButtonElement>(null);
  /* Rename stays open on system structures; delete does not. */
  const showCaret = canAuthor;
  const canDelete = canAuthor && !system;
  /* Full-height square tabs; the active one is the work surface's colour with a mode-coloured bottom rule. */
  const frame = on ? "border-b-mode-solid bg-grid-container" : "border-b-transparent";
  return (
    <span className="caret-host relative flex h-full shrink-0 items-stretch"
      onContextMenu={(e) => { if (showCaret) { e.preventDefault(); setMenu(true); } }}>
      <button id={`structure-tab-${name}`} type="button" role="tab" aria-selected={on} tabIndex={on ? 0 : -1}
        onClick={onSelect}
        className={cx(
          "flex h-full cursor-pointer items-center gap-1.5 border-b-2 ps-3 text-caption whitespace-nowrap",
          showCaret ? "pe-1" : "pe-3",
          frame,
          on ? "font-semibold text-fg-primary" : "text-fg-tertiary hover:bg-hover hover:text-fg-primary",
        )}>
        {system && <Lock size={10} aria-label="System-defined" />}
        {label}
      </button>
      {showCaret && (
        <button ref={caretRef} type="button" aria-label={`${label} options`} aria-haspopup="menu" aria-expanded={menu}
          onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }}
          className={cx("grid h-full w-6 cursor-pointer place-items-center border-b-2 text-fg-tertiary hover:text-fg-primary",
            frame, !on && "caret-reveal")}>
          <ChevronDown size={11} aria-hidden />
        </button>
      )}
      <Popover anchorRef={caretRef} open={menu} onClose={() => setMenu(false)} placement="top-start" label={`${label} options`} className="min-w-37 py-1">
        <MenuItem onSelect={() => { setMenu(false); onEdit(); }}><Pencil size={13} aria-hidden /> Edit…</MenuItem>
        <MenuDivider />
        <MenuItem tone="danger" disabled={!canDelete} onSelect={() => { setMenu(false); onDelete(); }}>
          <Trash2 size={13} aria-hidden /> Delete…{!canDelete && <span className="ms-auto ps-3 text-caption">required</span>}
        </MenuItem>
      </Popover>
    </span>
  );
}
