import { useState, type ReactNode } from "react";
import {
  Archive, BarChart3, ChevronLeft, CircleAlert, GitBranch, IdCard, Lock,
  Maximize2, Minimize2, Pencil, RefreshCw, Search, Server, Shield, Sliders, Tag, Trash2, Wrench,
  type LucideIcon,
} from "lucide-react";
import { DIMENSION_SCHEMA, systemSection, type PropertyFieldDef, type PropertySectionDef } from "../lib/properties";
import { AssignUnassignSurface } from "../surface/AssignUnassignSurface";
import { EmptyState } from "../components/EmptyState";
import { PaneTitle, TitleBand } from "../components/Grid";
import { ChromeButton, Pipe } from "./controls";
import { ConfirmDialog } from "./ConfirmDialog";
import { cx } from "../lib/cx";
import { ConfigIndex, FieldRow, TextInput, controlClass, type IndexGroup } from "../components/ConfigFields";
import { ATTACHMENTS, NOTES } from "../lib/records";
import { AttachmentsList, NotesList } from "../components/RecordLists";

/*
 * Member configuration (Dimensions · MODEL · member selected).
 *
 *   ┌ header band: ‹ STRUCTURE | Member · Section ─────────── search refresh collapse ┐
 *   │ section index (212px)   │ page title band  LABEL · meta ………………………… actions        │
 *   │ Attributes              │ page body                                             │
 *   │ RELATIONS …             │                                                       │
 *   │ RECORDS …               │                                                       │
 *   (Delete · Cancel · Save sit top-right in the header band, before the tools)
 *
 * Every page opens with the same title band the assign surface uses, so
 * attribute pages, Permissions and Notes read as one family. ATTRIBUTES is a
 * menu group: Identity, one item per schema section of the structure, and
 * System Details — each its own page (2026-09-14, replacing the one-page
 * accordion). Save/Cancel commit the MEMBER, so they live in the header band,
 * visible whichever page is open; the dot marks the attribute page holding edits.
 */

type Item = [id: string, label: string, Icon: LucideIcon, ctx?: string | null];

/* Attribute items are built per structure (its schema sections); these follow them. */
const REST: Array<{ group: string | null; items: Item[] }> = [
  { group: "Relations", items: [
    ["relationships", "Relationships", GitBranch, null],
    ["permissions", "Permissions", Shield, "PERMISSIONS"],
    ["rollup", "Rollup", BarChart3, "AGG_ROLLUP"],
    ["report", "Report & Metric Views", Sliders, "REPORT_LAYOUT"],
    ["structures", "Allocation & Structures", GitBranch, "STRUCTURES"],
    ["composition", "Composition", Wrench, "COMPOSITION_QTY"],
  ] },
  { group: "Records", items: [
    ["notes", "Notes", Pencil],
    ["attachments", "Attachments", Archive],
  ] },
];
const schemaItemId = (sectionId: string) => `attr-${sectionId}`;

interface Identity { name: string; shortName: string; description: string; memo: string }

export interface MemberConfigurationProps {
  name: string;
  structure: string | null;
  locked: boolean;
  chromeCollapsed: boolean;
  onChromeCollapsed: (c: boolean) => void;
  onExit: () => void;
  onDelete: () => void;
}

export function MemberConfiguration({ name, structure, locked, chromeCollapsed, onChromeCollapsed, onExit, onDelete }: MemberConfigurationProps) {
  /* The shell keys this component by member, so a new member re-seeds everything. */
  const [section, setSection] = useState("identity");
  const seed: Identity = { name, shortName: "", description: "", memo: "" };
  const [draft, setDraft] = useState<Identity>(seed);
  const [saved, setSaved] = useState<Identity>(seed);
  const [confirm, setConfirm] = useState(false);

  const schema = structure ? DIMENSION_SCHEMA[structure] : undefined;
  const system = Boolean(schema?.system);
  const cannotDelete = locked || system;
  const dirty = (Object.keys(draft) as (keyof Identity)[]).some((k) => draft[k] !== saved[k]);
  const schemaSections = schema?.sections ?? [];
  const index: Array<{ group: string | null; items: Item[] }> = [
    { group: "Attributes", items: [
      ["identity", "Identity", IdCard],
      ...schemaSections.map((sec): Item => [schemaItemId(sec.id), sec.label, Tag]),
      ["system", "System Details", Server],
    ] },
    ...REST,
  ];
  const indexGroups: IndexGroup[] = index.map((g) => ({ group: g.group, items: g.items.map(([id, label, Icon]) => ({ id, label, Icon })) }));
  const current = index.flatMap((g) => g.items).find(([id]) => id === section) ?? index[0].items[0];

  return (
    <section aria-label={`${saved.name} configuration`} className="flex min-h-0 min-w-0 flex-1 flex-col border-s border-line-strong">
      <header className="flex h-row-toolbar shrink-0 items-center gap-2 border-b border-line-strong bg-mode-soft ps-1.5 pe-2">
        <button type="button" onClick={onExit} aria-label="Back to master list"
          className="grid h-6 cursor-pointer place-items-center rounded-chip px-1.5 text-mode-ink hover:bg-surface">
          <ChevronLeft size={15} aria-hidden />
        </button>
        <span className="shrink-0 text-caption font-semibold tracking-label whitespace-nowrap text-mode-ink uppercase">{structure ?? "Structure"}</span>
        <span aria-hidden className="shrink-0 text-caption text-mode-ink">|</span>
        <h2 title={saved.name} className="min-w-0 shrink truncate text-ui font-semibold">{saved.name}</h2>
        {cannotDelete && <Lock size={11} aria-label="System-defined member" className="shrink-0 text-fg-tertiary" />}
        <span className="shrink-0 text-caption whitespace-nowrap text-fg-tertiary">· {current[1]}</span>
        <span className="min-w-3 flex-1" />
        {/* Member actions lead the top-right group: destructive apart, then Cancel / Save, then tools. */}
        <div className="flex shrink-0 items-center gap-1.5">
          <ChromeButton variant="danger-ghost" className="h-control-h w-control-h shrink-0 px-0" disabled={cannotDelete}
            onClick={() => setConfirm(true)} aria-label="Delete member"
            title={cannotDelete ? "System-defined — cannot be deleted" : "Delete member"}>
            <Trash2 size={14} aria-hidden className="size-3.5 shrink-0" />
          </ChromeButton>
          <Pipe className="mx-1" />
          <ChromeButton className="h-control-h bg-surface px-3" disabled={!dirty} onClick={() => setDraft(saved)}>Cancel</ChromeButton>
          <ChromeButton variant="primary" disabled={!dirty} onClick={() => setSaved(draft)}>Save</ChromeButton>
          <Pipe className="mx-1" />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ChromeButton variant="icon" aria-label="Search this member"><Search size={14} aria-hidden /></ChromeButton>
          <ChromeButton variant="icon" aria-label="Refresh"><RefreshCw size={14} aria-hidden /></ChromeButton>
          <ChromeButton variant="icon" onClick={() => onChromeCollapsed(!chromeCollapsed)}
            aria-label={chromeCollapsed ? "Expand header" : "Collapse header"}>
            {chromeCollapsed ? <Maximize2 size={14} aria-hidden /> : <Minimize2 size={14} aria-hidden />}
          </ChromeButton>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-cfg-index shrink-0 flex-col border-e border-line-strong bg-shell-alt">
          <ConfigIndex groups={indexGroups} section={current[0]} onSection={setSection} label="Member sections"
            controls="member-section" dirty={dirty ? ["identity"] : []} />
        </div>

        <div id="member-section" role="region" aria-label={current[1]} className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
          <SectionContent item={current} name={saved.name} schemaSections={schemaSections}
            system={system} draft={draft} onDraft={setDraft} dirty={dirty} />
        </div>
      </div>

      {confirm && (
        <ConfirmDialog title={`Delete ${saved.name}?`} confirmLabel="Delete member"
          onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); onDelete(); }}>
          This removes the member from every view and structure that holds it. It cannot be undone.
        </ConfirmDialog>
      )}
    </section>
  );
}

function SectionContent({ item, name, schemaSections, system, draft, onDraft, dirty }: {
  item: Item; name: string; schemaSections: PropertySectionDef[]; system: boolean;
  draft: Identity; onDraft: (d: Identity) => void; dirty: boolean;
}) {
  const [id, label, , ctx] = item;

  /* Relation pages bring their own title bands (the pattern the other pages copy). */
  if (ctx) return <AssignUnassignSurface key={`${name}-${id}`} ctx={ctx} hideTabs />;

  if (id === "identity") {
    return (
      <AttributePage label={label} count={4} dirty={dirty}>
        <FieldRow label="Name | ID">{(fid) => <TextInput id={fid} value={draft.name} onChange={(v) => onDraft({ ...draft, name: v })} />}</FieldRow>
        <FieldRow label="Short Name">{(fid) => <TextInput id={fid} value={draft.shortName} onChange={(v) => onDraft({ ...draft, shortName: v })} />}</FieldRow>
        <FieldRow label="Description">{(fid) => <TextInput id={fid} area value={draft.description} onChange={(v) => onDraft({ ...draft, description: v })} />}</FieldRow>
        <FieldRow label="Memo">{(fid) => <TextInput id={fid} area value={draft.memo} onChange={(v) => onDraft({ ...draft, memo: v })} />}</FieldRow>
      </AttributePage>
    );
  }
  if (id === "system" || id.startsWith("attr-")) {
    const sec = id === "system" ? systemSection(system) : schemaSections.find((x) => schemaItemId(x.id) === id);
    const fields = sec?.fields ?? [];
    return (
      <AttributePage label={label} count={fields.length} dirty={dirty}>
        {fields.length
          ? fields.map((f) => <SchemaField key={f.l} field={f} />)
          : <p className="py-4 text-ui text-fg-tertiary">No settings defined for this structure yet.</p>}
      </AttributePage>
    );
  }

  return (
    <>
      <TitleBand>
        <PaneTitle count={id === "notes" ? `${NOTES.length} notes` : id === "attachments" ? `${ATTACHMENTS.length} files` : undefined}>
          {label}
        </PaneTitle>
      </TitleBand>
      <div className={cx("min-h-0 flex-1 overflow-auto", id !== "relationships" && "bg-canvas p-4")}>
        {id === "relationships" && (
          <EmptyState title="No relationships yet"
            description="Parent, child and connected members for this member will appear here." />
        )}
        {id === "notes" && <NotesList />}
        {id === "attachments" && <AttachmentsList />}
      </div>
    </>
  );
}

/* ── One attribute section per page: title band, then its fields in a card ─ */
function AttributePage({ label, count, dirty, children }: { label: string; count: number; dirty: boolean; children: ReactNode }) {
  return (
    <>
      <TitleBand>
        <PaneTitle count={`${count} ${count === 1 ? "field" : "fields"}`}>{label}</PaneTitle>
        {dirty && (
          <span role="status" className="ms-auto flex items-center gap-1 text-caption font-semibold text-warning-text">
            <CircleAlert size={12} aria-hidden /> Unsaved changes
          </span>
        )}
      </TitleBand>
      <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4">
        <div className="max-w-3xl rounded-panel border border-line-subtle bg-surface px-4">{children}</div>
      </div>
    </>
  );
}

function SchemaField({ field: f }: { field: PropertyFieldDef }) {
  const off = Boolean(f.off);
  const hint = (f.src || off) ? (
    <p className="mt-1 flex items-center gap-1 text-caption text-fg-tertiary">
      <Lock size={10} aria-hidden /> {f.src ? `Derived · ${f.src}` : f.off}
    </p>
  ) : null;

  if (f.t === "check") {
    return (
      <FieldRow label={f.l} hint={hint}>
        {(id) => (
          <label className={cx("flex h-control-form items-center gap-2 text-ui", off ? "cursor-not-allowed text-fg-disabled" : "cursor-pointer text-fg-secondary")}>
            <input id={id} type="checkbox" defaultChecked={Boolean(f.v)} disabled={off} className="size-4 accent-mode-solid" />
            {f.v ? "Yes" : "No"}
          </label>
        )}
      </FieldRow>
    );
  }
  if (f.t === "read") {
    /* A derived value without its authority is indistinguishable from a typed one. */
    return (
      <FieldRow label={f.l} hint={hint}>
        {(id) => <output id={id} className="block pt-1.5 text-ui leading-body break-words">{String(f.v ?? "—")}</output>}
      </FieldRow>
    );
  }
  return (
    <FieldRow label={f.l} hint={hint}>
      {(id) => (
        <select id={id} defaultValue={String(f.v)} disabled={off}
          className={cx(controlClass, "h-control-form", off ? "cursor-not-allowed bg-shell-alt text-fg-disabled" : "cursor-pointer")}>
          <option>{String(f.v)}</option>
        </select>
      )}
    </FieldRow>
  );
}
