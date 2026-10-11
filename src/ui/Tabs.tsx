import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./cx";

export interface TabsProps<K extends string> {
  items: ReadonlyArray<{ key: K; label: ReactNode }>;
  value: K;
  onChange: (key: K) => void;
  /** Accessible name of the tab list. */
  label: string;
  /** id of the panel the tabs switch. Give the panel role="tabpanel" and this id. */
  panelId: string;
  className?: string;
}

/** Underline tabs. One tab stop; ←/→ move and select, Home/End jump. */
export function Tabs<K extends string>({ items, value, onChange, label, panelId, className }: TabsProps<K>) {
  const refs = useRef(new Map<K, HTMLButtonElement>());
  const onKeyDown = (e: KeyboardEvent) => {
    const i = items.findIndex((t) => t.key === value);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: items.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = items[(to + items.length) % items.length];
    onChange(next.key);
    refs.current.get(next.key)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown}
      className={cx("flex min-w-0 items-stretch gap-1 overflow-x-auto border-b border-line-subtle", className)}>
      {items.map((t) => {
        const on = t.key === value;
        return (
          <button key={t.key} ref={(el) => { if (el) refs.current.set(t.key, el); else refs.current.delete(t.key); }}
            type="button" role="tab" aria-selected={on} aria-controls={panelId} tabIndex={on ? 0 : -1} onClick={() => onChange(t.key)}
            className={cx("-mb-px shrink-0 cursor-pointer border-b-2 px-3 py-2 text-ui whitespace-nowrap transition-[color,border-color] ease-standard",
              on ? "border-mode-solid font-semibold text-fg-primary" : "border-transparent text-fg-secondary hover:text-fg-primary")}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
