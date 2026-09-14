# Step 1 — Audit of the source JSX

Source: `AU_AssignUnassignSurface` (Surface E, spec-first build) as pasted into the session
on 2026-09-14. The paste was truncated at 50,000 characters, inside the right-hand tool
slot (catalogue / member-scope pane). No file existed on disk, so locations cite the
component and prop rather than `file:line`.

Skills applied: `audit-ai-design-slop`, `better-interface` (→ accessibility, layout,
writing, typography, colors, ui).

---

## Part A — AI-design-slop audit

### Verdict

The surface is not decorative slop. It has no gradients, glass, glow or ornamental
cards; its visual language is restrained and task-driven. Its problems are
**established UI defects** hidden under a large amount of in-code narration: text tokens
that fail contrast, controls with no focus or keyboard path, and one fabricated number
presented as a counted consequence. Remove the fabricated "2 views lose members" first,
then fix the token pairs, because those fixes propagate to every row.

### Checked scope

- `AU_T` tokens, `AU_G` geometry, `AU_REGISTRY`, all shared primitives
- `AU_AssignUnassignSurface`: context tab strip, Assigned pane (title band, confirm
  state, view menu, grid head, sorted banner, rows, scope chip, empty state)
- Not inspected: right-hand catalogue / scope pane (truncated), rendered output

### Findings

| Priority | Class | Pattern | Evidence | Harm | Remove or fix |
|---|---|---|---|---|---|
| P0 | Slop pattern | Fake proof | Remove-all confirm renders the literal `2 views lose members` whenever `consequence === "display"`. The comment above it says "Counted, not vague… checkable". | States a consequence that was never computed; users learn to distrust or ignore the warning | Remove the string until a real count exists; render only when the count is > 0 |
| P1 | Quality defect | Consequence warning disappears | `hideTabs` removes the tab strip and the consequence badge with it; the "constraint line" the comment says it relocates to was removed (2026-08-21) | In hosted mode nothing warns that edits move reported numbers | Keep one consequence badge in the Assigned title band, independent of `hideTabs` |
| P1 | Quality defect | Unreadable secondary text | `ink3` (3.65:1) and `ink4` (2.08:1) carry 11px text: row numbers, "Ordered — position carries meaning", "(2 of 8)", "View by", menu reason line | Secondary information is hard to read in exactly the dense places it is needed | Rebuild neutral ramp so every text role is ≥ 4.5:1 |
| P1 | Quality defect | Essential info only on hover | "Drag is off while sorted", lock reason on the structure select, full row names under ellipsis, Spec provenance on tabs — all `title=` only | Unreachable on touch and to most keyboard users | Put the reason in visible text (sorted banner already says it — delete the duplicate `title`); give truncated names a reachable full value |
| P2 | Slop pattern | Narration in source | ~60% of the pasted source is decision-log comments (Founder rulings, CH-0xx). Several are stale (comment D describes a line that no longer exists) | Comments now contradict behaviour; reviewers trust the comment and miss the defect | Move rulings to `docs/decisions.md`; keep one-line `// CH-017` references |
| P2 | Slop pattern | Internal jargon in UI | "Consequence UNRULED", "NO MATH" chip at 8px, tab tooltips "Spec 68 §12 composition context", header "Name \| ID" | Spec vocabulary leaks to end users; 8px caps unreadable | Plain labels: "Folder", "Consequence not set"; drop spec citations from UI |
| P2 | Quality defect | Token bypass | `#FFF`, `#FDF6EC`, `${color}1F`, radius `4` beside `AU_T.r=6`, `fontSize:8`, `fontWeight:650`, widths `84`/`68`/`56` inline | Values drift; the token object is not the real system | Every value from the new token layer (Step 2) |
| P3 | Slop pattern | Blind prefix rename | Property keys renamed `label`→`AU_label` (`AU_label:"Rollup"`), destructuring shadows the `AU_label` style const, prose comments rewritten | Noise; masks real shadowing | Module boundaries give isolation — drop the prefix entirely |

**Largest single improvement:** delete the hardcoded "2 views lose members" and make the
consequence badge unconditional — it is the only signal on this surface that an edit
changes numbers, and it is currently both fabricated in one place and absent in another.

### Keep (intentional character, not slop)

- Warm stone neutrals + one teal accent; red reserved for destructive
- Shared geometry constants so header and body columns align (`AU_G`)
- Access level as three **different icon shapes** (X / eye / check) — not colour alone
- Tri-state select-all; one derivation feeds count, select-all and body
- Segmented assignment filter (locked ruling 2026-08-21)
- Sort as display projection with a stated banner and drag disabled
- Locked structure shown disabled + lock icon, never hidden
- Registry-driven columns and constraints (folders, cross-dimension, scope)
- Greyed views in the menu with one stated reason
- Confirm step on Remove all; `leaf` recursion guard

### Unknowns

- Catalogue / member-scope pane (truncated) — rebuilt from surviving state logic
- `PROTO_VIEWS`, `viewIsSystem` — defined outside the pasted block
- Rendered output at any viewport — nothing rendered

---

## Part B — Interface review

### Scope and coverage

Scope: the pasted Surface E component tree (see above). Stack: React function
components, inline style objects, lucide-react icons, no CSS system, no tests, no
project convention documents found (`readme` only).

| Domain | Evidence inspected | Result |
|---|---|---|
| Accessibility | All interactive elements, focus styles, keyboard handlers, ARIA roles, hit sizes | 6 findings |
| Layout | Frame split, fixed band heights, wrapping, viewport sizing | 2 findings |
| Writing | Every visible string and `title`/`aria-label` | 2 findings |
| Typography | Size/weight usage, truncation | 1 finding |
| Colors | Token values; contrast computed from declared pairs (script below) | 3 findings |
| UI | Radius, icons, motion, state styling | 1 finding |

### Measured contrast (declared token pairs, WCAG 2.x)

| Pair | Ratio | Use in source | Requirement | Result |
|---|---|---|---|---|
| ink2 `#57534E` / white | 7.63 | column heads, labels | 4.5 | Pass |
| ink3 `#8A8580` / white | 3.65 | counts, empty state, "View by", badge text | 4.5 | **Fail** |
| ink3 / canvas `#FAFAF9` | 3.50 | filter band text | 4.5 | **Fail** |
| ink4 `#B8B3AD` / white | 2.08 | row numbers, inactive access icons, grip, row X | 4.5 text / 3 icon | **Fail** |
| lineStrong `#DBD8D4` / white | 1.42 | input borders, toggle-off track, segmented border | 3 (non-text) | **Fail** |
| readOnly `#CA8A04` / white | 2.94 | active "Read only" eye icon | 3 (non-text) | **Fail** |
| readOnly / its 12% chip | 2.57 | same, on active chip | 3 | **Fail** |
| warn `#B45309` / `#FDF6EC` | 4.68 | sorted banner | 4.5 | Pass |
| accent `#0F766E` / white | 5.47 | view select, toggle-on | 4.5 | Pass |
| ok `#15803D` / white | 5.02 | Allow access | 3 | Pass |
| white / danger `#B91C1C` | 6.47 | Remove button | 4.5 | Pass |

### Findings

| Severity | Domain | Location | Before | After | Why |
|---|---|---|---|---|---|
| HIGH | Accessibility | `AU_field` (search, qty); `AU_ViewBy` `seg` selects; `AU_Toggle`, `AU_AccessLevel`, `AU_ShowFilter` buttons | `outline:"none"` with no replacement; buttons with `border:"none"` and no focus style | `:focus-visible` ring from a `focus` token, 2px, verified against panel and accent | Keyboard-reachable controls with no visible focus indicator |
| HIGH | Accessibility | Row `draggable` + `onDragStart`/`onDrop` | Reorder by mouse drag only | Keyboard move: grip is a `<button>`; Alt+↑/↓ moves the row; announce new position via `role="status"` | Pointer-only path; also broken in Firefox (no `dataTransfer.setData`) |
| HIGH | Accessibility | View menu (`role="menu"`) | `div` rows, full-screen click-catcher, no Escape, no focus move | Native `<button>` trigger + list of `menuitem`s, Escape closes and returns focus, arrow keys move | Overlay with no keyboard dismissal |
| HIGH | Accessibility | Row remove `X` button | Deletes row, its qty, access and scope selections immediately | Keep immediate removal but show an Undo toast (`role="status"`, persists until dismissed) | Destructive action with no confirmation or undo; attribute data is lost |
| HIGH | Colors | `AU_T.ink3`, `AU_T.ink4` as text colours (see table) | 3.65:1 and 2.08:1 at 11px | Neutral ramp where `text-secondary` ≥ 4.5 and `text-tertiary` ≥ 4.5; decorative-only step never used for text | Text contrast fails its required ratio |
| HIGH | Colors | `AU_T.readOnly` active icon; `AU_T.lineStrong` as control boundary | 2.94:1; 1.42:1 | Darker warning-hue step for read-only; separate `border-control` token ≥ 3:1 | Non-text contrast of state icons and control boundaries fails 3:1 |
| HIGH | Typography | Row name span | `overflow:hidden; textOverflow:ellipsis; whiteSpace:nowrap`, no full value | `title` is not enough — render full name in an accessible `aria-label`/tooltip on focus, or allow two-line clamp | Truncated content with no way to reach the full value |
| HIGH | Writing | Remove-all confirm | `2 views lose members` (literal) | Remove; render computed count only when > 0 | Misleads — invented consequence |
| HIGH | Layout | Root `height:"100vh"`; two frames `flex:1` with no breakpoint; `TITLE_H`/`FILTER_H` fixed heights with `nowrap` children | Frames squeeze to ~160px at 320px; title band cannot wrap the confirm row | `height:100%`; stack frames below a content-derived container width; `min-height` bands with wrapping | Controls clipped at 320px / 200% zoom (source-evident, not rendered) |
| MEDIUM | Accessibility | Scope chip `span role="button" tabIndex={0}`; access buttons 18×18; row X 22×22; toggle 28×16 | Custom button; sub-24px targets | Native `<button>`; 24×24 minimum hit area via pseudo-element | Native first; WCAG 2.5.8 target size |
| MEDIUM | Colors | `danger` = destructive **and** `unruled` consequence; `warn` = "Changes results" **and** sorted banner; `accentInk` = security consequence **and** explicit-scope border | One hue, several meanings | One role per hue: consequence badges get their own semantic tokens; sorted banner uses `info` | One colour, one meaning |
| MEDIUM | Writing | Tab `title` "Spec 68 §12 composition context"; "Consequence UNRULED"; "NO MATH"; "Name \| ID" | Spec jargon in UI | Drop spec citations; "Consequence not set"; "Folder"; "Name" | Plain words; internal vocabulary confuses users |
| MEDIUM | UI | Inline one-offs: radius 4 vs 6 vs 10; `#FFF`; `#FDF6EC`; `${color}1F`; 8px/650 | Values outside the token object | Token-only styling (Step 2) | Accidental inconsistency in radius and surfaces |
| LOW | Layout | `AttrCell` width `access ? 68 : 68` | Dead ternary; widths duplicated in header and cell | Single `columnWidth(type)` shared by head and cell | Header/body alignment rule (R2) enforced by one source |

Correctness bugs carried over from the earlier code review (not interface findings, fixed
in Step 3): `AttrCell` defined inside render (qty input loses focus each keystroke);
unguarded `AU_REGISTRY[ctxKey]`; comparator never returns 0; `globalThis.__AUVM__`
debug hook; `Date.now()` ids; O(n²) row numbering.

### Verification

Passed / run:
- Contrast computed from declared hex pairs with a WCAG 2.x luminance script (table above)
- Source read for accessible names: every icon-only button has `aria-label` — pass
- Source read for `prefers-reduced-motion`: toggle transitions (120ms, `left`,
  `background`) are unguarded — folded into Step 3 (short, but will be guarded)

Not verified:
- Rendered layout at 320px and 200% zoom
- Screen-reader announcement order
- Catalogue / scope pane behaviour (truncated)

### Verdict

**Block** — nine HIGH findings. All are fixable inside the existing visual direction; none
requires a redesign.
