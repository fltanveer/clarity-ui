/*
 * POV axes — each is a VIEW, optionally narrowed to ONE MEMBER in it.
 * These scope which facts are queried; they never remove rows, so they render
 * as selectors, not removable filter chips.
 */

export interface PovView {
  id: string;
  name: string;
  members: string[];
  /** Saved views are filed like the members pane's; the full list stays unfiled. */
  folder?: string;
  /** rule = matches on a condition, static = a fixed list. */
  kind?: "rule" | "static";
  /** The structure's full list: locked, and always first. */
  system?: boolean;
}

export interface PovAxis {
  id: string;
  label: string;
  /** The model these views read. Shown locked: the axis decides it, not the picker. */
  source: string;
  views: PovView[];
}

export interface PovValue {
  viewId: string;
  /** Empty = the whole view. Otherwise the members chosen from it. */
  memberIds: string[];
}

export const POV_AXES: PovAxis[] = [
  /* CH-015 · "Report view" is the locked noun for Metric Layouts over Account Metrics. */
  { id: "reportView", label: "Report view", source: "Accounts", views: [
    { id: "all", name: "All accounts", system: true, members: ["Revenue", "Cost of revenue", "Opex", "Assets", "Liabilities", "Equity"] },
    { id: "is", name: "Income Statement", folder: "Statements", kind: "rule", members: ["Revenue", "Cost of revenue", "Opex"] },
    { id: "bs", name: "Balance Sheet", folder: "Statements", kind: "rule", members: ["Assets", "Liabilities", "Equity"] },
    { id: "cf", name: "Cash Flow", folder: "Statements", kind: "rule", members: ["Operating", "Investing", "Financing"] },
    { id: "opex", name: "Opex detail", folder: "Management", kind: "static", members: ["Payroll", "Marketing", "Facilities"] },
    { id: "kpi", name: "KPI accounts", folder: "Management", kind: "static", members: ["Headcount", "ARR"] } ] },
  { id: "companyView", label: "Company view", source: "Companies", views: [
    { id: "allc", name: "All companies", system: true, members: ["Acme US", "Acme Canada", "Acme Mexico", "Acme EMEA", "Acme UK"] },
    { id: "c1", name: "Company 1", folder: "Consolidation", kind: "static", members: ["Acme US", "Acme Canada"] },
    { id: "na", name: "North America", folder: "By region", kind: "rule", members: ["Acme US", "Acme Canada", "Acme Mexico"] } ] },
  { id: "version", label: "Version", source: "Versions", views: [
    { id: "v1", name: "Version 1", system: true, members: ["Working", "Submitted"] },
    { id: "act", name: "Actuals", folder: "Reported", kind: "rule", members: ["Posted"] },
    { id: "bud", name: "FY26 Budget", folder: "Planning", kind: "static", members: ["Draft", "Approved"] } ] },
  { id: "calendarYear", label: "Calendar year", source: "Calendar", views: [
    { id: "y24", name: "2024", members: ["Q1", "Q2", "Q3", "Q4"] },
    { id: "y25", name: "2025", members: ["Q1", "Q2", "Q3", "Q4"] },
    { id: "y26", name: "2026", members: ["Q1", "Q2", "Q3", "Q4"] } ] },
  { id: "currency", label: "Currency", source: "Currencies", views: [
    { id: "usd", name: "USD", members: ["Reporting", "Functional"] },
    { id: "eur", name: "EUR", members: ["Reporting", "Functional"] },
    { id: "gbp", name: "GBP", members: ["Reporting", "Functional"] } ] },
  { id: "entityView", label: "Entity view", source: "Entities", views: [
    { id: "alle", name: "All entities", system: true, members: ["Marketing", "R&D", "G&A"] },
    { id: "mkt", name: "Marketing", folder: "By function", kind: "rule", members: ["Brand", "Demand gen"] },
    { id: "rnd", name: "R&D", folder: "By function", kind: "rule", members: ["Platform", "Applied"] } ] },
];

export const initialPov = (): Record<string, PovValue> =>
  Object.fromEntries(POV_AXES.map((a) => [a.id, { viewId: a.views[0].id, memberIds: [] }]));
