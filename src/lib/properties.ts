/*
 * Dimension property schema — from Prototype 3 (source: Dimension Properties
 * Unified v5.0). Content preserved, rendering discarded: one renderer
 * (PropertyField) reads this data. Keyed by structure label as the structure
 * bar spells it.
 *
 *   t:"select" — editable     t:"read" + src — derived value and its authority
 *   t:"check"  — boolean      off — disabled, with the reason shown (never hidden)
 *   t:"text"   — free text (e.g. a user's email)
 */

import { childrenOf } from "./nav";

export interface PropertyFieldDef {
  l: string;
  t: "select" | "read" | "check" | "text";
  v?: string | boolean;
  src?: string;
  off?: string;
  note?: string;
  /** Select choices; the current value is always offered. */
  opts?: string[];
}

export interface PropertySectionDef {
  id: string;
  label: string;
  fields: PropertyFieldDef[];
  note?: string;
  collapsed?: boolean;
  placeholder?: boolean;
}

export interface StructureSchema {
  kind: string;
  system?: boolean;
  identity: Array<"name" | "shortName" | "description" | "memo">;
  note?: string;
  sections: PropertySectionDef[];
}

export const PROPERTY_TABS = ["Properties", "Notes", "Attachments"] as const;
export type PropertyTab = (typeof PROPERTY_TABS)[number];

const DEFAULTS_SECTION: PropertySectionDef = { id: "defaults", label: "Defaults", fields: [
  { l: "Inactive", t: "check" },
  { l: "Default", t: "check", note: "is_default" },
] };

export const systemSection = (system: boolean): PropertySectionDef => ({
  id: "system", label: "System Details", collapsed: true, fields: [
    { l: "Order #", v: "—", t: "select", ...(system ? { off: "system-defined" } : null) },
    { l: "Hidden", t: "check", ...(system ? { off: "system-defined" } : null) },
    { l: "System-Defined", t: "check", v: system, off: "capability from Model Type" },
    { l: "Can be Renamed", t: "check", v: !system, off: "capability from Model Type" },
    { l: "Created", v: "04 Feb 2026, 15:29 · jack@clarityos", t: "read" },
    { l: "Updated", v: "04 Feb 2026, 15:29 · jack@clarityos", t: "read" },
    { l: "Member ID", v: "f2bbb614-a25e-40b8-a426-7051afa03183", t: "read",
      src: "UUID is the authoritative identity; the name is mutable" },
  ] });

export const DIMENSION_SCHEMA: Record<string, StructureSchema> = {
  "Companies": { kind: "Company", identity: ["name", "shortName", "description"],
    note: "Enforced default company — may be renamed, cannot be deleted.",
    sections: [
      { id: "class", label: "Classification", fields: [
        { l: "Functional Currency", v: "USD — US Dollar", t: "select" },
        { l: "Calendar", v: "US Fiscal (Jan–Dec)", t: "select" },
      ] },
      DEFAULTS_SECTION,
    ] },
  "Company Regions": { kind: "Company Region", identity: ["name", "shortName", "description"], sections: [
    { id: "class", label: "Classification", fields: [
      { l: "Companies", v: "—", t: "read", src: "companies whose Company Region is this" },
    ] },
    DEFAULTS_SECTION,
  ] },
  "IC Elimination Groups": { kind: "IC Elimination Group", system: true, identity: ["name", "description"],
    sections: [
      { id: "class", label: "Classification", fields: [
        { l: "Consolidation Node", v: "Acme Consolidated (Group)", t: "read", src: "consolidation hierarchy" },
      ] },
    ] },
  "Accounts": { kind: "Account", identity: ["name", "shortName", "description"], sections: [
    { id: "class", label: "Classification", fields: [
      { l: "Company", v: "Acme Holdings", t: "select" },
      { l: "Account Rollup", v: "—", t: "select" },
    ] },
    { id: "acctdef", label: "Defaults", fields: [
      { l: "FX Rate Type", v: "Spot", t: "select" },
      { l: "Intercompany", t: "check" },
      { l: "Inactive", t: "check" },
      { l: "Default", t: "check" },
    ] },
  ] },
  "Account Rollups": { kind: "Account Rollup", identity: ["name", "shortName", "description"], sections: [
    { id: "class", label: "Classification", fields: [
      { l: "Accounts", v: "—", t: "read", src: "accounts that roll up here" },
      { l: "Account Type", v: "Asset", t: "select" },
      { l: "Account Meaning", v: "—", t: "select" },
      { l: "Cash Flow Rollup", v: "—", t: "select" },
    ] },
    { id: "reporting", label: "Reporting", fields: [
      { l: "Carries Balance", v: "Yes", t: "read", src: "Account Meaning" },
      { l: "Increase in Value is Favorable", v: "Yes", t: "read", src: "Account Meaning" },
      { l: "Metric Aggregation", v: "Sum", t: "select" },
      { l: "Default Time Metric", v: "Balance", t: "select" },
    ] },
    { id: "display", label: "Display & Formatting", fields: [
      { l: "Input Precision", v: "Currency Settings", t: "read", src: "Unit · Currency facade · per value" },
      { l: "Symbol", v: "$ (per value)", t: "read", src: "Unit · Currency facade" },
    ] },
    { id: "rolldef", label: "Defaults", fields: [
      { l: "FX Rate Type", v: "Spot", t: "select" },
      { l: "Intercompany", t: "check" },
      { l: "Inactive", t: "check" },
      { l: "Default", t: "check" },
    ] },
  ] },
  "Cash Flow Rollups": { kind: "Cash Flow Rollup", identity: ["name", "shortName", "description"], sections: [
    { id: "class", label: "Classification", fields: [{ l: "Cash Flow Category", v: "Cash", t: "select" }] },
    DEFAULTS_SECTION,
  ] },
  "Computed Accounts": { kind: "Computed Metric", identity: ["name", "shortName", "description"], sections: [
    { id: "reporting", label: "Reporting", fields: [
      { l: "Metric Aggregation", v: "None", t: "read", src: "recomputed from the formula, never summed" },
      { l: "Default Time Metric", v: "Net", t: "select" },
    ] },
    DEFAULTS_SECTION,
  ] },
  "Account Meanings": { kind: "Account Meaning", system: true, identity: ["name", "shortName", "description"], sections: [
    { id: "behav", label: "Behavioural Defaults", fields: [
      { l: "Carries Balance", v: "Yes", t: "read", src: "Account Meaning" },
      { l: "Increase in Value is Favorable", v: "Yes", t: "read", src: "Account Meaning" },
      { l: "Valid Cash Flow Categories", v: "Cash", t: "read", src: "M:N — system-defined" },
    ] },
  ] },
  "Account Types": { kind: "Account Type", system: true, identity: ["name", "description"], sections: [] },
  "Account Classes": { kind: "Account Class", system: true, identity: ["name", "description"], sections: [] },
  "Account Categories": { kind: "Account Category", system: true, identity: ["name", "description"], sections: [] },
  "Sign": { kind: "Sign", system: true, identity: ["name", "description"], sections: [] },
  "Sign Direction": { kind: "Sign Direction", system: true, identity: ["name", "description"], sections: [] },
  "Units of Measure": { kind: "Unit of Measure", identity: ["name", "description"], sections: [
    { id: "display", label: "Display & Formatting", fields: [
      { l: "Input Precision", v: "0 decimals", t: "select" },
      { l: "Symbol", v: "FTE", t: "select" },
    ] },
    DEFAULTS_SECTION,
  ] },
  "Currencies": { kind: "Currency", identity: ["name", "shortName", "description", "memo"], sections: [
    { id: "display", label: "Display & Formatting", fields: [
      { l: "Input Precision", v: "2 decimals", t: "read", src: "ISO 4217 minor units" },
      { l: "Rounding (display)", v: "Nearest 0.01", t: "select" },
      { l: "Symbol", v: "$ · currency.usd", t: "read", src: "Symbol Registry" },
      { l: "Symbol Placement", v: "Prefix — $1,234", t: "select" },
      { l: "Separators", v: "1,234.56 (comma / dot)", t: "select" },
      { l: "Negative Style", v: "(1,234.56) parentheses", t: "select" },
    ] },
    { id: "curdef", label: "Defaults", fields: [
      { l: "Default Currency", t: "check", v: true },
      { l: "Inactive", t: "check" },
    ] },
  ] },
  "FX Rate Types": { kind: "FX Rate Type", system: true, identity: ["name", "description"], sections: [] },
  "Versions": { kind: "Version", identity: ["name", "description"], sections: [
    { id: "class", label: "Classification", fields: [
      { l: "Version Type", v: "Budget", t: "select" },
      { l: "Input Basis", v: "Detail — DR · CR · NET", t: "select" },
    ] },
    { id: "verdef", label: "Defaults", fields: [
      { l: "Default Version", t: "check" },
      { l: "Locked", t: "check" },
      { l: "Inactive", t: "check" },
    ] },
  ] },
  "Version Types": { kind: "Version Type", identity: ["name", "description"], sections: [DEFAULTS_SECTION] },
  "Business Areas": { kind: "Business Area", identity: ["name", "description"], sections: [
    { id: "class", label: "Classification", fields: [{ l: "Business Area Type", v: "Cost Center", t: "select" }] },
    DEFAULTS_SECTION,
  ] },
  "Products & Services": { kind: "Product & Service", identity: ["name", "description"], sections: [
    { id: "class", label: "Classification", fields: [{ l: "Type", v: "Product", t: "select" }] },
    DEFAULTS_SECTION,
  ] },
  "Custom Rollups": { kind: "Custom Rollup", identity: ["name", "shortName", "description"], sections: [
    { id: "class", label: "Classification", fields: [
      { l: "Dimension Basis", v: "—", t: "select" },
      { l: "Members", v: "—", t: "read", src: "static membership" },
    ] },
    DEFAULTS_SECTION,
  ] },
  "Users": { kind: "User", identity: ["name", "shortName", "description"], sections: [
    { id: "class", label: "Classification", fields: [
      { l: "Role", v: "Viewer", t: "select" },
      { l: "Default Company", v: "Acme Holdings", t: "select" },
      { l: "Email", v: "", t: "text", note: "Sign-in identity; an invitation goes here" },
    ] },
    { id: "userdef", label: "Defaults", fields: [
      { l: "Inactive", t: "check" },
      { l: "Require MFA", t: "check", v: true },
    ] },
  ] },
  "Roles": { kind: "Role", identity: ["name", "shortName", "description"], sections: [
    { id: "class", label: "Classification", fields: [
      { l: "Mode Access", v: "DATA", t: "select" },
      { l: "Data Access", v: "Read-only", t: "select" },
      { l: "Users", v: "—", t: "read", src: "users who hold this role" },
    ] },
    DEFAULTS_SECTION,
  ] },
  "Posting Stages": { kind: "Posting Stage", identity: ["name", "description"], sections: [DEFAULTS_SECTION] },
  "Period Types": { kind: "Period Type", system: true, identity: ["name", "description"], sections: [] },
};

/* Custom Rollups appear under several domains; the basis differs per domain. */
export const ROLLUP_BASIS: Record<string, string> = {
  Company: "Company · Company Region",
  Account: "Account · Account Type",
  "Business Area": "Business Area",
  "Product & Service": "Products & Services · Type · Color · Size",
  Picklist: "Job Title · State · Ins. Carriers",
};

/* Fallback when the structure has no schema entry. */
export const GENERIC_SECTIONS: PropertySectionDef[] = [
  { id: "general", label: "General", fields: [
    { l: "Account Category", v: "Statistical", t: "select" },
    { l: "Account Type", v: "Amount", t: "select" },
    { l: "Posting sign", v: "Debit", t: "read" },
  ] },
];

/* A master list is a structure, not a member: identity plus one named gap. */
export const MASTER_SECTIONS: PropertySectionDef[] = [
  { id: "other", label: "Other Settings", fields: [], placeholder: true },
];

/*
 * A structure's own sections, with one Classification dropdown per child
 * structure appended after its fields (children classify their parent).
 */
export function schemaSectionsFor(structure: string | null, domain: string | null): PropertySectionDef[] {
  const schema = structure ? DIMENSION_SCHEMA[structure] : undefined;
  const sections = schema?.sections ?? [];
  const kids = domain && structure ? childrenOf(domain, structure) : [];
  if (!kids.length) return sections;
  const fields: PropertyFieldDef[] = kids.map((k) => ({ l: k.field, v: "—", t: "select" }));
  return sections.some((s) => s.id === "class")
    ? sections.map((s) => (s.id === "class" ? { ...s, fields: [...s.fields, ...fields] } : s))
    : [{ id: "class", label: "Classification", fields }, ...sections];
}

export function sectionsFor(master: boolean, structure: string | null, domain: string | null): PropertySectionDef[] {
  if (master) return MASTER_SECTIONS;
  const schema = structure ? DIMENSION_SCHEMA[structure] : undefined;
  if (!schema) return GENERIC_SECTIONS;
  const sections = schemaSectionsFor(structure, domain).map((sec) =>
    sec.id === "class" && structure === "Custom Rollups"
      ? { ...sec, fields: sec.fields.map((f) => (f.l === "Dimension Basis" ? { ...f, v: ROLLUP_BASIS[domain ?? ""] ?? "—" } : f)) }
      : sec);
  return [...sections, systemSection(Boolean(schema.system))];
}

/*
 * A member's own classification values over the structure's defaults, with
 * select choices from the structure that owns them. Fields the member has no
 * value for keep the schema's.
 */
export function withMemberValues(sections: PropertySectionDef[], attrs: Record<string, string> | undefined,
  options: Record<string, string[]>): PropertySectionDef[] {
  return sections.map((sec) => ({ ...sec, fields: sec.fields.map((f) => ({
    ...f,
    ...(attrs?.[f.l] !== undefined ? { v: attrs[f.l] } : null),
    ...(f.t === "select" && options[f.l] ? { opts: options[f.l] } : null),
  })) }));
}

/** A select's choices, current value first when the list does not hold it. */
export const choicesOf = (f: PropertyFieldDef): string[] => {
  const v = String(f.v ?? "—");
  return f.opts?.includes(v) ? f.opts : [v, ...(f.opts ?? [])];
};

/* The member shown in the demo is system-defined, so Delete is gated. */
export const DEMO_MEMBER = { structure: "Account", systemDefined: true, deleteReason: "System-defined — cannot be deleted." };
