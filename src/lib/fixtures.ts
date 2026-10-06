/*
 * Resolved-state fixtures — handoff v0.5 (Company and Workforce) with its
 * companion fixture data. A stand-in for the resolver payload: every state the
 * shell can be in for these structures is DECLARED here, and the shell renders
 * it. The shell does not work out roles, selectors or whether Add applies.
 *
 * Two modes (MODEL, DATA) crossed with an access level (user, L100). L100
 * keeps its existing behaviour this pass, so frames are declared for the user
 * access level only; see resolveFrame.
 */

import { COMPANIES, COMPANY_REGIONS, PEOPLE_CAN, PEOPLE_USA, WORKFORCE_PLANS, type Member } from "./members";
import type { PropertySectionDef } from "./properties";
import type { GridColumn, Mode } from "../shell/types";

export type Access = "user" | "L100";

/** The declared role of the items in the list, in this context. */
export type ItemRole = "Record" | "Model";

/** "All Models" — the Model selector's first option. */
export const ALL_MODELS = "all";

export type ModelSelector =
  /** One Model: its name as plain text, nothing to pick. */
  | { kind: "text"; label: string }
  /** Many Models: All Models first, then each Model. */
  | { kind: "select"; value: string; options: Array<{ id: string; label: string }> };

export interface ResolvedFrame {
  /** Domain › Domain Structure › Model — declared, never read off a tab. */
  path: { domain: string; structure: string; model: string };
  mode: Mode;
  access: Access;
  /**
   * What the pane is working on, shown as "Model | Parent". The items are Models
   * at All Models — and a single-Model dimension like Company IS all Models — and
   * Records only once one specific Model is chosen among several (Jams, 30 Sep
   * and 1 Oct). The type is the structure's.
   */
  context: { role: ItemRole; type: "Parent" | "Child" };
  /** The governing item: the Model in MODEL, the chosen Model in DATA (null before one is chosen). */
  governing: string | null;
  modelSelector: ModelSelector;
  /** The View control is available on every frame here; Master list is the default. */
  viewSelector: { available: true; defaultViewId: "master" };
  list: {
    role: ItemRole;
    /** Business noun for one item, e.g. "Company", "Person". */
    noun: string;
    ids: string[];
    /** Session additions are stored under this key. */
    key: string;
    /** Shown when the list has nothing to render. */
    empty: string;
  };
  /** null = not offered. Disabled is still shown, with its reason. */
  add: { label: string; enabled: boolean; reason?: string } | null;
  /** No frame in this pass offers Assign (no membership child). */
  assign: null;
  columns: GridColumn[];
  /** Per-item sections the fixture supplies. Absent = the shell's existing sections. */
  sections?: Record<string, PropertySectionDef[]>;
}

const col = (id: string, label: string): GridColumn => ({ id, label });
const COMPANY_COLUMNS = [col("name", "Name / Code"), col("short", "Short Name"), col("desc", "Description"),
  col("region", "Company Region"), col("status", "Status")];
const PLAN_COLUMNS = [col("name", "Name / Code"), col("short", "Short Name"), col("desc", "Description"), col("status", "Status")];
/* People: records only. Their drivers show in the grid below, for the person picked. */
const PERSON_COLUMNS = [col("name", "Name / Code")];

/* Structures whose columns are declared without a full frame. */
export const STRUCTURE_COLUMNS: Record<string, GridColumn[]> = {};

/*
 * Structure Type — two values only (v32). A structure with no declared parent
 * structure is a root Parent; Company Regions is the explicit Child.
 */
export const STRUCTURE_TYPE: Record<string, "Parent" | "Child"> = {
  "Company:Companies": "Parent",
  "Company:Company Regions": "Child",
  "Workforce:Workforce Plans": "Parent",
};
const REGION_COLUMNS = [col("name", "Name / Code"), col("short", "Short Name"), col("desc", "Description")];

const ids = (list: Member[]) => list.map((m) => m.id);
const view = { available: true, defaultViewId: "master" } as const;
const ctx = (role: ItemRole, key: string) => ({ role, type: STRUCTURE_TYPE[key] });

/* Driver values — blue in the fixture: layout only, not business assumptions. Read off each person. */
const drivers = (list: Member[]): Record<string, PropertySectionDef[]> => Object.fromEntries(list.map((p) => [p.id, [
  { id: "drivers", label: "Drivers", fields: [
    { l: "Salary", v: p.attrs?.Salary ?? "", t: "read" },
    { l: "Hours worked", v: p.attrs?.["Hours worked"] ?? "", t: "read" },
    { l: "Hourly rate", v: p.attrs?.["Hourly rate"] ?? "", t: "read", src: "Salary ÷ Hours worked" },
  ] },
]]));

const COMPANY: Record<Mode, ResolvedFrame> = {
  MODEL: {
    path: { domain: "Company", structure: "Companies", model: "Company" }, mode: "MODEL", access: "user", context: ctx("Model", "Company:Companies"),
    governing: "Company", modelSelector: { kind: "text", label: "Company" }, viewSelector: view,
    list: { role: "Record", noun: "Company", ids: ids(COMPANIES), key: "Company:Companies", empty: "No companies in this view." },
    add: { label: "Add Company", enabled: true }, assign: null, columns: COMPANY_COLUMNS,
  },
  /* Self set: the child of a company is the company itself — nothing to add or assign. */
  DATA: {
    path: { domain: "Company", structure: "Companies", model: "Company" }, mode: "DATA", access: "user", context: ctx("Model", "Company:Companies"),
    governing: "Company", modelSelector: { kind: "text", label: "Company" }, viewSelector: view,
    list: { role: "Record", noun: "Company", ids: ids(COMPANIES), key: "Company:Companies", empty: "No companies in this view." },
    add: null, assign: null, columns: COMPANY_COLUMNS,
  },
};

/*
 * Company Regions — the child structure. The workbook names no Model; v32 uses
 * the singular of the structure, "Company Region". Dimension records: added in
 * MODEL only, like Companies.
 */
const REGION_LIST = { role: "Record" as const, noun: "Company Region", ids: ids(COMPANY_REGIONS), key: "Company:Company Regions", empty: "No company regions in this view." };
const COMPANY_REGIONS_FRAME: Record<Mode, ResolvedFrame> = {
  MODEL: {
    path: { domain: "Company", structure: "Company Regions", model: "Company Region" }, mode: "MODEL", access: "user", context: ctx("Model", "Company:Company Regions"),
    governing: "Company Region", modelSelector: { kind: "text", label: "Company Region" }, viewSelector: view,
    list: REGION_LIST, add: { label: "Add Company Region", enabled: true }, assign: null, columns: REGION_COLUMNS,
  },
  DATA: {
    path: { domain: "Company", structure: "Company Regions", model: "Company Region" }, mode: "DATA", access: "user", context: ctx("Model", "Company:Company Regions"),
    governing: "Company Region", modelSelector: { kind: "text", label: "Company Region" }, viewSelector: view,
    list: REGION_LIST, add: null, assign: null, columns: REGION_COLUMNS,
  },
};

const PLAN_OPTIONS = [{ id: ALL_MODELS, label: "All Models" }, ...WORKFORCE_PLANS.map((p) => ({ id: p.id, label: p.name }))];
const workforceData = (value: string, governing: string | null, list: ResolvedFrame["list"],
  add: ResolvedFrame["add"], columns: GridColumn[], sections?: ResolvedFrame["sections"]): ResolvedFrame => ({
  path: { domain: "Workforce", structure: "Workforce Plans", model: "Workforce Plan" }, mode: "DATA", access: "user",
  context: ctx(governing ? "Record" : "Model", "Workforce:Workforce Plans"),
  governing, modelSelector: { kind: "select", value, options: PLAN_OPTIONS }, viewSelector: view,
  list, add, assign: null, columns, ...(sections ? { sections } : null),
});

const WORKFORCE_MODEL: ResolvedFrame = {
  path: { domain: "Workforce", structure: "Workforce Plans", model: "Workforce Plan" }, mode: "MODEL", access: "user", context: ctx("Model", "Workforce:Workforce Plans"),
  governing: "Workforce Plan", modelSelector: { kind: "text", label: "Workforce Plan" }, viewSelector: view,
  list: { role: "Record", noun: "Workforce Plan", ids: ids(WORKFORCE_PLANS), key: "Workforce:Workforce Plans", empty: "No workforce plans in this view." },
  add: { label: "Add Workforce Plan", enabled: true }, assign: null, columns: PLAN_COLUMNS,
};

/* DATA: keyed by the Model selector's value. Population: Add once a specific Model is chosen. */
const WORKFORCE_DATA: Record<string, ResolvedFrame> = {
  [ALL_MODELS]: workforceData(ALL_MODELS, null,
    { role: "Model", noun: "Workforce Plan", ids: ids(WORKFORCE_PLANS), key: "Workforce:Workforce Plans", empty: "No workforce plans." },
    { label: "Add Person", enabled: false, reason: "Choose a workforce plan" }, PLAN_COLUMNS),
  "wf-usa": workforceData("wf-usa", "Workforce USA",
    { role: "Record", noun: "Person", ids: ids(PEOPLE_USA), key: "Workforce:Workforce Plans#wf-usa", empty: "No people in Workforce USA." },
    { label: "Add Person", enabled: true }, PERSON_COLUMNS, drivers(PEOPLE_USA)),
  /* Canada's people are dummy demo data (see members.ts). */
  "wf-can": workforceData("wf-can", "Workforce Canada",
    { role: "Record", noun: "Person", ids: ids(PEOPLE_CAN), key: "Workforce:Workforce Plans#wf-can", empty: "No people in Workforce Canada." },
    { label: "Add Person", enabled: true }, PERSON_COLUMNS, drivers(PEOPLE_CAN)),
};

/*
 * Look up the declared frame. Returns null where the fixture declares nothing
 * (every other structure, and L100) — those keep the shell's existing behaviour.
 */
export function resolveFrame(q: { domain: string | null; structure: string | null; mode: Mode; access: Access; model: string }): ResolvedFrame | null {
  if (q.access === "L100") return null;
  const key = `${q.domain}:${q.structure}`;
  if (key === "Company:Companies") return COMPANY[q.mode];
  if (key === "Company:Company Regions") return COMPANY_REGIONS_FRAME[q.mode];
  if (key === "Workforce:Workforce Plans") return q.mode === "MODEL" ? WORKFORCE_MODEL : WORKFORCE_DATA[q.model] ?? WORKFORCE_DATA[ALL_MODELS];
  return null;
}

/** Structures the fixture covers, whatever the mode or access level. */
export const FIXTURE_STRUCTURES = new Set(["Company:Companies", "Company:Company Regions", "Workforce:Workforce Plans"]);
