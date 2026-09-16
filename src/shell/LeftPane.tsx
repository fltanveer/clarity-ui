import { useMemo, useState } from "react";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Layers, Lock, Plus, Search, X } from "lucide-react";
import { MEMBERS, type Member, type MemberView } from "../lib/members";
import { cx } from "../lib/cx";
import { VIEW_SWITCHER_ANCHOR } from "./ViewSwitcher";

export interface LeftPaneProps {
  collapsed: boolean;
  /** Expanded width in px (resizable). */
  width?: number;
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
  collapsed, width, onCollapsed, canAuthor, member, onMember, peek, structure, view, chooserOpen, onChooser,
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
    <aside aria-label="Members" style={width ? { width } : undefined} className="flex w-left-pane shrink-0 flex-col overflow-hidden bg-shell">
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
          View card — two controls, two jobs:
            body   → master-list level: shows the data grid for this model + view
            change → opens the model + view panel beside the pane
          idle   — white card, hairline lift, neutral eyebrow; mode tint only on the icon tile
          hover  — body: a mode-tint wash grows left → right into white (500ms)
          active — the grid is showing this view (no member picked) or its panel is open:
                   the wash holds, the edge takes the mode colour
          open   — as active, and the change button turns solid
        */}
        <div className="px-2 pt-0.5 pb-1.5">
          <div data-active={member === null || chooserOpen ? "" : undefined} className={cx(
            "group/card relative isolate flex items-center gap-1 overflow-hidden rounded-panel border pe-1.5",
            "transition-[background-color,border-color,box-shadow] duration-150 ease-standard",
            member === null || chooserOpen
              ? "border-mode-solid bg-surface bg-linear-to-r from-mode-soft to-surface shadow-lift rtl:bg-linear-to-l"
              : "border-line-strong bg-surface shadow-lift has-[button:hover]:border-line-control-hover",
          )}>
            <button type="button" aria-current={member === null ? "true" : undefined}
              aria-label={`${structure ?? "Structure"}: ${view.name}. Show all members`}
              onClick={() => { onMember(null); onChooser(false); }}
              className="group/body flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-1.5 ps-1.5 text-start">
              {/* Gradients do not interpolate, so the wash is a layer that scales in from the leading edge. */}
              {!(member === null || chooserOpen) && (
                <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 origin-left scale-x-0 bg-linear-to-r from-mode-soft to-surface opacity-0 transition-[scale,opacity] duration-500 ease-standard group-hover/body:scale-x-100 group-hover/body:opacity-100 rtl:origin-right rtl:bg-linear-to-l" />
              )}
              <span aria-hidden className={cx(
                "grid size-8 shrink-0 place-items-center rounded-control transition-[background-color,color] duration-150 ease-standard",
                member === null || chooserOpen ? "bg-surface text-mode-ink" : "bg-mode-soft text-mode-ink group-hover/body:bg-surface",
              )}>
                <Layers size={15} strokeWidth={1.75} />
              </span>
              <span aria-hidden className="min-w-0 flex-1">
                <span className="block truncate text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">{structure}</span>
                <span className="block truncate text-ui font-semibold text-fg-primary">{view.name}</span>
              </span>
            </button>
            <button {...{ [VIEW_SWITCHER_ANCHOR]: "" }} type="button" aria-haspopup="dialog" aria-expanded={chooserOpen}
              aria-label="Change model or view" title="Change model or view"
              onClick={() => onChooser(!chooserOpen)}
              className={cx(
                "grid size-8 shrink-0 cursor-pointer place-items-center rounded-control border transition-[background-color,border-color,color] duration-150 ease-standard",
                /* Prominent at rest (tinted, mode edge) — it is the way to another model or view;
                   solid on hover and while its panel is open. */
                chooserOpen
                  ? "border-mode-solid bg-mode-solid text-fg-on-accent shadow-lift"
                  : "border-mode-solid bg-mode-soft text-mode-ink hover:bg-mode-solid hover:text-fg-on-accent hover:shadow-lift",
              )}>
              <ArrowLeftRight size={15} strokeWidth={2} aria-hidden />
            </button>
          </div>
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
