import { forwardRef } from "react";
import { ChevronRight } from "lucide-react";
import { colWidth } from "../components/Grid";
import { cx } from "../lib/cx";

export interface ScopeChipProps {
  rowName: string;
  selected: number;
  total: number;
  active: boolean;
  onToggle: () => void;
}

/**
 * The SOLE switch into and out of member scoping (§6.6). Shows a live count,
 * not a static "Selecting" word. Only the fill marks the active row.
 */
export const ScopeChip = forwardRef<HTMLButtonElement, ScopeChipProps>(function ScopeChip(
  { rowName, selected, total, active, onToggle },
  ref,
) {
  const all = selected === 0;
  const text = all ? `All (${total})` : `${selected} of ${total}`;
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={cx(
        colWidth.members,
        "flex h-control-sm shrink-0 cursor-pointer items-center justify-between gap-1 rounded-md border px-2",
        "text-caption whitespace-nowrap tabular-nums transition-[background-color,color,border-color] ease-standard",
        active
          ? "border-accent-solid bg-accent-solid font-semibold text-fg-on-accent hover:bg-accent-solid-hover"
          : all
            ? "border-line-control text-fg-secondary hover:bg-hover"
            : "border-line-control font-semibold text-fg-primary hover:bg-hover",
      )}
    >
      <span>
        <span className="sr-only">Member scope for {rowName}: </span>
        {text}
      </span>
      <ChevronRight size={12} strokeWidth={active ? 2 : 1.5} aria-hidden />
    </button>
  );
});
