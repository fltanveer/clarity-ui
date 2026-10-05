import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowLeftRight, ChevronDown, ChevronLeft, ChevronRight, Layers, Lock, Plus, Search, X } from "lucide-react";
import type { Member, MemberView } from "../lib/members";
import type { ModelSelector, ResolvedFrame } from "../lib/fixtures";
import { cx } from "../lib/cx";
import { term } from "../lib/terms";
import { VIEW_SWITCHER_ANCHOR } from "./ViewSwitcher";

export interface LeftPaneProps {
  collapsed: boolean;
  /** Expanded width in px (resizable). */
  width?: number;
  onCollapsed: (c: boolean) => void;
  member: string | null;
  onMember: (id: string | null) => void;
  peek: string | null;
  structure: string | null;
  view: MemberView;
  /** The structure's members; the view picks which show. */
  members: Member[];
  /** The Structure : View chooser in the work area. */
  chooserOpen: boolean;
  onChooser: (open: boolean) => void;

  /** Members deleted this session. */
  hidden?: string[];
  /** Opens the add dialog. */
  onAddMember?: () => void;
  /** Declared add action: null = not offered; disabled is shown with its reason. */
  add: AddAction | null;

  /* ── Resolved-frame structures (fixtures) ── */
  /** Model selector, above the View card. Absent where the frame declares none. */
  modelSelector?: ModelSelector;
  onModel?: (id: string) => void;
  /** The list exactly as resolved (already narrowed by the View); skips the pane's own view filter. */
  listed?: Member[];
  /** Plural business noun for the list's accessible name, e.g. "Companies". */
  listLabel?: string;
  /** Items carry the Model role: a click chooses that Model. */
  onChoose?: (id: string) => void;
  /** The Model already chosen: its row stays highlighted while the grid lists its records. */
  chosen?: string;
  /** Eyebrow over a list of Models, e.g. "Choose a workforce plan". */
  chooseHint?: string;
  emptyMessage?: string;
  /** What the list is, as declared: Model in MODEL mode, Record in DATA; Parent or Child. */
  context?: ResolvedFrame["context"];
  /** What the View card's view is of: the chosen Model once one is chosen, else the structure. */
  viewScope?: string | null;
}

export interface AddAction { label: string; enabled: boolean; reason?: string }

/*
 * Members pane. Two selection states, deliberately distinct:
 *   member (committed) — a click HERE: mode-soft fill + mode bar.
 *   peek   (inspected) — echo of a centre-grid click: neutral fill, no mode colour.
 * The folder row is the active row whenever no member is committed; exactly one
 * row carries the bar, because it answers "where am I".
 */
export function LeftPane({
  collapsed, width, onCollapsed, member, onMember, peek, structure, view, members, chooserOpen, onChooser,
  hidden = [], onAddMember, add, modelSelector, onModel, listed, listLabel, onChoose, chosen, chooseHint, emptyMessage, context, viewScope,
}: LeftPaneProps) {
  const [q, setQ] = useState("");
  /* Search is one icon until asked for; closing it clears the query so nothing stays filtered unseen. */
  const [searching, setSearching] = useState(false);
  const closeSearch = () => { setSearching(false); setQ(""); };
  const shown = useMemo(
    () => (listed ?? members.filter((m) => view.ids.includes(m.id))).filter((m) => !hidden.includes(m.id))
      .filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase())),
    [listed, members, view, q, hidden],
  );
  const addReasonId = "left-pane-add-reason";
  /* A chosen Model narrows the view to that Model: "Workforce USA · Master list", not the structure's. */
  const scope = viewScope ?? structure;

  if (collapsed) {
    const name = members.find((m) => m.id === member)?.name;
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
        <h2 className="min-w-0 flex-1 truncate text-body font-semibold">Members</h2>
        <button type="button" onClick={() => (searching ? closeSearch() : setSearching(true))}
          aria-label="Search members" aria-expanded={searching} aria-controls="left-pane-search"
          className={cx("grid size-7 shrink-0 cursor-pointer place-items-center rounded-control border",
            searching || q ? "border-mode-solid bg-mode-soft text-mode-ink" : "border-line-control bg-surface text-fg-secondary hover:border-line-control-hover hover:text-fg-primary")}>
          <Search size={14} aria-hidden />
        </button>
        {add && onAddMember && (
          /* Disabled stays visible with its reason: the mode disables, it never removes. */
          <button type="button" aria-label={add.label} title={add.enabled ? add.label : `${add.label} — ${add.reason}`}
            aria-haspopup="dialog" disabled={!add.enabled} aria-describedby={add.enabled ? undefined : addReasonId}
            onClick={onAddMember}
            className={cx("grid size-7 shrink-0 place-items-center rounded-control border bg-surface",
              add.enabled ? "cursor-pointer border-line-control text-mode-ink hover:border-mode-solid hover:bg-mode-soft" : "cursor-not-allowed border-line-subtle text-fg-disabled")}>
            <Plus size={15} aria-hidden />
          </button>
        )}
        {add && !add.enabled && add.reason && !onChoose && <span id={addReasonId} className="sr-only">{add.reason}</span>}
        <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-line-subtle" />
        <button type="button" onClick={() => onCollapsed(true)} aria-label="Collapse members"
          className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-control text-fg-tertiary hover:bg-hover hover:text-fg-primary">
          <ChevronLeft size={15} aria-hidden />
        </button>
      </div>

      {searching && (
        <div id="left-pane-search" className="border-b border-line-subtle px-2.5 py-2">
          <label className="flex h-button min-w-0 items-center gap-1.5 rounded-control border border-line-control bg-surface px-2 hover:border-line-control-hover">
            <Search size={12} aria-hidden className="shrink-0 text-fg-tertiary" />
            <span className="sr-only">Search this list</span>
            <input type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
              onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); closeSearch(); } }}
              className="min-w-0 flex-1 bg-transparent text-caption outline-none placeholder:text-fg-tertiary [&::-webkit-search-cancel-button]:hidden" />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Clear search"
                className="grid size-4 shrink-0 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover">
                <X size={10} aria-hidden />
              </button>
            )}
          </label>
        </div>
      )}

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
        {modelSelector && <ModelRow selector={modelSelector} onModel={onModel} context={context} />}
        <div className="px-2 pt-0.5 pb-1.5">
          <div data-active={member === null || chooserOpen ? "" : undefined} className={cx(
            "group/card relative isolate flex items-center gap-1 overflow-hidden rounded-panel border pe-1.5",
            "transition-[background-color,border-color,box-shadow] duration-150 ease-standard",
            member === null || chooserOpen
              ? "border-mode-solid bg-surface bg-linear-to-r from-mode-soft to-surface shadow-lift rtl:bg-linear-to-l"
              : "border-line-strong bg-surface shadow-lift has-[button:hover]:border-line-control-hover",
          )}>
            <button type="button" aria-current={member === null ? "true" : undefined}
              aria-label={`${scope ?? "Structure"}: ${view.name}. Show all members`}
              onClick={() => { onMember(null); onChooser(false); }}
              {...term("View")}
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
                <span className="block truncate text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">{scope}</span>
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

        {/* Choosing a Model happens here: at All Models the list IS the picker, so it says so. */}
        {onChoose && (
          <p id={addReasonId} className="px-3 pt-1 pb-0.5 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">
            {chooseHint ?? add?.reason ?? "Choose a Model"}
          </p>
        )}
        <ul aria-label={`${listLabel ?? "Members"} in ${view.name}`}>
          {shown.map((m: Member) => {
            const on = m.id === member || m.id === chosen;
            const peeked = !on && m.id === peek;
            return (
              <li key={m.id}>
                <button type="button" onClick={() => (onChoose ?? onMember)(m.id)} aria-current={on ? "true" : undefined}
                  className={cx(
                    "flex w-full cursor-pointer items-center gap-1.5 border-s-[3px] py-1.5 ps-6 pe-3 text-start",
                    on ? "border-s-mode-solid bg-mode-soft" : peeked ? "border-s-transparent bg-shell-alt" : "border-s-transparent hover:bg-shell-alt",
                  )}>
                  <span className={cx("min-w-0 flex-1 truncate text-ui", on ? "font-semibold text-mode-ink" : "text-fg-secondary")}>{m.name}</span>
                  {m.locked && <Lock size={11} aria-label="System-defined" className="shrink-0 text-fg-icon" />}
                  {onChoose && <ChevronRight size={13} aria-hidden className="shrink-0 text-fg-icon" />}
                </button>
              </li>
            );
          })}
        </ul>
        {!shown.length && (
          <p className="px-6 py-2 text-caption text-fg-tertiary">
            {q.trim() ? `Nothing matches “${q}”.` : structure ? emptyMessage ?? "Nothing in this view." : "No structures yet."}
          </p>
        )}
      </div>
    </aside>
  );
}

/* "All Models" → "All models": the back link reads as a sentence. */
const sentence = (t: string) => t.charAt(0) + t.slice(1).toLowerCase();

/*
 * Model selector, above the View card. Three states:
 *   one Model     — label and its name as text; nothing to pick.
 *   All Models    — label and the dropdown; the list below is the Models.
 *   Model chosen  — "← All models" takes the label's place, so the way back sits
 *                   exactly where the eye already is; the dropdown switches plans.
 */
function ModelRow({ selector, onModel, context }: { selector: ModelSelector; onModel?: (id: string) => void; context?: ResolvedFrame["context"] }) {
  const eyebrow = <p id="left-pane-model-label" {...term("Model")} className="ps-0.5 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">Model</p>;
  /* Switching mode flips the role in place: the same list reads as Models, then as Records. */
  const chip = context && (
    <span className="shrink-0 rounded-chip bg-mode-soft px-1.5 py-0.5 text-micro font-semibold whitespace-nowrap text-mode-ink">
      <span {...term("Role")}>{context.role}</span> | <span {...term("Structure Type")}>{context.type}</span>
    </span>
  );
  const top = (lead: ReactNode) => <div className="mb-1 flex min-h-5 items-center justify-between gap-2">{lead}{chip}</div>;
  /* One Model: the same dropdown as Workforce, locked to it, so the control never moves between structures. */
  if (selector.kind === "text") {
    return (
      <div className="px-2.5 pt-1.5 pb-2">
        {top(eyebrow)}
        <div className="relative">
          <select aria-label="Model" aria-describedby="left-pane-model-locked" disabled value={selector.label}
            className="h-control-form w-full cursor-not-allowed appearance-none truncate rounded-control border border-line-subtle bg-subtle ps-7 pe-8 text-ui text-fg-disabled opacity-100">
            <option value={selector.label}>{selector.label}</option>
          </select>
          {/* Reads as the Workforce dropdown, switched off: greyed chevron kept, lock says why. */}
          <Lock size={12} aria-hidden className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-fg-disabled" />
          <ChevronDown size={14} aria-hidden className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-fg-disabled" />
          <span id="left-pane-model-locked" className="sr-only">Locked: this structure has only one Model</span>
        </div>
      </div>
    );
  }
  const [all, ...models] = selector.options;
  const chosen = selector.value !== all.id;
  return (
    <div className="px-2.5 pt-1.5 pb-2">
      {top(chosen ? (
        <button type="button" onClick={() => onModel?.(all.id)}
          className="flex cursor-pointer items-center gap-1 rounded-chip ps-0.5 pe-1 text-caption font-medium text-mode-ink hover:underline">
          <ArrowLeft size={13} aria-hidden /> {sentence(all.label)}
        </button>
      ) : eyebrow)}
      <div className="relative">
        <select aria-label="Model" value={selector.value} onChange={(e) => onModel?.(e.target.value)}
          className="h-control-form w-full cursor-pointer appearance-none truncate rounded-control border border-line-control bg-surface ps-2.5 pe-8 text-ui text-fg-primary hover:border-line-control-hover">
          <option value={all.id}>{all.label}</option>
          {models.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} aria-hidden className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary" />
      </div>
    </div>
  );
}
