import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

/** Never blank (Spec R6): say what the place is, how to fill it, one next step. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-1 px-3 py-4">
      <p className="text-body font-medium text-fg-primary">{title}</p>
      {description && <p className="text-body text-fg-secondary">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
