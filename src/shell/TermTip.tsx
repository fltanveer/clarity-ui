import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TERMS, type Term } from "../lib/terms";

const DELAY = 450;
const TIP_ID = "term-tip";

/*
 * One tooltip for the whole shell. Any element with `data-term` gets its
 * system name and a one-line meaning on hover (after a short delay, so moving
 * across the chrome doesn't flicker) or on keyboard focus. Mounted once, so
 * the bars don't each carry tooltip state.
 */
export function TermTip() {
  const [tip, setTip] = useState<{ term: Term; x: number; y: number; above: boolean } | null>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const find = (t: EventTarget | null) =>
      t instanceof Element ? t.closest<HTMLElement>("[data-term]") : null;

    const show = (el: HTMLElement) => {
      const t = el.dataset.term as Term;
      if (!(t in TERMS)) return;
      anchor.current?.removeAttribute("aria-describedby");
      anchor.current = el;
      el.setAttribute("aria-describedby", TIP_ID);
      const r = el.getBoundingClientRect();
      const above = r.bottom + 96 > window.innerHeight;
      setTip({ term: t, x: r.left + r.width / 2, y: above ? r.top - 6 : r.bottom + 6, above });
    };
    const hide = () => {
      window.clearTimeout(timer.current);
      anchor.current?.removeAttribute("aria-describedby");
      anchor.current = null;
      setTip(null);
    };

    const onOver = (e: MouseEvent) => {
      const el = find(e.target);
      if (el === anchor.current) return;
      window.clearTimeout(timer.current);
      if (!el) { hide(); return; }
      /* Already showing one: move straight to the next, no second wait. */
      if (anchor.current) show(el);
      else timer.current = window.setTimeout(() => show(el), DELAY);
    };
    const onFocus = (e: FocusEvent) => {
      const el = find(e.target);
      if (el && (e.target as Element).matches(":focus-visible")) show(el);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") hide(); };

    document.addEventListener("mouseover", onOver);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", hide);
    document.addEventListener("pointerdown", hide);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.clearTimeout(timer.current);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("pointerdown", hide);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  /* Keep the tip inside the viewport horizontally once its width is known. */
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!tip || !ref.current) { setLeft(null); return; }
    const w = ref.current.offsetWidth;
    setLeft(Math.min(Math.max(8, tip.x - w / 2), window.innerWidth - w - 8));
  }, [tip]);

  if (!tip) return null;
  return createPortal(
    <div ref={ref} id={TIP_ID} role="tooltip"
      style={{ position: "fixed", left: left ?? -9999, ...(tip.above ? { bottom: window.innerHeight - tip.y } : { top: tip.y }) }}
      className="pointer-events-none z-60 max-w-68 rounded-control bg-inverse px-2.5 py-2 text-caption leading-body text-fg-on-inverse shadow-popover">
      <span className="mb-0.5 block text-micro font-semibold tracking-eyebrow uppercase opacity-70">{tip.term}</span>
      {TERMS[tip.term]}
    </div>,
    document.body,
  );
}
