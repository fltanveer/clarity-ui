import { Minimize2 } from "lucide-react";

/* Row 6 · status channel: save state, selection aggregates, build. */
export function Footer() {
  return (
    <footer className="flex h-row-footer shrink-0 items-center gap-3.5 border-t border-line-subtle bg-shell-alt px-edge text-caption text-fg-tertiary tabular-nums">
      <span role="status">All changes saved · 14:22</span>
      <span>No range selected</span>
      <span className="ms-auto">© BudgetNOW Inc. 2020–2026</span>
      <span>V.4.13 | Build 2026-08-18</span>
    </footer>
  );
}

/*
 * A collapsed thing carries its own way back. With both toolbars folded this
 * is the only control that restores them, so it takes the mode colour rather
 * than a grey glyph.
 */
export function CollapsedChromeStrip({ label, path, onRestore }: { label: string; path: string; onRestore: () => void }) {
  return (
    <div className="flex h-[1.375rem] shrink-0 items-center gap-2 border-b-2 border-mode-solid bg-shell px-edge text-caption text-fg-tertiary">
      <span className="font-semibold text-mode-ink">{label}</span>
      <span aria-hidden className="text-fg-icon">›</span>
      <span className="truncate">{path}</span>
      <button type="button" onClick={onRestore} aria-label="Restore toolbars" aria-keyshortcuts="Control+Shift+F"
        title="Restore toolbars (Ctrl+Shift+F)"
        className="ms-auto flex h-[1.125rem] shrink-0 cursor-pointer items-center gap-1 rounded-control border border-mode-solid px-1.5 text-caption font-semibold whitespace-nowrap text-mode-ink hover:bg-mode-soft">
        <Minimize2 size={11} aria-hidden /> Restore
      </button>
    </div>
  );
}

/* Honest stub: an undesigned workspace says so instead of borrowing another screen. */
export function WorkspaceStub({ name }: { name: string }) {
  return (
    <div className="grid flex-1 place-items-center bg-grid-container px-6">
      <div className="max-w-95 text-center">
        <p className="mb-1.5 text-title font-semibold text-fg-secondary">{name}</p>
        <p className="text-ui leading-body text-fg-tertiary">
          This workspace isn’t designed yet. The shell, navigation and chrome around it are real; the work surface is not.
        </p>
      </div>
    </div>
  );
}
