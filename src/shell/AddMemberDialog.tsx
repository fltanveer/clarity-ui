import { useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown, CircleAlert, Plus } from "lucide-react";
import { OPTIONS } from "../lib/members";
import { DIMENSION_SCHEMA, choicesOf, schemaSectionsFor } from "../lib/properties";
import { ChromeButton } from "./controls";
import { Dialog } from "./Dialog";
import { DialogIcon } from "./StructureDialogs";
import { Card, inputClass, labelClass } from "./PropertiesPane";
import { cx } from "../lib/cx";

export interface NewMember {
  name: string;
  shortName: string;
  description: string;
  memo: string;
  /** Classification values by field label; unset fields are left out. */
  attrs: Record<string, string>;
}

type IdKey = "name" | "shortName" | "description" | "memo";
/* Same keys and labels as member configuration, so L100 field rules apply here too. */
const IDENTITY: Array<{ key: IdKey; rule: string; label: string; area?: boolean }> = [
  { key: "name", rule: "member_name", label: "Name | ID" },
  { key: "shortName", rule: "short_name", label: "Short Name" },
  { key: "description", rule: "description", label: "Description", area: true },
  { key: "memo", rule: "memo", label: "Memo", area: true },
];
const UNSET = "—";

export interface AddMemberDialogProps {
  domain: string;
  structure: string;
  /** Names already in the structure, for the uniqueness check. */
  existing: string[];
  /** What L100 has done to identity fields: renamed, hidden or read-only for MODEL. */
  fieldRules?: Record<string, { label: string; hiddenInModel: boolean; lockedInModel: boolean }>;
  onCancel: () => void;
  onCreate: (m: NewMember) => void;
}

/*
 * Create a member (a Model) in the current structure. Two groups, in the order
 * the member's configuration shows them: Identity, then Classification — the
 * structure's own dropdowns followed by one per child structure. Derived values
 * are not asked for: they are computed once the member exists.
 */
export function AddMemberDialog({ domain, structure, existing, fieldRules, onCancel, onCreate }: AddMemberDialogProps) {
  const kind = DIMENSION_SCHEMA[structure]?.kind ?? "member";
  const noun = kind.toLowerCase();
  const errorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Record<IdKey, string>>({ name: "", shortName: "", description: "", memo: "" });
  const [error, setError] = useState<string | null>(null);

  const classFields = schemaSectionsFor(structure, domain)
    .filter((s) => s.id === "class")
    .flatMap((s) => s.fields)
    .filter((f) => f.t === "select" || f.t === "text")
    .map((f) => ({ ...f, opts: OPTIONS[f.l] ?? f.opts }));
  const [attrs, setAttrs] = useState<Record<string, string>>(() =>
    Object.fromEntries(classFields.map((f) => [f.l, f.t === "text" ? "" : String(f.v ?? UNSET)])));

  const [open, setOpen] = useState({ identity: true, class: true });
  const identity = IDENTITY.filter((f) => !fieldRules?.[f.rule]?.hiddenInModel);

  const submit = () => {
    const name = draft.name.trim();
    if (!name) { setError(`Enter a name for this ${noun}.`); nameRef.current?.focus(); return; }
    if (existing.some((n) => n.toLowerCase() === name.toLowerCase())) {
      setError(`${structure} already has a ${noun} called “${name}”. Choose a different name.`);
      nameRef.current?.focus();
      return;
    }
    onCreate({
      name, shortName: draft.shortName.trim(), description: draft.description.trim(), memo: draft.memo.trim(),
      attrs: Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v && v !== UNSET)),
    });
  };

  return (
    <Dialog title={`New ${noun}`} subtitle={<>{domain} domain · {structure}</>} className="max-w-[30rem]"
      icon={<DialogIcon tone="mode"><Plus size={16} /></DialogIcon>}
      onClose={onCancel} onSubmit={submit}
      footer={
        <>
          <ChromeButton onClick={onCancel}>Cancel</ChromeButton>
          <ChromeButton type="submit" variant="primary" className="h-control-h">Create {noun}</ChromeButton>
        </>
      }>
      {/* Same cards as the properties pane, on its canvas: the member reads the same before and after it exists. */}
      <div className="-mx-5 -my-4 flex flex-col gap-2 bg-canvas p-3">
        <Card id="identity" label="Identity" meta={`${identity.length} fields`}
          open={open.identity} onToggle={() => setOpen({ ...open, identity: !open.identity })}>
          {identity.map((f) => {
            const rule = fieldRules?.[f.rule];
            const locked = f.key !== "name" && Boolean(rule?.lockedInModel);
            const label = rule?.label || f.label;
            const isName = f.key === "name";
            return (
              <Field key={f.key} label={label}>
                {(id) => f.area ? (
                  <textarea id={id} rows={2} value={draft[f.key]} disabled={locked}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                    className={cx(inputClass, "min-h-14 resize-y py-1.5 leading-body")} />
                ) : (
                  <>
                    <input id={id} ref={isName ? nameRef : undefined} value={draft[f.key]} disabled={locked}
                      autoComplete="off" spellCheck={false} aria-required={isName || undefined}
                      onChange={(e) => { setDraft({ ...draft, [f.key]: e.target.value }); if (isName) setError(null); }}
                      aria-invalid={isName && error ? "true" : undefined}
                      aria-describedby={isName && error ? errorId : undefined}
                      className={cx(inputClass, "h-control-form", isName && error && "border-danger-text hover:border-danger-text")} />
                    {isName && error && (
                      <p id={errorId} className="mt-1 flex items-start gap-1 text-caption text-danger-text">
                        <CircleAlert size={12} aria-hidden className="mt-0.5 shrink-0" /> {error}
                      </p>
                    )}
                  </>
                )}
              </Field>
            );
          })}
        </Card>

        {classFields.length > 0 && (
          <Card id="class" label="Classification" meta={`${classFields.length} ${classFields.length === 1 ? "field" : "fields"}`}
            open={open.class} onToggle={() => setOpen({ ...open, class: !open.class })}>
            {classFields.map((f) => (
              <Field key={f.l} label={f.l}>
                {(id) => f.t === "text" ? (
                  <input id={id} value={attrs[f.l]} autoComplete="off" spellCheck={false}
                    type={f.l === "Email" ? "email" : "text"} placeholder={f.l === "Email" ? "name@acme.example" : undefined}
                    onChange={(e) => setAttrs({ ...attrs, [f.l]: e.target.value })}
                    className={cx(inputClass, "h-control-form")} />
                ) : (
                  <div className="relative">
                    <select id={id} value={attrs[f.l]} onChange={(e) => setAttrs({ ...attrs, [f.l]: e.target.value })}
                      className={cx(inputClass, "h-control-form cursor-pointer appearance-none truncate pe-8")}>
                      {choicesOf({ ...f, v: String(f.v ?? UNSET) }).map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={14} aria-hidden className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary" />
                  </div>
                )}
              </Field>
            ))}
          </Card>
        )}
      </div>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      {children(id)}
    </div>
  );
}
