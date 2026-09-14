# Decisions log

Rulings that previously lived as long comments inside the source JSX. Code now carries
one-line references (`CH-014`, `§6.6`); the reasoning lives here.

| Id / date | Ruling | Why | Where in code |
|---|---|---|---|
| 2026-08-20 | Contexts removed: Navigation, Properties, Allocation, Driver Scope, Simple, Metric View | Founder direction | `lib/registry.ts` |
| 2026-08-20 | "Report" renamed "Report & Metric Views"; "Structures" renamed "Allocation & Structures" — **labels only** | Consolidate labels, not behaviour. **Open:** Allocation & Structures still behaves as Structures (relationship registry, cross-dimension off), while removed Allocation was composition with cross-dimension on. Needs a ruling. | `lib/registry.ts` |
| CH-008 | `NAV_ORGANIZE` registered: folders yes, cross-dimension no, display consequence | Registry is the gatekeeper; borrowing a neighbour's context would misdeclare constraints | `lib/registry.ts`, `getContext` |
| 2026-08-20 | Assigned count shows "n of total" | Answers "how much of the population is accounted for" | `AssignedPane` |
| 2026-08-20 | Scoping entered and left only via the chip; no Done button; chip shows live count | One control, three jobs; row clicks must not open sub-tasks | `ScopeChip` |
| 2026-08-20 | Access level = three icons, one click | Faster than a menu; distinct shapes read without colour | `AccessLevel` (No access now `Ban`, see below) |
| 2026-08-21 | "Building" label removed from tab strip; constraint text line removed | Controls already enforce the rules | `AssignUnassignSurface` |
| 2026-08-21 | Consequence row removed | **Superseded 2026-09-14:** badge re-homed to the Assigned filter band. Spec §11-8 requires the UNRULED badge; removal left the surface non-conformant | `AssignedPane` |
| 2026-08-21 **LOCKED** | Assignment filter is a segmented control | High-frequency three-option filter; a dropdown's closed face reads as a label and hides that a filter is on. If width pressure returns, collapse at a breakpoint with the active value on the face. Do not reopen without a founder ruling. | `SegmentedControl` |
| CH-014 | Views filter consumption, never configuration | A view on the Assigned pane would make it misreport what is assigned | `ViewMenu` |
| CH-014 → removed | "2 views lose members" warning | Was a hardcoded literal presented as a count. Reinstate only with a computed count, shown when > 0 | — |
| CH-016 | One door to view management (no separate Create view) | Two entrances duplicated CH-009's removed "New view" | `ViewMenu` |
| CH-017 | One dropdown: Master list checked, saved views greyed, reason stated once, Manage views last | Greyed entries teach that views exist and why they don't apply. Distinct from DEC-2026-08-30-A (ineligible metrics absent): that is family eligibility, this is level applicability | `ViewMenu` |
| CH-018 | `leaf` guard: no view menu, no Add folder at the bottom of a recursive structure | Both would be category errors inside a view's own facet | `AssignUnassignSurface` |
| 2026-09-14 | Surface prefix `AU_` dropped | Module boundaries give isolation; the prefix rename had also rewritten property keys and prose | project structure |
| 2026-09-14 | "No access" icon X → Ban | Rendered beside the row Remove X, the two were indistinguishable | `AccessLevel` |
| 2026-09-14 | Row remove gets Undo, not a confirm | High-frequency action; undo keeps it one click and recoverable | `AssignedPane`, `ToastRegion` |
| 2026-09-14 | Frames share a parent grid via subgrid | Bands must align across the divider even when one side wraps (R3) | `Grid.Pane` |
| 2026-09-14 | Palette taken from Prototype 3 (warm shell, DATA blue / MODEL green / L100 violet), replacing the v1 teal | DEC-2026-08-17-A/C are foundation rulings; the reference screens use them | `tokens/color.mjs` |
| 2026-09-14 | Prototype colours that failed AA shifted in lightness only (ink-3, ink-4, input border, DATA/MODEL solids, status green, rail quiet ink) | Contrast floor; hue kept so the look holds | `docs/02-styleguide.md` table |
| 2026-09-14 · **OPEN** | Spec 110 v1.1 (cool slate, `#3B82F6`/`#10B981`, 272px chrome) conflicts with Prototype 3 (warm, emerald lineage, 184px chrome) | Prototype rulings are later and match the reference screens, so they were used. Spec 110 is DRAFT; needs a founder call to reconcile | — |
| 2026-09-14 | Dark theme removed | Neither prototype nor canon defines one | `theme.css` |
| 2026-09-14 | Breadcrumb built from the live path instead of the prototype's fixed "Dimensions › … › Input accounts › Member Selected" | A static breadcrumb is wrong on every other screen | `Header` |
| 2026-09-14 | Properties header names the active domain, not a hard-coded "ACCOUNT" | Same reason | `PropertiesPane` |
| 2026-09-14 | Filter / Group by / Split kept as visual stubs | Prototype parity; not wired in the prototype either | `ViewToolbar` |
| 2026-09-14 | Rail darkened to neutral near-black `#161616` (line `#2C2C2C`, control edge `#3D3D3D`) | Requested; members pane and shell stay warm and light | `tokens/color.mjs` |
| 2026-09-14 | Active rail item: deep mode tint background (`mode-deep` → DATA `#1A47A8`, MODEL `#0A5D42`, L100 `#4A1B93`), white text, light 3px bar | Requested; follows the theme in every mode, text ≥4.5:1 | `Rail`, `tokens/color.mjs` |
| 2026-09-14 | POV bar on white; selectors borderless with a hover/open fill | Requested; matches the header selectors' borderless-at-rest rule (CH-013) | `Toolbars.PovBar` |
| 2026-09-14 | Divider between every POV selector (was zone pipes only, before Company view and Entity view) | Requested; with borders gone, each selector needs its own edge | `Toolbars.PovBar` |
| 2026-09-14 | Member configuration ported (CH-002 index + editor, CH-005 unified header and index footer), replacing the interim tabbed detail | Requested; matches Prototype 3 | `MemberConfiguration` |
| 2026-09-14 | Header lock and Delete gate follow the member (`locked`) and structure (`system`), not the prototype's always-true `PROTO_MEMBER.systemDefined` | The prototype showed every member as system-defined | `MemberConfiguration` |
| 2026-09-14 | Member configuration: Identity, schema sections and System Details combined into one **Attributes** page (accordion, Expand/Collapse all); index shows one Attributes entry | Requested; one scroll for all attributes, section state visible at a glance | `MemberConfiguration` |
| 2026-09-14 | Every configuration page opens with the assign surface's title band (`LABEL · count … actions`) | Requested ("Report & Metric Views top layout"); one page grammar | `MemberConfiguration` |
| 2026-09-14 | Relationships shows an empty state instead of a blank pane | **Reverses** the 2026-08-21 "empty, no placeholder" ruling: a lone title band over nothing read as broken next to the other pages. Revert if the founder ruling stands | `MemberConfiguration` |
| 2026-09-14 | Assign surface stacks below a 56rem container (Assigned sized to content, max 45%; Available fills the rest); side by side above | At ~720px the two-column layout wrapped every band and left tall empty rows | `AssignUnassignSurface` |
| 2026-09-14 | View by is one compact button + panel (structure, view, lock reason in words) | Two inline selects plus lock text could not fit a tool pane; the panel keeps the reason visible, not hover-only | `ViewBy` |
| 2026-09-14 · **A11y trade-off** | Input borders lightened to `#C4BEB6` (1.8:1, below WCAG 1.4.11's 3:1), darker on hover, 3:1 orange focus ring | Requested ("too dark"). Fields stay identifiable by their label and row; switch track keeps a 3:1 colour (`control-track`) | `tokens/color.mjs` |
