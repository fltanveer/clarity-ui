/*
 * POV axes — each is a VIEW, optionally narrowed to ONE MEMBER in it.
 * These scope which facts are queried; they never remove rows, so they render
 * as selectors, not removable filter chips.
 */

export interface PovView {
  id: string;
  name: string;
  members: string[];
}

export interface PovAxis {
  id: string;
  label: string;
  views: PovView[];
}

export interface PovValue {
  viewId: string;
  memberId: string | null;
}

export const POV_AXES: PovAxis[] = [
  /* CH-015 · "Report view" is the locked noun for Metric Layouts over Account Metrics. */
  { id: "reportView", label: "Report view", views: [
    { id: "is", name: "Income Statement", members: ["Revenue", "Cost of revenue", "Opex"] },
    { id: "bs", name: "Balance Sheet", members: ["Assets", "Liabilities", "Equity"] },
    { id: "cf", name: "Cash Flow", members: ["Operating", "Investing", "Financing"] },
    { id: "all", name: "All accounts", members: ["Member A", "Member B", "Member C"] } ] },
  { id: "companyView", label: "Company view", views: [
    { id: "c1", name: "Company 1", members: ["Acme US", "Acme Canada"] },
    { id: "allc", name: "All companies", members: ["Acme US", "Acme Canada", "Acme Mexico", "Acme EMEA", "Acme UK"] },
    { id: "na", name: "North America", members: ["Acme US", "Acme Canada", "Acme Mexico"] } ] },
  { id: "version", label: "Version", views: [
    { id: "v1", name: "Version 1", members: ["Working", "Submitted"] },
    { id: "act", name: "Actuals", members: ["Posted"] },
    { id: "bud", name: "FY26 Budget", members: ["Draft", "Approved"] } ] },
  { id: "calendarYear", label: "Calendar year", views: [
    { id: "y24", name: "2024", members: ["Q1", "Q2", "Q3", "Q4"] },
    { id: "y25", name: "2025", members: ["Q1", "Q2", "Q3", "Q4"] },
    { id: "y26", name: "2026", members: ["Q1", "Q2", "Q3", "Q4"] } ] },
  { id: "currency", label: "Currency", views: [
    { id: "usd", name: "USD", members: ["Reporting", "Functional"] },
    { id: "eur", name: "EUR", members: ["Reporting", "Functional"] },
    { id: "gbp", name: "GBP", members: ["Reporting", "Functional"] } ] },
  { id: "entityView", label: "Entity view", views: [
    { id: "mkt", name: "Marketing", members: ["Brand", "Demand gen"] },
    { id: "rnd", name: "R&D", members: ["Platform", "Applied"] },
    { id: "alle", name: "All entities", members: ["Marketing", "R&D", "G&A"] } ] },
];

export const initialPov = (): Record<string, PovValue> =>
  Object.fromEntries(POV_AXES.map((a) => [a.id, { viewId: a.views[0].id, memberId: null }]));
