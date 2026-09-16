import { useEffect, useId, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Lock, Trash2 } from "lucide-react";
import {
  DIMENSION_SCHEMA, PROPERTY_TABS, sectionsFor,
  type PropertyFieldDef, type PropertySectionDef, type PropertyTab,
} from "../lib/properties";
import { ChromeButton } from "./controls";
import { cx } from "../lib/cx";
import { ATTACHMENTS, NOTES, initials } from "../lib/records";

export interface PropertiesPaneProps {
  open: boolean;
  /** Expanded width in px (resizable). */
  width?: number;
  onOpen: (open: boolean) => void;
  domain: string | null;
  structure: string | null;
  /** null = master-list level. */
  memberName: string | null;
  memberLocked: boolean;
}

interface Identity { name: string; shortName: string; description: string; memo: string }

/*
 * Far-right properties pane (folder level). Three-part structure: sticky
 * identity header, scrolling body, sticky action footer. The field set follows
 * the STRUCTURE; the identity follows the SELECTION. Both re-seed together, so
 * a stale name never sits above new fields.
 */
export function PropertiesPane({ open, width, onOpen, domain, structure, memberName, memberLocked }: PropertiesPaneProps) {
  const master = memberName === null;
  const schema = structure ? DIMENSION_SCHEMA[structure] : undefined;
  const idFields = schema?.identity ?? ["name", "description"];
  const sections = sectionsFor(master, structure, domain);
  const locked = master || memberLocked || Boolean(schema?.system);

  const seed = (): Identity => ({ name: memberName ?? "Master list", shortName: "", description: "", memo: "" });
  const [tab, setTab] = useState<PropertyTab>("Properties");
  const [draft, setDraft] = useState<Identity>(seed);
  const [saved, setSaved] = useState<Identity>(seed);
  const [openSec, setOpenSec] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const s = seed();
    setDraft(s);
    setSaved(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberName, structure]);

  const dirty = (Object.keys(draft) as (keyof Identity)[]).some((k) => draft[k] !== saved[k]);
  const isOpen = (s: PropertySectionDef) => openSec[s.id] ?? !s.collapsed;

  if (!open) {
    return (
      <aside aria-label="Properties (collapsed)" onClick={() => onOpen(true)}
        className="flex w-right-rail shrink-0 cursor-pointer flex-col items-center gap-2 border-s border-line-subtle bg-shell-alt pt-1.5">
        <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(true); }} aria-label="Expand properties"
          className="grid h-6 w-6 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover">
          <ChevronLeft size={14} aria-hidden />
        </button>
        {/* Right rail reads top-to-bottom: the text's top edge faces the content. */}
        <span aria-hidden className="text-caption font-semibold tracking-label text-fg-secondary [writing-mode:vertical-rl]">PROPERTIES</span>
      </aside>
    );
  }

  return (
    <aside aria-label="Properties" style={width ? { width } : undefined} className="flex w-right-pane shrink-0 flex-col border-s border-line-subtle bg-shell">
      <div className="flex h-row-toolbar shrink-0 items-center gap-1.5 border-b border-line-subtle bg-mode-soft ps-3 pe-1">
        <span className="shrink-0 text-caption font-semibold tracking-label whitespace-nowrap text-mode-ink uppercase">{domain ?? "Structure"}</span>
        <span aria-hidden className="shrink-0 text-caption text-mode-ink">|</span>
        <h2 title={saved.name} className="min-w-0 flex-1 truncate text-ui font-semibold">{saved.name}</h2>
        {locked && <Lock size={11} aria-label="System-defined" className="shrink-0 text-fg-tertiary" />}
        <button type="button" onClick={() => onOpen(false)} aria-label="Collapse properties"
          className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover">
          <ChevronRight size={14} aria-hidden />
        </button>
      </div>

      <div role="tablist" aria-label="Property panel sections" className="flex h-10 shrink-0 items-stretch gap-1 border-b border-line-subtle px-2">
        {PROPERTY_TABS.map((t) => {
          const on = tab === t;
          return (
            <button key={t} type="button" role="tab" aria-selected={on} id={`prop-tab-${t}`}
              aria-controls="prop-panel" tabIndex={on ? 0 : -1} onClick={() => setTab(t)}
              onKeyDown={(e) => {
                const i = PROPERTY_TABS.indexOf(t);
                const n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
                if (n === null) return;
                e.preventDefault();
                const next = PROPERTY_TABS[(n + PROPERTY_TABS.length) % PROPERTY_TABS.length];
                setTab(next);
                document.getElementById(`prop-tab-${next}`)?.focus();
              }}
              className={cx("group relative flex min-w-0 flex-auto cursor-pointer items-center justify-center px-0.5 text-ui whitespace-nowrap",
                on ? "font-semibold text-fg-primary" : "text-fg-tertiary hover:text-fg-primary")}>
              <span title={t} className={cx("min-w-0 truncate rounded-chip px-1.5 py-1 transition-[background-color] ease-standard", !on && "group-hover:bg-hover")}>{t}</span>
              <span aria-hidden className={cx("absolute inset-x-2 -bottom-px h-0.5 rounded-full", on ? "bg-mode-solid" : "bg-transparent")} />
            </button>
          );
        })}
      </div>

      <div id="prop-panel" role="tabpanel" aria-labelledby={`prop-tab-${tab}`}
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {tab === "Properties" && (
          <>
            {!master && schema?.system && (
              <p className="flex items-start gap-2 rounded-panel border border-line-subtle bg-shell-alt px-3 py-2 text-caption leading-body text-fg-secondary">
                <Lock size={12} aria-hidden className="mt-0.5 shrink-0 text-fg-tertiary" />
                System-managed — members are maintained by ClarityOS and cannot be edited here.
              </p>
            )}
            <Card id="identity" label="Identity" meta={`${2 + Number(master || idFields.includes("shortName")) + Number(master || idFields.includes("memo"))} fields`}
              open={openSec.identity ?? true} onToggle={() => setOpenSec((p) => ({ ...p, identity: !(p.identity ?? true) }))}>
              <EditField label="Name | ID" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
              {(master || idFields.includes("shortName")) && (
                <EditField label="Short Name" value={draft.shortName} onChange={(v) => setDraft({ ...draft, shortName: v })} />
              )}
              <EditField area label="Description" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} />
              {(master || idFields.includes("memo")) && (
                <EditField area label="Memo" value={draft.memo} onChange={(v) => setDraft({ ...draft, memo: v })} />
              )}
            </Card>
            {sections.map((s) => (
              <Card key={s.id} id={s.id} label={s.label} meta={s.fields.length ? `${s.fields.length} ${s.fields.length === 1 ? "field" : "fields"}` : "Empty"}
                open={isOpen(s)} onToggle={() => setOpenSec((p) => ({ ...p, [s.id]: !isOpen(s) }))}>
                {s.fields.map((f) => <PropertyField key={f.l} field={f} />)}
                {!s.fields.length && (
                  <p className="text-caption leading-body text-fg-tertiary">No settings defined for this structure yet.</p>
                )}
              </Card>
            ))}
          </>
        )}
        {tab === "Notes" && (
          <>
            <ListCaption>{NOTES.length} notes</ListCaption>
            <ul className="flex flex-col gap-2">
              {NOTES.map((n) => (
                <li key={n.title} className="rounded-panel border border-line-subtle bg-surface p-3">
                  <p className="text-ui font-semibold">{n.title}</p>
                  <p className="mt-0.5 text-ui leading-body text-pretty text-fg-secondary">{n.body}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-caption text-fg-tertiary">
                    <Avatar name={n.by} /> {n.by} · {n.on}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
        {tab === "Attachments" && (
          <>
            <ListCaption>{ATTACHMENTS.length} files</ListCaption>
            <ul className="divide-y divide-line-subtle overflow-hidden rounded-panel border border-line-subtle bg-surface">
              {ATTACHMENTS.map((a) => {
                const Icon = /\.(xlsx?|csv)$/i.test(a.name) ? FileSpreadsheet : FileText;
                return (
                  <li key={a.name} className="flex items-center gap-2.5 px-3 py-2.5">
                    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-control bg-shell-alt text-fg-icon">
                      <Icon size={15} strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p title={a.name} className="truncate text-ui">{a.name}</p>
                      <p className="truncate text-caption text-fg-tertiary"><span className="tabular-nums">{a.size}</span> · {a.by} · {a.on}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Gated delete: shown with its reason, never hidden. */}
      {locked && (
        <p id="delete-reason" className="flex shrink-0 items-center gap-1.5 border-t border-line-subtle bg-shell-alt px-3 py-2 text-caption text-fg-tertiary">
          <Lock size={12} aria-hidden /> System-defined — cannot be deleted.
        </p>
      )}
      {/* Destructive and primary are separated by the full pane width. */}
      <div className="flex h-12 shrink-0 items-center gap-1.5 border-t border-line-subtle bg-shell px-3">
        <ChromeButton variant="danger-ghost" disabled={locked} aria-describedby={locked ? "delete-reason" : undefined}>
          <Trash2 size={12} aria-hidden /> Delete
        </ChromeButton>
        <span className="flex-1" />
        <ChromeButton disabled={!dirty} onClick={() => setDraft(saved)}>Cancel</ChromeButton>
        <ChromeButton variant="primary" className="h-button" disabled={!dirty} onClick={() => setSaved(draft)}>Save</ChromeButton>
      </div>
    </aside>
  );
}

const inputClass = "w-full rounded-control border border-line-control bg-surface px-2.5 text-ui text-fg-primary outline-none hover:border-line-control-hover";
const labelClass = "mb-1 block text-caption font-medium text-fg-secondary";

function EditField({ label, value, onChange, area }: { label: string; value: string; onChange: (v: string) => void; area?: boolean }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      {area
        ? <textarea id={id} rows={2} value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputClass, "min-h-14 resize-y py-1.5 leading-body")} />
        : <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputClass, "h-control-form")} />}
    </div>
  );
}

/* Collapsible card sized for the pane: collapsed = tinted header (reads as a card on the shell); expanded = all white. */
function Card({ id, label, meta, open, onToggle, children }: {
  id: string; label: string; meta: string; open: boolean; onToggle: () => void; children: ReactNode;
}) {
  const panelId = `prop-sec-${id}`;
  return (
    <section className="shrink-0 overflow-hidden rounded-panel border border-line-subtle bg-surface">
      <h3>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panelId}
          className={cx("flex h-10 w-full cursor-pointer items-center gap-2 px-3 text-start transition-[background-color] duration-150 ease-standard hover:bg-hover", open ? "border-b border-line-subtle bg-surface" : "bg-shell-alt")}>
          <ChevronDown size={14} aria-hidden className={cx("shrink-0 text-fg-tertiary transition-transform ease-standard", !open && "-rotate-90")} />
          <span className="min-w-0 flex-1 truncate text-ui font-semibold">{label}</span>
          <span className="shrink-0 text-caption text-fg-tertiary tabular-nums">{meta}</span>
        </button>
      </h3>
      {open && <div id={panelId} className="flex flex-col gap-3 p-3">{children}</div>}
    </section>
  );
}

const ListCaption = ({ children }: { children: ReactNode }) => (
  <p className="text-caption font-medium text-fg-tertiary">{children}</p>
);

const Avatar = ({ name }: { name: string }) => (
  <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full bg-mode-soft text-[0.5625rem] font-semibold text-mode-ink">
    {initials(name)}
  </span>
);

function PropertyField({ field: f }: { field: PropertyFieldDef }) {
  const id = useId();
  const off = Boolean(f.off);
  const hint = (f.src || off) ? (
    <p id={`${id}-hint`} className="mt-1 flex items-center gap-1 text-caption text-fg-tertiary">
      <Lock size={10} aria-hidden className="shrink-0" />
      {/* A derived value without its authority is indistinguishable from a typed one. */}
      <span className="min-w-0">{f.src ? `Derived · ${f.src}` : f.off}</span>
    </p>
  ) : null;
  if (f.t === "check") {
    return (
      <div>
        <label className={cx("flex items-center gap-2 text-ui", off ? "cursor-not-allowed text-fg-disabled" : "cursor-pointer text-fg-primary")}>
          <input type="checkbox" defaultChecked={Boolean(f.v)} disabled={off} aria-describedby={hint ? `${id}-hint` : undefined} className="size-4 accent-mode-solid" />
          {f.l}
        </label>
        {hint}
      </div>
    );
  }
  if (f.t === "read") {
    return (
      <div>
        <p className={labelClass}>{f.l}</p>
        <p className="rounded-control bg-shell px-2.5 py-1.5 text-ui leading-body break-words">{String(f.v ?? "—")}</p>
        {hint}
      </div>
    );
  }
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{f.l}</label>
      <div className="relative">
        <select id={id} defaultValue={String(f.v)} disabled={off} aria-describedby={hint ? `${id}-hint` : undefined}
          className={cx(inputClass, "h-control-form appearance-none truncate pe-8", off ? "cursor-not-allowed bg-shell-alt text-fg-disabled" : "cursor-pointer")}>
          <option>{String(f.v)}</option>
        </select>
        <ChevronDown size={14} aria-hidden className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary" />
      </div>
      {hint}
    </div>
  );
}
