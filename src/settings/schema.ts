/*
 * Company settings — what a company admin can change for everyone in the
 * company. One document per company, versioned, validated on every read so a
 * stale or hand-edited copy can never break the app: unknown keys are dropped
 * and bad values fall back to the default.
 *
 * Add a setting: add it to the type, DEFAULTS and normalize(). Bump VERSION
 * only for a breaking change, and migrate in normalize().
 */

import { isHex } from "./color";
import { DEFAULT_TOOLBAR, normalizeToolbar, type ToolbarItem } from "./toolbar";
import { DEFAULT_TABLE, normalizeTable, type TableStyle } from "./table";
import { DEFAULT_BEHAVIOURS, normalizeBehaviours, type Behaviours } from "./rules";

export const VERSION = 1;

export type Theme = "light" | "dark" | "system";
export type Density = "comfortable" | "compact";
export type PaneDefault = "open" | "collapsed";

export interface CompanySettings {
  version: typeof VERSION;
  appearance: {
    theme: Theme;
    density: Density;
  };
  /** One colour per slot; null = ClarityOS default. Readable variants are derived (settings/brand.ts). */
  brand: {
    /** Workspace menu (left rail) background. */
    menu: string | null;
    /** DATA mode chrome: action bar, selection, primary buttons. */
    data: string | null;
    /** MODEL mode chrome. */
    model: string | null;
  };
  /** Action bar layout: order, zone, label, icon, visibility (settings/toolbar.ts). */
  toolbar: ToolbarItem[];
  /** How every grid looks (settings/table.ts). */
  table: TableStyle;
  /** Built-in conditions the company has tuned (settings/rules.ts). */
  behaviours: Behaviours;
  /** How the work area opens. People can still open and close panes as they work. */
  layout: {
    membersPane: PaneDefault;
    propertiesPane: PaneDefault;
    /** The Details section under a drilled-in Model's records. */
    details: PaneDefault;
  };
}

export const DEFAULTS: CompanySettings = {
  version: VERSION,
  appearance: { theme: "light", density: "comfortable" },
  brand: { menu: null, data: null, model: null },
  toolbar: DEFAULT_TOOLBAR,
  table: DEFAULT_TABLE,
  behaviours: DEFAULT_BEHAVIOURS,
  layout: { membersPane: "open", propertiesPane: "open", details: "open" },
};

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? v as Record<string, unknown> : {});

const PANE = ["open", "collapsed"] as const;

/** Any input → a valid CompanySettings. */
export function normalize(raw: unknown): CompanySettings {
  const r = obj(raw), a = obj(r.appearance), b = obj(r.brand), l = obj(r.layout);
  const hex = (v: unknown) => (isHex(v) ? v.toUpperCase() : null);
  return {
    version: VERSION,
    appearance: {
      theme: pick(a.theme, ["light", "dark", "system"] as const, DEFAULTS.appearance.theme),
      density: pick(a.density, ["comfortable", "compact"] as const, DEFAULTS.appearance.density),
    },
    brand: { menu: hex(b.menu), data: hex(b.data), model: hex(b.model) },
    toolbar: normalizeToolbar(r.toolbar ?? DEFAULT_TOOLBAR),
    table: normalizeTable(r.table),
    behaviours: normalizeBehaviours(r.behaviours),
    layout: {
      membersPane: pick(l.membersPane, PANE, DEFAULTS.layout.membersPane),
      propertiesPane: pick(l.propertiesPane, PANE, DEFAULTS.layout.propertiesPane),
      details: pick(l.details, PANE, DEFAULTS.layout.details),
    },
  };
}

export const isDefault = (s: CompanySettings) => JSON.stringify(s) === JSON.stringify(DEFAULTS);
