import { useEffect, useRef, type InputHTMLAttributes } from "react";
import { cx } from "../lib/cx";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  indeterminate?: boolean;
}

/** Native checkbox, tinted with the accent role. Wrap in a <label> for a shared hit area. */
export function Checkbox({ indeterminate = false, className, ...rest }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cx("m-0 size-4 cursor-pointer accent-accent-solid disabled:cursor-not-allowed", className)}
      {...rest}
    />
  );
}

export interface SelectAllProps {
  total: number;
  selected: number;
  onChange: (selectAll: boolean) => void;
  label: string;
}

/** Tri-state select-all for a column header (Spec R1). */
export function SelectAll({ total, selected, onChange, label }: SelectAllProps) {
  const all = total > 0 && selected === total;
  return (
    <span className="flex size-control-sm items-center justify-center">
      <Checkbox
        checked={all}
        indeterminate={selected > 0 && !all}
        disabled={total === 0}
        onChange={() => onChange(!all)}
        aria-label={label}
      />
    </span>
  );
}
