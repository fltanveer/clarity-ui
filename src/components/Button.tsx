import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "../lib/cx";

export type ButtonVariant = "secondary" | "ghost" | "danger" | "danger-outline";
export type ButtonSize = "md" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Turns off the press scale where motion would distract (e.g. inside dense rows). */
  static?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  secondary: "border border-line-control bg-surface text-fg-primary hover:bg-hover",
  ghost: "text-fg-secondary hover:bg-hover hover:text-fg-primary",
  danger: "bg-danger-solid text-fg-on-danger hover:bg-danger-solid-hover",
  "danger-outline": "border border-line-control bg-surface text-danger-text hover:bg-danger-soft",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-control gap-1.5 px-3 text-ui",
  icon: "size-control-sm justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", static: isStatic, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        "inline-flex shrink-0 cursor-pointer items-center rounded-md font-medium whitespace-nowrap",
        "transition-[scale,background-color,color] ease-standard",
        !isStatic && "active:scale-96",
        "disabled:cursor-not-allowed disabled:border-line-subtle disabled:bg-transparent disabled:text-fg-disabled disabled:active:scale-100",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  );
});
