import type { ReactNode } from "react";

/** Inline system notice strip (e.g. sorted view). Info role, never warning. */
export function Notice({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex min-h-assign-band shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-info-line bg-info-soft px-3 py-1.5 text-caption text-info-text">
      <p className="min-w-0 flex-1">{children}</p>
      {action}
    </div>
  );
}
