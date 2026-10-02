import { useId, useRef, useState, type ReactNode } from "react";
import { Boxes, CircleAlert, GitBranch, Layers, Lock, Pencil, Plus, Trash2, Users } from "lucide-react";
import { FieldRow, controlClass } from "../components/ConfigFields";
import { ChromeButton } from "./controls";
import { Dialog, dangerButtonClass } from "./Dialog";
import { cx } from "../lib/cx";

/* What a structure is, derived from its name: rollups aggregate, the rest list members. */
const kindOf = (name: string) => (/rollup/i.test(name) ? "Rollup structure" : "Member list");

export const DialogIcon = ({ tone, children }: { tone: "mode" | "danger"; children: React.ReactNode }) => (
  <span aria-hidden className={cx("grid size-9 shrink-0 place-items-center rounded-control",
    tone === "mode" ? "bg-mode-soft text-mode-ink" : "bg-danger-soft text-danger-text")}>
    {children}
  </span>
);

/* A structure's identity — the same four fields, in the same rows, as a member's. */
export interface StructureIdentity { name: string; shortName: string; description: string; memo: string }
const EMPTY_IDENTITY: StructureIdentity = { name: "", shortName: "", description: "", memo: "" };
const IDENTITY_ROWS: Array<{ key: keyof StructureIdentity; label: string; area?: boolean }> = [
  { key: "name", label: "Name / Code" },
  { key: "shortName", label: "Short Name" },
  { key: "description", label: "Description", area: true },
  { key: "memo", label: "Memo", area: true },
];

export interface EditStructureDialogProps {
  domain: string;
  name: string;
  /** Required structure: renamable, not deletable. */
  system: boolean;
  /** Structure-closed domain: defined by ClarityOS, not renamable. */
  closed: boolean;
  /** Names of the other structures in this domain, for the uniqueness check. */
  siblings: string[];
  identity?: Partial<StructureIdentity>;
  onCancel: () => void;
  onSave: (next: StructureIdentity) => void;
}

/*
 * Edit a structure. What is editable follows the structure's context:
 *   ordinary  → every identity field
 *   required  → every identity field, with a note that it cannot be deleted
 *   closed    → the name is locked with its reason; the rest stay editable
 * Validation runs on Save and says how to fix it, next to the field.
 */
export function EditStructureDialog({ domain, name, system, closed, siblings, identity, onCancel, onSave }: EditStructureDialogProps) {
  return (
    <StructureIdentityDialog title="Edit structure" subtitle={<>{domain} domain · {name}</>} submitLabel="Save changes"
      icon={<Pencil size={16} />} domain={domain} siblings={siblings} nameLocked={closed}
      initial={{ ...EMPTY_IDENTITY, ...identity, name }} onCancel={onCancel} onSave={onSave}
      lead={
        <ul aria-label="Structure facts" className="flex flex-wrap gap-1.5">
          <Fact icon={<Boxes size={12} />}>{kindOf(name)}</Fact>
          <Fact icon={<Users size={12} />}>5 members</Fact>
          <Fact icon={<GitBranch size={12} />}>Used by 3 structures</Fact>
        </ul>
      }
      foot={system && (
        <p className="flex items-start gap-2 rounded-panel border border-line-subtle bg-surface px-3 py-2 text-caption leading-body text-fg-secondary">
          <Lock size={12} aria-hidden className="mt-0.5 shrink-0 text-fg-tertiary" />
          Required structure: it can be renamed, but it can’t be deleted.
        </p>
      )} />
  );
}

export interface AddStructureDialogProps {
  domain: string;
  /** What one structure is called here, e.g. "Model Category"; otherwise "structure". */
  noun: string;
  siblings: string[];
  onCancel: () => void;
  onCreate: (next: StructureIdentity) => void;
}

/* Add a structure: the member's Add flow, applied one level up. */
export function AddStructureDialog({ domain, noun, siblings, onCancel, onCreate }: AddStructureDialogProps) {
  const lower = noun.toLowerCase();
  return (
    <StructureIdentityDialog title={`New ${lower}`} subtitle={<>{domain} domain · added after the last {lower}</>}
      submitLabel={`Create ${lower}`} icon={<Plus size={16} />} domain={domain} siblings={siblings} noun={lower}
      initial={EMPTY_IDENTITY} onCancel={onCancel} onSave={onCreate} />
  );
}

function StructureIdentityDialog({ title, subtitle, submitLabel, icon, domain, siblings, noun = "structure", nameLocked = false,
  initial, lead, foot, onCancel, onSave }: {
  title: string; subtitle: ReactNode; submitLabel: string; icon: ReactNode; domain: string; siblings: string[];
  noun?: string; nameLocked?: boolean; initial: StructureIdentity; lead?: ReactNode; foot?: ReactNode;
  onCancel: () => void; onSave: (next: StructureIdentity) => void;
}) {
  const errorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const next = draft.name.trim();
    if (!nameLocked) {
      if (!next) { setError(`Enter a name for this ${noun}.`); nameRef.current?.focus(); return; }
      if (siblings.some((s) => s.toLowerCase() === next.toLowerCase())) {
        setError(`Another ${domain} structure is already called “${next}”. Choose a different name.`);
        nameRef.current?.focus();
        return;
      }
    }
    onSave({ name: nameLocked ? initial.name : next, shortName: draft.shortName.trim(),
      description: draft.description.trim(), memo: draft.memo.trim() });
  };

  return (
    <Dialog title={title} subtitle={subtitle} className="max-w-[36rem]"
      icon={<DialogIcon tone="mode">{icon}</DialogIcon>}
      onClose={onCancel} onSubmit={submit}
      footer={
        <>
          <ChromeButton onClick={onCancel}>Cancel</ChromeButton>
          <ChromeButton type="submit" variant="primary" className="h-control-h">{submitLabel}</ChromeButton>
        </>
      }>
      {/* The member's Identity page, on its canvas: a structure reads the same way a member does. */}
      <div className="-mx-5 -my-4 flex flex-col gap-3 bg-canvas p-4">
        {lead}
        <section aria-label="Identity">
          <p className="mb-2 flex items-baseline gap-2 text-caption font-semibold tracking-label text-fg-secondary uppercase">
            Identity <span className="font-normal tracking-normal text-fg-tertiary normal-case">{IDENTITY_ROWS.length} fields</span>
          </p>
          <div className="rounded-panel border border-line-subtle bg-surface px-4">
            {IDENTITY_ROWS.map((r) => {
              const isName = r.key === "name";
              const hint = isName && error ? (
                <p id={errorId} className="mt-1 flex items-start gap-1 text-caption text-danger-text">
                  <CircleAlert size={12} aria-hidden className="mt-0.5 shrink-0" /> {error}
                </p>
              ) : isName && nameLocked ? (
                <p className="mt-1 flex items-start gap-1 text-caption text-fg-tertiary">
                  <Lock size={11} aria-hidden className="mt-0.5 shrink-0" />
                  Structures in the {domain} domain are defined by ClarityOS, so the name can’t be changed.
                </p>
              ) : undefined;
              return (
                <FieldRow key={r.key} label={r.label} hint={hint}>
                  {(id) => r.area ? (
                    <textarea id={id} rows={2} value={draft[r.key]} onChange={(e) => setDraft({ ...draft, [r.key]: e.target.value })}
                      className={cx(controlClass, "min-h-16 resize-y py-1.5 leading-body")} />
                  ) : (
                    <input id={id} ref={isName ? nameRef : undefined} value={draft[r.key]} disabled={isName && nameLocked}
                      autoComplete="off" spellCheck={false} aria-required={isName || undefined}
                      onChange={(e) => { setDraft({ ...draft, [r.key]: e.target.value }); if (isName) setError(null); }}
                      aria-invalid={isName && error ? "true" : undefined}
                      aria-describedby={isName && error ? errorId : undefined}
                      className={cx(controlClass, "h-control-form", isName && error && "border-danger-text hover:border-danger-text")} />
                  )}
                </FieldRow>
              );
            })}
          </div>
        </section>
        {foot}
      </div>
    </Dialog>
  );
}

const Fact = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <li className="flex items-center gap-1.5 rounded-full bg-shell px-2.5 py-1 text-caption text-fg-secondary">
    <span aria-hidden className="text-fg-tertiary">{icon}</span>{children}
  </li>
);

export interface DeleteStructureDialogProps {
  domain: string;
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/*
 * Destructive, irreversible: the consequences are listed in numbers and the
 * action unlocks only when the exact structure name is typed. Paste is allowed;
 * the friction is reading the name, not retyping it.
 */
export function DeleteStructureDialog({ domain, name, onCancel, onConfirm }: DeleteStructureDialogProps) {
  const inputId = useId();
  const hintId = useId();
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === name;

  return (
    <Dialog role="alertdialog" title={`Delete ${name}?`} subtitle={<>{domain} domain · this can’t be undone</>}
      icon={<DialogIcon tone="danger"><Trash2 size={16} /></DialogIcon>}
      onClose={onCancel} onSubmit={() => { if (matches) onConfirm(); }}
      footer={
        <>
          <ChromeButton onClick={onCancel}>Cancel</ChromeButton>
          <button type="submit" disabled={!matches} className={dangerButtonClass}>
            <Trash2 size={13} aria-hidden /> Delete structure
          </button>
        </>
      }>
      <div className="mb-4 rounded-panel border border-line-subtle bg-shell px-3.5 py-3">
        <p className="mb-2 text-ui font-semibold text-fg-primary">Deleting this structure will:</p>
        <ul className="flex flex-col gap-1.5 text-ui text-fg-secondary">
          <li className="flex items-start gap-2"><Users size={14} aria-hidden className="mt-0.5 shrink-0 text-fg-tertiary" /> Remove it from all 5 members that belong to it</li>
          <li className="flex items-start gap-2"><GitBranch size={14} aria-hidden className="mt-0.5 shrink-0 text-fg-tertiary" /> Repost 1,284 derived facts across 3 dependent structures</li>
          <li className="flex items-start gap-2"><Layers size={14} aria-hidden className="mt-0.5 shrink-0 text-fg-tertiary" /> Delete the views and saved layouts built on it</li>
        </ul>
      </div>

      <label htmlFor={inputId} className="mb-1 block text-ui text-fg-secondary">
        To confirm, type <strong className="font-semibold text-fg-primary select-all">{name}</strong>
      </label>
      <input id={inputId} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false}
        aria-describedby={hintId}
        className={cx(controlClass, "h-control-form", matches && "border-danger-text hover:border-danger-text")} />
      <p id={hintId} aria-live="polite" className="mt-1 text-caption text-fg-tertiary">
        {matches ? "Name matches. You can delete this structure." : "The delete button unlocks when the name matches exactly."}
      </p>
    </Dialog>
  );
}

export interface DeleteDomainDialogProps {
  /** What the workspace calls a domain, e.g. "Dimension". */
  noun: string;
  workspace: string;
  name: string;
  /** Structures inside it; they go with it. */
  structures: string[];
  onCancel: () => void;
  onConfirm: () => void;
}

/* Same contract as deleting a structure: consequences first, exact name to unlock. */
export function DeleteDomainDialog({ noun, workspace, name, structures, onCancel, onConfirm }: DeleteDomainDialogProps) {
  const inputId = useId();
  const hintId = useId();
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === name;
  const n = structures.length;
  const lower = noun.toLowerCase();

  return (
    <Dialog role="alertdialog" title={`Delete ${name}?`} subtitle={<>{workspace} · this can’t be undone</>}
      icon={<DialogIcon tone="danger"><Trash2 size={16} /></DialogIcon>}
      onClose={onCancel} onSubmit={() => { if (matches) onConfirm(); }}
      footer={
        <>
          <ChromeButton onClick={onCancel}>Cancel</ChromeButton>
          <button type="submit" disabled={!matches} className={dangerButtonClass}>
            <Trash2 size={13} aria-hidden /> Delete {lower}
          </button>
        </>
      }>
      <div className="mb-4 rounded-panel border border-line-subtle bg-shell px-3.5 py-3">
        <p className="mb-2 text-ui font-semibold text-fg-primary">Deleting this {lower} will:</p>
        <ul className="flex flex-col gap-1.5 text-ui text-fg-secondary">
          <li className="flex items-start gap-2"><Layers size={14} aria-hidden className="mt-0.5 shrink-0 text-fg-tertiary" />
            {n ? `Delete its ${n} ${n === 1 ? "structure" : "structures"}: ${structures.join(", ")}` : "Remove it from the domain bar. It has no structures, so nothing else is affected."}
          </li>
          {n > 0 && (
            <li className="flex items-start gap-2"><Users size={14} aria-hidden className="mt-0.5 shrink-0 text-fg-tertiary" /> Delete the members, views and saved layouts in them</li>
          )}
        </ul>
      </div>

      <label htmlFor={inputId} className="mb-1 block text-ui text-fg-secondary">
        To confirm, type <strong className="font-semibold text-fg-primary select-all">{name}</strong>
      </label>
      <input id={inputId} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false}
        aria-describedby={hintId}
        className={cx(controlClass, "h-control-form", matches && "border-danger-text hover:border-danger-text")} />
      <p id={hintId} aria-live="polite" className="mt-1 text-caption text-fg-tertiary">
        {matches ? `Name matches. You can delete this ${lower}.` : "The delete button unlocks when the name matches exactly."}
      </p>
    </Dialog>
  );
}

export interface AddDomainDialogProps {
  /** What the workspace calls a domain, e.g. "Dimension". */
  noun: string;
  workspace: string;
  /** Names already used in this workspace, for the uniqueness check. */
  existing: string[];
  onCancel: () => void;
  onCreate: (next: { name: string; description: string }) => void;
}

/*
 * Create a domain. New domains join the end of the domain bar, after the
 * last zone (for Dimensions: after Picklist), and open empty: structures are
 * added from the structure bar.
 */
export function AddDomainDialog({ noun, workspace, existing, onCancel, onCreate }: AddDomainDialogProps) {
  const nameId = useId();
  const errorId = useId();
  const descId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const next = name.trim();
    if (!next) { setError(`Enter a name for this ${noun.toLowerCase()}.`); nameRef.current?.focus(); return; }
    if (existing.some((s) => s.toLowerCase() === next.toLowerCase())) {
      setError(`${workspace} already has a ${noun.toLowerCase()} called “${next}”. Choose a different name.`);
      nameRef.current?.focus();
      return;
    }
    onCreate({ name: next, description: desc.trim() });
  };

  return (
    <Dialog title={`New ${noun.toLowerCase()}`} subtitle={<>{workspace} · added after the last {noun.toLowerCase()}</>}
      icon={<DialogIcon tone="mode"><Plus size={16} /></DialogIcon>}
      onClose={onCancel} onSubmit={submit}
      footer={
        <>
          <ChromeButton onClick={onCancel}>Cancel</ChromeButton>
          <ChromeButton type="submit" variant="primary" className="h-control-h">Create {noun.toLowerCase()}</ChromeButton>
        </>
      }>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor={nameId} className="mb-1 block text-caption font-medium text-fg-secondary">Name</label>
          <input ref={nameRef} id={nameId} value={name} autoFocus autoComplete="off" spellCheck={false}
            placeholder="e.g. Project"
            onChange={(e) => { setName(e.target.value); setError(null); }}
            aria-invalid={error ? "true" : undefined} aria-describedby={error ? errorId : undefined}
            className={cx(controlClass, "h-control-form", error && "border-danger-text hover:border-danger-text")} />
          {error && (
            <p id={errorId} className="mt-1 flex items-start gap-1 text-caption text-danger-text">
              <CircleAlert size={12} aria-hidden className="mt-0.5 shrink-0" /> {error}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={descId} className="mb-1 block text-caption font-medium text-fg-secondary">
            Description <span className="font-normal text-fg-tertiary">(optional)</span>
          </label>
          <textarea id={descId} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder={`What this ${noun.toLowerCase()} classifies, and who uses it`}
            className={cx(controlClass, "min-h-20 resize-y py-1.5 leading-body")} />
        </div>
        <p className="flex items-start gap-2 rounded-panel border border-line-subtle bg-shell px-3 py-2 text-caption leading-body text-fg-secondary">
          <Layers size={12} aria-hidden className="mt-0.5 shrink-0 text-fg-tertiary" />
          It starts with no structures. Add them from the structure bar once it’s created.
        </p>
      </div>
    </Dialog>
  );
}
