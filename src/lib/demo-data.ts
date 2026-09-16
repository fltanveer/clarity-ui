/* Synthetic demo data. Shapes are contractual; entries are stand-ins. */

export interface MasterMember {
  name: string;
  region: string;
}

export const MASTER: MasterMember[] = [
  { name: "Acme US Corporation", region: "North America" },
  { name: "Acme Canada Ltd.", region: "North America" },
  { name: "Acme Mexico S.A.", region: "North America" },
  { name: "Acme EMEA Holdings B.V.", region: "EMEA" },
  { name: "Acme UK Ltd.", region: "EMEA" },
  { name: "Acme APAC Pte. Ltd.", region: "APAC" },
  { name: "Intercompany eliminations", region: "Not applicable" },
  { name: "Acme Group consolidated", region: "Not applicable" },
];

export const STRUCTURES = ["Companies", "Accounts", "Drivers · Model A"];

export const VIEWS = ["All members", "Operating entities", "Eliminations only"] as const;
export type ViewName = (typeof VIEWS)[number];

export const inView = (view: string, m: MasterMember) =>
  view === "Operating entities" ? m.region !== "Not applicable"
    : view === "Eliminations only" ? m.region === "Not applicable"
    : true;

/*
 * The catalogue uses the same views as the members pane (MEMBER_VIEWS), so a
 * view reads the same everywhere. Its fixture is different, so each view id
 * gets a rule over these companies; unknown ids (new views) show everything.
 */
const CATALOGUE_VIEW_RULES: Record<string, (m: MasterMember) => boolean> = {
  master: () => true,
  opco: (m) => m.region !== "Not applicable",
  elims: (m) => m.region === "Not applicable",
  acq: (m) => m.name === "Acme EMEA Holdings B.V." || m.name === "Acme APAC Pte. Ltd.",
  na: (m) => m.region === "North America",
  emea: (m) => m.region === "EMEA",
  dormant: (m) => m.name === "Intercompany eliminations",
  audit: (m) => m.name !== "Intercompany eliminations",
};
export const inCatalogueView = (viewId: string, m: MasterMember) => (CATALOGUE_VIEW_RULES[viewId] ?? (() => true))(m);

export interface ScopeMember {
  name: string;
  depth: number;
}

export const SCOPE_MEMBERS: ScopeMember[] = [
  { name: "Default entity", depth: 0 },
  { name: "Corp", depth: 0 },
  { name: "Admin", depth: 1 },
  { name: "Marketing", depth: 1 },
  { name: "R&D", depth: 1 },
  { name: "EMEA", depth: 0 },
];

export const SCOPE_VIEWS = ["All members", "Top level only", "Departments only"] as const;

export const inScopeView = (view: string, m: ScopeMember) =>
  view === "Top level only" ? m.depth === 0
    : view === "Departments only" ? m.depth > 0
    : true;

export interface SavedView {
  id: string;
  name: string;
}

/* User-created views for the current list. System views are excluded by the host. */
export const SAVED_VIEWS: SavedView[] = [
  { id: "v-opco", name: "Operating companies" },
  { id: "v-na", name: "North America only" },
  { id: "v-board", name: "Board pack entities" },
];
