# Step 2 — Styleguide (v2: prototype palette)

The token set the ClarityOS shell and the Assign / Unassign surface are built on.

**Revision 2 (2026-09-14).** v1 regenerated a teal palette from Surface E's
candidate tokens. That broke foundation ruling DEC-2026-08-17-C, and it did not
match the reference screens. v2 takes its values from
`ClarityOS_UI_Prototype_3.jsx`. Where a prototype value failed WCAG AA for how
it is used, its lightness was shifted and its hue kept.

Sources, in order of authority for this build:

1. **Prototype 3 foundation rulings** (may not be reopened from a UI session):
   - DEC-2026-08-17-A: warm restrained shell, neutral financial surface
   - DEC-2026-08-17-B: governed icon library, small financial vocabulary
   - DEC-2026-08-17-C: MODEL = green, DATA = blue, chrome only, binary
2. **Spec 110 v1.1 UI Design Canon** (DRAFT, pending founder lock): cell-state
   grammar, shell rows, keyboard model.
3. **WCAG 2.2 AA:** contrast floor, focus visibility, target size.

## Architecture

```
tokens/color.mjs              primitives · roles · mode roles · required pairs
scripts/build-tokens.mjs      → src/styles/colors.generated.css + JSON; fails on any contrast miss
scripts/sync-docs.mjs         → the tables in this file
src/styles/theme.css          Tailwind: colour roles (@theme inline), type, geometry, radius, motion
```

| Tier | Example | Used by |
|---|---|---|
| Primitive | `--prim-data-solid` | `colors.generated.css` only |
| Role | `--role-fg-tertiary` → `text-fg-tertiary` | Components |
| Mode role | `--role-mode-solid` → `bg-mode-solid` | Mode chrome; recoloured by `data-mode` |
| Geometry | `--spacing-row-toolbar` → `h-row-toolbar` | Shell rows and panes |

Mode switching uses one mechanism: `data-mode="DATA|MODEL|L100"` on the shell root.
Colour utilities are declared with `@theme inline`. That way each utility
references the role variable directly and picks up the nearest `data-mode`.

**Light theme only.** Neither the prototype nor Spec 110 defines a dark theme,
so v1's dark theme was removed.

## Changed from the prototype

Every change is a lightness shift on the same hue. Nothing was re-hued.

| Token | Prototype | Now | Why |
|---|---|---|---|
| `warm-ink-3` (secondary text: breadcrumb, pane headers, codes, footer) | `#847D74` | `#706A63` | 3.51–4.06:1 on shell and white → ≥4.6 |
| `warm-ink-4` | `#ABA49A` as text | icons only, `#8D877F` | 2.13–2.47:1 as text. Text moved to ink-3; icons need 3:1 |
| `warm-line-control` | inputs used `#D5D0C8` | `#C4BEB6` (hover `#A39D95`) | Lightened by request after trying `#8D8984` (3:1). Below 1.4.11's 3:1: fields rely on label + row, focus ring is 3:1. Switch off-track uses `control-track` `#8D8984` |
| `data-solid` | `#2563EB` | `#235FE0` | White labels on a 10% white button fill: 4.03 → ≥4.6 |
| `model-solid` | `#0E9F6E` | `#0A7652` | White text 3.39:1 → ≥4.6 |
| `green-700` (status "Active") | `#0E9F6E` | `#0B7C56` | 3.39:1 → ≥4.6 |
| `rail-ink-4` ("DEV BUILD ONLY") | `#7E786E` | `#918C83` | 3.54:1 on the dark rail → ≥4.6 |
| Section band text | `M.accent` on `M.soft` | `mode-ink` on `mode-soft` | DATA 4.48, MODEL 3.01 → ≥7 |
| Focus ring on mode bars | orange `#EA580C` | white (`.on-bar`) | Orange on the blue bar is 1.45:1 |
| Caption text | 11px | 12px | Legibility floor (Step 1 audit). 9px survives only for uppercase eyebrows above a value |

Kept, even though Spec 110 differs, because the later founder ruling governs:

| Spec 110 v1.1 | Prototype 3 (used) |
|---|---|
| Cool slate shell (`#F8FAFC`, `#0F172A`) | Warm shell (`#F6F4F1`, `#22201D`), DEC-A |
| MODEL `#10B981`, DATA `#3B82F6` | MODEL `#0E9F6E`→`#0A7652`, DATA `#2563EB`→`#235FE0`, emerald lineage |
| Rail `#0F172A` | Rail `#161616` (neutral near-black; prototype S5 "dark" was `#26241F`) |
| 272px chrome, toolbars full width | 184px window chrome; toolbars inside the centre pane (A2) |

## Colour

### Primitives

<!-- AUTO:primitives -->
| Primitive | Hex |
|---|---|
| `action-bronze` | #8A4B2A |
| `amber-100` | #FEF3C7 |
| `amber-700` | #B45309 |
| `data-ink` | #1A47A8 |
| `data-soft` | #E8EFFD |
| `data-solid` | #235FE0 |
| `focus-orange` | #EA580C |
| `green-700` | #0B7C56 |
| `grid-container` | #FBFBFC |
| `grid-header` | #F4F4F6 |
| `grid-line` | #E7E7EA |
| `grid-line-col` | #DEDEE3 |
| `l100-ink` | #4A1B93 |
| `l100-soft` | #F1EAFB |
| `l100-solid` | #5B21B6 |
| `model-ink` | #0A5D42 |
| `model-soft` | #E6F5EF |
| `model-solid` | #0A7652 |
| `rail-bg` | #161616 |
| `rail-control-edge` | #3D3D3D |
| `rail-ink` | #F2EFEA |
| `rail-ink-2` | #B5AFA4 |
| `rail-ink-3` | #9C968B |
| `rail-ink-4` | #918C83 |
| `rail-line` | #2C2C2C |
| `red-100` | #FEE2E2 |
| `red-700` | #B91C1C |
| `red-800` | #991B1B |
| `slate-100` | #F1F5F9 |
| `slate-300` | #CBD5E1 |
| `slate-700` | #334155 |
| `warm-canvas` | #FAF9F7 |
| `warm-control-track` | #8D8984 |
| `warm-ink` | #22201D |
| `warm-ink-2` | #55504A |
| `warm-ink-3` | #706A63 |
| `warm-ink-4` | #8D877F |
| `warm-ink-disabled` | #ABA49A |
| `warm-line` | #E5E1DB |
| `warm-line-control` | #C4BEB6 |
| `warm-line-control-hover` | #A39D95 |
| `warm-line-strong` | #D5D0C8 |
| `warm-shell` | #F6F4F1 |
| `warm-shell-alt` | #F1EEEA |
| `white` | #FFFFFF |
<!-- /AUTO:primitives -->

### Roles

<!-- AUTO:roles -->
| Role | Primitive | Hex |
|---|---|---|
| `canvas` | `warm-canvas` | #FAF9F7 |
| `shell` | `warm-shell` | #F6F4F1 |
| `shell-alt` | `warm-shell-alt` | #F1EEEA |
| `surface` | `white` | #FFFFFF |
| `subtle` | `grid-header` | #F4F4F6 |
| `hover` | `warm-shell-alt` | #F1EEEA |
| `inverse` | `warm-ink` | #22201D |
| `grid-container` | `grid-container` | #FBFBFC |
| `grid-line` | `grid-line` | #E7E7EA |
| `grid-line-col` | `grid-line-col` | #DEDEE3 |
| `grid-header` | `grid-header` | #F4F4F6 |
| `fg-primary` | `warm-ink` | #22201D |
| `fg-secondary` | `warm-ink-2` | #55504A |
| `fg-tertiary` | `warm-ink-3` | #706A63 |
| `fg-icon` | `warm-ink-4` | #8D877F |
| `fg-disabled` | `warm-ink-disabled` | #ABA49A |
| `fg-on-accent` | `white` | #FFFFFF |
| `fg-on-danger` | `white` | #FFFFFF |
| `fg-on-inverse` | `white` | #FFFFFF |
| `line-subtle` | `warm-line` | #E5E1DB |
| `line-strong` | `warm-line-strong` | #D5D0C8 |
| `line-control` | `warm-line-control` | #C4BEB6 |
| `line-control-hover` | `warm-line-control-hover` | #A39D95 |
| `control-track` | `warm-control-track` | #8D8984 |
| `control-thumb` | `white` | #FFFFFF |
| `rail-bg` | `rail-bg` | #161616 |
| `rail-line` | `rail-line` | #2C2C2C |
| `rail-fg` | `rail-ink` | #F2EFEA |
| `rail-fg-secondary` | `rail-ink-2` | #B5AFA4 |
| `rail-fg-tertiary` | `rail-ink-3` | #9C968B |
| `rail-fg-quiet` | `rail-ink-4` | #918C83 |
| `rail-control-edge` | `rail-control-edge` | #3D3D3D |
| `action` | `action-bronze` | #8A4B2A |
| `focus` | `focus-orange` | #EA580C |
| `l100-solid` | `l100-solid` | #5B21B6 |
| `l100-soft` | `l100-soft` | #F1EAFB |
| `l100-ink` | `l100-ink` | #4A1B93 |
| `danger-solid` | `red-700` | #B91C1C |
| `danger-solid-hover` | `red-800` | #991B1B |
| `danger-text` | `red-700` | #B91C1C |
| `danger-soft` | `red-100` | #FEE2E2 |
| `warning-solid` | `amber-700` | #B45309 |
| `warning-icon` | `amber-700` | #B45309 |
| `warning-text` | `amber-700` | #B45309 |
| `warning-soft` | `amber-100` | #FEF3C7 |
| `success-text` | `green-700` | #0B7C56 |
| `success-icon` | `green-700` | #0B7C56 |
| `success-soft` | `model-soft` | #E6F5EF |
| `info-text` | `slate-700` | #334155 |
| `info-soft` | `slate-100` | #F1F5F9 |
| `info-line` | `slate-300` | #CBD5E1 |
<!-- /AUTO:roles -->

### Mode roles (chrome only)

<!-- AUTO:modes -->
| Role | DATA | MODEL | L100 |
|---|---|---|---|
| `mode-solid` | #235FE0 | #0A7652 | #5B21B6 |
| `mode-soft` | #E8EFFD | #E6F5EF | #F1EAFB |
| `mode-ink` | #1A47A8 | #0A5D42 | #4A1B93 |
| `mode-deep` | #1A47A8 | #0A5D42 | #4A1B93 |
<!-- /AUTO:modes -->

Where each mode role appears: the domain bar's bottom rule, the active domain
tab, the action toolbar fill, the rail's active bar and logo, the members-tree
selection, the property section bands, the POV values and the primary Save.
Grid cells never change colour with mode.

### One colour, one meaning

| Hue | Means |
|---|---|
| Blue (DATA) / green (MODEL) / violet (L100) | Which mode you are in: chrome only |
| Orange `#EA580C` | Keyboard focus (and, in the ledger, the active cell) |
| Bronze `#8A4B2A` | Property-panel tab underline, pinned plan, "New plan" |
| Red | Destructive actions; bulk-delete bar |
| Amber | Reorder mode bar, warnings |
| Green `#0B7C56` | Member status "Active" |
| Slate | System notices in the assign surface |

### Contrast gate

4.5 = text (WCAG 1.4.3). 3 = icons, focus and control boundaries (1.4.11).
Pairs that involve a mode role are checked in all three modes.

<!-- AUTO:pairs -->
| Mode | Pair | Ratio | Min | Result |
|---|---|---|---|---|
| — | `fg-primary` on `surface` | 16.25 | 4.5 | Pass |
| — | `fg-primary` on `shell` | 14.80 | 4.5 | Pass |
| — | `fg-primary` on `shell-alt` | 14.05 | 4.5 | Pass |
| — | `fg-secondary` on `surface` | 7.98 | 4.5 | Pass |
| — | `fg-secondary` on `shell` | 7.27 | 4.5 | Pass |
| — | `fg-secondary` on `shell-alt` | 6.90 | 4.5 | Pass |
| — | `fg-secondary` on `grid-header` | 7.26 | 4.5 | Pass |
| — | `fg-tertiary` on `surface` | 5.34 | 4.5 | Pass |
| — | `fg-tertiary` on `shell` | 4.87 | 4.5 | Pass |
| — | `fg-tertiary` on `shell-alt` | 4.62 | 4.5 | Pass |
| — | `fg-tertiary` on `canvas` | 5.08 | 4.5 | Pass |
| — | `fg-tertiary` on `grid-header` | 4.86 | 4.5 | Pass |
| DATA | `fg-tertiary` on `mode-soft` | 4.63 | 4.5 | Pass |
| MODEL | `fg-tertiary` on `mode-soft` | 4.75 | 4.5 | Pass |
| L100 | `fg-tertiary` on `mode-soft` | 4.55 | 4.5 | Pass |
| — | `fg-icon` on `surface` | 3.56 | 3 | Pass |
| — | `fg-icon` on `shell-alt` | 3.08 | 3 | Pass |
| — | `fg-icon` on `shell` | 3.24 | 3 | Pass |
| — | `control-track` on `surface` | 3.47 | 3 | Pass |
| — | `control-thumb` on `control-track` | 3.47 | 3 | Pass |
| DATA | `control-thumb` on `mode-solid` | 5.55 | 3 | Pass |
| MODEL | `control-thumb` on `mode-solid` | 5.64 | 3 | Pass |
| L100 | `control-thumb` on `mode-solid` | 8.98 | 3 | Pass |
| DATA | `fg-on-accent` on `mode-solid` | 5.55 | 4.5 | Pass |
| MODEL | `fg-on-accent` on `mode-solid` | 5.64 | 4.5 | Pass |
| L100 | `fg-on-accent` on `mode-solid` | 8.98 | 4.5 | Pass |
| DATA | `fg-on-accent` on `mode-solid + 10% white` | 4.61 | 4.5 | Pass |
| MODEL | `fg-on-accent` on `mode-solid + 10% white` | 4.61 | 4.5 | Pass |
| L100 | `fg-on-accent` on `mode-solid + 10% white` | 7.23 | 4.5 | Pass |
| DATA | `mode-ink` on `mode-soft` | 7.25 | 4.5 | Pass |
| MODEL | `mode-ink` on `mode-soft` | 7.03 | 4.5 | Pass |
| L100 | `mode-ink` on `mode-soft` | 9.58 | 4.5 | Pass |
| DATA | `mode-ink` on `surface` | 8.36 | 4.5 | Pass |
| MODEL | `mode-ink` on `surface` | 7.90 | 4.5 | Pass |
| L100 | `mode-ink` on `surface` | 11.23 | 4.5 | Pass |
| DATA | `mode-ink` on `shell` | 7.62 | 4.5 | Pass |
| MODEL | `mode-ink` on `shell` | 7.20 | 4.5 | Pass |
| L100 | `mode-ink` on `shell` | 10.23 | 4.5 | Pass |
| DATA | `mode-solid` on `shell` | 5.05 | 3 | Pass |
| MODEL | `mode-solid` on `shell` | 5.13 | 3 | Pass |
| L100 | `mode-solid` on `shell` | 8.18 | 3 | Pass |
| DATA | `mode-solid` on `shell-alt` | 4.80 | 3 | Pass |
| MODEL | `mode-solid` on `shell-alt` | 4.87 | 3 | Pass |
| L100 | `mode-solid` on `shell-alt` | 7.77 | 3 | Pass |
| — | `focus` on `surface` | 3.56 | 3 | Pass |
| — | `focus` on `shell` | 3.24 | 3 | Pass |
| — | `focus` on `shell-alt` | 3.08 | 3 | Pass |
| — | `focus` on `grid-header` | 3.24 | 3 | Pass |
| DATA | `fg-on-inverse` on `mode-solid` | 5.55 | 3 | Pass |
| MODEL | `fg-on-inverse` on `mode-solid` | 5.64 | 3 | Pass |
| L100 | `fg-on-inverse` on `mode-solid` | 8.98 | 3 | Pass |
| — | `rail-fg` on `rail-bg` | 15.78 | 4.5 | Pass |
| — | `rail-fg-secondary` on `rail-bg` | 8.30 | 4.5 | Pass |
| DATA | `rail-fg` on `mode-deep` | 7.29 | 4.5 | Pass |
| MODEL | `rail-fg` on `mode-deep` | 6.89 | 4.5 | Pass |
| L100 | `rail-fg` on `mode-deep` | 9.80 | 4.5 | Pass |
| — | `rail-fg-tertiary` on `rail-bg` | 6.16 | 4.5 | Pass |
| — | `rail-fg-quiet` on `rail-bg` | 5.41 | 4.5 | Pass |
| — | `action` on `shell` | 6.13 | 3 | Pass |
| — | `action` on `surface` | 6.73 | 3 | Pass |
| — | `l100-ink` on `l100-soft` | 9.58 | 4.5 | Pass |
| — | `fg-on-accent` on `l100-solid` | 8.98 | 4.5 | Pass |
| — | `danger-text` on `surface` | 6.47 | 4.5 | Pass |
| — | `danger-text` on `shell` | 5.89 | 4.5 | Pass |
| — | `fg-on-danger` on `danger-solid` | 6.47 | 4.5 | Pass |
| — | `danger-text` on `danger-soft` | 5.30 | 4.5 | Pass |
| — | `fg-on-accent` on `warning-solid` | 5.02 | 4.5 | Pass |
| — | `warning-text` on `warning-soft` | 4.51 | 4.5 | Pass |
| — | `warning-icon` on `surface` | 5.02 | 3 | Pass |
| — | `success-text` on `surface` | 5.21 | 4.5 | Pass |
| — | `success-icon` on `success-soft` | 4.63 | 3 | Pass |
| — | `info-text` on `info-soft` | 9.45 | 4.5 | Pass |
| — | `fg-on-inverse` on `inverse` | 16.25 | 4.5 | Pass |
<!-- /AUTO:pairs -->

## Typography

Inter Variable, bundled through `@fontsource-variable/inter`. Tabular numerals are used wherever values change.

| Token | Size / line height | Use |
|---|---|---|
| `text-micro` | 9 / 12 | Uppercase eyebrow above a value (POV axis, header selector) |
| `text-caption` | 12 / 16 | Buttons, breadcrumb, pane headers, grid secondary columns, footer |
| `text-ui` | 13 / 20 | Tabs, member names, menus, grid cells |
| `text-body` | 14 / 22 | Window title (uppercase, 700, tracking 0.045em), dialogs |
| `text-title` | 15 / 22 | Member name, stub heading |
| `text-heading` / `text-display` | 20 / 25 | Styleguide only |

## Geometry (LOCKED, Prototype 3)

| Token | px | Element |
|---|---|---|
| `row-header` | 60 | Row 1 window header |
| `row-domain` | 48 | Row 2 domain bar |
| `row-toolbar` | 44 | Action toolbar, view toolbar, POV bar, pane headers |
| `row-structure` | 48 | Row 5 structure bar |
| `row-footer` | 28 | Row 6 footer |
| `rail` / `rail-icon` | 200 / 56 | Workspace rail (auto-collapses below 1360px wide) |
| `left-pane` / `left-rail` | 240 / 32 | Members pane |
| `right-pane` / `right-rail` | 280 / 28 | Properties pane |
| `centre-min` | 600 | Centre never narrower; the body scrolls instead |
| `edge` / `tab-inset` | 18 / 13 | Shell inline edge; domain-tab padding |
| `button` | 26 | Toolbar and ghost buttons |
| `control-h` | 30 | Mode pill, header selectors, primary button |
| `control-form` | 32 | Form inputs |
| `pov` | 34 | POV selector |
| `grid-head` / `grid-row` | 26 / 30 | Member grid |
| `band` | 26 | Property section band |

## Radius, elevation, motion

| Token | Value | Use |
|---|---|---|
| `rounded-chip` | 4px | Icon buttons, menu items, structure tabs |
| `rounded-control` | 5px | Buttons, inputs, selectors |
| `rounded-md` | 6px | Mode pill segments |
| `rounded-panel` | 8px | Popovers, dialogs, mode pill track |
| `shadow-popover` | `0 16px 48px / .22` | Menus, popovers, dialogs |
| `shadow-lift` | `0 1px 2px / .08` | Active mode segment, L100 chip |
| `ease-standard`, 120ms | | Colour and width transitions. Off under reduced motion |

## Focus

A 2px ring with `outline-offset: -2px`, so the dense shell's overflow never
clips it. The ring is orange on neutral grounds (verified ≥3:1) and white inside
mode-coloured bars (`.on-bar`). Forced-colours mode uses `Highlight`.
