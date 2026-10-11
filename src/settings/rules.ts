import { BOTTOM_TABS, TOP_TABS, isAddToken, isPipe } from "../lib/nav";

/*
 * Conditional behaviour as data. A rule is a flat list of clauses
 * ("Mode is DATA", "Role is not Member") matched all / any, or "never".
 * No nesting and no expressions: an admin can read every rule as a sentence,
 * and a rule can only ask about the facts listed here, which the app
 * supplies. An empty list always matches.
 */

export type FactId = "mode" | "role" | "domain" | "structure" | "modelChosen" | "recordSelected";

export interface FactDef {
  label: string;
  /** Values offered in the editor; booleans read Yes / No. */
  values: ReadonlyArray<string | boolean>;
}

const tokens = (lists: Record<string, string[]>) =>
  [...new Set(Object.values(lists).flat().filter((t) => !isPipe(t) && !isAddToken(t)))].sort();

export const FACTS: Record<FactId, FactDef> = {
  mode: { label: "Mode", values: ["DATA", "MODEL"] },
  role: { label: "Role", values: ["Admin", "Member"] },
  domain: { label: "Domain", values: tokens(TOP_TABS) },
  structure: { label: "Structure", values: tokens(BOTTOM_TABS) },
  modelChosen: { label: "A Model is chosen", values: [true, false] },
  recordSelected: { label: "A record is selected", values: [true, false] },
};

export const FACT_IDS = Object.keys(FACTS) as FactId[];

/** What the app knows right now. */
export type Facts = { [K in FactId]: K extends "modelChosen" | "recordSelected" ? boolean : string | null };

export interface Clause { fact: FactId; op: "is" | "isNot"; value: string | boolean }
export interface Rule { match: "all" | "any" | "never"; clauses: Clause[] }

export const ALWAYS: Rule = { match: "all", clauses: [] };

export function evaluate(rule: Rule | null | undefined, facts: Facts): boolean {
  if (!rule) return true;
  if (rule.match === "never") return false;
  const test = (c: Clause) => (facts[c.fact] === c.value) === (c.op === "is");
  if (!rule.clauses.length) return true;
  return rule.match === "all" ? rule.clauses.every(test) : rule.clauses.some(test);
}

/** Any input → a valid rule. Clauses naming unknown facts or values are dropped. */
export function normalizeRule(raw: unknown, fallback: Rule = ALWAYS): Rule {
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;
  const match = r.match === "any" || r.match === "never" ? r.match : r.match === "all" ? "all" : null;
  if (!match) return fallback;
  const clauses = (Array.isArray(r.clauses) ? r.clauses : []).flatMap((c): Clause[] => {
    const x = (c ?? {}) as Record<string, unknown>;
    if (typeof x.fact !== "string" || !(x.fact in FACTS)) return [];
    const fact = x.fact as FactId;
    if (!FACTS[fact].values.includes(x.value as string | boolean)) return [];
    return [{ fact, op: x.op === "isNot" ? "isNot" : "is", value: x.value as string | boolean }];
  });
  return { match, clauses: clauses.slice(0, 8) };
}

const show = (v: string | boolean) => (v === true ? "Yes" : v === false ? "No" : v);

/** The rule as a sentence, for the editor. */
export function describe(rule: Rule): string {
  if (rule.match === "never") return "Never";
  if (!rule.clauses.length) return "Always";
  const parts = rule.clauses.map((c) => `${FACTS[c.fact].label} ${c.op === "is" ? "is" : "is not"} ${show(c.value)}`);
  return parts.join(rule.match === "all" ? " and " : " or ");
}

/* ── behaviours: built-in conditions a company may tune ──────────────────── */

export type BehaviourId = "detailsSplit";

export const BEHAVIOURS: Record<BehaviourId, { label: string; description: string; default: Rule }> = {
  detailsSplit: {
    label: "Details under records",
    description: "The Details grid below a Model's records. It also needs records that carry details.",
    default: { match: "all", clauses: [{ fact: "mode", op: "is", value: "DATA" }, { fact: "modelChosen", op: "is", value: true }] },
  },
};

export type Behaviours = Record<BehaviourId, Rule>;

export const DEFAULT_BEHAVIOURS: Behaviours = { detailsSplit: BEHAVIOURS.detailsSplit.default };

export const normalizeBehaviours = (raw: unknown): Behaviours => {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return { detailsSplit: normalizeRule(r.detailsSplit, BEHAVIOURS.detailsSplit.default) };
};
