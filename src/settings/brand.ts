import tokens from "../styleguide/colors.generated.json";
import { contrast, fit, lift, luminance, mix } from "./color";

/*
 * Company brand colours → CSS variables.
 *
 * An admin picks ONE colour per slot (menu, DATA, MODEL). Everything else is
 * derived so the contrast rules in tokens/color.mjs still hold: the fill is
 * darkened until white text reads on it, the tint is lightened until grey
 * text reads on it, the ink is moved until it reads on the tint. A picked
 * colour is never used unchecked, so no company can make the app unreadable.
 */

const prim = tokens.primitives as Record<string, string>;
const role = (r: string, dark = false) =>
  prim[(dark && (tokens.darkRoles as Record<string, string>)[r]) || (tokens.roles as Record<string, string>)[r]];

const WHITE = "#FFFFFF";
const L = { surface: role("surface"), shell: role("shell"), shellAlt: role("shell-alt"), tertiary: role("fg-tertiary") };
const D = { surface: role("surface", true), shellAlt: role("shell-alt", true), tertiary: role("fg-tertiary", true) };

export interface ModeColours { solid: string; soft: string; ink: string; deep: string }

const readsOn = (fg: string, bg: string, min: number) => contrast(fg, bg) >= min;

/** Light-theme mode colours from one picked colour. */
export function deriveMode(picked: string): { light: ModeColours; dark: ModeColours } {
  const solid = fit(picked, (c) => readsOn(WHITE, lift(c, 0.1), 4.5) && readsOn(c, L.shellAlt, 3), "darker");
  const soft = fit(mix(solid, WHITE, 0.9), (c) => readsOn(L.tertiary, c, 4.5), "lighter");
  const ink = fit(solid, (c) => readsOn(c, soft, 4.5) && readsOn(c, L.shell, 4.5) && readsOn(WHITE, c, 4.5), "darker");

  /* Dark: same fill rule (white text wins, see tokens/color.mjs); tint is a deep shade; ink goes lighter. */
  const dSolid = fit(picked, (c) => readsOn(WHITE, lift(c, 0.1), 4.5), "darker");
  const dSoft = fit(mix(dSolid, D.surface, 0.8), (c) => readsOn(D.tertiary, c, 4.5), "darker");
  const dInk = fit(picked, (c) => readsOn(c, dSoft, 4.5) && readsOn(c, D.shellAlt, 3), "lighter");

  return { light: { solid, soft, ink, deep: ink }, dark: { solid: dSolid, soft: dSoft, ink: dInk, deep: ink } };
}

export interface RailColours {
  tone: "dark" | "light";
  bg: string; line: string; edge: string;
  fg: string; secondary: string; tertiary: string; quiet: string;
  active: string; control: string;
}

/** Menu (workspace rail) colours from one picked background. Text flips dark on a light menu. */
export function deriveRail(picked: string): RailColours {
  const tone = luminance(picked) > 0.18 ? "light" : "dark";
  const fg = tone === "dark" ? "#F2EFEA" : "#22201D";
  /* Mid-tones: push the background away from the text until there is room for the quieter greys. */
  const bg = fit(picked, (c) => readsOn(fg, c, 7), tone === "dark" ? "darker" : "lighter");
  const grey = (amount: number) => fit(mix(fg, bg, amount), (c) => readsOn(c, bg, 4.5), tone === "dark" ? "lighter" : "darker");
  return {
    tone, bg, fg,
    secondary: grey(0.25), tertiary: grey(0.35), quiet: grey(0.4),
    line: mix(bg, fg, 0.12), edge: mix(bg, fg, 0.2),
    active: tone === "dark" ? "oklch(1 0 0 / 0.13)" : "oklch(0 0 0 / 0.07)",
    control: tone === "dark" ? "oklch(1 0 0 / 0.06)" : "oklch(0 0 0 / 0.04)",
  };
}

export interface Brand { menu: string | null; data: string | null; model: string | null }

const vars = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `  --role-${k}: ${v};`).join("\n");
const modeVars = (m: ModeColours) => vars({ "mode-solid": m.solid, "mode-soft": m.soft, "mode-ink": m.ink, "mode-deep": m.deep });

/*
 * CSS for the brand. Selectors start with `html` so each one outranks the
 * generated rule it replaces by one element, in light and in dark.
 */
export function brandCss(brand: Brand): string {
  const out: string[] = [];
  if (brand.menu) {
    const r = deriveRail(brand.menu);
    out.push(`html:root {\n${vars({
      "rail-bg": r.bg, "rail-line": r.line, "rail-control-edge": r.edge, "rail-fg": r.fg,
      "rail-fg-secondary": r.secondary, "rail-fg-tertiary": r.tertiary, "rail-fg-quiet": r.quiet,
      "rail-active": r.active, "rail-control": r.control,
    })}\n}`);
  }
  for (const [mode, hex] of [["DATA", brand.data], ["MODEL", brand.model]] as const) {
    if (!hex) continue;
    const { light, dark } = deriveMode(hex);
    const base = mode === "DATA" ? "html:root,\n" : "";
    out.push(`${base}html[data-mode="${mode}"],\nhtml [data-mode="${mode}"] {\n${modeVars(light)}\n}`);
    const dBase = mode === "DATA" ? 'html[data-theme="dark"],\n' : "";
    out.push(`${dBase}html[data-theme="dark"][data-mode="${mode}"],\nhtml[data-theme="dark"] [data-mode="${mode}"] {\n${modeVars(dark)}\n}`);
  }
  return out.join("\n\n");
}

export const railTone = (brand: Brand) => (brand.menu ? deriveRail(brand.menu).tone : "dark");
