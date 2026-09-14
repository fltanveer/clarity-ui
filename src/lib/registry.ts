/*
 * Context registry — the Gatekeeper for the assign surface (Spec §5).
 * A context not declared here does not exist for the UI; the surface renders an
 * explicit "not registered" state rather than borrowing a neighbour's
 * constraints. Rulings behind each entry: docs/decisions.md.
 */

export type Consequence = "results" | "display" | "security" | "unruled";
export type ColumnType = "toggle" | "qty" | "access";

export interface AttributeColumn {
  key: "down" | "through" | "qty" | "access";
  head: string;
  type: ColumnType;
}

export interface ContextDef {
  label: string;
  /** Spec 68 composition context or Spec 71 relationship schema. */
  registry: "composition" | "relationship";
  /** Cross-dimension assignment allowed. When false the structure picker locks. */
  cross: boolean;
  consequence: Consequence;
  /** "headers" and "yes" both allow folders. */
  folders: "yes" | "no" | "headers";
  /** Rows carry a member-scope chip. */
  scope: boolean;
  cols: AttributeColumn[];
}

export const REGISTRY = {
  AGG_ROLLUP: {
    label: "Rollup", registry: "composition", cross: false,
    consequence: "results", folders: "headers", scope: false, cols: [],
  },
  REPORT_LAYOUT: {
    label: "Report & Metric Views", registry: "composition", cross: true,
    consequence: "display", folders: "yes", scope: false,
    cols: [
      { key: "down", head: "Drill-down", type: "toggle" },
      { key: "through", head: "Drill-through", type: "toggle" },
    ],
  },
  STRUCTURES: {
    label: "Allocation & Structures", registry: "relationship", cross: false,
    consequence: "unruled", folders: "no", scope: true, cols: [],
  },
  COMPOSITION_QTY: {
    label: "Composition", registry: "relationship", cross: false,
    consequence: "results", folders: "no", scope: false,
    cols: [{ key: "qty", head: "Qty", type: "qty" }],
  },
  PERMISSIONS: {
    label: "Permissions", registry: "relationship", cross: false,
    consequence: "security", folders: "no", scope: false,
    cols: [{ key: "access", head: "Access", type: "access" }],
  },
  NAV_ORGANIZE: {
    label: "Members", registry: "composition", cross: false,
    consequence: "display", folders: "yes", scope: false, cols: [],
  },
} satisfies Record<string, ContextDef>;

export type ContextKey = keyof typeof REGISTRY;

export const CONTEXT_KEYS = Object.keys(REGISTRY) as ContextKey[];

export function getContext(key: string): ContextDef | null {
  return (REGISTRY as Record<string, ContextDef>)[key] ?? null;
}

export const allowsFolders = (ctx: ContextDef) => ctx.folders !== "no";
