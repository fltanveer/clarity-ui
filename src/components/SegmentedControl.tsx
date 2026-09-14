import { useId } from "react";
import { cx } from "../lib/cx";

export interface SegmentedOption<V extends string> {
  value: V;
  label: string;
}

export interface SegmentedControlProps<V extends string> {
  options: readonly SegmentedOption<V>[];
  value: V;
  onChange: (value: V) => void;
  label: string;
}

/**
 * High-frequency, few-option, mutually exclusive filter. All options visible;
 * one click. Locked 2026-08-21 (docs/decisions.md). Native radios underneath.
 */
export function SegmentedControl<V extends string>({ options, value, onChange, label }: SegmentedControlProps<V>) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex h-control shrink-0 overflow-hidden rounded-md border border-line-control"
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <label key={o.value} className={cx("relative flex", i > 0 && "border-l border-line-control")}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={on}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span
              className={cx(
                "flex cursor-pointer items-center px-2.5 text-ui whitespace-nowrap transition-[background-color,color] ease-standard",
                "peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus",
                on ? "bg-inverse font-semibold text-fg-on-inverse" : "text-fg-secondary hover:bg-hover",
              )}
            >
              {o.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
