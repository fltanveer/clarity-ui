import { forwardRef, useEffect, useId, useImperativeHandle, useRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "./cx";

/* ── Checkbox ─────────────────────────────────────────────────────────────── */

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Text beside the box; the whole row becomes the hit area. Omit for a bare box (then give aria-label). */
  label?: ReactNode;
  /** "Some selected" — for a select-all box. */
  indeterminate?: boolean;
}

/** Native checkbox in the mode colour. Use for inclusion (in / out), never for a setting that acts at once. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, indeterminate = false, className, disabled, ...rest }, ref,
) {
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inner.current!);
  useEffect(() => { if (inner.current) inner.current.indeterminate = indeterminate; }, [indeterminate]);
  const box = (
    <input ref={inner} type="checkbox" disabled={disabled} {...rest}
      className={cx("m-0 size-4 shrink-0 cursor-pointer accent-mode-solid disabled:cursor-not-allowed", !label && className)} />
  );
  if (!label) return box;
  return (
    <label className={cx("inline-flex cursor-pointer items-center gap-2 text-ui text-fg-primary", disabled && "cursor-not-allowed text-fg-disabled", className)}>
      {box}{label}
    </label>
  );
});

/* ── Switch ───────────────────────────────────────────────────────────────── */

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible text. Without it, pass aria-label. */
  label?: ReactNode;
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
}

/** A setting that takes effect immediately. State reads from thumb position and fill, not colour alone. */
export function Switch({ checked, onChange, label, disabled, className, ...aria }: SwitchProps) {
  const id = useId();
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <button type="button" role="switch" aria-checked={checked} aria-labelledby={label ? id : undefined}
        aria-label={label ? undefined : aria["aria-label"]} disabled={disabled} onClick={() => onChange(!checked)}
        className="group inline-flex h-control-sm cursor-pointer items-center disabled:cursor-not-allowed">
        <span aria-hidden className={cx("relative h-4 w-7 rounded-full transition-[background-color] ease-standard group-disabled:opacity-50",
          checked ? "bg-mode-solid" : "bg-control-track")}>
          <span className={cx("absolute top-0.5 left-0.5 size-3 rounded-full bg-control-thumb shadow-thumb transition-transform ease-standard",
            checked && "translate-x-3")} />
        </span>
      </button>
      {label && <span id={id} onClick={() => !disabled && onChange(!checked)}
        className={cx("cursor-pointer text-ui", disabled ? "text-fg-disabled" : "text-fg-primary")}>{label}</span>}
    </span>
  );
}

/* ── Segmented ────────────────────────────────────────────────────────────── */

export interface SegmentedProps<V extends string> {
  options: ReadonlyArray<{ value: V; label: string }>;
  value: V;
  onChange: (value: V) => void;
  /** Accessible name of the group. */
  label: string;
  className?: string;
}

/** 2–4 mutually exclusive options, all visible, one click. Native radios underneath. */
export function Segmented<V extends string>({ options, value, onChange, label, className }: SegmentedProps<V>) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label}
      className={cx("inline-flex h-button shrink-0 overflow-hidden rounded-control border border-line-strong bg-surface", className)}>
      {options.map((o, i) => (
        <label key={o.value} className={cx("relative flex", i > 0 && "border-s border-line-strong")}>
          <input type="radio" name={name} value={o.value} checked={o.value === value} onChange={() => onChange(o.value)} className="peer sr-only" />
          <span className={cx(
            "flex cursor-pointer items-center px-2.5 text-caption whitespace-nowrap transition-[background-color,color] ease-standard",
            "peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus",
            o.value === value ? "bg-mode-solid font-semibold text-fg-on-accent" : "text-fg-secondary hover:bg-hover",
          )}>{o.label}</span>
        </label>
      ))}
    </div>
  );
}
