import { Ban, Check, Eye, type LucideIcon } from "lucide-react";
import type { AccessLevel as Level } from "../lib/assignment";
import { cx } from "../lib/cx";

interface LevelDef {
  value: Level;
  label: string;
  Icon: LucideIcon;
  active: string;
}

/*
 * Three different SHAPES, so the state reads without colour. "No access" is a
 * ban glyph, not an X: the row's Remove button sits one cell away and is an X.
 */
const LEVELS: LevelDef[] = [
  { value: "none", label: "No access", Icon: Ban, active: "bg-danger-soft text-danger-text" },
  { value: "read", label: "Read only", Icon: Eye, active: "bg-warning-soft text-warning-icon" },
  { value: "write", label: "Allow access", Icon: Check, active: "bg-success-soft text-success-icon" },
];

export interface AccessLevelProps {
  value: Level;
  onChange: (value: Level) => void;
  /** Unique per row: native radios group by name. */
  name: string;
  rowLabel: string;
}

/** Native radio group: arrow keys, one tab stop and checked state come from the platform. */
export function AccessLevel({ value, onChange, name, rowLabel }: AccessLevelProps) {
  return (
    <div role="radiogroup" aria-label={`Access for ${rowLabel}`} className="flex gap-1.5">
      {LEVELS.map(({ value: v, label, Icon, active }) => {
        const on = value === v;
        return (
          <label key={v} title={label} className="relative flex size-control-sm cursor-pointer">
            <input
              type="radio"
              name={name}
              value={v}
              checked={on}
              onChange={() => onChange(v)}
              aria-label={label}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cx(
                "flex size-full items-center justify-center rounded-sm transition-[background-color,color] ease-standard",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-focus",
                on ? active : "text-fg-tertiary hover:bg-hover",
              )}
            >
              <Icon size={14} strokeWidth={on ? 2.5 : 1.5} />
            </span>
          </label>
        );
      })}
    </div>
  );
}
