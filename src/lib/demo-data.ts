/* Demo data. Shapes are contractual; companies come from the sample members. */

import { COMPANIES, MEMBER_VIEWS } from "./members";

export interface MasterMember {
  name: string;
  region: string;
}

/* The assign catalogue lists Companies by name, with their region. */
export const MASTER: MasterMember[] = COMPANIES.map((c) => ({ name: c.name, region: c.attrs?.["Company Region"] ?? "—" }));

export const STRUCTURES = ["Companies", "Accounts", "Drivers · Model A"];

export const VIEWS = ["All members", "Operating entities", "Eliminations only"] as const;
export type ViewName = (typeof VIEWS)[number];

export const inView = (view: string, m: MasterMember) =>
  view === "Operating entities" ? m.region !== "Global"
    : view === "Eliminations only" ? m.region === "Global"
    : true;

/*
 * The catalogue uses the same views as the members pane (MEMBER_VIEWS), so a
 * view reads the same everywhere. Unknown ids (new views) show everything.
 */
export const inCatalogueView = (viewId: string, m: MasterMember) => {
  const v = MEMBER_VIEWS.find((x) => x.id === viewId);
  const id = COMPANIES.find((c) => c.name === m.name)?.id;
  return !v || !id || v.ids.includes(id);
};

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
  { id: "v-core", name: "Core Operating Companies" },
  { id: "v-na", name: "North America" },
  { id: "v-emea", name: "EMEA Operations" },
];
