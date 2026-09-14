import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "../lib/cx";

/*
 * Chrome button families (prototype ghostBtn / onColourBtn / iconBtn /
 * primaryBtn). A surface picks from these; it does not author a fifth.
 *   ghost   26px, bordered, neutral — on neutral bars and panes
 *   bar     26px, translucent white — on a mode-coloured bar (needs `.on-bar`)
 *   icon    24px square, borderless
 *   primary mode-solid fill — Save
 */
type Variant = "ghost" | "bar" | "icon" | "primary" | "danger-ghost";

export interface ChromeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base = "inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap transition-[background-color,color] ease-standard disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  ghost: "h-button gap-1.5 rounded-control border border-line-strong px-2.5 text-caption text-fg-secondary hover:bg-hover hover:text-fg-primary disabled:text-fg-disabled disabled:hover:bg-transparent",
  "danger-ghost": "h-button gap-1.5 rounded-control border border-danger-text px-2.5 text-caption text-danger-text hover:bg-danger-soft disabled:border-line-strong disabled:text-fg-disabled disabled:hover:bg-transparent",
  bar: "h-button gap-1.5 rounded-control border border-on-bar-edge bg-on-bar px-2.5 text-caption text-fg-on-accent hover:bg-on-bar-hover disabled:opacity-50",
  icon: "size-6 rounded-chip text-fg-tertiary hover:bg-hover hover:text-fg-primary",
  primary: "h-control-h gap-1.5 rounded-control bg-mode-solid px-3 text-caption font-semibold text-fg-on-accent hover:bg-mode-ink disabled:opacity-45 disabled:hover:bg-mode-solid",
};

export const ChromeButton = forwardRef<HTMLButtonElement, ChromeButtonProps>(function ChromeButton(
  { variant = "ghost", className, type = "button", ...rest }, ref,
) {
  return <button ref={ref} type={type} className={cx(base, variants[variant], className)} {...rest} />;
});

/** Vertical pipe between semantic zones in a bar. */
export const Pipe = ({ className }: { className?: string }) => (
  <span aria-hidden className={cx("h-4 w-px shrink-0 self-center bg-line-strong", className)} />
);
