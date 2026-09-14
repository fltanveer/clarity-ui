import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CircleAlert } from "lucide-react";
import { ChromeButton } from "./controls";

export interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/*
 * Destructive confirm. States blast radius in numbers; the confirm button
 * repeats the consequence. Focus starts on Cancel, the background is inert,
 * Escape cancels, and focus returns to whatever opened it.
 */
export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.getElementById("root");
    /* A modal underneath may already hold the background inert; leave it that way. */
    const wasInert = root?.hasAttribute("inert");
    root?.setAttribute("inert", "");
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onCancel(); }
      if (e.key === "Tab") {
        const f = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!f?.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (!wasInert) root?.removeAttribute("inert");
      opener?.focus();
    };
  }, [onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center overscroll-contain bg-scrim p-4">
      <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body"
        className="w-full max-w-100 rounded-panel border border-line-strong bg-surface p-4 shadow-popover">
        <h2 id="confirm-title" className="mb-1.5 flex items-center gap-2 text-body font-semibold">
          <CircleAlert size={16} aria-hidden className="text-danger-text" /> {title}
        </h2>
        <p id="confirm-body" className="mb-4 text-ui leading-body text-fg-secondary">{children}</p>
        <div className="flex justify-end gap-2">
          <ChromeButton ref={cancelRef} onClick={onCancel}>Cancel</ChromeButton>
          <button type="button" onClick={onConfirm}
            className="h-control-h cursor-pointer rounded-control bg-danger-solid px-3 text-caption font-semibold text-fg-on-danger hover:bg-danger-solid-hover">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
