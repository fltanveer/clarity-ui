import tokens from "../styleguide/colors.generated.json";
import { brandCss, deriveMode, deriveRail } from "../settings/brand";
import { contrast, lift } from "../settings/color";
import { normalize } from "../settings/schema";

const prim = tokens.primitives as Record<string, string>;
const roles = tokens.roles as Record<string, string>;
const dark = tokens.darkRoles as Record<string, string>;
const light = (r: string) => prim[roles[r]];
const dk = (r: string) => prim[dark[r] ?? roles[r]];

/* Deterministic spread of colours across the whole RGB cube, including greys and extremes. */
const SAMPLES: string[] = [];
for (let r = 0; r < 256; r += 51) for (let g = 0; g < 256; g += 51) for (let b = 0; b < 256; b += 51)
  SAMPLES.push("#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase());

describe("brand colours", () => {
  it(`any picked mode colour yields readable chrome in light and dark (${SAMPLES.length} colours)`, () => {
    for (const hex of SAMPLES) {
      const { light: m, dark: d } = deriveMode(hex);
      const fail = (what: string, ratio: number, min: number) => { if (ratio < min) throw new Error(`${hex}: ${what} ${ratio.toFixed(2)} < ${min}`); };
      fail("white on fill", contrast("#FFFFFF", lift(m.solid, 0.1)), 4.5);
      fail("fill on shell-alt", contrast(m.solid, light("shell-alt")), 3);
      fail("grey text on tint", contrast(light("fg-tertiary"), m.soft), 4.5);
      fail("ink on tint", contrast(m.ink, m.soft), 4.5);
      fail("ink on shell", contrast(m.ink, light("shell")), 4.5);
      fail("white on rail active", contrast("#FFFFFF", m.deep), 4.5);
      fail("dark: white on fill", contrast("#FFFFFF", lift(d.solid, 0.1)), 4.5);
      fail("dark: grey text on tint", contrast(dk("fg-tertiary"), d.soft), 4.5);
      fail("dark: ink on tint", contrast(d.ink, d.soft), 4.5);
      fail("dark: ink on shell-alt", contrast(d.ink, dk("shell-alt")), 3);
    }
  });

  it("any picked menu colour keeps every menu text level readable", () => {
    for (const hex of SAMPLES) {
      const r = deriveRail(hex);
      for (const [k, fg] of Object.entries({ fg: r.fg, secondary: r.secondary, tertiary: r.tertiary, quiet: r.quiet })) {
        if (contrast(fg, r.bg) < 4.5) throw new Error(`${hex}: menu ${k} ${contrast(fg, r.bg).toFixed(2)} < 4.5`);
      }
    }
  });

  it("a light menu flips its text dark", () => {
    expect(deriveRail("#FFFFFF").tone).toBe("light");
    expect(deriveRail("#161616").tone).toBe("dark");
  });

  it("emits nothing for defaults and only valid colours survive the schema", () => {
    expect(brandCss({ menu: null, data: null, model: null })).toBe("");
    expect(normalize({ brand: { menu: "red", data: "#0f766e", model: 5 } }).brand).toEqual({ menu: null, data: "#0F766E", model: null });
    expect(brandCss({ menu: null, data: "#0F766E", model: null })).toContain('html[data-theme="dark"] [data-mode="DATA"]');
  });
});
