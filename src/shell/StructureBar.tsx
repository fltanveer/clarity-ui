import { useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Lock, Menu, Pencil, Plus, Trash2 } from "lucide-react";
import {
  BOTTOM_TABS, CLOSED_DOMAINS, NON_DELETABLE_STRUCTURES, isAddToken, isPipe, plusLabel, type WorkspaceId,
} from "../lib/nav";
import { MenuDivider, MenuItem, Popover } from "./Popover";
import { ConfirmDialog } from "./ConfirmDialog";
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
  const items = raw.filter((t) => !isAddToken(t));
  const tabs = items.filter((t) => !isPipe(t));
  const hasAdd = raw.some(isAddToken);
  const addLabel = plusLabel(workspace, domain);
  const stripRef = useRef<HTMLDivElement>(null);
  const [allOpen, setAllOpen] = useState(false);
  const allRef = useRef<HTMLButtonElement>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

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
            <MenuItem key={t} checked={t === structure} onSelect={() => { onStructure(t); setAllOpen(false); }}>{t}</MenuItem>
          )) : <p className="px-3 py-1.5 text-caption text-fg-tertiary">No structures defined</p>}
        </Popover>
      </div>

      <div ref={stripRef} role="tablist" aria-label="Structures" onKeyDown={onKeyDown}
        className="no-scrollbar flex h-full min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
        {tabs.length === 0 ? (
          <span className="ps-tab-inset text-caption text-fg-tertiary">No structures defined for this domain</span>
        ) : items.map((t, i) => isPipe(t)
          ? <Pipe key={`p${i}`} className="mx-1" />
          : <StructureTab key={t} name={t} on={t === structure} onSelect={() => onStructure(t)}
              system={NON_DELETABLE_STRUCTURES.has(`${domain}:${t}`)} canAuthor={canAuthor}
              onDelete={() => setConfirm(t)} />)}
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

      {confirm && (
        <ConfirmDialog
          title={`Delete ${confirm}?`}
          confirmLabel="Delete structure and repost"
          onCancel={() => setConfirm(null)}
          onConfirm={() => setConfirm(null)}
        >
          This removes the structure and reposts <strong>1,284 derived facts</strong> across 3 dependent structures. It cannot be undone.
        </ConfirmDialog>
      )}
    </div>
  );
}

function StructureTab({ name, on, onSelect, system, canAuthor, onDelete }: {
  name: string; on: boolean; onSelect: () => void; system: boolean;
  canAuthor: boolean; onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const caretRef = useRef<HTMLButtonElement>(null);
  /* Rename stays open on system structures; delete does not. */
  const showCaret = canAuthor;
  const canDelete = canAuthor && !system;
  const frame = on ? "border-t-mode-solid bg-grid-container" : "border-t-transparent";
  return (
    <span className="caret-host relative flex shrink-0 items-stretch"
      onContextMenu={(e) => { if (showCaret) { e.preventDefault(); setMenu(true); } }}>
      <button id={`structure-tab-${name}`} type="button" role="tab" aria-selected={on} tabIndex={on ? 0 : -1}
        onClick={onSelect}
        className={cx(
          "-mt-px flex h-7.5 cursor-pointer items-center gap-1.5 rounded-tl-chip border-t-2 ps-2.5 text-caption whitespace-nowrap",
          showCaret ? "pe-1" : "rounded-tr-chip pe-2.5",
          frame,
          on ? cx("border-s border-s-line-subtle font-semibold text-fg-primary", !showCaret && "border-e border-e-line-subtle") : "text-fg-tertiary hover:text-fg-primary",
        )}>
        {system && <Lock size={10} aria-label="System-defined" />}
        {name}
      </button>
      {showCaret && (
        <button ref={caretRef} type="button" aria-label={`${name} options`} aria-haspopup="menu" aria-expanded={menu}
          onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }}
          className={cx("-mt-px grid h-7.5 w-5 cursor-pointer place-items-center rounded-tr-chip border-t-2 text-fg-tertiary",
            frame, on ? "border-e border-e-line-subtle" : "caret-reveal")}>
          <ChevronDown size={11} aria-hidden />
        </button>
      )}
      <Popover anchorRef={caretRef} open={menu} onClose={() => setMenu(false)} placement="top-start" label={`${name} options`} className="min-w-37 py-1">
        <MenuItem onSelect={() => setMenu(false)}><Pencil size={13} aria-hidden /> Edit</MenuItem>
        <MenuDivider />
        <MenuItem tone="danger" disabled={!canDelete} onSelect={() => { setMenu(false); onDelete(); }}>
          <Trash2 size={13} aria-hidden /> Delete{!canDelete && <span className="ms-auto ps-3 text-caption">required</span>}
        </MenuItem>
      </Popover>
    </span>
  );
}
