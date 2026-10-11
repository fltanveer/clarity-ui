import { isIconName, type IconName } from "./icons";

/*
 * Toolbar as data. The ACTIONS registry is code: what each action does and
 * what may be changed about it. Company settings only arrange it — where an
 * action sits, its order, label, icon and whether it shows — so no setting
 * can run code or break a rule.
 */

export type ActionId = "add" | "reorder" | "bulkDelete" | "export" | "import" | "refresh" | "toggleHeader";
/** main = buttons on the bar · menu = inside "Actions ▾" · end = icon group on the right. */
export type Zone = "main" | "menu" | "end";
export type Display = "both" | "icon" | "label";
type Lock = "label" | "hidden" | "icon";

export interface ActionDef {
  id: ActionId;
  label: string;
  icon: IconName;
  /** What it does, for the editor. */
  description: string;
  /** Fields the admin may not change, and why. */
  locks?: Partial<Record<Lock, string>>;
  danger?: boolean;
}

export const ACTIONS: Record<ActionId, ActionDef> = {
  add: { id: "add", label: "Add", icon: "Plus", description: "Adds a record (Add Person, Add Company…).",
    locks: { label: "Named after the record type, e.g. Add Person." } },
  reorder: { id: "reorder", label: "Reorder", icon: "Menu", description: "Turns the grid into reorder mode." },
  bulkDelete: { id: "bulkDelete", label: "Bulk delete", icon: "Trash2", description: "Select several records to delete.", danger: true },
  export: { id: "export", label: "Export", icon: "Download", description: "Downloads the current view." },
  import: { id: "import", label: "Import", icon: "Upload", description: "Loads records from a file." },
  refresh: { id: "refresh", label: "Refresh", icon: "RefreshCw", description: "Reloads the data." },
  toggleHeader: { id: "toggleHeader", label: "Collapse header", icon: "Maximize2", description: "Hides the header rows for more space.",
    locks: { hidden: "It is the way back after collapsing, so it always shows.", icon: "Changes with its state." } },
};

export const ACTION_IDS = Object.keys(ACTIONS) as ActionId[];

export interface ToolbarItem {
  id: ActionId;
  zone: Zone;
  display: Display;
  hidden: boolean;
  /** null = the action's own label. */
  label: string | null;
  /** null = the action's own icon. */
  icon: IconName | null;
}

const item = (id: ActionId, zone: Zone, display: Display): ToolbarItem => ({ id, zone, display, hidden: false, label: null, icon: null });

/* Today's bar: Add · Actions ▾ (Reorder, Bulk delete) · Export … Import, Refresh, Collapse. */
export const DEFAULT_TOOLBAR: ToolbarItem[] = [
  item("add", "main", "both"), item("export", "main", "both"),
  item("reorder", "menu", "both"), item("bulkDelete", "menu", "both"),
  item("import", "end", "icon"), item("refresh", "end", "icon"), item("toggleHeader", "end", "icon"),
];

const ZONES: Zone[] = ["main", "menu", "end"];
const DISPLAYS: Display[] = ["both", "icon", "label"];

/**
 * Any input → a valid toolbar: unknown actions drop, duplicates keep the
 * first, locked fields reset, and actions missing from the list (new in a
 * later release) are added where the default puts them.
 */
export function normalizeToolbar(raw: unknown): ToolbarItem[] {
  const seen = new Set<ActionId>();
  const out: ToolbarItem[] = [];
  for (const r of Array.isArray(raw) ? raw : []) {
    const id = (r as { id?: unknown })?.id;
    if (typeof id !== "string" || !(id in ACTIONS) || seen.has(id as ActionId)) continue;
    const def = ACTIONS[id as ActionId], x = r as Record<string, unknown>;
    seen.add(def.id);
    const label = typeof x.label === "string" && x.label.trim() ? x.label.trim().slice(0, 32) : null;
    out.push({
      id: def.id,
      zone: ZONES.includes(x.zone as Zone) ? x.zone as Zone : "main",
      display: DISPLAYS.includes(x.display as Display) ? x.display as Display : "both",
      hidden: def.locks?.hidden ? false : x.hidden === true,
      label: def.locks?.label ? null : label,
      icon: def.locks?.icon || !isIconName(x.icon) ? null : x.icon,
    });
  }
  for (const d of DEFAULT_TOOLBAR) if (!seen.has(d.id)) out.push({ ...d });
  return out;
}

export const labelOf = (t: ToolbarItem) => t.label ?? ACTIONS[t.id].label;
export const iconOf = (t: ToolbarItem): IconName => t.icon ?? ACTIONS[t.id].icon;
