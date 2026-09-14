import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ChromeButton } from "./controls";
import { cx } from "../lib/cx";

export interface DialogProps {
  title: string;
  /** One line under the title: what this dialog acts on. */
  subtitle?: ReactNode;
  icon?: ReactNode;
  /** alertdialog for destructive confirmations. */
  role?: "dialog" | "alertdialog";
  onClose: () => void;
  /** When set, body + footer are a form: Enter submits. */
  onSubmit?: () => void;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
}

/*
 * Modal shell shared by edit and confirm flows. The shell behind is inert while
 * open (preserving an inert state a surface below already set), focus starts on
 * the first field, Tab stays inside, Escape closes, and focus returns to the
 * control that opened it.
 */
export function Dialog({ title, subtitle, icon, role = "dialog", onClose, onSubmit, children, footer, className }: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const root = document.getElementById("root");
    const wasInert = root?.hasAttribute("inert");
    const opener = document.activeElement as HTMLElement | null;
    root?.setAttribute("inert", "");
    const first = panelRef.current?.querySelector<HTMLElement>("input:not(:disabled), textarea:not(:disabled), select:not(:disabled)")
      ?? panelRef.current?.querySelector<HTMLElement>("footer button:not(:disabled)");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== "Tab") return;
      const f = [...(panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [href]') ?? [])];
      if (!f.length) return;
      const firstEl = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (!wasInert) root?.removeAttribute("inert");
      opener?.focus();
    };
  }, []);

  const body = (
    <>
      <div className="px-5 py-4">{children}</div>
      <footer className="flex items-center justify-end gap-2 border-t border-line-subtle bg-shell px-5 py-3">{footer}</footer>
    </>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center overscroll-contain bg-scrim p-4">
      <div ref={panelRef} role={role} aria-modal="true" aria-labelledby={titleId}
        className={cx(
          "flex max-h-full w-full max-w-[32rem] flex-col overflow-hidden rounded-panel border border-line-strong bg-surface text-ui text-fg-primary shadow-popover",
          "transition-[scale,opacity] duration-150 ease-standard starting:scale-[0.98] starting:opacity-0",
          className,
        )}>
        <header className="flex shrink-0 items-start gap-3 border-b border-line-subtle px-5 py-4">
          {icon}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-title font-semibold text-balance">{title}</h2>
            {subtitle && <p className="mt-0.5 text-caption text-fg-tertiary">{subtitle}</p>}
          </div>
          <ChromeButton variant="icon" className="-me-1 size-8" onClick={onClose} aria-label="Close dialog">
            <X size={16} aria-hidden />
          </ChromeButton>
        </header>
        {onSubmit ? (
          <form noValidate className="flex min-h-0 flex-col overflow-auto"
            onSubmit={(e: FormEvent) => { e.preventDefault(); onSubmit(); }}>
            {body}
          </form>
        ) : body}
      </div>
    </div>,
    document.body,
  );
}

/* Solid destructive action; the only red fill in a dialog. */
export const dangerButtonClass =
  "inline-flex h-control-h shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control bg-danger-solid px-3 text-caption font-semibold text-fg-on-danger hover:bg-danger-solid-hover " +
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-danger-solid";
