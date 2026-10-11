/*
 * Small colour toolkit for company brand colours: WCAG contrast (same maths as
 * scripts/build-tokens.mjs), mixing, and lightness search in HSL so a hue is
 * kept while its lightness moves until a contrast rule passes.
 */

export const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => "#" + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("").toUpperCase();

export function luminance(hex: string) {
  const [r, g, b] = channels(hex).map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `amount` of `b` mixed into `a` (0 = a, 1 = b). */
export const mix = (a: string, b: string, amount: number) => {
  const x = channels(a), y = channels(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * amount));
};

/** The solid with `alpha` white on top — buttons sitting on a mode-coloured bar. */
export const lift = (hex: string, alpha: number) => mix(hex, "#FFFFFF", alpha);

function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = channels(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function fromHsl(h: number, s: number, l: number) {
  const f = (n: number) => {
    const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
    return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return toHex([f(0), f(8), f(4)]);
}

/**
 * Move `hex` lighter or darker, keeping hue and saturation, until `ok` passes.
 * Returns the first passing colour, or the end of the range if none passes.
 */
export function fit(hex: string, ok: (c: string) => boolean, direction: "darker" | "lighter") {
  if (ok(hex)) return hex;
  const [h, s, l] = toHsl(hex);
  const step = direction === "darker" ? -0.005 : 0.005;
  let last = hex;
  for (let x = l + step; x >= 0 && x <= 1; x += step) {
    last = fromHsl(h, s, x);
    if (ok(last)) return last;
  }
  return last;
}

/** Hue distance in degrees, for "these two colours look alike". */
export function hueGap(a: string, b: string) {
  const d = Math.abs(toHsl(a)[0] - toHsl(b)[0]) * 360;
  return Math.min(d, 360 - d);
}
