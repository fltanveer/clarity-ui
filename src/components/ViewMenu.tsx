import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Info, ListFilter, Settings2 } from "lucide-react";
import { ViewList, type ViewListItem } from "./ViewList";

export interface ViewMenuProps {
  /** Views for this list, rendered like the members view panel. Only the full list applies while assigning. */
  views: readonly ViewListItem[];
  /** Omit to hide "Manage views" (host has no view management). */
  onManageViews?: () => void;
}

/**
 * Views filter consumption, never configuration (CH-014). The menu shows the
 * same grouped view list as the members view panel so users recognise their
 * views, keeps every view but the full list unavailable (assignment always
 * shows every member), says why once, and offers the single door to view
 * management (CH-016/017).
 *
 * Keyboard (APG menu button): Enter/Space/↓ open and focus the first item,
 * ↑/↓ move, Home/End jump, Escape or Tab close, focus returns to the trigger.
 */
export function ViewMenu({ views, onManageViews }: ViewMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const reasonId = useId();

  /* The structure's full list is the one view assignment uses; add it if the host list lacks it. */
  const master = views.find((v) => v.system) ?? { id: "master", name: "Master list", system: true };
  const items = views.some((v) => v.system) ? views : [master, ...views];

  const menuItems = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    menuItems()[0]?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onMenuKeyDown = (e: KeyboardEvent) => {
    const list = menuItems();
    const i = list.indexOf(document.activeElement as HTMLElement);
    const focus = (n: number) => list[(n + list.length) % list.length]?.focus();
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); focus(i + 1); break;
      case "ArrowUp": e.preventDefault(); focus(i - 1); break;
      case "Home": e.preventDefault(); focus(0); break;
      case "End": e.preventDefault(); focus(list.length - 1); break;
      case "Escape": e.preventDefault(); close(true); break;
      case "Tab": close(false); break;
    }
  };

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) { e.preventDefault(); setOpen(true); }
        }}
        className="inline-flex h-control cursor-pointer items-center gap-1.5 rounded-md border border-line-control bg-surface px-2 text-ui text-fg-primary hover:bg-hover"
      >
        <ListFilter size={14} strokeWidth={1.5} aria-hidden className="text-fg-tertiary" />
        <span className="sr-only">View: </span>
        <span className="font-semibold">{master.name}</span>
        <ChevronDown size={14} strokeWidth={1.5} aria-hidden className="text-fg-tertiary" />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Views"
          aria-describedby={reasonId}
          onKeyDown={onMenuKeyDown}
          className="absolute top-full right-0 z-40 mt-1 flex w-80 flex-col overflow-hidden rounded-panel border border-line-strong bg-surface text-ui shadow-popover"
        >
          {/* One title band, as in the members view panel: 44px white band, caption, hairline. */}
          <div role="none" className="flex h-row-toolbar shrink-0 items-center border-b border-line-subtle bg-surface px-3">
            <span className="text-caption font-semibold tracking-label text-fg-tertiary uppercase">Views</span>
          </div>
          <div className="max-h-[min(28rem,60vh)] overflow-y-auto py-1.5">
            <ViewList items={items} activeId={master.id} itemRole="menuitemradio"
              isDisabled={(v) => v.id !== master.id} onPick={() => close(true)} />
          </div>

          <p id={reasonId} role="none" className="flex items-start gap-1.5 border-t border-line-subtle bg-shell px-3 py-2 text-caption leading-body text-fg-secondary">
            <Info size={12} aria-hidden className="mt-0.5 shrink-0 text-fg-tertiary" />
            Views apply when viewing. Assignment always shows every member.
          </p>

          {onManageViews && (
            <div role="none" className="flex border-t border-line-subtle bg-shell px-3 py-2">
              <button type="button" role="menuitem" tabIndex={-1}
                onClick={() => { close(true); onManageViews(); }}
                className="ms-auto inline-flex h-button cursor-pointer items-center gap-1.5 rounded-control border border-line-strong bg-surface px-2.5 text-caption text-fg-secondary hover:bg-hover hover:text-fg-primary focus-visible:-outline-offset-2">
                <Settings2 size={13} aria-hidden /> Manage views
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
