import { Fragment, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, CornerDownRight, Lock, Menu, Pencil, Plus, Trash2 } from "lucide-react";
import {
  BOTTOM_TABS, CLOSED_DOMAINS, NON_DELETABLE_STRUCTURES, SECTIONED_DOMAINS, SECTION_LABEL, SECTION_ORDER,
  isAddToken, isPipe, plusLabel, sectionOf, type StructureSection, type WorkspaceId,
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
  /** L100 only: Edit opens the structure's configuration window instead of the rename dialog. */
  onConfigure: (structure: string) => void;
}

/*
 * Row 5 · structures of the ACTIVE DOMAIN. Tabs hang from the top edge, flush
 * to the work surface. [+ Add · ☰] sit outside the scrollport. Alt+PgUp /
 * Alt+PgDn switch tabs (Spec 110 §6.1); ←/→ move within the tab list.
 */
export function StructureBar({ workspace, domain, structure, onStructure, canAuthor, l100, onConfigure }: StructureBarProps) {
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
  /* Sectioned domains group by role; the rest keep their '|' zones. Tab order follows what is shown. */
  const sections = domain && SECTIONED_DOMAINS.has(domain)
    ? SECTION_ORDER.map((kind) => ({ kind, tabs: items.filter((t) => !isPipe(t) && sectionOf(domain, t) === kind) }))
        .filter((sec) => sec.tabs.length)
    : null;
  const tabs = sections ? sections.flatMap((sec) => sec.tabs) : items.filter((t) => !isPipe(t));
  /* A domain with no structures yet (just created) can always add its first. */
  const hasAdd = raw.some(isAddToken) || raw.length === 0;
  const addLabel = plusLabel(workspace, domain);
  const stripRef = useRef<HTMLDivElement>(null);
  const [allOpen, setAllOpen] = useState(false);
  const allRef = useRef<HTMLButtonElement>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const closed = domain ? CLOSED_DOMAINS.has(domain) : false;

  const tab = (t: string, sectionId?: string) => (
    <StructureTab key={t} name={t} label={labelOf(t)} on={t === structure} onSelect={() => onStructure(t)}
      system={NON_DELETABLE_STRUCTURES.has(key(t))} canAuthor={canAuthor} sectionId={sectionId}
      onEdit={() => (l100 ? onConfigure(labelOf(t)) : setEditing(t))} onDelete={() => setConfirm(t)} />
  );

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
          {tabs.length ? (sections ?? [{ kind: null as StructureSection | null, tabs }]).map((sec, i) => (
            <Fragment key={sec.kind ?? "all"}>
              {i > 0 && <MenuDivider />}
              {sec.kind && (
                <p className="flex items-center gap-1 px-3 pt-1.5 pb-0.5 text-micro font-semibold tracking-label text-fg-tertiary uppercase">
                  {sec.kind === "child" && <CornerDownRight size={10} aria-hidden />}{SECTION_LABEL[sec.kind]}
                </p>
              )}
              {sec.tabs.map((t) => (
                <MenuItem key={t} checked={t === structure} onSelect={() => { onStructure(t); setAllOpen(false); }}>{labelOf(t)}</MenuItem>
              ))}
            </Fragment>
          )) : <p className="px-3 py-1.5 text-caption text-fg-tertiary">No structures defined</p>}
        </Popover>
      </div>

      <div ref={stripRef} role="tablist" aria-label="Structures" onKeyDown={onKeyDown}
        className="no-scrollbar flex h-full min-w-0 flex-1 items-stretch gap-0.5 overflow-x-auto">
        {tabs.length === 0 ? (
          <span className="ps-tab-inset text-caption text-fg-tertiary">No structures defined for this domain</span>
        ) : sections ? sections.map((sec, i) => (
          <Fragment key={sec.kind}>
            {i > 0 && <Pipe className="mx-1.5 self-center" />}
            <SectionLabel kind={sec.kind} id={`structure-section-${sec.kind}`} />
            {sec.tabs.map((t) => tab(t, `structure-section-${sec.kind}`))}
          </Fragment>
        )) : items.map((t, i) => isPipe(t) ? <Pipe key={`p${i}`} className="mx-1" /> : tab(t))}
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

/*
 * Section eyebrow: names what the following tabs are. A child section hangs
 * off the parents with a ↳ so it reads as belonging to them, not beside them.
 * Tabs point at it with aria-describedby, so the role is announced too.
 */
function SectionLabel({ kind, id }: { kind: StructureSection; id: string }) {
  return (
    <span id={id} className={cx(
      "flex shrink-0 items-center gap-1 self-center rounded-chip px-1.5 py-0.5 text-micro font-semibold tracking-label whitespace-nowrap uppercase",
      kind === "child" ? "bg-surface text-fg-secondary ring-1 ring-line-subtle" : "text-fg-tertiary",
    )}>
      {kind === "child" && <CornerDownRight size={10} aria-hidden />}
      {SECTION_LABEL[kind]}
      <span className="sr-only"> structures</span>
    </span>
  );
}

function StructureTab({ name, label, on, onSelect, system, canAuthor, onEdit, onDelete, sectionId }: {
  name: string; label: string; on: boolean; onSelect: () => void; system: boolean;
  canAuthor: boolean; onEdit: () => void; onDelete: () => void; sectionId?: string;
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
        aria-describedby={sectionId}
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
