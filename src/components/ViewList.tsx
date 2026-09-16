import { Check, Filter, Folder, ListChecks, Lock } from "lucide-react";
import { cx } from "../lib/cx";

export interface ViewListItem {
  id: string;
  name: string;
  folder?: string | null;
  kind?: "rule" | "static";
  system?: boolean;
  /** Members the view returns; falls back to ids.length when omitted. */
  count?: number;
  ids?: readonly string[];
}

export interface ViewListProps {
  items: readonly ViewListItem[];
  activeId: string;
  onPick: (id: string) => void;
  /** Filters by name; groups with no match drop out. */
  query?: string;
  /** "menuitemradio" inside an APG menu (roving focus handled by the host); plain buttons otherwise. */
  itemRole?: "button" | "menuitemradio";
  isDisabled?: (item: ViewListItem) => boolean;
  countOf?: (item: ViewListItem) => number | undefined;
}

/*
 * The one view list: unfiled first (Master list on top), then folders in saved
 * order. Each row carries the view's kind (lock = system, funnel = rule-based,
 * checklist = static list), its member count and a tick on the current view.
 * Shared by the members view panel, the Assigned pane's view menu and the
 * Available pane's "View by" picker so a view reads the same everywhere.
 */
export function ViewList({ items, activeId, onPick, query = "", itemRole = "button", isDisabled, countOf }: ViewListProps) {
  const menu = itemRole === "menuitemradio";
  const q = query.trim().toLowerCase();
  const folders = [...new Set(items.map((v) => v.folder).filter(Boolean) as string[])];
  const groups = [
    { folder: null as string | null, items: items.filter((v) => !v.folder) },
    ...folders.map((f) => ({ folder: f as string | null, items: items.filter((v) => v.folder === f) })),
  ].map((g) => ({ ...g, items: g.items.filter((v) => v.name.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length);

  if (!groups.length) {
    return <p className="px-3 py-3 text-ui text-fg-tertiary">No views match “{query}”.</p>;
  }

  return (
    <>
      {groups.map((g) => (
        <div key={g.folder ?? "__unfiled"} role="group" aria-label={g.folder ?? "Unfiled"}>
          {g.folder && (
            <p aria-hidden className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-caption font-semibold tracking-label text-fg-secondary uppercase">
              <Folder size={12} className="shrink-0 text-fg-tertiary" /> {g.folder}
            </p>
          )}
          <ul role={menu ? "none" : undefined}>
            {g.items.map((v) => {
              const on = v.id === activeId;
              const disabled = isDisabled?.(v) ?? false;
              const KindIcon = v.system ? Lock : v.kind === "rule" ? Filter : ListChecks;
              const count = countOf ? countOf(v) : v.count ?? v.ids?.length;
              return (
                <li key={v.id} role={menu ? "none" : undefined}>
                  <button type="button"
                    role={menu ? "menuitemradio" : undefined} aria-checked={menu ? on : undefined} tabIndex={menu ? -1 : undefined}
                    aria-current={!menu && on ? "true" : undefined} aria-disabled={disabled || undefined}
                    onClick={() => { if (!disabled) onPick(v.id); }}
                    className={cx("flex h-9 w-full items-center gap-2 pe-3 text-start focus-visible:-outline-offset-2",
                      g.folder ? "ps-8" : "ps-3",
                      on ? "bg-mode-soft" : disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-hover")}>
                    <KindIcon size={13} aria-hidden className={cx("shrink-0", on ? "text-mode-ink" : disabled ? "text-fg-disabled" : "text-fg-tertiary")} />
                    <span className={cx("min-w-0 flex-1 truncate text-ui",
                      on ? "font-semibold text-mode-ink" : disabled ? "text-fg-disabled" : "text-fg-primary")}>{v.name}</span>
                    {count !== undefined && (
                      <span className="shrink-0 text-caption text-fg-tertiary tabular-nums">{count}<span className="sr-only"> members</span></span>
                    )}
                    <span className="flex w-4 shrink-0 justify-center text-mode-ink">{on && <Check size={14} aria-hidden />}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
