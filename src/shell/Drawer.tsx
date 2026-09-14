import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "../lib/cx";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}

/*
 * Right-side overlay drawer. Slides in over a scrim; the shell behind is inert
 * while it is open. Escape or a scrim click closes it and focus returns to the
 * control that opened it. Tab stays inside the panel.
 * Entry uses @starting-style, so reduced motion (global 0ms rule) just appears.
 */
export function Drawer({ open, onClose, label, children, className }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const root = document.getElementById("root");
    const wasInert = root?.hasAttribute("inert");
    const opener = document.activeElement as HTMLElement | null;
    root?.setAttribute("inert", "");
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== "Tab") return;
      const f = [...(panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])') ?? [])];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (!wasInert) root?.removeAttribute("inert");
      opener?.focus();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end overscroll-contain">
      <div aria-hidden onClick={onClose}
        className="absolute inset-0 bg-scrim transition-opacity duration-200 ease-standard starting:opacity-0" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}
        className={cx(
          "relative flex h-full w-full max-w-[26rem] flex-col border-s border-line-strong bg-surface text-ui text-fg-primary shadow-popover outline-none",
          "transition-[translate] duration-200 ease-standard starting:translate-x-full",
          className,
        )}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
