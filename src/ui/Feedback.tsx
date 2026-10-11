import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cx } from "./cx";

export type Tone = "neutral" | "mode" | "info" | "success" | "warning" | "danger";

/* ── Badge ────────────────────────────────────────────────────────────────── */

const soft: Record<Tone, string> = {
  neutral: "bg-subtle text-fg-secondary",
  mode: "bg-mode-soft text-mode-ink",
  info: "bg-info-soft text-info-text",
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
};
const solid: Record<Tone, string> = {
  neutral: "bg-inverse text-fg-on-inverse",
  mode: "bg-mode-solid text-fg-on-accent",
  info: "bg-mode-solid text-fg-on-accent",
  success: "bg-success-icon text-fg-on-accent",
  warning: "bg-warning-solid text-fg-primary",
  danger: "bg-danger-solid text-fg-on-danger",
};

export interface BadgeProps {
  tone?: Tone;
  /** solid = the one thing to notice (e.g. the picked record) · soft = status, counts. */
  solid?: boolean;
  children: ReactNode;
  className?: string;
}

/** Short status or label. Text, not colour, carries the meaning. */
export function Badge({ tone = "neutral", solid: isSolid = false, children, className }: BadgeProps) {
  return (
    <span className={cx("inline-flex max-w-full min-w-0 items-center gap-1 truncate rounded-chip px-2 py-0.5 text-caption font-semibold",
      (isSolid ? solid : soft)[tone], className)}>
      {children}
    </span>
  );
}

/* ── Notice ───────────────────────────────────────────────────────────────── */

const noticeTone = {
  info: { box: "border-info-line bg-info-soft text-info-text", Icon: Info },
  success: { box: "border-success-icon/40 bg-success-soft text-success-text", Icon: CheckCircle2 },
  warning: { box: "border-warning-icon/40 bg-warning-soft text-warning-text", Icon: AlertTriangle },
  danger: { box: "border-danger-text/40 bg-danger-soft text-danger-text", Icon: XCircle },
} as const;

export interface NoticeProps {
  tone?: keyof typeof noticeTone;
  /** Bold lead-in, e.g. "Sorted view." */
  title?: ReactNode;
  children?: ReactNode;
  /** One button at the end, e.g. <Button>Clear sort</Button>. */
  action?: ReactNode;
  className?: string;
}

/** Inline message about the area it sits in. Not a toast: it stays until the condition ends. */
export function Notice({ tone = "info", title, children, action, className }: NoticeProps) {
  const { box, Icon } = noticeTone[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"}
      className={cx("flex flex-wrap items-center gap-x-3 gap-y-1 rounded-control border px-3 py-2 text-caption", box, className)}>
      <Icon size={14} aria-hidden className="shrink-0" />
      <p className="min-w-0 flex-1">{title && <strong className="font-semibold">{title} </strong>}{children}</p>
      {action}
    </div>
  );
}

/* ── EmptyState ───────────────────────────────────────────────────────────── */

export interface EmptyStateProps {
  /** What this place is, or why it is empty. */
  title: ReactNode;
  /** How to fill it. */
  description?: ReactNode;
  /** One next step. */
  action?: ReactNode;
  className?: string;
}

/** Never leave an area blank: say what it is, how to fill it, and one next step. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cx("flex flex-col items-start gap-1 px-3 py-4", className)}>
      <p className="text-ui font-medium text-fg-primary">{title}</p>
      {description && <p className="text-caption text-fg-tertiary">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
