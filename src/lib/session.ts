/* Session switcher fixture — Subscriber → Plan. Plan rows are name-only (ruled). */

export const USER = { name: "Jack Davidson", email: "jack@clarityos.com", initials: "JD" };

export interface Plan {
  id: string;
  name: string;
  current?: boolean;
}

/** The signed-in user's role in a company. Admin may change company settings; Member may not. */
export type CompanyRole = "Admin" | "Member";

export interface Subscriber {
  id: string;
  name: string;
  planLimit: number;
  /** The signed-in user's role here. Fixture until Security › Users / Roles is wired to sign-in. */
  role: CompanyRole;
  plans: Plan[];
}

export const SUBSCRIBERS: Subscriber[] = [
  { id: "mg", name: "Meridian Group", planLimit: 3, role: "Admin", plans: [
    { id: "mc", name: "Meridian Consolidated", current: true },
    { id: "me", name: "Meridian EMEA" },
    { id: "mn", name: "Northpoint Bakeries" }] },
  { id: "ah", name: "Aster Holdings", planLimit: 4, role: "Member", plans: [
    { id: "ac", name: "Aster Consolidated" },
    { id: "ap", name: "Aster Carve-out" }] },
  { id: "hi", name: "Halden Industries", planLimit: 2, role: "Member", plans: [
    { id: "hg", name: "Halden Group" }] },
];

export const initials = (name: string) =>
  name.split(/[\s-]/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** The company the current plan belongs to. */
export const currentCompany = (): Subscriber =>
  SUBSCRIBERS.find((s) => s.plans.some((p) => p.current)) ?? SUBSCRIBERS[0];
