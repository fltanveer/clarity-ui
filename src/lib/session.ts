/* Session switcher fixture — Subscriber → Plan. Plan rows are name-only (ruled). */

export const USER = { name: "Jack Davidson", email: "jack@clarityos.com", initials: "JD" };

export interface Plan {
  id: string;
  name: string;
  current?: boolean;
}

export interface Subscriber {
  id: string;
  name: string;
  planLimit: number;
  plans: Plan[];
}

export const SUBSCRIBERS: Subscriber[] = [
  { id: "mg", name: "Meridian Group", planLimit: 3, plans: [
    { id: "mc", name: "Meridian Consolidated", current: true },
    { id: "me", name: "Meridian EMEA" },
    { id: "mn", name: "Northpoint Bakeries" }] },
  { id: "ah", name: "Aster Holdings", planLimit: 4, plans: [
    { id: "ac", name: "Aster Consolidated" },
    { id: "ap", name: "Aster Carve-out" }] },
  { id: "hi", name: "Halden Industries", planLimit: 2, plans: [
    { id: "hg", name: "Halden Group" }] },
];

export const initials = (name: string) =>
  name.split(/[\s-]/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
