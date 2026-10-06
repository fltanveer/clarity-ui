import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { GripHorizontal, GripVertical } from "lucide-react";

export interface SplitterProps {
  /** Accessible name, e.g. "Resize members pane". */
  label: string;
  value: number;
  min: number;
  max: number;
  defaultValue: number;
  onChange: (next: number) => void;
  /**
   * Which pane it resizes. "start" sits on a leading pane's trailing edge
   * (drag right = wider); "end" sits on a trailing pane's leading edge
   * (drag left = wider).
   */
  side: "start" | "end";
  /** "vertical" (default) splits side-by-side panes; "horizontal" splits stacked panes and resizes height. */
  orientation?: "vertical" | "horizontal";
}

const STEP = 16;
const BIG_STEP = 64;

/*
 * Vertical pane splitter (WAI-ARIA window splitter). Zero net width in the
 * flex row — an 8px hit area straddles the pane border. A grip handle sits at
 * mid-height so the splitter is discoverable at rest (neutral); it fills with
 * the mode colour, and a 2px gradient line (light ends, dark middle) runs the
 * full height, on hover, keyboard focus and while dragging. Keyboard: ←/→ (Shift = larger step),
 * Home/End for the limits, Enter or double-click to reset.
 */
export function Splitter({ label, value, min, max, defaultValue, onChange, side, orientation = "vertical" }: SplitterProps) {
  const start = useRef<{ x: number; w: number } | null>(null);
  const horizontal = orientation === "horizontal";
  const pos = (e: PointerEvent<HTMLDivElement>) => (horizontal ? e.clientY : e.clientX);
  const [dragging, setDragging] = useState(false);
  const clamp = (n: number) => Math.round(Math.min(max, Math.max(min, n)));
  const grow = side === "start" ? 1 : -1;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: pos(e), w: value };
    setDragging(true);
    document.body.style.cursor = horizontal ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    onChange(clamp(start.current.w + (pos(e) - start.current.x) * grow));
  };
  const end = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    start.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? BIG_STEP : STEP;
    let next: number | null = null;
    if (e.key === (horizontal ? "ArrowDown" : "ArrowRight")) next = value + step * grow;
    else if (e.key === (horizontal ? "ArrowUp" : "ArrowLeft")) next = value - step * grow;
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    else if (e.key === "Enter") next = defaultValue;
    if (next === null) return;
    e.preventDefault();
    onChange(clamp(next));
  };

  return (
    <div role="separator" aria-orientation={orientation} aria-label={label}
      aria-valuenow={value} aria-valuemin={min} aria-valuemax={max} tabIndex={0}
      title={`${label} · drag, or use arrow keys · double-click to reset`}
      data-dragging={dragging || undefined}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={end} onPointerCancel={end}
      onKeyDown={onKeyDown} onDoubleClick={() => onChange(defaultValue)}
      className={horizontal
        ? "group relative z-20 -my-1 h-2 w-full shrink-0 cursor-row-resize touch-none outline-none"
        : "group relative z-20 -mx-1 w-2 shrink-0 cursor-col-resize touch-none outline-none"}>
      <span aria-hidden className={
        /* Gradient line: clear for the outer quarters, full mode colour only at the middle where the grip sits. Gradients do not
           interpolate, so the line is always painted and only its opacity animates. */
        (horizontal
          ? "pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-linear-to-r from-mode-solid/0 from-25% via-mode-solid via-50% to-mode-solid/0 to-75% "
          : "pointer-events-none absolute inset-y-0 start-1/2 w-0.5 -translate-x-1/2 bg-linear-to-b from-mode-solid/0 from-25% via-mode-solid via-50% to-mode-solid/0 to-75% ") +
        "opacity-0 transition-opacity duration-200 ease-standard group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[dragging]:opacity-100"
      } />
      <span aria-hidden className={
        "absolute top-1/2 start-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border shadow-lift " +
        (horizontal ? "h-3.5 w-8 " : "h-8 w-3.5 ") +
        "border-line-strong bg-surface text-fg-tertiary transition-[background-color,border-color,color] duration-150 ease-standard " +
        "group-hover:border-mode-solid group-hover:bg-mode-solid group-hover:text-fg-on-accent " +
        "group-focus-visible:border-mode-solid group-focus-visible:bg-mode-solid group-focus-visible:text-fg-on-accent " +
        "group-data-[dragging]:border-mode-solid group-data-[dragging]:bg-mode-solid group-data-[dragging]:text-fg-on-accent"
      }>
        {horizontal ? <GripHorizontal size={11} strokeWidth={2} /> : <GripVertical size={11} strokeWidth={2} />}
      </span>
    </div>
  );
}
