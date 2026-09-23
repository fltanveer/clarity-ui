import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight, ChevronLeft, CornerDownRight, FileText, IdCard, LayoutGrid, Link2, Lock, Shield, Settings2,
  TriangleAlert, X, type LucideIcon,
} from "lucide-react";
import { AssignUnassignSurface } from "../surface/AssignUnassignSurface";
import { PaneTitle, TitleBand } from "../components/Grid";
import { ConfigIndex, DerivedHint, FieldRow, TextInput, controlClass, type IndexGroup } from "../components/ConfigFields";
import { Switch } from "../components/Switch";
import { SegmentedControl } from "../components/SegmentedControl";
import { ChromeButton, Pipe } from "./controls";
import { FieldSettingsPanel, FieldSettingsRail, seedFieldSettings, type FieldSettingsValue, type FieldSpec } from "./FieldSettings";
import { cx } from "../lib/cx";

/*
 * Container configuration (L100 only) — one surface for the objects that hold
 * other objects: the Workspace, its Domains, their Structures, and the Model
 * inside a structure. The three containers open it as a modal
 * (ContainerConfigDialog); the Model opens it in place, in the work area.
 *
 *   ┌ header: ⚙ Dimensions · Workspace ───────── Cancel · Save · close ┐
 *   │ WORKSPACE            │ page title band                          │
 *   │ PROPERTIES           │ page body                                │
 *   │   Identity           │                                          │
 *   │ SYSTEM & GOVERNANCE  │                                          │
 *   │   Permissions …      │                                          │
 *
 * Same two-column modal as Manage views, same section index as member
 * configuration, so "configure a container" reads like "configure a member".
 * Grouping and order follow the Golden UI reference: PROPERTIES is what a user
 * names and recognises, SYSTEM & GOVERNANCE is what the system owns. Identity
 * first, Audit & Identifiers last (orientation §5.4). Which container it is
 * changes the words and the fields, never the shape.
 */

export interface ContainerSubject {
  /** The object being configured, as the user meets it: "Workspace", "Domain". */
  kind: string;
  /** Its current name — the window title and the seed for Name | ID. */
  label: string;
  /** Singular and plural seeds; a tab label is singular in one bar and plural in another. */
  name: string;
  plural: string;
  Icon: LucideIcon;
  /** Stable key and immutable id, both system-managed. */
  keyValue: string;
  idValue: string;
  /** Workspace only: names the browser window. */
  windowTitle?: boolean;
  /** A Model has one name; containers that label tabs and lists also carry a plural. */
  noPlural?: boolean;
  /** What is unresolved about this object, stated where it is edited rather than hidden. */
  notice?: string;
  /** What owns it. Absent for the top of the chain. */
  parent?: { kind: string; name: string };
  /** What it owns: the child tabs, already stripped of pipes and add tokens. */
  children: { kind: string; items: string[] };
  /** Defined by ClarityOS: the name is locked and says why. */
  closed?: boolean;
  /** Domain Structure only: one contract serves both roles, so the pane says which it is showing. */
  roles?: { kind: string; note: string };
  /** Classification rows, delivered by the resolved frame and never edited here. */
  classification?: ClassificationRow[];
}

export interface ClassificationRow {
  label: string;
  /** One value, or one per role where the two roles resolve differently. */
  value: string | { Parent: string; Child: string };
  hint?: string;
  /** Applies only in the child role (Cardinality). */
  childOnly?: boolean;
}

interface Identity {
  name: string; plural: string; shortName: string;
  description: string; memo: string; windowTitle: string;
}
interface Governance { order: string; hidden: boolean; inactive: boolean; renamable: boolean }

type SectionId = "identity" | "permissions" | "relationships" | "classification" | "governance" | "audit";
type Role = "Parent" | "Child";

const LABELS: Record<SectionId, string> = {
  identity: "Identity", permissions: "Permissions", relationships: "Relationships",
  classification: "Classification", governance: "Governance & Navigation", audit: "Audit & Identifiers",
};

const ROLE_OPTIONS = [{ value: "Parent" as const, label: "Parent" }, { value: "Child" as const, label: "Child" }];

const STAMP = "2026-08-13 10:46";

/* One declaration per identity field: the pane renders it, field settings renames it. */
const IDENTITY_FIELDS: readonly (FieldSpec & { kindOnly?: "plural" | "windowTitle"; control: keyof Identity | "icon" | "color" })[] = [
  { key: "member_name", label: "Name | ID", type: "String (Text)", system: true, control: "name",
    helper: "" },
  { key: "icon_name", label: "Icon", type: "Icon", control: "icon" },
  { key: "color_scheme", label: "Color", type: "Select", control: "color" },
  { key: "plural_name", label: "Plural name", type: "String (Text)", control: "plural", kindOnly: "plural",
    helper: "Labels lists and tabs. Blank falls back to the name." },
  { key: "short_name", label: "Short name", type: "String (Text)", control: "shortName",
    helper: "Up to 16 characters. A display alias, never a key." },
  { key: "description", label: "Description", type: "Text", control: "description" },
  { key: "memo", label: "Memo", type: "Text", control: "memo" },
  { key: "window_title", label: "Window title", type: "String (Text)", control: "windowTitle", kindOnly: "windowTitle",
    helper: "Workspace only. Names the browser window." },
];

export const identityFieldsFor = (subject: ContainerSubject) => IDENTITY_FIELDS.filter((f) =>
  f.kindOnly === undefined
  || (f.kindOnly === "plural" && !subject.noPlural)
  || (f.kindOnly === "windowTitle" && subject.windowTitle));

export interface ContainerConfigurationProps {
  subject: ContainerSubject;
  onClose: () => void;
  /** Field settings, owned by the shell so MODEL mode honours what L100 sets here. */
  settings?: Record<string, FieldSettingsValue>;
  onSettings?: (next: Record<string, FieldSettingsValue>) => void;
  /**
   * "modal" — the container windows, opened over the shell.
   * "inline" — the Model, which owns the work area, so it wears the same
   * 44px header band as member configuration (one row height across the centre).
   */
  variant?: "modal" | "inline";
}

export function ContainerConfiguration({
  subject, onClose, settings: hostSettings, onSettings, variant = "modal",
}: ContainerConfigurationProps) {
  const { kind, label, Icon } = subject;
  const seedId: Identity = {
    name: subject.name, plural: subject.plural, shortName: "",
    description: "", memo: "", windowTitle: "",
  };
  const seedGov: Governance = { order: "0", hidden: false, inactive: false, renamable: !subject.closed };
  const [section, setSection] = useState<SectionId>("identity");
  const [role, setRole] = useState<Role>("Parent");
  /* Field settings: what each field is called and how it behaves. L100 work, so inline only.
     The shell owns them where it needs to apply them elsewhere; otherwise they are local. */
  const [ownSettings, setOwnSettings] = useState(() => seedFieldSettings(identityFieldsFor(subject)));
  const settings = hostSettings ?? ownSettings;
  const setSettings = (next: Record<string, FieldSettingsValue>) =>
    (onSettings ? onSettings(next) : setOwnSettings(next));
  const [fieldsOpen, setFieldsOpen] = useState(false);
  /* Classification only exists where the contract declares one. */
  const index = useMemo<IndexGroup[]>(() => [
    { group: "Properties", items: [{ id: "identity", label: "Identity", Icon: IdCard }] },
    { group: "System & Governance", items: [
      { id: "permissions", label: "Permissions", Icon: Shield },
      { id: "relationships", label: "Relationships", Icon: Link2 },
      ...(subject.classification ? [{ id: "classification", label: "Classification", Icon: LayoutGrid }] : []),
      { id: "governance", label: "Governance & Navigation", Icon: Settings2 },
      { id: "audit", label: "Audit & Identifiers", Icon: FileText },
    ] },
  ], [subject.classification]);
  const [id, setId] = useState(seedId);
  const [savedId, setSavedId] = useState(seedId);
  const [gov, setGov] = useState(seedGov);
  const [savedGov, setSavedGov] = useState(seedGov);

  const idDirty = (Object.keys(id) as (keyof Identity)[]).some((k) => id[k] !== savedId[k]);
  const govDirty = (Object.keys(gov) as (keyof Governance)[]).some((k) => gov[k] !== savedGov[k]);
  const dirty = idDirty || govDirty;

  return (
    <section aria-label={`${label} ${kind.toLowerCase()} configuration`} className="flex min-h-0 min-w-0 flex-1 flex-col">
      {variant === "inline" ? (
        /* Same band as member configuration — 44px, mode tint, back arrow, path — with the
           kind spelled out, so "configuring the Model" never reads as "configuring a record". */
        <header className="flex h-row-toolbar shrink-0 items-center gap-2 border-b border-line-strong bg-mode-soft ps-1.5 pe-2">
          <button type="button" onClick={onClose} aria-label="Back to the list"
            className="grid h-6 cursor-pointer place-items-center rounded-chip px-1.5 text-mode-ink hover:bg-surface">
            <ChevronLeft size={15} aria-hidden />
          </button>
          {subject.parent && (
            <>
              <span className="shrink-0 text-caption font-semibold tracking-label whitespace-nowrap text-mode-ink uppercase">{subject.parent.name}</span>
              <span aria-hidden className="shrink-0 text-caption text-mode-ink">|</span>
            </>
          )}
          <h2 title={label} className="min-w-0 shrink truncate text-ui font-semibold">{label}</h2>
          <span className="shrink-0 rounded-[3px] bg-mode-solid px-1.5 text-micro font-semibold tracking-eyebrow text-fg-on-accent uppercase">{kind}</span>
          <span className="shrink-0 text-caption whitespace-nowrap text-fg-tertiary">· {LABELS[section]}</span>
          <span className="min-w-3 flex-1" />
          <div className="flex shrink-0 items-center gap-1.5">
            <ChromeButton className="h-control-h bg-surface px-3" disabled={!dirty}
              onClick={() => { setId(savedId); setGov(savedGov); }}>Cancel</ChromeButton>
            <ChromeButton variant="primary" disabled={!dirty}
              onClick={() => { setSavedId(id); setSavedGov(gov); }}>Save</ChromeButton>
          </div>
        </header>
      ) : (
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line-strong bg-surface ps-4 pe-3">
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-control bg-mode-soft text-mode-ink">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-heading font-semibold">{label}</h2>
            <p className="text-caption text-fg-tertiary">{kind}</p>
          </div>
          <span className="min-w-3 flex-1" />
          <div className="flex shrink-0 items-center gap-1.5">
            <ChromeButton className="h-control-h bg-surface px-3" disabled={!dirty}
              onClick={() => { setId(savedId); setGov(savedGov); }}>Cancel</ChromeButton>
            <ChromeButton variant="primary" disabled={!dirty}
              onClick={() => { setSavedId(id); setSavedGov(gov); }}>Save</ChromeButton>
            <Pipe className="mx-1" />
          </div>
          <ChromeButton variant="icon" className="size-8" onClick={onClose}
            aria-label={`Close ${kind.toLowerCase()} configuration`} title="Close (Esc)">
            <X size={18} aria-hidden />
          </ChromeButton>
        </header>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="flex w-cfg-index shrink-0 flex-col border-e border-line-strong bg-shell-alt">
          {/* Modal only: the window needs to name its subject. In place, the header band
              above already says it, and member configuration's index carries no band. */}
          {variant === "modal" && (
            <div className="flex h-row-toolbar shrink-0 items-center border-b border-line-subtle bg-surface px-3">
              <h3 className="text-caption font-semibold tracking-label text-fg-tertiary uppercase">{kind}</h3>
            </div>
          )}
          <ConfigIndex groups={index} section={section} onSection={(s) => setSection(s as SectionId)}
            label={`${kind} sections`} controls="container-section"
            dirty={[...(idDirty ? ["identity"] : []), ...(govDirty ? ["governance"] : [])]} />
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-1">
        <div id="container-section" role="region" aria-label={LABELS[section]}
          className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
          {/* One shared contract, two roles: the bar says which role the pane is showing. */}
          {subject.roles && (section === "identity" || section === "classification") && (
            <div className="flex min-h-assign-band shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-subtle bg-mode-soft px-3 py-1.5">
              <div className="min-w-0 flex-1">
                <p className="text-caption font-semibold text-mode-ink">{subject.roles.kind} role context</p>
                <p className="text-caption text-fg-secondary">{subject.roles.note}</p>
              </div>
              <SegmentedControl options={ROLE_OPTIONS} value={role} onChange={setRole} label="Structure role" />
            </div>
          )}
          {section === "identity" && <IdentityPage subject={subject} value={id} onChange={setId} dirty={idDirty} settings={settings} />}
          {section === "classification" && <ClassificationPage rows={subject.classification ?? []} role={role} />}
          {section === "permissions" && <AssignUnassignSurface key={`${kind}-${label}-perm`} ctx="PERMISSIONS" hideTabs />}
          {section === "relationships" && <RelationshipsPage subject={subject} />}
          {section === "governance" && <GovernancePage subject={subject} value={gov} onChange={setGov} dirty={govDirty} />}
          {section === "audit" && <AuditPage subject={subject} />}
        </div>

        {variant === "inline" && (
          <>
            {fieldsOpen && (
              <FieldSettingsPanel fields={identityFieldsFor(subject)} values={settings}
                onChange={(key, next) => setSettings({ ...settings, [key]: next })}
                onClose={() => setFieldsOpen(false)} />
            )}
            <FieldSettingsRail active={section === "identity"} open={fieldsOpen}
              onOpen={() => setFieldsOpen((o) => !o)}
              reason="Field settings apply to Identity fields. Open Identity to edit them." />
          </>
        )}
        </div>
      </div>
    </section>
  );
}

function Page({ label, count, dirty, notice, children }: {
  label: string; count?: number; dirty?: boolean; notice?: string; children: ReactNode;
}) {
  return (
    <>
      <TitleBand>
        <PaneTitle count={count == null ? undefined : `${count} ${count === 1 ? "field" : "fields"}`}>{label}</PaneTitle>
        {dirty && <span role="status" className="ms-auto text-caption font-semibold text-warning-text">Unsaved changes</span>}
      </TitleBand>
      <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4">
        <div className="flex max-w-3xl flex-col gap-3">
          {/* What is unresolved is said on the page that edits it, not left for someone to discover. */}
          {notice && (
            <p className="flex items-start gap-2 rounded-panel bg-warning-soft px-3.5 py-2.5 text-ui leading-body text-warning-text">
              <TriangleAlert size={14} aria-hidden className="mt-0.5 shrink-0" />{notice}
            </p>
          )}
          <div className="rounded-panel border border-line-subtle bg-surface px-4">{children}</div>
        </div>
      </div>
    </>
  );
}

/* Read-only value: same gutter as an input, without pretending to be one. */
const Out = ({ id, children }: { id: string; children: ReactNode }) => (
  <output id={id} className="block pt-1.5 text-ui break-all">{children}</output>
);

const Hint = ({ children }: { children: ReactNode }) => (
  <p className="mt-1 text-caption text-fg-tertiary">{children}</p>
);

/* Icon and colour have no picker yet. A stub that says so beats a control that lies. */
function StubPicker({ id, swatch, children }: { id: string; swatch: ReactNode; children: string }) {
  return (
    <button id={id} type="button" title={`${children} — picker not built yet`}
      className={cx(controlClass, "flex h-control-form cursor-pointer items-center gap-2 text-start text-fg-secondary")}>
      {swatch}{children}
    </button>
  );
}

function IdentityPage({ subject, value, onChange, dirty, settings }: {
  subject: ContainerSubject; value: Identity; onChange: (v: Identity) => void; dirty: boolean;
  settings: Record<string, FieldSettingsValue>;
}) {
  const set = <K extends keyof Identity>(k: K, v: Identity[K]) => onChange({ ...value, [k]: v });
  const fields = identityFieldsFor(subject);
  return (
    <Page label="Identity" count={fields.length} dirty={dirty} notice={subject.notice}>
      {fields.map((f) => {
        const s = settings[f.key];
        const locked = f.key === "member_name" && subject.closed;
        return (
          <FieldRow key={f.key} label={s?.label ?? f.label} state={s?.hiddenInModel ? "hidden" : s?.lockedInModel ? "locked" : undefined}
            hint={locked ? (
              <p className="mt-1 flex items-start gap-1 text-caption text-fg-tertiary">
                <Lock size={11} aria-hidden className="mt-0.5 shrink-0" />
                {subject.kind}s like this one are defined by ClarityOS, so the name can’t be changed.
              </p>
            ) : s?.helper ? <Hint>{s.helper}</Hint> : undefined}>
            {(id) => {
              if (f.control === "icon") {
                return <StubPicker id={id} swatch={<span aria-hidden className="grid size-4 place-items-center text-fg-tertiary">◇</span>}>Choose icon</StubPicker>;
              }
              if (f.control === "color") {
                return <StubPicker id={id} swatch={<span aria-hidden className="size-3.5 rounded-[3px] bg-mode-solid" />}>Choose colour</StubPicker>;
              }
              const k = f.control;
              const area = k === "description" || k === "memo";
              return <TextInput id={id} area={area} value={value[k]} disabled={locked}
                onChange={(v) => set(k, v)} />;
            }}
          </FieldRow>
        );
      })}
    </Page>
  );
}

function GovernancePage({ subject, value, onChange, dirty }: {
  subject: ContainerSubject; value: Governance; onChange: (v: Governance) => void; dirty: boolean;
}) {
  const set = <K extends keyof Governance>(k: K, v: Governance[K]) => onChange({ ...value, [k]: v });
  const place = subject.kind === "Workspace" ? "the rail" : "the domain bar";
  return (
    <Page label="Governance & Navigation" count={5} dirty={dirty}>
      <FieldRow label="Order #" hint={<Hint>Where this {subject.kind.toLowerCase()} sits in {place}. 0 is first.</Hint>}>
        {(id) => <input id={id} inputMode="numeric" value={value.order} onChange={(e) => set("order", e.target.value)}
          className={cx(controlClass, "h-control-form w-24! tabular-nums")} />}
      </FieldRow>
      <FieldRow label="Hidden" hint={<Hint>Kept out of navigation. Independent of Inactive.</Hint>}>
        {() => <div className="pt-0.5"><Switch checked={value.hidden} onChange={(v) => set("hidden", v)} label="Hidden from navigation" /></div>}
      </FieldRow>
      <FieldRow label="Inactive" hint={<Hint>Approved target · no contract row yet, so this switch stores nothing.</Hint>}>
        {() => <div className="pt-0.5"><Switch checked={value.inactive} onChange={(v) => set("inactive", v)} label={`${subject.kind} inactive`} /></div>}
      </FieldRow>
      <FieldRow label="Can be renamed" hint={<Hint>Governs the rename action. Editable at L100 only.</Hint>}>
        {() => <div className="pt-0.5"><Switch checked={value.renamable} onChange={(v) => set("renamable", v)} label={`${subject.kind} can be renamed`} /></div>}
      </FieldRow>
      <FieldRow label="System-defined" hint={<DerivedHint>System-managed · set by the seed that created it</DerivedHint>}>
        {(id) => <Out id={id}>{subject.closed ? "Yes — defined by ClarityOS" : "No — created in this organization"}</Out>}
      </FieldRow>
    </Page>
  );
}

function RelationshipsPage({ subject }: { subject: ContainerSubject }) {
  const { parent, children } = subject;
  return (
    <>
      <TitleBand><PaneTitle count={`${children.items.length + (parent ? 1 : 0)} linked`}>Relationships</PaneTitle></TitleBand>
      <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4">
        <div className="flex max-w-3xl flex-col gap-3">
          {/* Edges are shown, never edited here: a dropdown would imply the graph is a property. */}
          <p className="text-caption text-fg-secondary">Links resolved from the graph. Read-only here — edges are changed where they are owned.</p>
          <RelationshipGroup title="Parent · owned by" icon={<ArrowUpRight size={14} aria-hidden />}>
            {parent
              ? <Links items={[parent.name]} note={parent.kind} />
              : <p className="text-ui text-fg-tertiary">None. A {subject.kind.toLowerCase()} is the top of the visible chain.</p>}
          </RelationshipGroup>
          <RelationshipGroup title="Children · owns" icon={<CornerDownRight size={14} aria-hidden />}>
            {children.items.length
              ? <Links items={children.items} note={children.kind} />
              : <p className="text-ui text-fg-tertiary">No {children.kind.toLowerCase()} defined here.</p>}
          </RelationshipGroup>
          <RelationshipGroup title="Connected to" icon={<Link2 size={14} aria-hidden />}>
            <p className="text-ui text-fg-tertiary">No connections resolved for this {subject.kind.toLowerCase()}.</p>
          </RelationshipGroup>
        </div>
      </div>
    </>
  );
}

function Links({ items, note }: { items: string[]; note: string }) {
  return (
    <>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((n) => (
          <li key={n} className="flex items-center gap-1.5 rounded-chip bg-shell px-2.5 py-1 text-ui text-fg-secondary">
            <span aria-hidden className="size-1.5 rounded-full bg-mode-solid" />{n}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-caption text-fg-tertiary">{note}</p>
    </>
  );
}

function RelationshipGroup({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-panel border border-line-subtle bg-surface">
      <h3 className="flex items-center gap-1.5 border-b border-line-subtle px-3.5 py-2 text-caption font-semibold tracking-label text-fg-secondary uppercase">
        <span aria-hidden className="text-fg-tertiary">{icon}</span>{title}
      </h3>
      <div className="px-3.5 py-3">{children}</div>
    </section>
  );
}

/*
 * Classification is internal taxonomy: it is delivered by the resolved frame and
 * shown read-only at L100 (orientation §2), never offered as an editable control.
 */
function ClassificationPage({ rows, role }: { rows: ClassificationRow[]; role: Role }) {
  const shown = rows.filter((r) => !r.childOnly || role === "Child");
  return (
    <Page label="Classification" count={shown.length}>
      {shown.map((r) => (
        <FieldRow key={r.label} label={r.label} hint={r.hint ? <DerivedHint>{r.hint}</DerivedHint> : undefined}>
          {(id) => <Out id={id}>{typeof r.value === "string" ? r.value : r.value[role]}</Out>}
        </FieldRow>
      ))}
    </Page>
  );
}

function AuditPage({ subject }: { subject: ContainerSubject }) {
  return (
    <Page label="Audit & Identifiers" count={6}>
      <FieldRow label={`${subject.kind} key`} hint={<DerivedHint>System-managed · the stable key other records point at</DerivedHint>}>
        {(id) => <Out id={id}>{subject.keyValue}</Out>}
      </FieldRow>
      <FieldRow label={`${subject.kind} ID`} hint={<DerivedHint>Immutable · every relationship anchors on it</DerivedHint>}>
        {(id) => <Out id={id}>{subject.idValue}</Out>}
      </FieldRow>
      <FieldRow label="Created" hint={<DerivedHint>System-managed</DerivedHint>}>{(id) => <Out id={id}>{STAMP}</Out>}</FieldRow>
      <FieldRow label="Created by" hint={<PendingHint />}>{(id) => <Pending id={id} />}</FieldRow>
      <FieldRow label="Updated" hint={<DerivedHint>System-managed</DerivedHint>}>{(id) => <Out id={id}>{STAMP}</Out>}</FieldRow>
      <FieldRow label="Updated by" hint={<PendingHint />}>{(id) => <Pending id={id} />}</FieldRow>
    </Page>
  );
}

/* Created by / Updated by stay visible and empty: the field is approved, the
   column behind it is not built. An absent row would hide the gap. */
const Pending = ({ id }: { id: string }) => (
  <output id={id} className="block pt-1.5 text-ui text-fg-tertiary">Not recorded</output>
);
const PendingHint = () => <Hint>Approved field · nothing stores the actor yet, so it stays empty.</Hint>;

/*
 * The window itself, modal over the shell like Manage views: the shell behind
 * is inert while it is open, Escape closes, and focus returns to the control
 * that opened it — the rail gear, or the domain tab's Edit.
 */
export function ContainerConfigDialog(props: ContainerConfigurationProps) {
  const close = props.onClose;
  useEffect(() => {
    const root = document.getElementById("root");
    const opener = document.activeElement as HTMLElement | null;
    root?.setAttribute("inert", "");
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root?.removeAttribute("inert");
      opener?.focus();
    };
  }, [close]);

  return createPortal(
    <div className="fixed inset-0 z-40 grid place-items-center overscroll-contain bg-scrim p-4 sm:p-8">
      <div role="dialog" aria-modal="true" aria-label={`${props.subject.kind} configuration`}
        className="flex h-full max-h-[52rem] w-full max-w-[80rem] overflow-hidden rounded-panel border border-line-strong bg-surface shadow-popover">
        <ContainerConfiguration {...props} />
      </div>
    </div>,
    document.body,
  );
}
