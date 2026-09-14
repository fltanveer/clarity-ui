import { useId, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cx } from "../lib/cx";

/* Inputs are 16px below `sm` so iOS Safari does not zoom, 13px from `sm` up. */
const fieldBase =
  "h-control rounded-md border border-line-control bg-surface hover:border-line-control-hover px-2 text-fg-primary text-input-mobile sm:text-ui " +
  "placeholder:text-fg-tertiary disabled:cursor-not-allowed disabled:text-fg-disabled";

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function SearchField({ value, onChange, label, className, ...rest }: SearchFieldProps) {
  const id = useId();
  return (
    <div className={cx("relative flex min-w-24 flex-1", className)}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <Search
        size={14}
        strokeWidth={1.5}
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-fg-tertiary"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        className={cx(fieldBase, "w-full ps-7")}
        {...rest}
      />
    </div>
  );
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

export function TextField({ value, onChange, className, ...rest }: TextFieldProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cx(fieldBase, "tabular-nums", className)}
      {...rest}
    />
  );
}

export interface InlineSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  tone?: "default" | "accent";
}

/** Borderless native select for inline "Structure : View" phrases. */
export function InlineSelect({ value, onChange, options, tone = "default", className, ...rest }: InlineSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        "h-control-sm max-w-full min-w-0 cursor-pointer truncate rounded-sm bg-transparent px-1 font-semibold",
        "text-input-mobile sm:text-ui hover:bg-hover",
        "disabled:cursor-not-allowed disabled:text-fg-secondary disabled:hover:bg-transparent",
        tone === "accent" ? "text-accent-text" : "text-fg-primary",
        className,
      )}
      {...rest}
    >
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}
