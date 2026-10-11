import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-outline" | "on-bar";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = the one main action · secondary = everything else · ghost = quiet, in dense rows ·
   *  danger / danger-outline = destructive · on-bar = sits on a mode-coloured bar. */
  variant?: ButtonVariant;
  /** sm 26px (toolbars, panes) · md 30px (dialog footers, forms). */
  size?: ButtonSize;
  /** Square, icon only. Give it an aria-label. */
  icon?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-mode-solid font-semibold text-fg-on-accent enabled:hover:bg-mode-ink",
  secondary: "border border-line-strong bg-surface text-fg-secondary enabled:hover:bg-hover enabled:hover:text-fg-primary",
  ghost: "text-fg-tertiary enabled:hover:bg-hover enabled:hover:text-fg-primary",
  danger: "bg-danger-solid font-semibold text-fg-on-danger enabled:hover:bg-danger-solid-hover",
  "danger-outline": "border border-danger-text bg-surface text-danger-text enabled:hover:bg-danger-soft",
  "on-bar": "border border-on-bar-edge bg-on-bar text-fg-on-accent enabled:hover:bg-on-bar-hover",
};

const sizes: Record<ButtonSize, { text: string; square: string }> = {
  sm: { text: "h-button gap-1.5 px-2.5", square: "size-button" },
  md: { text: "h-control-h gap-1.5 px-3", square: "size-control-h" },
};

/** One button for the whole product. Pick a variant; never restyle it with colours. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "sm", icon = false, className, type = "button", ...rest }, ref,
) {
  return (
    <button ref={ref} type={type}
      className={cx(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-control text-caption whitespace-nowrap",
        "transition-[background-color,color,scale] ease-standard enabled:active:scale-96",
        "disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        icon ? sizes[size].square : sizes[size].text,
        className,
      )}
      {...rest} />
  );
});
