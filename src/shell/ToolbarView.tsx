import { useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { ICONS } from "../settings/icons";
import { ACTIONS, iconOf, labelOf, type ActionId, type ToolbarItem } from "../settings/toolbar";
import { MenuItem, Popover } from "./Popover";
import { ChromeButton } from "./controls";
import { cx } from "../lib/cx";

/** What the screen supplies for one action right now. Absent = not offered here. */
export interface ActionRuntime {
  onSelect?: () => void;
  disabled?: boolean;
  /** Why it is disabled, or a shortcut hint. */
  title?: string;
  /** Overrides the label at runtime (Add → "Add Person"). */
  label?: string;
  /** Overrides the icon at runtime (collapse ↔ expand). */
  icon?: ReactNode;
  /** Accessible name when it differs from the label. */
  ariaLabel?: string;
  ariaKeyShortcuts?: string;
  ariaHasPopup?: "dialog" | "menu";
}

export interface ToolbarViewProps {
  items: ToolbarItem[];
  run: Partial<Record<ActionId, ActionRuntime>>;
}

/*
 * Draws the action bar from data: main buttons, an "Actions ▾" menu holding
 * the menu zone (shown only when it has something), and the icon group on
 * the right. Same on-bar buttons for every action; the primary add keeps its
 * stronger edge.
 */
export function ToolbarView({ items, run }: ToolbarViewProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const shown = items.filter((t) => !t.hidden && run[t.id]);
  const zone = (z: ToolbarItem["zone"]) => shown.filter((t) => t.zone === z);

  const icon = (t: ToolbarItem) => {
    const r = run[t.id]!;
    if (r.icon) return r.icon;
    const Icon = ICONS[iconOf(t)];
    return <Icon size={14} aria-hidden />;
  };
  const label = (t: ToolbarItem) => run[t.id]?.label ?? labelOf(t);

  const button = (t: ToolbarItem, iconOnly: boolean) => {
    const r = run[t.id]!;
    const name = label(t);
    return (
      <ChromeButton key={t.id} variant="bar" onClick={r.onSelect} disabled={r.disabled}
        title={r.title ?? (iconOnly ? name : undefined)}
        aria-label={iconOnly || r.ariaLabel ? r.ariaLabel ?? name : undefined}
        aria-haspopup={r.ariaHasPopup} aria-keyshortcuts={r.ariaKeyShortcuts}
        className={cx(iconOnly && "w-8 px-0", t.id === "add" && "border-on-bar-edge-strong font-semibold")}>
        {t.display !== "label" || iconOnly ? icon(t) : null}
        {!iconOnly && t.display !== "icon" ? name : null}
      </ChromeButton>
    );
  };

  const menu = zone("menu");
  return (
    <div className="on-bar flex h-row-toolbar shrink-0 items-center gap-2 border-b border-mode-ink bg-mode-solid px-edge">
      {zone("main").map((t) => button(t, t.display === "icon"))}
      {menu.length > 0 && (
        <>
          <ChromeButton ref={menuRef} variant="bar" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            Actions <ChevronDown size={13} aria-hidden />
          </ChromeButton>
          <Popover anchorRef={menuRef} open={open} onClose={() => setOpen(false)} label="Actions" className="w-48 py-1">
            {menu.map((t) => {
              const r = run[t.id]!;
              return (
                <MenuItem key={t.id} tone={ACTIONS[t.id].danger ? "danger" : "default"} disabled={r.disabled}
                  onSelect={() => { setOpen(false); r.onSelect?.(); }}>
                  {icon(t)} {label(t)}
                </MenuItem>
              );
            })}
          </Popover>
        </>
      )}
      <div className="ms-auto flex gap-1.5">
        {zone("end").map((t) => button(t, t.display !== "label"))}
      </div>
    </div>
  );
}
