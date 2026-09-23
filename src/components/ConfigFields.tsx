import { useId, type KeyboardEvent, type ReactNode } from "react";
import { Lock, type LucideIcon } from "lucide-react";
import { cx } from "../lib/cx";

/*
 * Shared configuration building blocks: the section index (member and view
 * configuration use the same one) and the label-gutter field row.
 */

export interface IndexItem { id: string; label: string; Icon: LucideIcon }
export interface IndexGroup { group: string | null; items: IndexItem[] }

/*
 * Selection: a bordered, mode-tinted chip with weight — deliberately
 * not the members list's mode fill + bar, so "which member" and "which section" never
 * read as the same kind of selection side by side.
 */
export function ConfigIndex({ groups, section, onSection, label, controls, dirty = [] }: {
  groups: IndexGroup[];
  section: string;
  onSection: (id: string) => void;
  label: string;
  /** id of the region the index drives. */
  controls: string;
  /** Sections holding unsaved edits get a dot. */
  dirty?: string[];
}) {
  const items = groups.flatMap((g) => g.items);
  const onKeyDown = (e: KeyboardEvent) => {
    const i = items.findIndex((it) => it.id === section);
    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = items[(i + d + items.length) % items.length].id;
    onSection(next);
    document.getElementById(`${controls}-item-${next}`)?.focus();
  };
  return (
    <nav aria-label={label} onKeyDown={onKeyDown} className="min-h-0 flex-1 overflow-y-auto py-2">
      {groups.map((g, gi) => (
        <div key={g.group ?? "top"} className={cx(gi > 0 && "mt-2")}>
          {g.group && (
            <h3 id={`${controls}-group-${g.group}`} className="px-3 pt-2 pb-1 text-caption font-bold tracking-eyebrow text-fg-secondary uppercase">{g.group}</h3>
          )}
          <ul aria-labelledby={g.group ? `${controls}-group-${g.group}` : undefined}>
            {g.items.map(({ id, label: itemLabel, Icon }) => {
              const on = id === section;
              return (
                <li key={id} className="px-2">
                  <button id={`${controls}-item-${id}`} type="button" onClick={() => onSection(id)}
                    aria-current={on ? "page" : undefined} aria-controls={controls}
                    className={cx(
                      "flex h-grid-row w-full cursor-pointer items-center gap-2 rounded-control border px-2 text-start text-ui transition-[background-color,border-color,color] duration-150 ease-standard",
                      on ? "border-mode-solid/35 bg-mode-soft font-semibold text-mode-ink" : "border-transparent text-fg-secondary hover:bg-hover hover:text-fg-primary",
                    )}>
                    <Icon size={13} aria-hidden className={cx("shrink-0", on && "text-mode-ink")} />
                    <span className="min-w-0 flex-1 truncate">{itemLabel}</span>
                    {dirty.includes(id) && (
                      <span className="size-1.5 shrink-0 rounded-full bg-warning-icon" aria-label="Unsaved changes" role="img" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/*
 * One row per field: label in a fixed 168px gutter, every control filling the
 * same value column, so edges line up on every row and section (CH-004).
 */
export function FieldRow({ label, hint, state, children }: {
  label: string; hint?: ReactNode;
  /** What a lower tier will see, when an administrator has changed it. */
  state?: "hidden" | "locked";
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-4 border-b border-line-subtle py-2.5 last:border-b-0">
      <label htmlFor={id} className="w-42 shrink-0 pt-1.5 text-ui text-fg-secondary">
        {label}
        {state && (
          <span className={cx("ms-1.5 rounded-chip px-1.5 py-0.5 align-middle text-micro font-semibold whitespace-nowrap",
            state === "hidden" ? "bg-danger-soft text-danger-text" : "bg-shell-alt text-fg-secondary")}>
            {state === "hidden" ? "HIDDEN IN MODEL" : "READ-ONLY IN MODEL"}
          </span>
        )}
      </label>
      <div className="min-w-0 flex-1">
        {children(id)}
        {hint}
      </div>
    </div>
  );
}

export const controlClass =
  "w-full rounded-control border border-line-control bg-surface px-2.5 text-ui text-fg-primary outline-none hover:border-line-control-hover " +
  "disabled:cursor-not-allowed disabled:bg-shell disabled:text-fg-secondary disabled:hover:border-line-control";

export function TextInput({ id, value, onChange, area, disabled }: {
  id: string; value: string; onChange: (v: string) => void; area?: boolean; disabled?: boolean;
}) {
  return area
    ? <textarea id={id} rows={2} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={cx(controlClass, "min-h-16 resize-y py-1.5 leading-body")} />
    : <input id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={cx(controlClass, "h-control-form")} />;
}

/* A derived value without its authority is indistinguishable from a typed one. */
export const DerivedHint = ({ children }: { children: ReactNode }) => (
  <p className="mt-1 flex items-center gap-1 text-caption text-fg-tertiary">
    <Lock size={10} aria-hidden className="shrink-0" /> <span className="min-w-0">{children}</span>
  </p>
);
