# ClarityOS UI · Assign / Unassign

React 19 + TypeScript + Tailwind CSS v4 (Vite). Componentized port of
`ClarityOS_UI_Prototype_3.jsx`: the six-row window shell (Dimensions workspace in
DATA and MODEL) with the Assign / Unassign surface mounted in member detail.

```bash
npm install
npm run dev        # regenerates tokens + docs tables, starts Vite
npm test           # behaviour tests (Vitest + Testing Library)
npm run build      # tokens → typecheck → production build
```

The app opens on Dimensions › Company › Companies. `/#styleguide` is the living
styleguide. Switch DATA / MODEL with the pill; in MODEL, click a member in the
left pane to open member detail.

## Where things are

| Path | What |
|---|---|
| `tokens/color.mjs` | Colour source of truth: OKLCH ramps, semantic roles, required contrast pairs |
| `scripts/build-tokens.mjs` | Generates `src/styles/colors.generated.css` + JSON; **fails the build on any contrast miss** |
| `src/styles/theme.css` | Tailwind `@theme`: roles → utilities, type, spacing, geometry, radius, motion. Tailwind defaults are cleared |
| `src/shell/` | Window shell: rail, header, domain bar, toolbars, panes, structure bar |
| `src/components/` | Assign-surface primitives |
| `src/surface/` | Assign / Unassign composition |
| `src/lib/` | Navigation, members, POV, property schema, session, registry, reducer |
| `docs/01-audit.md` | Audit of the source JSX |
| `docs/02-styleguide.md` | Token reference (tables auto-synced) |
| `docs/03-components.md` | Component specs + audit resolution |
| `docs/decisions.md` | Rulings formerly embedded in source comments |

## Rules

- Components use role utilities only (`bg-shell`, `text-fg-tertiary`, `bg-mode-solid`).
  To add a colour, add a role in `tokens/color.mjs` and a pair to verify, then `npm run tokens`.
- Mode colour is chrome only: set by `data-mode` on the shell root, never on grid cells.
- Header and body cells read the same `colWidth` token.
- Never remove the focus ring; never add `transition: all`.
