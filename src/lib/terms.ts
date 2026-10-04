/*
 * System names for the parts of the shell, shown on hover (TermTip). Wording
 * follows the orientation brief: the chain is Workspace → Domain → Domain
 * Structure → Model → Record. "Member" is internal and never appears here.
 */
export const TERMS = {
  Organization: "The tenant boundary. Everything you see belongs to this organization and plan.",
  Workspace: "The top-level area of the app, picked from the left menu. It groups related domains.",
  Domain: "A business area inside the workspace, picked from the top menu.",
  "Domain Structure": "A kind of thing inside the domain, picked from the bottom tabs.",
  Model: "The rulebook for this structure. It names the business noun and decides which fields exist and how they behave.",
  Record: "One instance that follows the Model's rules, such as one company.",
  Role: "What the list is showing here: the Models themselves, or the Records of one chosen Model.",
  "Structure Type": "Parent is a root structure. Child hangs off a parent structure.",
  View: "A saved way to look at the list. It can narrow the list, but never adds, totals or widens it.",
  Mode: "MODEL is where you set the rules and structure. DATA is where you work with the records. Mode can disable controls, but never removes them.",
  "Access Level": "L100 is structure administration. It is an access level on top of a mode, not a mode of its own.",
  Property: "A field the Model defines. The server decides whether it is editable, calculated or system-managed.",
} as const;

export type Term = keyof typeof TERMS;

/** Spread onto an element to give it a system-name tooltip: `<span {...term("Domain")}>`. */
export const term = (t: Term) => ({ "data-term": t });
