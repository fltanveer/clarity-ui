import type { ReactNode } from "react";
import { X } from "lucide-react";

export interface ToastRegionProps {
  /** Rendered message; null keeps the (empty) live region mounted so updates announce. */
  message: ReactNode | null;
  action?: { label: string; onClick: () => void };
  onDismiss: () => void;
}

/**
 * Polite live region. A toast that carries an action stays until dismissed —
 * no timer, so Undo cannot vanish while someone is reaching for it.
 */
export function ToastRegion({ message, action, onDismiss }: ToastRegionProps) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center">
      {message && (
        <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-lg bg-inverse py-1.5 ps-3 pe-1.5 text-ui text-fg-on-inverse shadow-popover [&_:focus-visible]:outline-fg-on-inverse">
          <span className="min-w-0">{message}</span>
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="h-control-sm cursor-pointer rounded-sm px-2 font-semibold underline underline-offset-2 hover:no-underline"
            >
              {action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismiss}
            className="flex size-control-sm cursor-pointer items-center justify-center rounded-sm"
          >
            <X size={14} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
