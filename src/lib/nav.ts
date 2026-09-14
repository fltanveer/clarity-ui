/*
 * Navigation fixture — transplanted from Prototype 3, which took it verbatim
 * from Golden Skeleton v4 (founder-ruled). Labels, ids, order and '|' zone
 * pipes are the ruling; reconcile the application to them, not the reverse.
 * '+' tokens are not tabs: they become the pinned add control.
 */
import {
  ArrowLeftRight, BarChart3, Activity, DollarSign, GitBranch, LayoutGrid, Server,
  Shield, Sliders, Wrench, type LucideIcon,
} from "lucide-react";

export type WorkspaceId =
  | "insights" | "operational" | "financial" | "drivers" | "dimensions"
  | "workflow" | "security" | "importExport" | "maintenance" | "platform";

export type RailItem = { type: "divider" } | { type?: undefined; id: WorkspaceId; label: string };

export const WORKSPACES: RailItem[] = [
  { id: "insights", label: "Insights" },
  { type: "divider" },
  { id: "operational", label: "Operational" },
  { id: "financial", label: "Financial" },
  { type: "divider" },
  { id: "drivers", label: "Drivers" },
  { id: "dimensions", label: "Dimensions" },
  { type: "divider" },
  { id: "workflow", label: "Workflow" },
  { id: "security", label: "Security" },
  { type: "divider" },
  { id: "importExport", label: "Import / Export" },
  { type: "divider" },
  { id: "maintenance", label: "Maintenance" },
  /* Operator build: Platform is the door to Structure Administration (L100). */
  { type: "divider" },
  { id: "platform", label: "Platform" },
];

export const WORKSPACE_ICON: Record<WorkspaceId, LucideIcon> = {
  insights: BarChart3, operational: Activity, financial: DollarSign,
  drivers: Sliders, dimensions: LayoutGrid, workflow: GitBranch,
  security: Shield, importExport: ArrowLeftRight, maintenance: Wrench, platform: Server,
};

export const workspaceLabel = (id: WorkspaceId) =>
  (WORKSPACES.find((w) => w.type !== "divider" && w.id === id) as { label: string } | undefined)?.label ?? id;

/* Row 2 · domains per workspace */
export const TOP_TABS: Record<string, string[]> = {
  insights: ["Executive", "Board", "Finance", "Operations", "+ Add Collection"],
  operational: ["Revenue", "Cost", "|", "Expense", "Workforce", "|", "Asset", "Financing", "Equity"],
  financial: ["Ledger", "|", "Adjustment", "Consolidation"],
  drivers: ["Lookup", "Schedule", "|", "Custom", "Time", "|", "Smart"],
  dimensions: ["Company", "Account", "Calendar", "Currency", "Version", "Product & Service", "Business Area", "|", "Picklist", "|", "+ Add Dimension"],
  workflow: ["Task"],
  importExport: ["Import", "Export"],
  security: ["User", "Role", "|", "Activity"],
  maintenance: ["Setting"],
};

/* Row 5 · structures per domain */
export const BOTTOM_TABS: Record<string, string[]> = {
  Ledger: ["Ledger Summary", "Ledger Transactions"],
  Adjustment: ["Adjustment Journals", "Reclassifications", "Top-Down Allocations", "|", "FX Translation", "OCI / CTA", "Derivatives", "|", "Retained Earnings"],
  Consolidation: ["Consolidation Factor", "|", "Intercompany", "Investment Elimination", "|", "NCI", "Consolidation Goodwill"],
  Company: ["Companies", "IC Elimination Groups", "+", "|", "Custom Rollups"],
  Revenue: ["Revenues", "+"],
  Cost: ["Costs", "WIP", "Inventory"],
  Expense: ["Opex", "Prepaid", "Accruals", "+"],
  Workforce: ["Workforce Model", "+"],
  Asset: ["CapEx", "Intangible", "Properties", "Equipment", "Software & License", "Goodwill", "+"],
  Financing: ["Loans", "Credit Lines", "+"],
  Equity: ["Stock & Equity", "Dividend", "Share", "Capital Raise", "Regular", "+"],
  Lookup: ["Value Lookups", "Date Lookups", "|", "FX Rates", "P&S Composition", "|", "Tiered Tables", "Thresholds"],
  Schedule: ["Breakback", "Recognition", "Depreciation", "|", "Activity Cycle"],
  Custom: ["Custom Drivers", "Driver Sets"],
  Time: ["Time Metrics"],
  Smart: ["FX Conversion", "P&S Demand", "Financial Models"],
  "Business Area": ["Business Areas", "+", "|", "Custom Rollups"],
  Calendar: ["Gregorian Calendar", "|", "CY", "+", "|", "Posting Stages", "Period Types"],
  Currency: ["Currencies", "|", "FX Rate Types"],
  Version: ["Versions", "|", "Version Types"],
  Account: ["Accounts", "|", "Account Rollups", "Cash Flow Rollups", "Custom Rollups", "Computed Accounts", "|", "Account Meanings", "|", "Account Types", "Account Classes", "Account Categories", "Sign", "Sign Direction", "Units of Measure"],
  "Product & Service": ["Products & Services", "+", "|", "Custom Rollups"],
  Picklist: ["+", "|", "Custom Rollups"],
  Task: ["Tasks"],
  User: ["Users"],
  Role: ["Roles"],
  Activity: ["Activity Log"],
  Import: ["Financial Activities", "Operational Assumptions", "Lookup Tables", "|", "Dimensions"],
  Export: ["Financial Activities", "Operational Assumptions", "Lookup Tables", "|", "Dimensions"],
  Setting: ["System Settings"],
};

/* 'Must exist, cannot be deleted' — rename stays open. Keyed Domain:Structure. */
export const NON_DELETABLE_STRUCTURES = new Set([
  "Revenue:Revenues", "Cost:Costs", "Cost:WIP", "Cost:Inventory", "Expense:Opex",
  "Workforce:Workforce Model", "Asset:CapEx", "Financing:Loans", "Equity:Stock & Equity",
]);

/* Structure-closed domains: no structure management, even at L100. */
export const CLOSED_DOMAINS = new Set(["Account", "Currency", "Version"]);

export const isPipe = (t: string) => t === "|";
export const isAddToken = (t: string) => t.startsWith("+");

export const firstDomain = (workspace: WorkspaceId) =>
  (TOP_TABS[workspace] ?? []).find((t) => !isPipe(t) && !isAddToken(t)) ?? null;

export const firstStructure = (domain: string | null) =>
  (domain ? BOTTOM_TABS[domain] ?? [] : []).find((t) => !isPipe(t) && !isAddToken(t)) ?? null;

/* Structure-bar add label, ruled per domain (Golden Skeleton). */
export function plusLabel(workspace: WorkspaceId, domain: string | null): string | null {
  if (workspace === "insights") return null;
  if (domain === "Calendar") return "Add Calendar";
  if (domain === "Picklist") return "Add Picklist";
  if (workspace === "operational") return "New Model";
  return "Add Subcategory";
}

/*
 * Header context selectors — three places only (Golden Skeleton §6):
 * Operational and Financial get Company + Version; Dimensions › Account gets
 * Company only. Everywhere else they are absent, never disabled.
 */
export function contextSelectors(workspace: WorkspaceId, domain: string | null) {
  if (workspace === "operational" || workspace === "financial") return { company: true, version: true };
  if (workspace === "dimensions" && domain === "Account") return { company: true, version: false };
  return null;
}
