import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Layers, Lock, Plus, Search, X } from "lucide-react";
import { MEMBERS, type Member, type MemberView } from "../lib/members";
import { cx } from "../lib/cx";
import { VIEW_SWITCHER_ANCHOR } from "./ViewSwitcher";

export interface LeftPaneProps {
  collapsed: boolean;
  onCollapsed: (c: boolean) => void;
  canAuthor: boolean;
  member: string | null;
  onMember: (id: string | null) => void;
  peek: string | null;
  structure: string | null;
  view: MemberView;
  /** The Structure : View chooser in the work area. */
  chooserOpen: boolean;
  onChooser: (open: boolean) => void;

  /** Members deleted this session. */
  hidden?: string[];
}

/*
 * Members pane. Two selection states, deliberately distinct:
 *   member (committed) — a click HERE: mode-soft fill + mode bar.
 *   peek   (inspected) — echo of a centre-grid click: neutral fill, no mode colour.
 * The folder row is the active row whenever no member is committed; exactly one
 * row carries the bar, because it answers "where am I".
 */
export function LeftPane({
  collapsed, onCollapsed, canAuthor, member, onMember, peek, structure, view, chooserOpen, onChooser,
  hidden = [],
}: LeftPaneProps) {
  const [q, setQ] = useState("");
  const shown = useMemo(
    () => MEMBERS.filter((m) => view.ids.includes(m.id) && !hidden.includes(m.id))
      .filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase())),
    [view, q, hidden],
  );

  if (collapsed) {
    const name = MEMBERS.find((m) => m.id === member)?.name;
    return (
      <aside aria-label="Members (collapsed)" onClick={() => onCollapsed(false)}
        className="flex w-left-rail shrink-0 cursor-pointer flex-col items-center gap-2 overflow-hidden bg-shell-alt pt-1.5">
        <button type="button" onClick={(e) => { e.stopPropagation(); onCollapsed(false); }} aria-label="Expand members"
          className="grid h-6 w-6 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover">
          <ChevronRight size={14} aria-hidden />
        </button>
        {/* Text top edge faces the content it labels: left rail reads bottom-to-top. */}
        <span aria-hidden className="flex max-h-[80%] min-h-0 rotate-180 items-center gap-2 text-caption font-semibold tracking-label whitespace-nowrap [writing-mode:vertical-rl]">
          <span className="text-fg-secondary">MEMBERS</span>
          {name && <span className="min-h-0 truncate text-fg-primary">{name}</span>}
        </span>
      </aside>
    );
  }

  return (
    <aside aria-label="Members" className="flex w-left-pane shrink-0 flex-col overflow-hidden bg-shell">
      <div className="flex h-row-toolbar shrink-0 items-center gap-1.5 border-b border-line-subtle bg-shell-alt ps-3 pe-1.5">
        <h2 className="text-caption font-semibold tracking-label text-fg-tertiary uppercase">Members</h2>
        <button type="button" onClick={() => onCollapsed(true)} aria-label="Collapse members"
          className="ms-auto grid size-6 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover">
          <ChevronLeft size={14} aria-hidden />
        </button>
      </div>

      <div className="flex items-center gap-1.5 border-b border-line-subtle px-2.5 py-2">
        <label className="flex h-button min-w-0 flex-1 items-center gap-1.5 rounded-control border border-line-control bg-surface hover:border-line-control-hover px-2">
          <Search size={12} aria-hidden className="shrink-0 text-fg-tertiary" />
          <span className="sr-only">Search members</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members"
            className="min-w-0 flex-1 bg-transparent text-caption outline-none placeholder:text-fg-tertiary [&::-webkit-search-cancel-button]:hidden" />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear member search"
              className="grid size-4 shrink-0 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover">
              <X size={10} aria-hidden />
            </button>
          )}
        </label>
        {canAuthor && (
          <button type="button" aria-label="Add member" title="Add member"
            className="grid size-button shrink-0 cursor-pointer place-items-center rounded-control border border-mode-solid text-mode-ink hover:bg-mode-soft">
            <Plus size={14} aria-hidden />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {/*
          View trigger: which model and view the list shows, and the way to change them.
            idle  — white card on the shell, hairline lift, neutral eyebrow; the mode tint is only on the icon tile
            hover — a mode-tint wash grows left → right into white (slow, 500ms), chevron nudges toward the panel
            open  — mode edge + soft mode fill, solid icon tile, chevron turns back
          Clicking also returns to master-list level.
        */}
        <div className="px-2 pt-0.5 pb-1.5">
          <button {...{ [VIEW_SWITCHER_ANCHOR]: "" }} type="button" aria-haspopup="dialog" aria-expanded={chooserOpen}
            aria-current={member === null ? "true" : undefined}
            aria-label={`${structure ?? "Structure"}: ${view.name}. Choose structure and view`}
            onClick={() => { onMember(null); onChooser(!chooserOpen); }}
            className={cx(
              "group relative isolate flex w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-panel border py-1.5 ps-1.5 pe-2 text-start",
              "transition-[background-color,border-color,box-shadow] duration-150 ease-standard",
              chooserOpen
                ? "border-mode-solid bg-mode-soft"
                : "border-line-strong bg-surface shadow-lift hover:border-line-control-hover",
            )}>
            {/* Gradients do not interpolate, so the wash is a layer that scales in from the leading edge. */}
            {!chooserOpen && (
              <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 origin-left scale-x-0 bg-linear-to-r from-mode-soft to-surface opacity-0 transition-[scale,opacity] duration-500 ease-standard group-hover:scale-x-100 group-hover:opacity-100 rtl:origin-right rtl:bg-linear-to-l" />
            )}
            <span aria-hidden className={cx(
              "grid size-8 shrink-0 place-items-center rounded-control transition-[background-color,color] duration-150 ease-standard",
              chooserOpen ? "bg-mode-solid text-fg-on-accent" : "bg-mode-soft text-mode-ink group-hover:bg-surface",
            )}>
              <Layers size={15} strokeWidth={1.75} />
            </span>
            <span aria-hidden className="min-w-0 flex-1">
              <span className="block truncate text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">{structure}</span>
              <span className={cx("block truncate text-ui font-semibold", chooserOpen ? "text-mode-ink" : "text-fg-primary")}>{view.name}</span>
            </span>
            <ChevronRight size={14} aria-hidden className={cx(
              "shrink-0 transition-[color,translate,rotate] duration-150 ease-standard",
              chooserOpen ? "rotate-180 text-mode-ink" : "text-fg-tertiary group-hover:translate-x-0.5 group-hover:text-fg-secondary",
            )} />
          </button>
        </div>

        <ul aria-label={`Members in ${view.name}`}>
          {shown.map((m: Member) => {
            const on = m.id === member;
            const peeked = !on && m.id === peek;
            return (
              <li key={m.id}>
                <button type="button" onClick={() => onMember(m.id)} aria-current={on ? "true" : undefined}
                  className={cx(
                    "flex w-full cursor-pointer items-center gap-1.5 border-s-[3px] py-1.5 ps-6 pe-3 text-start",
                    on ? "border-s-mode-solid bg-mode-soft" : peeked ? "border-s-transparent bg-shell-alt" : "border-s-transparent hover:bg-shell-alt",
                  )}>
                  <span className={cx("min-w-0 flex-1 truncate text-ui", on ? "font-semibold text-mode-ink" : "text-fg-secondary")}>{m.name}</span>
                  {m.locked && <Lock size={11} aria-label="System-defined" className="shrink-0 text-fg-icon" />}
                </button>
              </li>
            );
          })}
        </ul>
        {!shown.length && <p className="px-6 py-2 text-caption text-fg-tertiary">No members match “{q}”.</p>}
      </div>
    </aside>
  );
}
