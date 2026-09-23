import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight, CornerDownRight, FileText, IdCard, LayoutGrid, Link2, Lock, Shield, Settings2, X,
  type LucideIcon,
} from "lucide-react";
import { AssignUnassignSurface } from "../surface/AssignUnassignSurface";
import { PaneTitle, TitleBand } from "../components/Grid";
import { ConfigIndex, DerivedHint, FieldRow, TextInput, controlClass, type IndexGroup } from "../components/ConfigFields";
import { Switch } from "../components/Switch";
import { SegmentedControl } from "../components/SegmentedControl";
import { ChromeButton, Pipe } from "./controls";
import { cx } from "../lib/cx";

/*
 * Container configuration (L100 only) — one window for the objects that hold
 * other objects: a Workspace and the Domains inside it.
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

export interface ContainerConfigurationProps {
  subject: ContainerSubject;
  onClose: () => void;
}

export function ContainerConfiguration({ subject, onClose }: ContainerConfigurationProps) {
  const { kind, label, Icon } = subject;
  const seedId: Identity = {
    name: subject.name, plural: subject.plural, shortName: "",
    description: "", memo: "", windowTitle: "",
  };
  const seedGov: Governance = { order: "0", hidden: false, inactive: false, renamable: !subject.closed };
  const [section, setSection] = useState<SectionId>("identity");
  const [role, setRole] = useState<Role>("Parent");
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

      <div className="flex min-h-0 flex-1">
        <div className="flex w-cfg-index shrink-0 flex-col border-e border-line-strong bg-shell-alt">
          {/* Title band matches the view surfaces: 44px, caption, hairline. */}
          <div className="flex h-row-toolbar shrink-0 items-center border-b border-line-subtle bg-surface px-3">
            <h3 className="text-caption font-semibold tracking-label text-fg-tertiary uppercase">{kind}</h3>
          </div>
          <ConfigIndex groups={index} section={section} onSection={(s) => setSection(s as SectionId)}
            label={`${kind} sections`} controls="container-section"
            dirty={[...(idDirty ? ["identity"] : []), ...(govDirty ? ["governance"] : [])]} />
        </div>

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
          {section === "identity" && <IdentityPage subject={subject} value={id} onChange={setId} dirty={idDirty} />}
          {section === "classification" && <ClassificationPage rows={subject.classification ?? []} role={role} />}
          {section === "permissions" && <AssignUnassignSurface key={`${kind}-${label}-perm`} ctx="PERMISSIONS" hideTabs />}
          {section === "relationships" && <RelationshipsPage subject={subject} />}
          {section === "governance" && <GovernancePage subject={subject} value={gov} onChange={setGov} dirty={govDirty} />}
          {section === "audit" && <AuditPage subject={subject} />}
        </div>
      </div>
    </section>
  );
}

function Page({ label, count, dirty, children }: { label: string; count?: number; dirty?: boolean; children: ReactNode }) {
  return (
    <>
      <TitleBand>
        <PaneTitle count={count == null ? undefined : `${count} ${count === 1 ? "field" : "fields"}`}>{label}</PaneTitle>
        {dirty && <span role="status" className="ms-auto text-caption font-semibold text-warning-text">Unsaved changes</span>}
      </TitleBand>
      <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4">
        <div className="max-w-3xl rounded-panel border border-line-subtle bg-surface px-4">{children}</div>
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

function IdentityPage({ subject, value, onChange, dirty }: {
  subject: ContainerSubject; value: Identity; onChange: (v: Identity) => void; dirty: boolean;
}) {
  const set = <K extends keyof Identity>(k: K, v: Identity[K]) => onChange({ ...value, [k]: v });
  const count = 7 + (subject.windowTitle ? 1 : 0);
  return (
    <Page label="Identity" count={count} dirty={dirty}>
      <FieldRow label="Name | ID"
        hint={subject.closed ? (
          <p className="mt-1 flex items-start gap-1 text-caption text-fg-tertiary">
            <Lock size={11} aria-hidden className="mt-0.5 shrink-0" />
            {subject.kind}s like this one are defined by ClarityOS, so the name can’t be changed.
          </p>
        ) : undefined}>
        {(id) => <TextInput id={id} value={value.name} disabled={subject.closed} onChange={(v) => set("name", v)} />}
      </FieldRow>
      <FieldRow label="Icon">{(id) => (
        <StubPicker id={id} swatch={<span aria-hidden className="grid size-4 place-items-center text-fg-tertiary">◇</span>}>Choose icon</StubPicker>
      )}</FieldRow>
      <FieldRow label="Color">{(id) => (
        <StubPicker id={id} swatch={<span aria-hidden className="size-3.5 rounded-[3px] bg-mode-solid" />}>Choose colour</StubPicker>
      )}</FieldRow>
      <FieldRow label="Plural name" hint={<Hint>Labels lists and tabs. Blank falls back to the name.</Hint>}>
        {(id) => <TextInput id={id} value={value.plural} onChange={(v) => set("plural", v)} />}
      </FieldRow>
      <FieldRow label="Short name" hint={<Hint>Up to 16 characters. A display alias, never a key.</Hint>}>
        {(id) => <TextInput id={id} value={value.shortName} onChange={(v) => set("shortName", v)} />}
      </FieldRow>
      <FieldRow label="Description">{(id) => <TextInput id={id} area value={value.description} onChange={(v) => set("description", v)} />}</FieldRow>
      <FieldRow label="Memo">{(id) => <TextInput id={id} area value={value.memo} onChange={(v) => set("memo", v)} />}</FieldRow>
      {subject.windowTitle && (
        <FieldRow label="Window title" hint={<Hint>Workspace only. Names the browser window.</Hint>}>
          {(id) => <TextInput id={id} value={value.windowTitle} onChange={(v) => set("windowTitle", v)} />}
        </FieldRow>
      )}
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
