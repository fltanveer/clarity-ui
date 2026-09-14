import { Fragment, useRef, type KeyboardEvent } from "react";
import { cx } from "../lib/cx";

export interface TabItem<K extends string> {
  key: K;
  label: string;
  /** Items with a different group get a divider before them. */
  group?: string;
}

export interface TabsProps<K extends string> {
  items: readonly TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  label: string;
  /** id of the element the tabs control. */
  panelId: string;
}

/**
 * Underline tabs, automatic activation. Roving tabindex: one tab stop;
 * ←/→ move and select, Home/End jump.
 */
export function Tabs<K extends string>({ items, value, onChange, label, panelId }: TabsProps<K>) {
  const refs = useRef(new Map<K, HTMLButtonElement>());

  const onKeyDown = (e: KeyboardEvent) => {
    const i = items.findIndex((t) => t.key === value);
    const go = (n: number) => {
      const next = items[(n + items.length) % items.length];
      onChange(next.key);
      refs.current.get(next.key)?.focus();
    };
    switch (e.key) {
      case "ArrowRight": e.preventDefault(); go(i + 1); break;
      case "ArrowLeft": e.preventDefault(); go(i - 1); break;
      case "Home": e.preventDefault(); go(0); break;
      case "End": e.preventDefault(); go(items.length - 1); break;
    }
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto"
    >
      {items.map((t, i) => {
        const on = t.key === value;
        const divider = i > 0 && t.group !== items[i - 1].group;
        return (
          <Fragment key={t.key}>
            {divider && <span aria-hidden className="mx-1.5 h-4 w-px shrink-0 self-center bg-line-strong" />}
            <button
              ref={(el) => { if (el) refs.current.set(t.key, el); else refs.current.delete(t.key); }}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={panelId}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(t.key)}
              className={cx(
                "shrink-0 cursor-pointer border-b-2 px-3 py-2.5 text-ui whitespace-nowrap -outline-offset-2",
                "transition-[color,border-color] ease-standard",
                on ? "border-accent-solid font-semibold text-fg-primary" : "border-transparent text-fg-secondary hover:text-fg-primary",
              )}
            >
              {t.label}
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
