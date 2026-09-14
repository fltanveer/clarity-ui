/*
 * Members and views — synthetic, from Prototype 3.
 * Generic member names on purpose: one fixture serves every domain without
 * claiming the list is Companies. IDs are stable; views resolve by id.
 */

export interface Member {
  id: string;
  name: string;
  code: string;
  type: "Standard" | "System" | "Computed";
  /** System-defined: cannot be deleted. */
  locked: boolean;
}

export const MEMBERS: Member[] = [
  { id: "acme-us", name: "Member A", code: "MBR-A", type: "Standard", locked: false },
  { id: "acme-emea", name: "Member B", code: "MBR-B", type: "Standard", locked: false },
  { id: "acme-apac", name: "Member C", code: "MBR-C", type: "Standard", locked: false },
  { id: "elim", name: "Member D", code: "MBR-D", type: "System", locked: true },
  { id: "consol", name: "Member E", code: "MBR-E", type: "Computed", locked: true },
];

export type RuleField = "type" | "locked" | "name" | "code";
export interface ViewRule { field: RuleField; op: string; value: string }

export const RULE_FIELDS: Record<RuleField, { label: string; ops: string[]; values?: string[] }> = {
  type: { label: "Type", ops: ["is", "is not"], values: ["Standard", "System", "Computed"] },
  locked: { label: "System-defined", ops: ["is"], values: ["Yes", "No"] },
  name: { label: "Name", ops: ["contains", "starts with"] },
  code: { label: "Code", ops: ["contains", "starts with"] },
};

/*
 * A view is a saved answer to "which members do I see": rule-based views
 * re-evaluate as members change; static lists hold exactly what was picked.
 * `ids` is the resolved result the rest of the shell reads.
 */
export interface MemberView {
  id: string;
  name: string;
  /** Structure the view is built on — decides whether it absorbs future members. */
  on: string;
  folder: string | null;
  ids: string[];
  system?: boolean;
  kind?: "rule" | "static";
  match?: "all" | "any";
  rules?: ViewRule[];
  description?: string;
  owner?: string;
  updated?: string;
  uuid?: string;
}

export function resolveView(v: MemberView, members: readonly Member[]): string[] {
  if (v.kind !== "rule") return members.filter((m) => v.ids.includes(m.id)).map((m) => m.id);
  const rules = v.rules ?? [];
  const test = (m: Member, r: ViewRule) => {
    const a = (r.field === "locked" ? (m.locked ? "Yes" : "No") : String(m[r.field])).toLowerCase();
    const b = r.value.toLowerCase();
    if (r.op === "is") return a === b;
    if (r.op === "is not") return a !== b;
    if (r.op === "contains") return a.includes(b);
    if (r.op === "starts with") return a.startsWith(b);
    return true;
  };
  return members
    .filter((m) => !rules.length || (v.match === "any" ? rules.some((r) => test(m, r)) : rules.every((r) => test(m, r))))
    .map((m) => m.id);
}

/* Unfiled first; Master list is unfiled and must stay at the top. */
export const MEMBER_VIEWS: MemberView[] = [
  { id: "master", name: "Master list", on: "Companies", folder: null, system: true, kind: "rule", match: "all", rules: [],
    description: "Every member of the structure. Maintained by ClarityOS.", owner: "ClarityOS", updated: "18 Aug 2026",
    uuid: "0b6d1f3e-2c1a-4e0f-9a51-6d0c2f9b1a00", ids: ["acme-us", "acme-emea", "acme-apac", "elim", "consol"] },
  { id: "opco", name: "Operating companies", on: "Companies", folder: "Consolidation", kind: "rule", match: "all",
    rules: [{ field: "type", op: "is", value: "Standard" }],
    description: "Trading entities included in the operating result.", owner: "J. Davidson", updated: "04 Aug 2026",
    uuid: "5a2e9c41-7b3d-4f6a-8e21-3c9d0b7f4e12", ids: ["acme-us", "acme-emea", "acme-apac"] },
  { id: "elims", name: "Elimination set", on: "Companies", folder: "Consolidation", kind: "rule", match: "all",
    rules: [{ field: "type", op: "is not", value: "Standard" }],
    description: "Elimination and consolidation entities.", owner: "M. Cowen", updated: "21 Jul 2026",
    uuid: "9d4b7e20-1f8c-4a3e-b6d5-2e7a9c0f3b44", ids: ["elim", "consol"] },
  { id: "acq", name: "Acquired entities", on: "Companies", folder: "Consolidation", kind: "static",
    description: "Entities acquired since FY24.", owner: "J. Davidson", updated: "02 Jun 2026",
    uuid: "c7f1e0a2-49bd-4e77-9a10-6f2b83c41d55", ids: ["acme-apac", "acme-emea"] },
  { id: "na", name: "North America by Region", on: "Region", folder: "By region", kind: "static",
    owner: "M. Cowen", updated: "12 May 2026", uuid: "1e3a5c7d-9b0f-4d2e-8a6c-4b1d3f5e7a90", ids: ["acme-us"] },
  { id: "emea", name: "EMEA by Region", on: "Region", folder: "By region", kind: "static",
    owner: "M. Cowen", updated: "12 May 2026", uuid: "2f4b6d8e-0a1c-4e3f-9b7d-5c2e4a6f8b01", ids: ["acme-emea"] },
  { id: "dormant", name: "Dormant companies", on: "Status", folder: "Audit", kind: "static",
    owner: "J. Davidson", updated: "30 Apr 2026", uuid: "3a5c7e9f-1b2d-4f4a-8c6e-6d3f5b7a9c12", ids: ["elim"] },
  { id: "audit", name: "In audit scope", on: "Status", folder: "Audit", kind: "static",
    description: "Entities in the FY26 external audit.", owner: "J. Davidson", updated: "30 Apr 2026",
    uuid: "4b6d8f0a-2c3e-4a5b-9d7f-7e4a6c8b0d23", ids: ["acme-us", "acme-emea", "acme-apac", "consol"] },
];

/** Search box appears in the view picker only above this many views. */
export const VIEW_SEARCH_MIN = 6;

export const memberById = (id: string | null) => MEMBERS.find((m) => m.id === id) ?? null;

/** Views seeded for a structure: the full demo set for Companies, Master list elsewhere. */
export const defaultViews = (structure: string | null): MemberView[] =>
  structure === "Companies"
    ? MEMBER_VIEWS
    : [{ id: "master", name: "Master list", on: structure ?? "Structure", folder: null, system: true, kind: "rule", match: "all", rules: [],
        description: "Every member of the structure. Maintained by ClarityOS.", owner: "ClarityOS", updated: "18 Aug 2026",
        uuid: "0b6d1f3e-2c1a-4e0f-9a51-6d0c2f9b1a00", ids: MEMBERS.map((m) => m.id) }];
