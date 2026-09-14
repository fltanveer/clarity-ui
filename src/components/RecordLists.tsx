import { FileSpreadsheet, FileText } from "lucide-react";
import { ATTACHMENTS, NOTES, initials } from "../lib/records";

/*
 * Records shown as separate cards on the page background, not rows split by
 * dividers: a card's edge is its own boundary, so nothing reads as a line that
 * stops short of the page.
 */
export function NotesList() {
  return (
    <ul className="flex max-w-3xl flex-col gap-2.5">
      {NOTES.map((n) => (
        <li key={n.title} className="flex gap-3 rounded-panel border border-line-subtle bg-surface p-4">
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-mode-soft text-caption font-semibold text-mode-ink">
            {initials(n.by)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <p className="min-w-0 flex-1 text-ui font-semibold">{n.title}</p>
              <p className="shrink-0 text-caption text-fg-tertiary">{n.on}</p>
            </div>
            <p className="mt-1 text-ui leading-body text-pretty text-fg-secondary">{n.body}</p>
            <p className="mt-2 text-caption text-fg-tertiary">{n.by}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AttachmentsList() {
  return (
    <ul className="flex max-w-3xl flex-col gap-2">
      {ATTACHMENTS.map((a) => {
        const Icon = /\.(xlsx?|csv)$/i.test(a.name) ? FileSpreadsheet : FileText;
        return (
          <li key={a.name} className="flex items-center gap-3 rounded-panel border border-line-subtle bg-surface px-3 py-2.5">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-control bg-shell-alt text-fg-icon">
              <Icon size={16} strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p title={a.name} className="truncate text-ui font-medium">{a.name}</p>
              <p className="truncate text-caption text-fg-tertiary"><span className="tabular-nums">{a.size}</span> · {a.by} · {a.on}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
