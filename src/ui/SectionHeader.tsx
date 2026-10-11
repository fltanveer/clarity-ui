import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "./cx";

export interface SectionHeaderProps {
  /** Short uppercase label, shown at the end of the band, e.g. "Details". */
  title: string;
  /** Start of the band: what the section is about, e.g. <Badge tone="mode" solid>Dave</Badge>. */
  lead?: ReactNode;
  /** Buttons before the title. */
  actions?: ReactNode;
  /** Pass both to make the section collapsible; the title becomes the toggle. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** id of the content the toggle shows and hides. */
  controls?: string;
  className?: string;
}

/**
 * Mode-tinted band that opens a section of the work area (e.g. a record's
 * Details under a grid). Content left, label right, chevron points down when
 * open and up when collapsed.
 */
export function SectionHeader({ title, lead, actions, collapsed = false, onCollapsedChange, controls, className }: SectionHeaderProps) {
  const label = "text-micro font-semibold tracking-eyebrow text-mode-ink uppercase";
  return (
    <header className={cx("flex shrink-0 items-center gap-2 bg-mode-soft px-3.75 py-2", !collapsed && "border-b border-line-subtle", className)}>
      {lead}
      <span className="ms-auto flex shrink-0 items-center gap-2">
        {actions}
        <h2 className="shrink-0">
          {onCollapsedChange ? (
            <button type="button" aria-expanded={!collapsed} aria-controls={controls} onClick={() => onCollapsedChange(!collapsed)}
              className={cx("flex cursor-pointer items-center gap-1 rounded-chip px-1 hover:bg-hover", label)}>
              {title}
              <ChevronDown size={13} aria-hidden className={cx("transition-transform duration-150 ease-standard", collapsed && "rotate-180")} />
            </button>
          ) : <span className={label}>{title}</span>}
        </h2>
      </span>
    </header>
  );
}
