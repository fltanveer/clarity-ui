import { CircleHelp, Eye, ShieldCheck, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Consequence } from "../lib/registry";
import { cx } from "../lib/cx";

const TONES: Record<Consequence, { text: string; Icon: LucideIcon; className: string }> = {
  results: { text: "Changes results", Icon: TriangleAlert, className: "bg-warning-soft text-warning-text" },
  security: { text: "Security scope", Icon: ShieldCheck, className: "bg-info-soft text-info-text" },
  display: { text: "Display only", Icon: Eye, className: "bg-subtle text-fg-secondary" },
  /* Spec §7-3: a consequence is never guessed. Rendered, never hidden. */
  unruled: { text: "Consequence unruled", Icon: CircleHelp, className: "bg-subtle text-fg-secondary" },
};

export function ConsequenceBadge({ consequence }: { consequence: Consequence }) {
  const { text, Icon, className } = TONES[consequence] ?? TONES.unruled;
  return (
    <span
      className={cx(
        "inline-flex h-control-sm shrink-0 items-center gap-1 rounded-full px-2 text-caption font-medium whitespace-nowrap",
        className,
      )}
    >
      <Icon size={12} strokeWidth={2} aria-hidden />
      {text}
    </span>
  );
}
