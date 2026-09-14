import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, ListFilter, Pencil } from "lucide-react";
import type { SavedView } from "../lib/demo-data";
import { cx } from "../lib/cx";

export interface ViewMenuProps {
  /** Saved views for this list. Shown greyed: views apply when viewing, not when assigning. */
  views: SavedView[];
  /** Omit to hide "Manage views…" (host has no view management). */
  onManageViews?: () => void;
}

/**
 * Views filter consumption, never configuration (CH-014). This menu shows the
 * saved views so users learn they exist, states once why they do not apply
 * here, and offers the single door to view management (CH-016/017).
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

  const items = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    items()[0]?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onMenuKeyDown = (e: KeyboardEvent) => {
    const list = items();
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

  const itemClass = "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-start text-ui";

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
        <span className="font-semibold">Master list</span>
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
          className="absolute top-full right-0 z-40 mt-1 min-w-menu rounded-lg bg-surface p-1 shadow-popover"
        >
          <div role="menuitemradio" aria-checked="true" tabIndex={-1}
            onClick={() => close(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); close(true); }
            }}
            className={cx(itemClass, "cursor-pointer font-semibold text-fg-primary hover:bg-hover focus-visible:-outline-offset-2")}>
            <Check size={14} strokeWidth={2} aria-hidden />
            Master list
          </div>

          {views.map((v) => (
            <div key={v.id} role="menuitemradio" aria-checked="false" aria-disabled="true" tabIndex={-1}
              className={cx(itemClass, "cursor-not-allowed ps-8 text-fg-disabled focus-visible:-outline-offset-2")}>
              {v.name}
            </div>
          ))}

          <p id={reasonId} role="none" className="px-2 pt-1 pb-2 ps-8 text-caption text-fg-secondary">
            Views apply when viewing. Assignment always shows every member.
          </p>

          {onManageViews && (
            <>
              <div role="separator" className="-mx-1 my-1 border-t border-line-subtle" />
              <div role="menuitem" tabIndex={-1}
                onClick={() => { close(true); onManageViews(); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); close(true); onManageViews(); }
                }}
                className={cx(itemClass, "cursor-pointer text-fg-primary hover:bg-hover focus-visible:-outline-offset-2")}>
                <Pencil size={14} strokeWidth={1.5} aria-hidden />
                Manage views…
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
