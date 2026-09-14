/*
 * Colour source of truth — ClarityOS shell.
 *
 * Values come from ClarityOS_UI_Prototype_3.jsx (the screens being built) under
 * its foundation rulings:
 *   DEC-2026-08-17-A  warm restrained shell · neutral financial surface
 *   DEC-2026-08-17-C  MODEL = green · DATA = blue · chrome only · binary
 *
 * Where a prototype value failed WCAG AA for the way it is used, its LIGHTNESS
 * was shifted the minimum needed to pass and the hue kept. Every shift is listed
 * in docs/02-styleguide.md ("Changed from the prototype") so it can be reviewed.
 *
 * Spec 110 v1.1 (design canon, DRAFT) specifies a cool slate shell and
 * #3B82F6 / #10B981 mode colours. The prototype's founder rulings are the later
 * decision and are what the reference screens show, so they win here; the
 * conflict is logged in docs/decisions.md.
 *
 * Light theme only: neither the prototype nor the canon defines a dark theme.
 *
 * Tier 1 — primitives: named hex values, never used by components.
 * Tier 2 — roles: named by job. `roles` are global; `modeRoles` change with
 *          data-mode="DATA|MODEL|L100" on the shell root (chrome only).
 */

export const primitives = {
  white: "#FFFFFF",

  /* warm shell · PROTO_WARMTH.subtle */
  "warm-canvas": "#FAF9F7",
  "warm-shell": "#F6F4F1",
  "warm-shell-alt": "#F1EEEA",
  "warm-line": "#E5E1DB",
  "warm-line-strong": "#D5D0C8",
  "warm-line-control": "#C4BEB6",   /* input borders at rest · lighter by request (1.8:1), see decisions */
  "warm-line-control-hover": "#A39D95",
  "warm-control-track": "#8D8984",  /* switch off-track · keeps 3:1 against the white thumb */
  "warm-ink": "#22201D",
  "warm-ink-2": "#55504A",
  "warm-ink-3": "#706A63",          /* was #847D74 · 3.51–4.06 → ≥4.6 */
  "warm-ink-4": "#8D877F",          /* was #ABA49A · icons only, ≥3:1 */
  "warm-ink-disabled": "#ABA49A",   /* disabled text · exempt from contrast */

  /* grid surface · PROTO_SURFACE */
  "grid-container": "#FBFBFC",
  "grid-line": "#E7E7EA",
  "grid-line-col": "#DEDEE3",
  "grid-header": "#F4F4F6",

  /* modes · PROTO_MODE.emerald */
  "data-solid": "#235FE0",          /* was #2563EB · white on a 10% lift ≥4.6 */
  "data-soft": "#E8EFFD",
  "data-ink": "#1A47A8",
  "model-solid": "#0A7652",         /* was #0E9F6E · white text 3.39 → ≥4.6 */
  "model-soft": "#E6F5EF",
  "model-ink": "#0A5D42",
  "l100-solid": "#5B21B6",
  "l100-soft": "#F1EAFB",
  "l100-ink": "#4A1B93",

  /* dark rail · deeper neutral near-black (2026-09-14, was warm #26241F) */
  "rail-bg": "#161616",
  "rail-line": "#2C2C2C",
  "rail-ink": "#F2EFEA",
  "rail-ink-2": "#B5AFA4",
  "rail-ink-3": "#9C968B",
  "rail-ink-4": "#918C83",          /* was #7E786E · 3.54:1 on the old rail */
  "rail-control-edge": "#3D3D3D",

  /* single-purpose accents */
  "action-bronze": "#8A4B2A",       /* PROTO_ACTION_ACCENT · property tab underline, pin */
  "focus-orange": "#EA580C",        /* PROTO_OVERLAY.focusRing · Spec 110 §8.2 */

  /* feedback */
  "red-700": "#B91C1C",
  "red-800": "#991B1B",
  "red-100": "#FEE2E2",
  "amber-700": "#B45309",
  "amber-100": "#FEF3C7",
  "green-700": "#0B7C56",           /* status "Active" · was #0E9F6E (3.39) */
  "slate-700": "#334155",
  "slate-300": "#CBD5E1",
  "slate-100": "#F1F5F9",
};

/* role → primitive, independent of mode */
export const roles = {
  /* surfaces */
  "canvas": "warm-canvas",
  "shell": "warm-shell",
  "shell-alt": "warm-shell-alt",
  "surface": "white",
  "subtle": "grid-header",
  "hover": "warm-shell-alt",
  "inverse": "warm-ink",

  /* grid */
  "grid-container": "grid-container",
  "grid-line": "grid-line",
  "grid-line-col": "grid-line-col",
  "grid-header": "grid-header",

  /* text & icons */
  "fg-primary": "warm-ink",
  "fg-secondary": "warm-ink-2",
  "fg-tertiary": "warm-ink-3",
  "fg-icon": "warm-ink-4",
  "fg-disabled": "warm-ink-disabled",
  "fg-on-accent": "white",
  "fg-on-danger": "white",
  "fg-on-inverse": "white",

  /* lines */
  "line-subtle": "warm-line",
  "line-strong": "warm-line-strong",
  "line-control": "warm-line-control",
  "line-control-hover": "warm-line-control-hover",
  "control-track": "warm-control-track",
  "control-thumb": "white",

  /* rail */
  "rail-bg": "rail-bg",
  "rail-line": "rail-line",
  "rail-fg": "rail-ink",
  "rail-fg-secondary": "rail-ink-2",
  "rail-fg-tertiary": "rail-ink-3",
  "rail-fg-quiet": "rail-ink-4",
  "rail-control-edge": "rail-control-edge",

  /* accents */
  "action": "action-bronze",
  "focus": "focus-orange",
  "l100-solid": "l100-solid",
  "l100-soft": "l100-soft",
  "l100-ink": "l100-ink",

  /* feedback */
  "danger-solid": "red-700",
  "danger-solid-hover": "red-800",
  "danger-text": "red-700",
  "danger-soft": "red-100",
  "warning-solid": "amber-700",
  "warning-icon": "amber-700",
  "warning-text": "amber-700",
  "warning-soft": "amber-100",
  "success-text": "green-700",
  "success-icon": "green-700",
  "success-soft": "model-soft",
  "info-text": "slate-700",
  "info-soft": "slate-100",
  "info-line": "slate-300",
};

/* role → primitive per mode. Chrome only (DEC-2026-08-17-C). */
export const modeRoles = {
  /* mode-deep: dark mode tint for the active rail item (2026-09-14). */
  DATA:  { "mode-solid": "data-solid",  "mode-soft": "data-soft",  "mode-ink": "data-ink",  "mode-deep": "data-ink" },
  MODEL: { "mode-solid": "model-solid", "mode-soft": "model-soft", "mode-ink": "model-ink", "mode-deep": "model-ink" },
  L100:  { "mode-solid": "l100-solid",  "mode-soft": "l100-soft",  "mode-ink": "l100-ink",  "mode-deep": "l100-ink" },
};

/*
 * Pairs that must pass. [foreground, background, minimum, options?]
 * 4.5 = text (WCAG 1.4.3). 3 = icons, focus and control boundaries (1.4.11).
 * A pair naming a mode role is checked in every mode.
 * `lift: 0.10` = the background is the solid with 10% white on top — the
 * translucent fill of buttons sitting on a mode-coloured bar.
 */
export const pairs = [
  ["fg-primary", "surface", 4.5], ["fg-primary", "shell", 4.5], ["fg-primary", "shell-alt", 4.5],
  ["fg-secondary", "surface", 4.5], ["fg-secondary", "shell", 4.5], ["fg-secondary", "shell-alt", 4.5],
  ["fg-secondary", "grid-header", 4.5],
  ["fg-tertiary", "surface", 4.5], ["fg-tertiary", "shell", 4.5], ["fg-tertiary", "shell-alt", 4.5],
  ["fg-tertiary", "canvas", 4.5], ["fg-tertiary", "grid-header", 4.5], ["fg-tertiary", "mode-soft", 4.5],
  ["fg-icon", "surface", 3], ["fg-icon", "shell-alt", 3], ["fg-icon", "shell", 3],
  /* Input borders are intentionally below 3:1 (user preference, 2026-09-14): fields
     are identified by their visible label and row, and focus draws a 3:1 orange ring. */
  ["control-track", "surface", 3], ["control-thumb", "control-track", 3], ["control-thumb", "mode-solid", 3],
  ["fg-on-accent", "mode-solid", 4.5], ["fg-on-accent", "mode-solid", 4.5, { lift: 0.10 }],
  ["mode-ink", "mode-soft", 4.5], ["mode-ink", "surface", 4.5], ["mode-ink", "shell", 4.5],
  ["mode-solid", "shell", 3], ["mode-solid", "shell-alt", 3],
  ["focus", "surface", 3], ["focus", "shell", 3], ["focus", "shell-alt", 3], ["focus", "grid-header", 3],
  ["fg-on-inverse", "mode-solid", 3],
  ["rail-fg", "rail-bg", 4.5], ["rail-fg-secondary", "rail-bg", 4.5],
  ["rail-fg", "mode-deep", 4.5],
  ["rail-fg-tertiary", "rail-bg", 4.5], ["rail-fg-quiet", "rail-bg", 4.5],
  ["action", "shell", 3], ["action", "surface", 3],
  ["l100-ink", "l100-soft", 4.5], ["fg-on-accent", "l100-solid", 4.5],
  ["danger-text", "surface", 4.5], ["danger-text", "shell", 4.5], ["fg-on-danger", "danger-solid", 4.5],
  ["danger-text", "danger-soft", 4.5],
  ["fg-on-accent", "warning-solid", 4.5], ["warning-text", "warning-soft", 4.5],
  ["warning-icon", "surface", 3],
  ["success-text", "surface", 4.5], ["success-icon", "success-soft", 3],
  ["info-text", "info-soft", 4.5],
  ["fg-on-inverse", "inverse", 4.5],
];
