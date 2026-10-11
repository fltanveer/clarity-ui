import {
  createContext, forwardRef, useContext, useId,
  type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from "react";
import { cx } from "./cx";

/* Field hands its id, description and error state to the control inside it. */
interface FieldState { id: string; describedBy?: string; invalid: boolean }
const FieldContext = createContext<FieldState | null>(null);

export interface FieldProps {
  label: string;
  /** One line under the control: what to enter. Hidden while an error shows. */
  hint?: ReactNode;
  /** Replaces the hint and marks the control invalid. */
  error?: ReactNode;
  required?: boolean;
  /** Visually hide the label (it stays for screen readers). */
  hideLabel?: boolean;
  children: ReactNode;
  className?: string;
}

/** Label + control + hint/error, wired for accessibility. Wrap one Input, Select or Textarea. */
export function Field({ label, hint, error, required, hideLabel, children, className }: FieldProps) {
  const id = useId();
  const note = error ?? hint;
  const noteId = note ? `${id}-note` : undefined;
  return (
    <FieldContext.Provider value={{ id, describedBy: noteId, invalid: Boolean(error) }}>
      <div className={cx("flex min-w-0 flex-col gap-1", className)}>
        <label htmlFor={id} className={cx("text-caption font-medium text-fg-secondary", hideLabel && "sr-only")}>
          {label}{required && <span aria-hidden className="text-danger-text"> *</span>}
        </label>
        {children}
        {note && <p id={noteId} className={cx("text-caption", error ? "text-danger-text" : "text-fg-tertiary")}>{note}</p>}
      </div>
    </FieldContext.Provider>
  );
}

/* 16px below `sm` so iOS Safari does not zoom; 13px from `sm` up. */
const control =
  "w-full rounded-control border border-line-control bg-surface px-2 text-input-mobile text-fg-primary sm:text-ui " +
  "hover:border-line-control-hover placeholder:text-fg-tertiary " +
  "disabled:cursor-not-allowed disabled:bg-subtle disabled:text-fg-disabled " +
  "aria-invalid:border-danger-text";

const useField = (id?: string, describedBy?: string) => {
  const f = useContext(FieldContext);
  return { id: id ?? f?.id, "aria-describedby": describedBy ?? f?.describedBy, "aria-invalid": f?.invalid || undefined };
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Icon inside the start edge, e.g. <Search size={14} />. */
  leading?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leading, className, id, "aria-describedby": describedBy, ...rest }, ref,
) {
  const wired = useField(id, describedBy);
  const input = <input ref={ref} {...wired} {...rest} className={cx(control, "h-control-form", Boolean(leading) && "ps-7", className)} />;
  if (!leading) return input;
  return (
    <div className="relative flex min-w-0">
      <span aria-hidden className="pointer-events-none absolute inset-y-0 start-2 flex items-center text-fg-tertiary">{leading}</span>
      {input}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, id, "aria-describedby": describedBy, rows = 3, ...rest }, ref,
) {
  return <textarea ref={ref} rows={rows} {...useField(id, describedBy)} {...rest} className={cx(control, "py-1.5", className)} />;
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Strings, or { value, label } pairs. Children work too. */
  options?: ReadonlyArray<string | { value: string; label: string }>;
}

/** Native select: keyboard, mobile pickers and screen readers for free. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, children, className, id, "aria-describedby": describedBy, ...rest }, ref,
) {
  return (
    <select ref={ref} {...useField(id, describedBy)} {...rest} className={cx(control, "h-control-form cursor-pointer pe-6", className)}>
      {options?.map((o) => typeof o === "string"
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>)}
      {children}
    </select>
  );
});
