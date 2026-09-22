import { useId, useRef, useState } from "react";
import { Boxes, ChevronDown, Layers, Lock, Search, Settings2 } from "lucide-react";
import { Popover } from "../shell/Popover";
import { ChromeButton } from "../shell/controls";
import { VIEW_SEARCH_MIN } from "../lib/members";
import { controlClass } from "./ConfigFields";
import { ViewList, type ViewListItem } from "./ViewList";
import { cx } from "../lib/cx";

export interface ViewByProps {
  structures: readonly string[];
  structure: string;
  onStructure: (value: string) => void;
  /** View names, or full view items (folder, kind, count) to render them like the members view panel. */
  views: readonly (string | ViewListItem)[];
  /** Current view: its name for string views, its id for items. */
  view: string;
  onView: (value: string) => void;
  /** Locked structure is disabled with a lock and a visible reason — never hidden (B10). */
  lockedReason?: string;
  countOf?: (item: ViewListItem) => number | undefined;
  /** Omit to hide "Manage views" (host has no view management, or the user may not author). */
  onManageViews?: () => void;
}

/*
 * "View by [Structure] : [View]" (Spec §6.1), compact: one button in the pane's
 * title band showing both current values. It opens the same panel the members
 * pane uses — Model / Structure, search, then the grouped view list — so a view
 * is picked the same way everywhere.
 */
export function ViewBy({ structures, structure, onStructure, views, view, onView, lockedReason, countOf, onManageViews }: ViewByProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLButtonElement>(null);
  const structureId = useId();
  const locked = Boolean(lockedReason);
  /* String views become unfiled items; the first is the structure's full list. */
  const items: ViewListItem[] = views.map((v, i) =>
    typeof v === "string" ? { id: v, name: v, folder: null, system: i === 0, kind: "rule" } : v);
  const current = items.find((v) => v.id === view) ?? items[0];
  const close = () => { setOpen(false); setQ(""); };

  return (
    <>
      <button ref={ref} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => (open ? close() : setOpen(true))}
        aria-label={`View by ${structure}, ${current?.name ?? view}${locked ? ", structure locked" : ""}`}
        className="flex h-control min-w-0 max-w-60 cursor-pointer items-center gap-1.5 rounded-control px-2 text-ui hover:bg-hover aria-expanded:bg-hover">
        <Layers size={13} strokeWidth={1.5} aria-hidden className="shrink-0 text-fg-tertiary" />
        <span aria-hidden className="min-w-0 truncate">
          <span className="text-fg-secondary">{structure}</span>
          <span className="text-fg-tertiary"> · </span>
          <span className="font-semibold text-accent-text">{current?.name ?? view}</span>
        </span>
        {locked && <Lock size={11} strokeWidth={1.5} aria-hidden className="shrink-0 text-fg-tertiary" />}
        <ChevronDown size={13} aria-hidden className="shrink-0 text-fg-tertiary" />
      </button>
      <Popover anchorRef={ref} open={open} onClose={close} role="dialog" label="View by"
        placement="bottom-end" className="flex max-h-[min(32rem,calc(100vh-8rem))] w-80 flex-col overflow-hidden bg-surface">
        {/* One title band, as in the members view panel; the fields below label themselves. */}
        <div className="flex h-row-toolbar shrink-0 items-center border-b border-line-subtle bg-surface px-3">
          <h3 className="text-caption font-semibold tracking-label text-fg-tertiary uppercase">Views</h3>
        </div>
        <div className="shrink-0 border-b border-line-subtle px-3 py-2.5">
          <label htmlFor={structureId} className="mb-1 block text-caption font-medium text-fg-secondary">Model / Structure</label>
          <div className="relative">
            {/* Always locked here, as in the members view panel: structure changes from the structure tabs. */}
            <Boxes size={14} aria-hidden className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary" />
            <select id={structureId} value={structure} onChange={(e) => onStructure(e.target.value)} disabled
              title={lockedReason ?? "Switch model or structure from the structure tabs"}
              className={cx(controlClass, "h-control-form cursor-pointer appearance-none ps-8 pe-8 font-semibold")}>
              {structures.map((s) => <option key={s}>{s}</option>)}
            </select>
            <Lock size={12} aria-hidden className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary" />
          </div>
        </div>

        {items.length > VIEW_SEARCH_MIN && (
          <div className="shrink-0 border-b border-line-subtle px-3 py-2.5">
            <label className="flex h-control-form items-center gap-1.5 rounded-control border border-line-control bg-surface px-2.5 hover:border-line-control-hover">
              <Search size={13} aria-hidden className="shrink-0 text-fg-tertiary" />
              <span className="sr-only">Search views</span>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search views"
                className="min-w-0 flex-1 bg-transparent text-ui outline-none placeholder:text-fg-tertiary [&::-webkit-search-cancel-button]:hidden" />
            </label>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto py-1.5">
          <ViewList items={items} activeId={current?.id ?? view} query={q} countOf={countOf}
            onPick={(id) => { onView(id); close(); ref.current?.focus(); }} />
        </div>

        {/* Same single door to view management as the members view panel. */}
        {onManageViews && (
          <div className="flex h-12 shrink-0 items-center border-t border-line-subtle bg-shell px-3">
            <ChromeButton className="ms-auto" onClick={() => { close(); onManageViews(); }}>
              <Settings2 size={13} aria-hidden /> Manage views
            </ChromeButton>
          </div>
        )}
      </Popover>
    </>
  );
}
