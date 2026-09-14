# Step 3 — Component specs

Two layers: the **shell** ported from Prototype 3, and the **assign surface** components (Surface E).

Every component below is implemented against the Step 2 tokens only: no hex values, no
Tailwind default palette, no arbitrary pixel values inside components. Skills applied:
`design-systems:component-spec`, `tailwindcss`, `better-ui`.

```
src/
  components/          primitives — no knowledge of assignment rules
    Button  Switch  Checkbox(SelectAll)  AccessLevel  SegmentedControl
    Field(SearchField, TextField, InlineSelect)  ViewBy  ConsequenceBadge
    ViewMenu  Tabs  Grid(Pane, PaneBody, TitleBand, FilterBand, GridHead,
    HeadCell, SortHeader, PaneTitle, RowIndex)  Notice  EmptyState  Toast
  surface/             Assign / Unassign composition — knows the registry
    AssignUnassignSurface  AssignedPane  AssignedRow  AttributeCell
    ScopeChip  RemoveAllConfirm  CataloguePane  ScopePane
  lib/                 registry, reducer, sort, demo data — no JSX
  styleguide/          living styleguide page (reads generated token JSON)
```

Shared rules for every component:

- **Focus**: the global `:focus-visible` ring: 2px orange `focus`, inset (`-2px`) so the
  dense shell never clips it; white inside mode-coloured bars (`.on-bar`). No component removes it.
- **Hit area**: ≥ 24×24px (`size-control-sm`) for every interactive element.
- **Icons**: lucide, `currentColor`, 1.5px stroke beside 400/500 text, 2px beside 600,
  always `aria-hidden` with the name on the control.
- **Motion**: 120ms `ease-standard`, named properties only, off under reduced motion.
  Buttons press to `scale(0.96)`; `static` turns that off inside dense rows.
- **Copy**: sentence case; buttons start with a verb.

---

## Shell (Prototype 3 port · stage 1)

Source: `ClarityOS_UI_Prototype_3.jsx` → `src/shell/`. Every prototype inline style
is now a token utility, and every `PROTO_` fixture is typed data in `src/lib/`
(`nav`, `members`, `pov`, `properties`, `session`).

```
AppShell ─ data-mode="DATA|MODEL|L100" (chrome colour only)
├─ Rail                     workspace menu · Platform = L100 door · footer commands
└─ column
   ├─ Header                title / breadcrumb · context selectors · session switcher
   ├─ DomainBar             [+ Add · ☰] · domain tabs (caret menu) · ModePill | L100Chip
   ├─ main
   │  ├─ LeftPane           members tree · ViewPicker · collapses to a 32px rail
   │  ├─ work area          ActionToolbar | GridModeBar · ViewToolbar · PovBar · MemberGrid
   │  │   or MemberConfiguration  MODEL + member selected (CH-002)
   │  └─ PropertiesPane     DATA only · collapses to a 28px rail
   ├─ StructureBar          [+ Add Subcategory · ☰] · structure tabs (caret menu) · ‹ ›
   └─ Footer
```

| Component | Key behaviour | Keyboard |
|---|---|---|
| `AppShell` | Owns workspace → domain → structure; member (committed) vs peek (inspected); staged reorder; mode gate `canAuthor = MODEL \|\| L100` | Ctrl+Shift+F chrome · Ctrl+PgUp/PgDn domain · Alt+PgUp/PgDn structure · Esc leaves grid mode |
| `Rail` | Dark ground; active = 3px mode bar + 600 weight; Platform toggles L100; auto-collapses below 1360px | Native buttons |
| `Header` | Breadcrumb from the live path (4 segments, collapses in the middle); Company/Version selectors only in Operational, Financial, Dimensions › Account; narrowed selector gets a dot + heavier weight | Selector menus: arrows, Esc |
| Session switcher | Search both levels; plan pin; archive (not delete) with confirm | Dialog popover, Esc returns focus |
| `DomainBar` | 2px mode rule; caret reveals on hover/focus, persistent on active; closed domains cannot be deleted | Roving tabs ←/→ Home End |
| `ModePill` / `L100Chip` | Active side filled with mode colour; `dataOnly` removes the pill from the DOM (Spec 110 §7.4) | Buttons, `aria-pressed` |
| `ActionToolbar` | Mode-filled bar, white focus ring; Add member only when authoring; Actions → Reorder / Bulk delete; collapse control survives collapse | Menu popover |
| `GridModeBar` | Amber (reorder) or red (delete) bar; Delete disabled at 0 | Esc cancels |
| `ViewToolbar` | Real search filters the grid; Columns picker drives visible columns; Display toggles row numbers, gridlines, banded rows. Filter / Group by / Split are **stubs** | — |
| `ColumnPicker` | × removes, checkbox adds; freeze is a radio boundary; first column locked; Reset to default | Grip ↑/↓ reorders |
| `PovBar` / `PovSelect` | Context, not filters: view + optional single member; narrowed shows a "1" badge on the bar; survives chrome collapse | Dialog popover |
| `LeftPane` | Folder row active when nothing committed; count = disclosure (`n` or `n/total`); lock on system members | Buttons; view picker arrows |
| `ViewPicker` | Unfiled first, then folders; search above 6 views; Manage views… | Menu popover |
| `MemberGrid` | Row click = inspect (drives properties, never moves panes); status icon + text; reorder grips; system members get no delete checkbox | Name cell button · grip ↑/↓ |
| `PropertiesPane` | Header `DOMAIN \| name`; bronze tab underline; identity fields from schema; banded collapsible sections; gated delete with reason; Save/Cancel on dirty | Roving tabs |
| `StructureBar` / `StructureTab` | Tabs hang from the top edge; non-deletable structures show a lock; delete → `ConfirmDialog` | Roving tabs; right-click opens caret menu |
| `ConfirmDialog` | alertdialog, background `inert`, focus on Cancel, focus returns | Esc cancels · Tab trapped |
| `MemberConfiguration` | CH-002/005: one header band (‹ STRUCTURE \| member 🔒 · section, search/refresh/collapse) over a 212px section index (Attributes · Relations · Records) and the centre editor. Lands on Identity pre-filled with the member. Attributes render label-left rows (168px label gutter, 460px control cap, prose fields wide) from the structure schema; Relations host `AssignUnassignSurface hideTabs` (Relationships is a deliberate empty landing); Records show notes/attachments. Member-scoped footer: Delete (gated for system members, confirm) · Cancel · Save (enabled when dirty, "Unsaved changes" band). List toolbars and POV are absent in this state | ↑/↓ move through the index |

Not yet ported: Views scope (CH-008), Ledger (Insights), Assumption surface (Operational /
Financial / Drivers), cell grammar and Source Reference Strip (Spec 110 §8, §5.4).
Those workspaces render an honest stub.

---

## Primitives

### Button

Actions. Not for navigation (use `<a>`), not for toggles with state (use `Switch`).

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `"secondary" \| "ghost" \| "danger" \| "danger-outline"` | `"secondary"` | |
| `size` | `"md" \| "icon"` | `"md"` | `md` = 28px tall; `icon` = 24px square, needs `aria-label` |
| `static` | `boolean` | `false` | Disables press scale |
| …native | `ButtonHTMLAttributes` | | `type` defaults to `"button"` |

| Variant | Use | Fill / text |
|---|---|---|
| secondary | Default action | `surface` / `fg-primary`, `line-control` border |
| ghost | Low-emphasis, icon buttons in rows | transparent / `fg-secondary` |
| danger | The confirming step of a destructive action | `danger-solid` / `fg-on-danger` |
| danger-outline | The entry to a destructive action (before confirm) | `surface` / `danger-text` |

States: default · hover (`hover`/`danger-solid-hover`) · focus-visible (ring) · active
(scale .96) · disabled (`fg-disabled`, `line-subtle` border, no scale, `not-allowed`).

Do: one `danger` fill per view, only after confirmation. Don't: use `danger-outline` for
non-destructive actions — red means destructive.

### Switch

Edge **attributes** only (Drill-down, Drill-through). Inclusion in a list is a checkbox,
never a switch (Spec §6.3).

| Prop | Type | Notes |
|---|---|---|
| `checked` | `boolean` | |
| `onChange` | `(checked) => void` | |
| `label` | `string` | Accessible name; describe the ON state |
| `disabled` | `boolean` | |

Anatomy: 24px-tall button hit area → 28×16 track → 12px thumb. State is carried by thumb
position **and** track fill (`accent-solid` on, `line-control` off; both ≥ 3:1 vs thumb and
surface). `role="switch"` + `aria-checked`. Space/Enter toggle (native button).

### Checkbox · SelectAll

Native `<input type="checkbox">` tinted with `accent-color`. Wrap in a `<label>` with the
row text so the whole row is one hit target.

`SelectAll` — tri-state column-header control (Spec R1).

| Prop | Type | Notes |
|---|---|---|
| `total` | `number` | Rows currently shown; `0` disables |
| `selected` | `number` | Shown rows that are selected |
| `onChange` | `(selectAll: boolean) => void` | `true` when moving to "all" |
| `label` | `string` | e.g. "Assign all shown members" |

Checked when `selected === total`, indeterminate when `0 < selected < total`. The same
derivation must feed the count, the select-all and the body (§7-6).

### AccessLevel

Three-state access picker: No access · Read only · Allow access.

| Prop | Type | Notes |
|---|---|---|
| `value` | `"none" \| "read" \| "write"` | |
| `onChange` | `(value) => void` | |
| `name` | `string` | Unique per row (native radio group) |
| `rowLabel` | `string` | Used in the group name "Access for …" |

Anatomy: `radiogroup` of three 24px labels, each a visually hidden native radio + icon.
Icons are **different shapes** — `Ban`, `Eye`, `Check` — so state reads without colour.
`Ban`, not `X`, because the row's Remove button is an X one cell away.
Active: soft fill + role colour (`danger-soft/danger-text`, `warning-soft/warning-icon`,
`success-soft/success-icon`, all ≥ 3:1). Inactive: `fg-tertiary`.
Keyboard: one tab stop, ←/→/↑/↓ change value (native radios). Ring via `peer-focus-visible`.

### SegmentedControl

High-frequency, ≤ 5 option, mutually exclusive filter. **Locked 2026-08-21**
(docs/decisions.md): do not replace with a dropdown; collapse only at a breakpoint and keep
the active value on the face.

| Prop | Type |
|---|---|
| `options` | `{ value, label }[]` |
| `value` / `onChange` | `V` / `(V) => void` |
| `label` | `string` (group name) |

Active segment: `inverse` fill + `fg-on-inverse`, weight 600. Native radios underneath.

### Field — SearchField · TextField · InlineSelect

| Component | Use | Key props |
|---|---|---|
| `SearchField` | Filter a list | `value`, `onChange`, `label` (rendered as sr-only `<label for>`) |
| `TextField` | Short values (Qty) | `value`, `onChange`, native input props; `tabular-nums` |
| `InlineSelect` | A select inside a sentence ("View by …") | `options`, `tone: "default" \| "accent"` |

28px tall, `line-control` border, `radius-md`. **16px text below `sm`**, 13px above, so
iOS Safari does not zoom. Placeholder is an example, never the label.

### ViewBy

"View by [Structure] : [View]" (Spec §6.1).

| Prop | Type | Notes |
|---|---|---|
| `structures`, `structure`, `onStructure` | | |
| `views`, `view`, `onView` | | View select uses `accent` tone |
| `lockedReason` | `string?` | When set: structure disabled + lock icon + reason shown as visible caption, linked by `aria-describedby`. Never hidden (B10). |

### ConsequenceBadge

The only warning that an edit changes reported numbers. Always rendered in the Assigned
filter band, whether or not the host owns the tabs.

| `consequence` | Text | Icon | Tone |
|---|---|---|---|
| `results` | Changes results | TriangleAlert | `warning-soft` / `warning-text` |
| `security` | Security scope | ShieldCheck | `info-soft` / `info-text` |
| `display` | Display only | Eye | `subtle` / `fg-secondary` |
| `unruled` | Consequence unruled | CircleHelp | `subtle` / `fg-secondary` |

Unknown values fall back to `unruled` — never guessed (§7-3).

### ViewMenu

Menu button listing saved views for the current list.

| Prop | Type | Notes |
|---|---|---|
| `views` | `SavedView[]` | Rendered `aria-disabled` — views filter consumption, never configuration (CH-014) |
| `onManageViews` | `() => void?` | Omit to hide "Manage views…" |

Anatomy: trigger (ListFilter icon · "Master list" · chevron) → popover (`radius-lg`,
`shadow-popover`, 4px padding, `radius-sm` items — concentric) → checked "Master list" ·
greyed views · one reason line (`aria-describedby`) · separator · Manage views….

Keyboard (APG menu button): Enter/Space/↓ open and focus first item; ↑/↓ wrap;
Home/End; Escape closes and returns focus to trigger; Tab closes. Click outside closes.

### Tabs

Underline tabs with automatic activation.

| Prop | Type | Notes |
|---|---|---|
| `items` | `{ key, label, group? }[]` | A change of `group` inserts a divider (registry family) |
| `value` / `onChange` | | |
| `label` | `string` | tablist name |
| `panelId` | `string` | `aria-controls` target |

Roving tabindex (one tab stop), ←/→ move and select, Home/End. Selected: 2px
`accent-solid` underline + weight 600. Overflows horizontally; the next tab peeks at the
edge as the scroll cue.

### Grid primitives

| Component | Role |
|---|---|
| `Pane` | A frame. Stacked below `@3xl`; above it, `row-span-4` + `grid-rows-subgrid` so bands align across frames. Children must be exactly TitleBand, FilterBand, GridHead, PaneBody. |
| `TitleBand` | `min-h-band` (40), wraps; pane title + pane actions |
| `FilterBand` | `min-h-band`, `canvas` fill; filters or the consequence badge |
| `GridHead` | `h-head` (32), `subtle` fill, `line-strong` bottom |
| `HeadCell` / `SortHeader` | Width from `colWidth.*` — same token as the body cell. SortHeader cycles none → asc → desc, arrow + sr-only "sorted ascending" |
| `PaneTitle` | Uppercase caption label + `tabular-nums` count, inside an `h2` |
| `RowIndex` | Member ordinal, `fg-tertiary` (≥ 4.5:1) |
| `PaneBody` | Scrolling fourth row |

Rows are `<ol>`/`<ul>` list items, not ARIA tables: no `role="row"` without a table.

### Notice

Inline system strip (sorted view). `info-soft` / `info-text` / `info-line` border.
Props: `children` (message), `action` (usually a secondary Button). Sticky at the top of
the pane body.

### EmptyState

Never blank (R6). Props: `title` (what's missing), `description` (how to fill it),
`action` (one next step). Filter empties name the query and offer "Clear filters".

### ToastRegion

Polite live region, always mounted. Props: `message` (node or `null`), `action`
(`{ label, onClick }`), `onDismiss`. **No timer when an action is present** — Undo cannot
vanish. `inverse` surface; focus ring switches to `fg-on-inverse` inside it.

---

## Surface components

### AssignUnassignSurface

| Prop | Type | Default | Notes |
|---|---|---|---|
| `ctx` | `string?` | own tabs, starts at `STRUCTURES` | Unregistered key → explicit "not registered" state, never a throw |
| `hideTabs` | `boolean` | `false` | Host owns the tab row; tablist not rendered at all |
| `leaf` | `boolean` | `false` | Bottom of a recursive structure: no view menu, no Add folder (CH-018) |
| `savedViews` | `SavedView[]` | demo views | |
| `onManageViews` | `() => void?` | | Replaces the source's module-global `AU_onManageViews` seam |
| `initialRows` | `Row[]?` | first two demo members | Seeded once |

Layout: `@container`; frames stack below 48rem container width, sit side by side above.
Context switch closes any sub-task (scoping, sort). Owns the Undo toast.

### AssignedPane

Ordered list of assigned members and folders — the artifact.

- Title band: "Assigned · n of total"; actions: ViewMenu (`display` consequence, not
  `leaf`), Add folder (folders allowed, not `leaf`), Remove all. Bulk actions hidden
  while scoping (§6.6).
- Filter band: ConsequenceBadge.
- Sorting is a display projection; stored order never changes (§7-1). While sorted a
  Notice states that reordering is off, with Clear sort.
- Reorder: drag (sets `dataTransfer`, works in Firefox) **or** keyboard — focus a grip,
  ↑/↓ moves one position; result announced in a polite status region; focus follows the
  moved row's grip.
- Remove row: immediate, with Undo toast; focus moves to the neighbour's remove button,
  or the pane title when the list empties.

### AssignedRow

`<li>` · RowIndex · grip button · name (wraps, never truncates) · [ScopeChip] ·
[AttributeCell…] · remove button. Folders show a folder icon and a "Not in totals" pill
and keep empty cells in attribute columns so alignment holds. While another row is being
scoped the row is `inert` at 40% opacity; the scoped row gets `selected` fill and hides
its remove button.

### AttributeCell

Module-level, memoised. Renders Switch, TextField (Qty) or AccessLevel per
`col.type`. Declared outside the pane so React never remounts it — the source's
in-render declaration made the Qty input lose focus on every keystroke (regression test
in `src/test/surface.test.tsx`).

### ScopeChip

The **sole** entry and exit for member scoping (§6.6). Native button, `aria-pressed`.
Visible text is the live count — "All (6)" or "2 of 6" — and the accessible name is
"Member scope for {row}: {count}". Active: `accent-solid` fill. Explicit scope:
weight 600. Escape in the scope pane also exits and returns focus here.

### RemoveAllConfirm

Inline confirm that counts everything removed: "Remove 2 members and 1 folder?".
Focus lands on Cancel; Escape cancels and returns focus to Remove all. Buttons:
`danger` "Remove all" · `secondary` "Cancel". No invented consequence counts.

### CataloguePane · ScopePane

Right-hand tool slot. Catalogue: ViewBy (locked when the context is not cross-dimension,
reason visible) · SegmentedControl (All / Assigned / Unassigned) · SearchField ·
SelectAll + sortable Name/Region · checkbox rows. Scope: same bands against the entity
hierarchy, indentation by depth, SelectAll scopes all shown members.

---

## Audit resolution

| Audit finding (docs/01-audit.md) | Resolution | Verified by |
|---|---|---|
| Fake "2 views lose members" | Removed; confirm counts real rows | Test: remove-all confirmation |
| Consequence badge lost with `hideTabs` | Badge lives in Assigned filter band in both modes | Test: hosted mode; styleguide hosted demo |
| `ink3`/`ink4` text contrast | Neutral ramp rebuilt; tertiary ≥ 4.5 on every surface | Contrast gate (76 pairs, 0 fail) |
| `readOnly` icon, `lineStrong` control borders | `warning-icon`, `line-control` roles ≥ 3:1 | Contrast gate |
| No focus indicators | Global `:focus-visible` ring; no `outline:none` | Screenshots 05, 06, 08 |
| Mouse-only reorder; Firefox drag | Keyboard ↑/↓ on grip + announcement; `setData` | Test: keyboard reorder |
| Menu without Escape/roles | APG menu button | Test: ViewMenu |
| Row remove without undo | Undo toast, persistent | Test: undo |
| Truncated names | Names wrap | Screenshot 07 (320px) |
| Fixed heights / 100vh / no breakpoint | `min-h` bands that wrap, `h-full`, container-query stacking, subgrid alignment | Screenshots 07, 08; no horizontal overflow at 320/640/1280 |
| Sub-24px targets, span-as-button | 24px minimum; native buttons/radios | Source |
| One hue, several meanings | Role table in styleguide; info for notices | Styleguide |
| Spec jargon in UI | "Consequence unruled", "Not in totals", "Name"; no spec tooltips | Source |
| Token bypass | Tailwind defaults cleared; roles only | Class check: 286 classes, all generated |
| `AttrCell` remount, unguarded registry, comparator, `globalThis` hook, `Date.now` ids, O(n²) ordinals | Fixed in `AttributeCell`, `getContext`, `Intl.Collator`, removed, sequence ids, single pass | Tests; source |
