import { cx } from "../lib/cx";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name. Describe the ON state ("Drill-down for Acme UK"). */
  label: string;
  disabled?: boolean;
}

/**
 * Edge attributes only (Spec §6.3). Inclusion is never a switch; attributes are
 * never a checkbox. State reads from thumb position AND track fill, so it
 * survives without colour and with motion disabled.
 */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      /* 24px tall hit area around a 16px track */
      className="group inline-flex h-control-sm cursor-pointer items-center disabled:cursor-not-allowed"
    >
      <span
        aria-hidden
        className={cx(
          "relative h-4 w-7 rounded-full transition-[background-color] ease-standard",
          checked ? "bg-accent-solid" : "bg-control-track",
          "group-disabled:opacity-50",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 left-0.5 size-3 rounded-full bg-control-thumb shadow-thumb",
            "transition-transform ease-standard",
            checked && "translate-x-3",
          )}
        />
      </span>
    </button>
  );
}
