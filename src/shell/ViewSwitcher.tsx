import { useEffect, useRef, useState } from "react";
import { Boxes, Lock, Search, Settings2 } from "lucide-react";
import { VIEW_SEARCH_MIN, type MemberView } from "../lib/members";
import { isAddToken, isPipe } from "../lib/nav";
import { controlClass } from "../components/ConfigFields";
import { ViewList } from "../components/ViewList";
import { ChromeButton } from "./controls";
import { cx } from "../lib/cx";

/** Marks the control that toggles the switcher, so clicking it is not an outside click. */
export const VIEW_SWITCHER_ANCHOR = "data-view-switcher-anchor";

export interface ViewSwitcherProps {
  open: boolean;
  onClose: () => void;
  structure: string | null;
  /** Structure-bar tokens for the domain: the models to choose from. */
  structureTokens: readonly string[];
  onStructure: (structure: string) => void;
  views: MemberView[];
  activeId: string;
  onActivate: (id: string) => void;
  /** Members that currently exist, for the per-view counts. */
  memberIds: readonly string[];
  /** Managing views is authoring: MODEL / L100 only. DATA picks. */
  canManage: boolean;
  onManage: () => void;
}

/*
 * Model + view picker, docked over the leading edge of the centre — beside the
 * members pane that opened it, from below the centre's first toolbar row (the
 * action toolbar, or member configuration's header) to the structure bar. The
 * parent positions it (relative container). It rises from the members pane, so
 * it casts shadow only to its trailing side; clip-path keeps the top, bottom
 * and leading edges clean against the toolbar and the members pane.
 * Choosing is one click and closes the overlay. Arranging and editing views is
 * deliberately not here: "Manage views" opens the full manager in a modal.
 */
export function ViewSwitcher({
  open, onClose, structure, structureTokens, onStructure, views, activeId, onActivate, memberIds, canManage, onManage,
}: ViewSwitcherProps) {
  const [q, setQ] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => { setQ(""); onClose(); };

  /* Same dismissal contract as every transient surface: Escape (focus back to
     the trigger) and a pointer-down outside. */
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('[aria-current="true"]')?.focus();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (panelRef.current?.contains(t) || t.closest?.(`[${VIEW_SWITCHER_ANCHOR}]`)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
      document.querySelector<HTMLElement>(`[${VIEW_SWITCHER_ANCHOR}]`)?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const models = structureTokens.filter((t) => !isPipe(t) && !isAddToken(t));
  const existing = new Set(memberIds);

  return (
    <div ref={panelRef} role="dialog" aria-label="Choose model and view"
      className="absolute start-0 top-row-toolbar bottom-0 z-30 flex w-80 max-w-full flex-col overflow-hidden border-x border-line-strong bg-surface text-ui text-fg-primary shadow-[16px_0_32px_-12px_oklch(0_0_0/0.18)] [clip-path:inset(0_-3rem_0_0)]">
      {/* One title band (44px, white); the fields below label themselves. */}
      <div className="flex h-row-toolbar shrink-0 items-center border-b border-line-subtle bg-surface px-3">
        <h2 className="text-caption font-semibold tracking-label text-fg-tertiary uppercase">Views</h2>
      </div>
      <div className="shrink-0 border-b border-line-subtle px-3 py-2.5">
        <label htmlFor="view-switcher-model" className="mb-1 block text-caption font-medium text-fg-secondary">Model / Structure</label>
        <div className="relative">
          {/* Locked: the structure tabs below the grid are where the model / structure changes. */}
          <Boxes size={14} aria-hidden className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary" />
          <select id="view-switcher-model" value={structure ?? ""} disabled onChange={(e) => { setQ(""); onStructure(e.target.value); }}
            title="Switch model or structure from the structure tabs"
            className={cx(controlClass, "h-control-form cursor-pointer appearance-none ps-8 pe-8 font-semibold")}>
            {models.map((m) => <option key={m}>{m}</option>)}
          </select>
          <Lock size={12} aria-hidden className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary" />
        </div>
      </div>

      {views.length > VIEW_SEARCH_MIN && (
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
        <ViewList items={views} activeId={activeId} query={q}
          countOf={(v) => v.ids?.filter((id) => existing.has(id)).length}
          onPick={(id) => { onActivate(id); close(); }} />
      </div>

      {canManage && (
        <div className="flex h-12 shrink-0 items-center gap-2 border-t border-line-subtle bg-shell px-3">
          <ChromeButton className="ms-auto" onClick={() => { setQ(""); onManage(); }}>
            <Settings2 size={13} aria-hidden /> Manage views
          </ChromeButton>
        </div>
      )}
    </div>
  );
}
