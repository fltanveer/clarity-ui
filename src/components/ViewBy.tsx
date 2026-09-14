import { useId, useRef, useState } from "react";
import { ChevronDown, Layers, Lock } from "lucide-react";
import { Popover } from "../shell/Popover";

export interface ViewByProps {
  structures: readonly string[];
  structure: string;
  onStructure: (value: string) => void;
  views: readonly string[];
  view: string;
  onView: (value: string) => void;
  /** Locked structure is disabled with a lock and a visible reason — never hidden (B10). */
  lockedReason?: string;
}

/*
 * "View by [Structure] : [View]" (Spec §6.1), compact: one button in the pane's
 * title band showing both current values, opening a small panel with the two
 * choices. A narrow tool pane cannot fit two inline selects plus a filter row,
 * and the panel has room to state the lock reason in words, not only a tooltip.
 */
export function ViewBy({ structures, structure, onStructure, views, view, onView, lockedReason }: ViewByProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const structureId = useId();
  const viewId = useId();
  const reasonId = useId();
  const locked = Boolean(lockedReason);
  const selectClass = "h-control w-full cursor-pointer rounded-control border border-line-control bg-surface px-2 text-ui hover:border-line-control-hover disabled:cursor-not-allowed disabled:bg-shell-alt disabled:text-fg-secondary";

  return (
    <>
      <button ref={ref} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        aria-label={`View by ${structure}, ${view}${locked ? ", structure locked" : ""}`}
        className="flex h-control min-w-0 max-w-60 cursor-pointer items-center gap-1.5 rounded-control px-2 text-ui hover:bg-hover aria-expanded:bg-hover">
        <Layers size={13} strokeWidth={1.5} aria-hidden className="shrink-0 text-fg-tertiary" />
        <span aria-hidden className="min-w-0 truncate">
          <span className="text-fg-secondary">{structure}</span>
          <span className="text-fg-tertiary"> · </span>
          <span className="font-semibold text-accent-text">{view}</span>
        </span>
        {locked && <Lock size={11} strokeWidth={1.5} aria-hidden className="shrink-0 text-fg-tertiary" />}
        <ChevronDown size={13} aria-hidden className="shrink-0 text-fg-tertiary" />
      </button>
      <Popover anchorRef={ref} open={open} onClose={() => setOpen(false)} role="dialog" label="View by"
        placement="bottom-end" className="flex w-64 flex-col gap-3 bg-surface p-3">
        <div>
          <label htmlFor={structureId} className="mb-1 block text-caption font-semibold text-fg-secondary">Structure</label>
          <select id={structureId} value={structure} onChange={(e) => onStructure(e.target.value)} disabled={locked}
            aria-describedby={locked ? reasonId : undefined} className={selectClass}>
            {structures.map((s) => <option key={s}>{s}</option>)}
          </select>
          {locked && (
            <p id={reasonId} className="mt-1 flex items-start gap-1 text-caption text-fg-tertiary">
              <Lock size={11} aria-hidden className="mt-0.5 shrink-0" /> {lockedReason}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={viewId} className="mb-1 block text-caption font-semibold text-fg-secondary">View</label>
          <select id={viewId} value={view} onChange={(e) => onView(e.target.value)} className={selectClass}>
            {views.map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>
      </Popover>
    </>
  );
}
