import { useId } from "react";
import { Check } from "lucide-react";
import { cx } from "../ui";

export interface ColorFieldProps {
  label: string;
  hint: string;
  /** Picked colour, or null for the ClarityOS default. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Colour shown for "Default". */
  defaultColor: string;
  presets: ReadonlyArray<{ name: string; hex: string }>;
  /** The colour actually used after readability checks, when it differs from the pick. */
  adjusted?: string | null;
}

/*
 * One brand slot: Default, a row of presets, and a custom picker. Swatches are
 * a native radio group (arrow keys move, the name is read out); the custom
 * picker is the browser's own colour input.
 */
export function ColorField({ label, hint, value, onChange, defaultColor, presets, adjusted }: ColorFieldProps) {
  const name = useId();
  const custom = value !== null && !presets.some((p) => p.hex === value);
  const swatch = (key: string, hex: string, title: string, checked: boolean, pick: () => void) => (
    <label key={key} title={title} className="relative grid size-7 cursor-pointer place-items-center">
      <input type="radio" name={name} checked={checked} onChange={pick} aria-label={title} className="peer sr-only" />
      <span aria-hidden style={{ background: hex }}
        className={cx("size-6 rounded-full border border-line-strong transition-[scale] ease-standard",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
          checked ? "scale-100 ring-2 ring-fg-primary ring-offset-2 ring-offset-surface" : "scale-90 hover:scale-100")} />
      {checked && <Check size={12} aria-hidden strokeWidth={3} className="pointer-events-none absolute text-fg-on-accent mix-blend-difference" />}
    </label>
  );

  return (
    <div className="border-b border-line-subtle py-3 last:border-b-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-ui font-medium text-fg-primary">{label}</p>
        <code className="font-mono text-caption text-fg-tertiary">{value ?? "Default"}</code>
      </div>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-1">
        {swatch("default", defaultColor, "Default", value === null, () => onChange(null))}
        <span aria-hidden className="mx-1 h-5 w-px bg-line-strong" />
        {presets.filter((p) => p.hex !== defaultColor).map((p) => swatch(p.hex, p.hex, p.name, value === p.hex, () => onChange(p.hex)))}
        <label title="Custom colour"
          className={cx("ms-1 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-2 text-caption",
            custom ? "border-fg-primary text-fg-primary" : "border-line-strong text-fg-secondary hover:bg-hover")}>
          <input type="color" value={value ?? defaultColor} onChange={(e) => onChange(e.target.value.toUpperCase())}
            aria-label={`${label}: custom colour`} className="size-4 cursor-pointer rounded-full border-0 bg-transparent p-0" />
          Custom
        </label>
      </div>
      <p className="mt-1.5 text-caption text-fg-tertiary">
        {adjusted ? <>Adjusted to <code className="font-mono">{adjusted}</code> so text stays readable. </> : null}{hint}
      </p>
    </div>
  );
}
