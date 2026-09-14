import { useEffect, useRef, useState } from "react";
import { Boxes, Check, ChevronDown, Filter, Folder, ListChecks, Lock, Search, Settings2 } from "lucide-react";
import { VIEW_SEARCH_MIN, type MemberView } from "../lib/members";
import { isAddToken, isPipe } from "../lib/nav";
import { controlClass } from "../components/ConfigFields";
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
 * Model + view picker, docked over the leading edge of the work area — beside
 * the members pane that opened it, from below the action toolbar to the
 * structure bar. The parent positions it (relative container).
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
  const query = q.trim().toLowerCase();
  const models = structureTokens.filter((t) => !isPipe(t) && !isAddToken(t));
  const existing = new Set(memberIds);
  const folders = [...new Set(views.map((v) => v.folder).filter(Boolean) as string[])];
  const groups = [
    { folder: null as string | null, items: views.filter((v) => !v.folder) },
    ...folders.map((f) => ({ folder: f as string | null, items: views.filter((v) => v.folder === f) })),
  ].map((g) => ({ ...g, items: g.items.filter((v) => v.name.toLowerCase().includes(query)) }))
    .filter((g) => g.items.length);

  return (
    <div ref={panelRef} role="dialog" aria-label="Choose model and view"
      className="absolute inset-y-0 start-0 z-30 flex w-80 max-w-full flex-col overflow-hidden border-e border-line-strong bg-surface text-ui text-fg-primary shadow-popover">
      <div className="flex shrink-0 flex-col gap-2 border-b border-line-subtle p-3">
        <div>
          <label htmlFor="view-switcher-model" className="mb-1 block text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">Model</label>
          <div className="relative">
            <Boxes size={14} aria-hidden className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-mode-ink" />
            <select id="view-switcher-model" value={structure ?? ""} onChange={(e) => { setQ(""); onStructure(e.target.value); }}
              className={cx(controlClass, "h-control-form cursor-pointer appearance-none ps-8 pe-8 font-semibold")}>
              {models.map((m) => <option key={m}>{m}</option>)}
            </select>
            <ChevronDown size={14} aria-hidden className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary" />
          </div>
        </div>
        {views.length > VIEW_SEARCH_MIN && (
          <label className="flex h-control-form items-center gap-1.5 rounded-control border border-line-control bg-surface px-2.5 hover:border-line-control-hover">
            <Search size={13} aria-hidden className="shrink-0 text-fg-tertiary" />
            <span className="sr-only">Search views</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search views"
              className="min-w-0 flex-1 bg-transparent text-ui outline-none placeholder:text-fg-tertiary [&::-webkit-search-cancel-button]:hidden" />
          </label>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1.5">
        <p className="px-3 pt-1 pb-1 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">View</p>
        {groups.map((g) => (
          <div key={g.folder ?? "__unfiled"} role="group" aria-label={g.folder ?? "Unfiled"}>
            {g.folder && (
              <p className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-caption font-semibold tracking-label text-fg-secondary uppercase">
                <Folder size={12} aria-hidden className="shrink-0 text-fg-tertiary" /> {g.folder}
              </p>
            )}
            <ul>
              {g.items.map((v) => {
                const on = v.id === activeId;
                const KindIcon = v.system ? Lock : v.kind === "rule" ? Filter : ListChecks;
                const count = v.ids.filter((id) => existing.has(id)).length;
                return (
                  <li key={v.id}>
                    <button type="button" aria-current={on ? "true" : undefined}
                      onClick={() => { onActivate(v.id); close(); }}
                      className={cx("flex h-9 w-full cursor-pointer items-center gap-2 pe-3 text-start",
                        g.folder ? "ps-8" : "ps-3", on ? "bg-mode-soft" : "hover:bg-hover")}>
                      <KindIcon size={13} aria-hidden className={cx("shrink-0", on ? "text-mode-ink" : "text-fg-tertiary")} />
                      <span className={cx("min-w-0 flex-1 truncate text-ui", on ? "font-semibold text-mode-ink" : "text-fg-primary")}>{v.name}</span>
                      <span className="shrink-0 text-caption text-fg-tertiary tabular-nums">{count}<span className="sr-only"> members</span></span>
                      <span className="flex w-4 shrink-0 justify-center text-mode-ink">{on && <Check size={14} aria-hidden />}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {!groups.length && (
          <p className="px-3 py-3 text-ui text-fg-tertiary">
            No views match “{q}”.{" "}
            <button type="button" onClick={() => setQ("")} className="cursor-pointer font-semibold text-mode-ink underline">Clear search</button>
          </p>
        )}
      </div>

      <div className="flex h-12 shrink-0 items-center gap-2 border-t border-line-subtle bg-shell px-3">
        <span className="text-caption text-fg-tertiary">{views.length} {views.length === 1 ? "view" : "views"}</span>
        {canManage && (
          <ChromeButton className="ms-auto" onClick={() => { setQ(""); onManage(); }}>
            <Settings2 size={13} aria-hidden /> Manage views
          </ChromeButton>
        )}
      </div>
    </div>
  );
}
