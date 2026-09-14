import {
  useCallback, useEffect, useLayoutEffect, useRef, useState,
  type KeyboardEvent, type ReactNode, type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "../lib/cx";

type Placement = "bottom-start" | "bottom-end" | "top-start";

export interface PopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  placement?: Placement;
  children: ReactNode;
  className?: string;
  role?: "menu" | "dialog";
  label?: string;
  /** Focus the first menu item on open (menus). Dialog popovers focus their first input. */
  autoFocus?: boolean;
}

/*
 * SHARED DISMISSAL + FIXED POSITIONING (prototype `useDismiss`, CaretMenu,
 * PovSelect). Every transient surface closes the same ways: Escape (focus
 * returns to the trigger) and a pointer-down outside.
 *
 * Positioned against the viewport from the anchor's rect and portalled to
 * <body>: the domain, POV and structure bars scroll horizontally, and an
 * `overflow` container clips an absolutely positioned child.
 */
export function Popover({
  anchorRef, open, onClose, placement = "bottom-start", children, className,
  role = "menu", label, autoFocus = true,
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);

  const place = useCallback(() => {
    const a = anchorRef.current?.getBoundingClientRect();
    const p = panelRef.current?.getBoundingClientRect();
    if (!a) return;
    const width = p?.width ?? 240;
    const left = placement === "bottom-end"
      ? Math.max(8, a.right - width)
      : Math.min(a.left, window.innerWidth - width - 8);
    setPos(placement === "top-start"
      ? { left, bottom: window.innerHeight - a.top + 4 }
      : { left, top: Math.min(a.bottom + 4, window.innerHeight - (p?.height ?? 0) - 8) });
  }, [anchorRef, placement]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
      anchorRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", place);
    };
  }, [open, onClose, anchorRef, place]);

  useEffect(() => {
    if (!open || !autoFocus) return;
    const first = panelRef.current?.querySelector<HTMLElement>(
      role === "menu" ? '[role^="menuitem"]:not([aria-disabled="true"])' : "input:not(:disabled), select:not(:disabled), textarea, button:not(:disabled), [tabindex='0']");
    first?.focus();
  }, [open, autoFocus, role]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (role !== "menu") return;
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => items[(n + items.length) % items.length]?.focus();
    if (e.key === "ArrowDown") { e.preventDefault(); go(i + 1); }
    if (e.key === "ArrowUp") { e.preventDefault(); go(i - 1); }
    if (e.key === "Home") { e.preventDefault(); go(0); }
    if (e.key === "End") { e.preventDefault(); go(items.length - 1); }
    if (e.key === "Tab") onClose();
  };

  return createPortal(
    <div
      ref={panelRef}
      role={role}
      aria-label={label}
      onKeyDown={onKeyDown}
      style={{ position: "fixed", left: pos?.left ?? -9999, top: pos?.top, bottom: pos?.bottom }}
      className={cx("z-50 rounded-panel border border-line-strong bg-shell text-ui text-fg-primary shadow-popover", className)}
    >
      {children}
    </div>,
    document.body,
  );
}

export function MenuItem({
  children, onSelect, tone = "default", checked, disabled,
}: {
  children: ReactNode;
  onSelect?: () => void;
  tone?: "default" | "danger";
  checked?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role={checked === undefined ? "menuitem" : "menuitemcheckbox"}
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      tabIndex={-1}
      onClick={() => { if (!disabled) onSelect?.(); }}
      className={cx(
        "flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-start text-ui hover:bg-hover",
        tone === "danger" ? "text-danger-text" : "text-fg-primary",
        disabled && "cursor-not-allowed text-fg-disabled hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

export const MenuDivider = () => <div role="separator" className="my-1 h-px bg-line-subtle" />;
