/*
 * Members and views. Structures with sample data (Companies, Accounts and
 * their rollups, Users, Roles) get their own members; every other structure
 * falls back to generic stand-ins. IDs are stable; views resolve by id.
 */

import { CHILD_STRUCTURES } from "./nav";

export interface Member {
  id: string;
  name: string;
  /** Short name — the grid's Code column. */
  code: string;
  type: "Standard" | "System" | "Computed";
  /** System-defined: cannot be deleted. */
  locked: boolean;
  description?: string;
  /** Classification values by property label, e.g. { "Company Region": "Europe" }. */
  attrs?: Record<string, string>;
}

/* Generic stand-ins for structures that have no sample data yet. */
export const MEMBERS: Member[] = [
  { id: "acme-us", name: "Member A", code: "MBR-A", type: "Standard", locked: false },
  { id: "acme-emea", name: "Member B", code: "MBR-B", type: "Standard", locked: false },
  { id: "acme-apac", name: "Member C", code: "MBR-C", type: "Standard", locked: false },
  { id: "elim", name: "Member D", code: "MBR-D", type: "System", locked: true },
  { id: "consol", name: "Member E", code: "MBR-E", type: "Computed", locked: true },
];

/*
 * Sample members (ClarityOS_Sample_Members). Names, short names, descriptions
 * and relationships are the sample's; ids are ours and stable.
 */
type Row = [id: string, name: string, code: string, description: string, attrs?: Record<string, string>];
const rows = (list: Row[], type: Member["type"] = "Standard", locked = false): Member[] =>
  list.map(([id, name, code, description, attrs]) => ({ id, name, code, description, type, locked, ...(attrs ? { attrs } : null) }));

export const REGIONS = rows([
  ["rg-glb", "Global", "GLB", "Group-wide designation spanning all operating regions"],
  ["rg-na", "North America", "NA", "Companies operating in the United States and Canada"],
  ["rg-eu", "Europe", "EU", "Companies operating across continental Europe"],
  ["rg-uk", "United Kingdom", "UK", "Companies operating in the United Kingdom"],
  ["rg-me", "Middle East", "ME", "Companies operating in Middle Eastern markets"],
  ["rg-apac", "Asia Pacific", "APAC", "Companies operating across Asia and the Pacific"],
]);

const region = (r: string) => ({ "Company Region": r });
/* The holding company is the enforced default company: renamable, never deletable. */
export const COMPANIES = rows([
  ["co-hold", "Acme Holdings Inc.", "Acme Holdings", "Parent holding company for the Acme Group", region("Global")],
  ["co-na", "Acme North America Inc.", "Acme NA", "North American operating company", region("North America")],
  ["co-eu", "Acme Europe Ltd.", "Acme Europe", "European regional operating company", region("Europe")],
  ["co-uk", "Acme UK Ltd.", "Acme UK", "United Kingdom sales and distribution company", region("United Kingdom")],
  ["co-de", "Acme Germany GmbH", "Acme DE", "German operating company", region("Europe")],
  ["co-il", "Acme Israel Ltd.", "Acme IL", "Israel technology and R&D company", region("Middle East")],
  ["co-apac", "Acme Asia Pacific Pte. Ltd.", "Acme APAC", "Asia-Pacific regional operating company", region("Asia Pacific")],
  ["co-svc", "Acme Services LLC", "Acme Services", "Shared-services company for the group", region("North America")],
]).map((c) => (c.id === "co-hold" ? { ...c, locked: true } : c));

/* Each region lists the companies that name it as their Company Region. */
export const COMPANY_REGIONS: Member[] = REGIONS.map((r) => ({ ...r, attrs: {
  Companies: COMPANIES.filter((c) => c.attrs?.["Company Region"] === r.name).map((c) => c.code).join("; ") || "—",
} }));

/* Company groups: static memberships over Companies, listed by short name as the sample does. */
const GROUPS: Array<[id: string, name: string, code: string, description: string, ids: string[]]> = [
  ["cg-group", "Consolidated Group", "Group", "All companies included in group consolidation", COMPANIES.map((c) => c.id)],
  ["cg-core", "Core Operating Companies", "Core Ops", "Primary revenue-generating operating companies", ["co-na", "co-eu", "co-uk", "co-de", "co-apac"]],
  ["cg-intl", "International Operations", "International", "Operating companies outside North America", ["co-eu", "co-uk", "co-de", "co-il", "co-apac"]],
  ["cg-emea", "EMEA Operations", "EMEA", "European and Middle Eastern operating companies", ["co-eu", "co-uk", "co-de", "co-il"]],
];

export const ACCOUNTS = rows([
  ["ac-cash", "Cash at Bank", "Cash", "Cash held in operating bank accounts", { "Account Rollup": "Cash & Cash Equivalents" }],
  ["ac-ar", "Accounts Receivable", "A/R", "Amounts due from customers", { "Account Rollup": "Current Assets" }],
  ["ac-inv", "Inventory", "Inventory", "Inventory held for sale or production", { "Account Rollup": "Current Assets" }],
  ["ac-ap", "Accounts Payable", "A/P", "Amounts owed to suppliers and vendors", { "Account Rollup": "Current Liabilities" }],
  ["ac-prev", "Product Revenue", "Product Rev", "Revenue generated from product sales", { "Account Rollup": "Revenue" }],
  ["ac-srev", "Service Revenue", "Service Rev", "Revenue generated from services", { "Account Rollup": "Revenue" }],
  ["ac-cogs", "Cost of Goods Sold", "COGS", "Direct costs attributable to products sold", { "Account Rollup": "Cost of Sales" }],
  ["ac-pay", "Salaries & Wages", "Payroll", "Employee salary and wage expense", { "Account Rollup": "Operating Expenses" }],
  ["ac-rent", "Rent & Occupancy", "Rent", "Office, warehouse and facility occupancy costs", { "Account Rollup": "Operating Expenses" }],
  ["ac-re", "Retained Earnings", "RE", "Accumulated earnings retained by the business", { "Account Rollup": "Equity" }],
]);

const namesOf = (ids: string[]) => ids.map((id) => ACCOUNTS.find((a) => a.id === id)?.name ?? id).join("; ");
const rollup = (accounts: string[], meaning: string, cashFlow: string) =>
  ({ Accounts: namesOf(accounts), "Account Meaning": meaning, "Cash Flow Rollup": cashFlow });
export const ACCOUNT_ROLLUPS = rows([
  ["ar-cash", "Cash & Cash Equivalents", "Cash", "Structured aggregation of cash accounts", rollup(["ac-cash"], "Cash", "Operating Activities")],
  ["ar-ca", "Current Assets", "Curr. Assets", "Structured aggregation of current asset accounts", rollup(["ac-ar", "ac-inv"], "Asset", "Working Capital Changes")],
  ["ar-cl", "Current Liabilities", "Curr. Liab.", "Structured aggregation of current liability accounts", rollup(["ac-ap"], "Liability", "Working Capital Changes")],
  ["ar-rev", "Revenue", "Revenue", "Structured aggregation of revenue accounts", rollup(["ac-prev", "ac-srev"], "Revenue", "Operating Activities")],
  ["ar-cos", "Cost of Sales", "COS", "Structured aggregation of direct cost accounts", rollup(["ac-cogs"], "Direct Cost", "Operating Activities")],
  ["ar-opex", "Operating Expenses", "OpEx", "Structured aggregation of operating expense accounts", rollup(["ac-pay", "ac-rent"], "Operating Expense", "Operating Activities")],
  ["ar-eq", "Equity", "Equity", "Structured aggregation of equity accounts", rollup(["ac-re"], "Equity", "Financing Activities")],
]);

export const CASH_FLOW_ROLLUPS = rows([
  ["cf-cfo", "Operating Activities", "CFO", "Cash flows generated or consumed by normal operations"],
  ["cf-cfi", "Investing Activities", "CFI", "Cash flows from investments and long-term assets"],
  ["cf-cff", "Financing Activities", "CFF", "Cash flows from debt, equity and distributions"],
  ["cf-wc", "Working Capital Changes", "WC Change", "Cash impact from movements in operating assets and liabilities"],
  ["cf-capex", "Capital Expenditures", "CapEx", "Cash spent acquiring long-term assets"],
  ["cf-debt", "Debt Proceeds & Repayments", "Debt", "Cash received from or paid toward borrowings"],
  ["cf-net", "Net Change in Cash", "Net Cash", "Net movement in cash during the reporting period"],
]);

/* Account Meanings are system-defined: they carry behaviour, so they cannot be deleted. */
export const ACCOUNT_MEANINGS = rows([
  ["am-cash", "Cash", "Cash", "Monetary asset available for immediate use"],
  ["am-asset", "Asset", "Asset", "Economic resource controlled by the business"],
  ["am-liab", "Liability", "Liability", "Present financial obligation of the business"],
  ["am-rec", "Receivable", "AR", "Amount expected to be collected from another party"],
  ["am-pay", "Payable", "AP", "Amount owed to another party"],
  ["am-rev", "Revenue", "Rev", "Income generated through business activities"],
  ["am-dc", "Direct Cost", "Direct Cost", "Cost directly attributable to generating revenue"],
  ["am-opex", "Operating Expense", "OpEx", "Cost incurred through normal business operations"],
  ["am-debt", "Debt", "Debt", "Interest-bearing financial obligation"],
  ["am-eq", "Equity", "Equity", "Residual ownership interest in the business"],
], "System", true);

export const COMPUTED_ACCOUNTS = rows([
  ["ca-gp", "Gross Profit", "GP", "Revenue less cost of goods or services sold"],
  ["ca-gm", "Gross Margin %", "GM%", "Gross profit expressed as a percentage of revenue"],
  ["ca-ebitda", "EBITDA", "EBITDA", "Earnings before interest, taxes, depreciation and amortization"],
  ["ca-ebitdam", "EBITDA Margin %", "EBITDA%", "EBITDA expressed as a percentage of revenue"],
  ["ca-ebit", "Operating Profit", "EBIT", "Profit after operating expenses and before financing and tax"],
  ["ca-ebitm", "Operating Margin %", "EBIT%", "Operating profit expressed as a percentage of revenue"],
  ["ca-nwc", "Net Working Capital", "NWC", "Current operating assets less current operating liabilities"],
  ["ca-roi", "Return on Investment", "ROI", "Return generated relative to invested capital"],
], "Computed");

/* Account groups: unstructured management groupings, i.e. Custom Rollups over Accounts. */
const ACCOUNT_GROUPS: Array<[id: string, name: string, code: string, description: string, ids: string[]]> = [
  ["ag-ebitda", "EBITDA Operating Accounts", "EBITDA Ops", "Unstructured management grouping of accounts relevant to EBITDA analysis", ["ac-prev", "ac-srev", "ac-cogs", "ac-pay", "ac-rent"]],
  ["ag-people", "People Costs", "People Costs", "Unstructured management grouping of workforce-related accounts", ["ac-pay"]],
  ["ag-core", "Core Operating Costs", "Core Op Costs", "Selected accounts used to analyze core operating expenditure", ["ac-cogs", "ac-pay", "ac-rent"]],
  ["ag-wc", "Working Capital", "Working Capital", "Selected operating accounts used for working-capital analysis", ["ac-ar", "ac-inv", "ac-ap"]],
];

/*
 * Users. Names, short names and descriptions are the sample's; role, default
 * company and email are inferred from each person's job, since the sample
 * does not pair them. Emails use the reserved example domain.
 */
const user = (role: string, company: string, email: string) => ({ Role: role, "Default Company": company, Email: `${email}@acme.example` });
export const USERS = rows([
  ["us-olivia", "Olivia Numbers", "Olivia", "Group CFO who likes the numbers reconciled before the coffee arrives", user("Approver", "Acme Holdings", "olivia.numbers")],
  ["us-penny", "Penny Ledger", "Penny", "Group Controller and guardian of the monthly close", user("Controller", "Acme Holdings", "penny.ledger")],
  ["us-cash", "Cash King", "Cash", "Treasury Manager who always knows where the money is", user("Contributor", "Acme Services", "cash.king")],
  ["us-victor", "Victor Variance", "Victor", "FP&A Director who wants an explanation for every variance", user("Modeler", "Acme Holdings", "victor.variance")],
  ["us-connie", "Connie Consolidation", "Connie", "Consolidation Manager keeping eight companies speaking one financial language", user("Finance Administrator", "Acme Holdings", "connie.consolidation")],
  ["us-manny", "Manny Operations", "Manny", "Operations Manager responsible for departmental plans", user("Planner", "Acme NA", "manny.operations")],
  ["us-sally", "Sally Sales", "Sally", "Sales Director who insists this quarter really will beat forecast", user("Contributor", "Acme NA", "sally.sales")],
  ["us-benny", "Benny Budget", "Benny", "Finance Manager who knows exactly where every department overspent", user("Planner", "Acme UK", "benny.budget")],
  ["us-rachel", "Rachel Revenue", "Rachel", "Commercial Finance Manager keeping sales forecasts grounded in reality", user("Analyst", "Acme Europe", "rachel.revenue")],
  ["us-alex", "Alex Admin", "Alex", "Platform Administrator who keeps everyone else away from the dangerous buttons", user("Platform Administrator", "Acme Services", "alex.admin")],
]);

/*
 * Roles. Mode access follows the three-mode ladder (DATA → MODEL → L100) and
 * data access what the role may do with values; both are read from each
 * role's description. Users is derived from the users that hold the role.
 */
const role = (mode: string, data: string) => ({ "Mode Access": mode, "Data Access": data });
const ROLE_ROWS = rows([
  ["ro-platform", "Platform Administrator", "Platform Admin", "Manages platform-level configuration and privileged operations", role("L100 · Structure Administration", "Edit")],
  ["ro-finance", "Finance Administrator", "Finance Admin", "Manages finance configuration and controlled finance processes", role("MODEL", "Edit")],
  ["ro-controller", "Controller", "Controller", "Oversees accounting, close, controls and financial governance", role("MODEL", "Approve")],
  ["ro-modeler", "Modeler", "Modeler", "Creates and maintains models and planning configuration", role("MODEL", "Edit")],
  ["ro-planner", "Planner", "Planner", "Enters and manages plans and forecasts within assigned scope", role("DATA", "Edit")],
  ["ro-approver", "Approver", "Approver", "Reviews and approves submitted financial or planning information", role("DATA", "Approve")],
  ["ro-analyst", "Analyst", "Analyst", "Analyzes financial information and creates permitted reporting views", role("DATA", "Read-only")],
  ["ro-contributor", "Contributor", "Contributor", "Enters or updates information within an assigned area", role("DATA", "Edit")],
  ["ro-viewer", "Viewer", "Viewer", "Read-only access to permitted information", role("DATA", "Read-only")],
]);
/* The platform role cannot be deleted: something must always hold L100. */
export const ROLES: Member[] = ROLE_ROWS.map((r) => ({
  ...r, locked: r.id === "ro-platform",
  attrs: { ...r.attrs, Users: USERS.filter((u) => u.attrs?.Role === r.name).map((u) => u.code).join("; ") || "—" },
}));

const groupRows = (list: typeof GROUPS, of: Member[]) =>
  rows(list.map(([id, name, code, description, ids]): Row =>
    [id, name, code, description, { Members: ids.map((i) => of.find((m) => m.id === i)?.code ?? i).join("; ") }]));
export const COMPANY_GROUPS = groupRows(GROUPS, COMPANIES);
export const ACCOUNT_GROUP_MEMBERS = groupRows(ACCOUNT_GROUPS, ACCOUNTS);

/* Keyed "Domain:Structure" — Custom Rollups exist under several domains. */
const BY_STRUCTURE: Record<string, Member[]> = {
  "Company:Companies": COMPANIES,
  "Company:Company Regions": COMPANY_REGIONS,
  "Company:Custom Rollups": COMPANY_GROUPS,
  "Account:Accounts": ACCOUNTS,
  "Account:Account Rollups": ACCOUNT_ROLLUPS,
  "Account:Cash Flow Rollups": CASH_FLOW_ROLLUPS,
  "Account:Account Meanings": ACCOUNT_MEANINGS,
  "Account:Computed Accounts": COMPUTED_ACCOUNTS,
  "Account:Custom Rollups": ACCOUNT_GROUP_MEMBERS,
  "User:Users": USERS,
  "Role:Roles": ROLES,
};

/* No structure yet (a new domain): nothing to list, not stand-ins. */
export const membersFor = (domain: string | null, structure: string | null): Member[] =>
  structure === null ? [] : BY_STRUCTURE[`${domain}:${structure}`] ?? MEMBERS;

const ALL = [...MEMBERS, ...Object.values(BY_STRUCTURE).flat()];

/* Options for a classification select, from the structure that owns the values. */
export const OPTIONS: Record<string, string[]> = {
  /* Each child structure's members are the choices for the field it adds to its parent. */
  ...Object.fromEntries(Object.entries(CHILD_STRUCTURES).map(([key, c]) => {
    const [domain, structure] = key.split(":");
    return [c.field, membersFor(domain, structure).map((m) => m.name)];
  })),
  "Account Rollup": ACCOUNT_ROLLUPS.map((r) => r.name),
  "Account Meaning": ACCOUNT_MEANINGS.map((r) => r.name),
  "Cash Flow Rollup": CASH_FLOW_ROLLUPS.map((r) => r.name),
  Company: COMPANIES.map((c) => c.code),
  "Default Company": COMPANIES.map((c) => c.code),
  Role: ROLE_ROWS.map((r) => r.name),
  "Mode Access": ["DATA", "MODEL", "L100 · Structure Administration"],
  "Data Access": ["Read-only", "Edit", "Approve"],
};

export type RuleField = "type" | "locked" | "name" | "code" | "region";
export interface ViewRule { field: RuleField; op: string; value: string }

export const RULE_FIELDS: Record<RuleField, { label: string; ops: string[]; values?: string[] }> = {
  type: { label: "Type", ops: ["is", "is not"], values: ["Standard", "System", "Computed"] },
  locked: { label: "System-defined", ops: ["is"], values: ["Yes", "No"] },
  name: { label: "Name", ops: ["contains", "starts with"] },
  code: { label: "Code", ops: ["contains", "starts with"] },
  region: { label: "Company Region", ops: ["is", "is not"], values: REGIONS.map((r) => r.name) },
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
    const a = (r.field === "locked" ? (m.locked ? "Yes" : "No")
      : r.field === "region" ? m.attrs?.["Company Region"] ?? ""
      : String(m[r.field])).toLowerCase();
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

const MASTER_VIEW = (on: string, ids: string[]): MemberView => ({
  id: "master", name: "Master list", on, folder: null, system: true, kind: "rule", match: "all", rules: [],
  description: "Every member of the structure. Maintained by ClarityOS.", owner: "ClarityOS", updated: "18 Aug 2026",
  uuid: "0b6d1f3e-2c1a-4e0f-9a51-6d0c2f9b1a00", ids,
});
const byRegion = (r: string) => COMPANIES.filter((c) => c.attrs?.["Company Region"] === r).map((c) => c.id);
const group = (id: string) => GROUPS.find((g) => g[0] === id)!;

/* Unfiled first; Master list is unfiled and must stay at the top. */
export const MEMBER_VIEWS: MemberView[] = [
  MASTER_VIEW("Companies", COMPANIES.map((c) => c.id)),
  ...(["cg-core", "cg-intl", "cg-emea"] as const).map((gid, i): MemberView => {
    const [, name, , description, ids] = group(gid);
    return { id: gid, name, on: "Custom Rollups", folder: "Company groups", kind: "static", description, ids,
      owner: i === 0 ? "Connie Consolidation" : "Penny Ledger", updated: "04 Aug 2026",
      uuid: `5a2e9c41-7b3d-4f6a-8e21-3c9d0b7f4e1${i}` };
  }),
  ...REGIONS.map((r, i): MemberView => ({
    id: r.id, name: r.name, on: "Company Regions", folder: "By region", kind: "rule", match: "all",
    rules: [{ field: "region", op: "is", value: r.name }], description: r.description, owner: "Connie Consolidation", updated: "12 May 2026",
    uuid: `1e3a5c7d-9b0f-4d2e-8a6c-4b1d3f5e7a9${i}`, ids: byRegion(r.name),
  })).filter((v) => v.ids.length),
];

const ACCOUNT_VIEWS: MemberView[] = [
  MASTER_VIEW("Accounts", ACCOUNTS.map((a) => a.id)),
  { id: "is", name: "Income Statement", on: "Account Rollups", folder: "Statements", kind: "static", owner: "Victor Variance", updated: "04 Aug 2026",
    description: "Revenue, direct cost and operating expense accounts.", uuid: "9d4b7e20-1f8c-4a3e-b6d5-2e7a9c0f3b40",
    ids: ["ac-prev", "ac-srev", "ac-cogs", "ac-pay", "ac-rent"] },
  { id: "bs", name: "Balance Sheet", on: "Account Rollups", folder: "Statements", kind: "static", owner: "Penny Ledger", updated: "04 Aug 2026",
    description: "Asset, liability and equity accounts.", uuid: "9d4b7e20-1f8c-4a3e-b6d5-2e7a9c0f3b41",
    ids: ["ac-cash", "ac-ar", "ac-inv", "ac-ap", "ac-re"] },
  ...ACCOUNT_GROUPS.map(([id, name, , description, ids], i): MemberView => ({
    id, name, on: "Custom Rollups", folder: "Management", kind: "static", description, ids,
    owner: "Victor Variance", updated: "21 Jul 2026", uuid: `c7f1e0a2-49bd-4e77-9a10-6f2b83c41d5${i}`,
  })),
];

/** Search box appears in the view picker only above this many views. */
export const VIEW_SEARCH_MIN = 6;

export const memberById = (id: string | null) => ALL.find((m) => m.id === id) ?? null;

/** Views seeded for a structure: the sample sets for Companies and Accounts, Master list elsewhere. */
export const defaultViews = (domain: string | null, structure: string | null): MemberView[] =>
  domain === "Company" && structure === "Companies" ? MEMBER_VIEWS
    : domain === "Account" && structure === "Accounts" ? ACCOUNT_VIEWS
    : [MASTER_VIEW(structure ?? "Structure", membersFor(domain, structure).map((m) => m.id))];
