# Company customisation

A company admin tailors ClarityOS for everyone in their company from **account drawer → Company settings**. Members cannot open it. Everything lives in `src/settings/`.

## The rules that shape it

- **One document per company.** `CompanySettings` in `schema.ts` is versioned, and `normalize()` repairs any input: bad values fall back to defaults and unknown keys drop. A stale or hand-edited copy can't break the app.
- **Settings are data, never code.** Look and feel become CSS variables. Toolbar and behaviour are data checked against fixed registries in code (`ACTIONS`, `FACTS`, `BEHAVIOURS`). No setting can run JavaScript or inject CSS.
- **Readability is enforced.** Brand colours are derived and moved until they pass the same contrast pairs as `tokens/color.mjs`. `brand.test.ts` checks 216 colours.
- **Admin only.** `canAdminister` comes from the user's role in the current company (`Subscriber.role`). The "Demo · sign in as" switch stands in for sign-in until Security › Users / Roles is wired to it.
- **No backend yet.** `store.ts` defines `SettingsStore` (`load`, `save`). `browserStore` keeps settings in localStorage. A server store implements the same two methods.

## What a company can set

| Tab | Setting | How it applies |
|---|---|---|
| Appearance | Theme (light, dark, match device), density (comfortable, compact) | `data-theme`, `data-density` on `<html>`; dark roles in `colors.generated.css`, compact sizes in `theme.css` |
| Appearance | Brand colours: menu, DATA, MODEL | `brand.ts` derives fill, tint, ink and menu greys, then injects `<style id="clarity-brand">` |
| Toolbar | Per action: zone, order, label, icon, display, visibility | `toolbar.ts` data → `ToolbarView`; locks protect Add's label and Collapse header |
| Tables | Preset + header, column lines, row lines, zebra, row numbers | `data-table-*` on `<html>` + `data-grid-*` markers on grids; main grid's Display menu starts from these |
| Rules | "Show when" per toolbar action; built-in behaviours (Details under records) | `rules.ts`: flat all/any/never clauses over fixed facts, `evaluate(rule, facts)` |
| Layout | Members pane, properties pane, Details: open or collapsed at start | `AppShell` initial state; people still toggle during a session |

Every change previews live while the admin edits. **Save** applies it for the company and **Cancel** discards it.

## Adding something

- **A setting:** add it to the type, `DEFAULTS` and `normalize()` in `schema.ts`. Apply it in `SettingsProvider` (CSS) or read it with `useSettings()`. Then add a control to the right tab.
- **A toolbar action:** add it to `ACTIONS` and `DEFAULT_TOOLBAR`, then supply its runtime in `ActionToolbar`. Saved toolbars pick it up automatically, because `normalizeToolbar` appends missing actions.
- **A fact for rules:** add it to `FACTS`, then compute it in `AppShell`'s `facts`.
- **A tunable behaviour:** add it to `BEHAVIOURS` with a default rule equal to today's behaviour. Then gate the code with `evaluate(behaviours.<id>, facts)`.

## Known limits

- In dark mode, thin mode-coloured lines (tab underlines, active edges) sit below 3:1 against the shell. White text on mode fills was prioritised. The planned fix is a separate `mode-line` role.
- Column lines "All" on the member grid are drawn with CSS on its flex rows. Very narrow fixed columns, such as Status, can clip.
