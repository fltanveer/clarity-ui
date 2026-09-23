import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Eye, EyeOff, Lock, LockOpen, PanelRightClose, Settings2, X } from "lucide-react";
import { Checkbox } from "../components/Checkbox";
import { controlClass } from "../components/ConfigFields";
import { cx } from "../lib/cx";

/*
 * Field settings (L100) — what a field is called and how it behaves, edited
 * beside the pane it changes so the effect is visible as you type.
 *
 * The rail is always present, so the door never appears and disappears; it
 * takes mode colour only on a section whose fields can be edited. The panel
 * overlays the page rather than resizing it, and each field is one collapsible
 * row: the header is the field, the body is its settings.
 */

export interface FieldSpec {
  /** Contract key. Never editable — records point at it. */
  key: string;
  /** Shipped label, before anyone renames it. */
  label: string;
  /** Declared type, from the contract. */
  type: string;
  /** A base database column: only its label can change. */
  system?: boolean;
  helper?: string;
}

export interface FieldSettingsValue {
  label: string;
  /** Hidden from MODEL users. L100 still sees it, marked. */
  hiddenInModel: boolean;
  /** Visible to MODEL users, but read-only. */
  lockedInModel: boolean;
  placeholder: string;
  helper: string;
  defaultValue: string;
  required: boolean;
  view: string;
  edit: string;
  sort: string;
}

export const seedFieldSettings = (fields: readonly FieldSpec[]): Record<string, FieldSettingsValue> =>
  Object.fromEntries(fields.map((f, i) => [f.key, {
    label: f.label, hiddenInModel: false, lockedInModel: false,
    placeholder: "", helper: f.helper ?? "", defaultValue: "",
    required: f.key.endsWith("name") && f.system === true, view: "1", edit: "1", sort: String(i),
  }]));

export function FieldSettingsRail({ active, open, onOpen, reason }: {
  /** The open section has editable fields. */
  active: boolean;
  open: boolean;
  onOpen: () => void;
  /** Why it is unavailable, when it is. */
  reason: string;
}) {
  return (
    <div className={cx("flex w-7 shrink-0 flex-col border-s", active ? "border-mode-solid" : "border-line-subtle")}>
      <button type="button" onClick={onOpen} disabled={!active} aria-expanded={open}
        aria-label={active ? "Field settings" : reason} title={active ? "Field settings" : reason}
        className={cx(
          "flex min-h-0 flex-1 cursor-pointer flex-col items-center gap-2 pt-2.5 transition-[background-color,color] duration-150 ease-standard",
          /* Carries mode colour wherever it can be used, so the door is visible before it is needed. */
          !active ? "cursor-not-allowed bg-shell-alt text-fg-disabled"
            : open ? "bg-mode-solid text-fg-on-accent"
              : "bg-mode-soft text-mode-ink hover:bg-mode-solid hover:text-fg-on-accent",
        )}>
        <Settings2 size={14} strokeWidth={2} aria-hidden className="shrink-0" />
        {/* Reads bottom-to-top, so its top edge faces the page it belongs to. */}
        <span aria-hidden className="min-h-0 rotate-180 truncate text-caption font-semibold tracking-label uppercase [writing-mode:vertical-rl]">
          Fields
        </span>
      </button>
    </div>
  );
}

export function FieldSettingsPanel({ fields, values, onChange, onClose }: {
  fields: readonly FieldSpec[];
  values: Record<string, FieldSettingsValue>;
  onChange: (key: string, next: FieldSettingsValue) => void;
  onClose: () => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(fields[0]?.key ?? null);
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  /* Same dismissal contract as the model + view panel: Escape, or a pointer outside. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); closeRef.current(); } };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!ref.current?.contains(t) && !t.closest?.("[aria-label='Field settings']")) closeRef.current();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <div ref={ref} role="dialog" aria-label="Field settings"
      className={cx(
        "absolute inset-y-0 end-0 z-30 flex w-96 max-w-full flex-col overflow-hidden border-s border-line-strong bg-surface",
        "shadow-[-16px_0_32px_-12px_oklch(0_0_0/0.18)] [clip-path:inset(0_0_0_-3rem)]",
      )}>
      <div className="flex h-row-toolbar shrink-0 items-center gap-2 border-b border-line-subtle bg-surface px-3">
        <h3 className="text-caption font-semibold tracking-label text-fg-tertiary uppercase">Field settings</h3>
        <span className="ms-auto text-caption text-fg-tertiary tabular-nums">{fields.length} fields</span>
        <button type="button" onClick={onClose} aria-label="Close field settings" title="Close (Esc)"
          className="grid size-6 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover hover:text-fg-primary">
          <PanelRightClose size={14} aria-hidden />
        </button>
      </div>

      <div className="shrink-0 border-b border-line-subtle bg-shell px-3 py-2">
        <p className="text-caption leading-body text-fg-secondary">
          Renaming a field changes what people see, never the key records point at.
        </p>
        {/* A legend, not a tooltip: two icon columns are worth explaining once, in view. */}
        <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-caption text-fg-secondary">
          <div className="flex items-center gap-1.5">
            <dt className="grid size-5 shrink-0 place-items-center rounded-control border border-line-strong bg-surface text-fg-tertiary">
              <Eye size={12} aria-hidden />
            </dt>
            <dd>Shown in Model mode</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="grid size-5 shrink-0 place-items-center rounded-control border border-line-strong bg-surface text-fg-tertiary">
              <LockOpen size={12} aria-hidden />
            </dt>
            <dd>Editable there</dd>
          </div>
        </dl>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {fields.map((f) => (
          <FieldCard key={f.key} spec={f} value={values[f.key]} open={openKey === f.key}
            onToggle={() => setOpenKey((k) => (k === f.key ? null : f.key))}
            onChange={(next) => onChange(f.key, next)} />
        ))}
      </div>
    </div>
  );
}

function FieldCard({ spec, value, open, onToggle, onChange }: {
  spec: FieldSpec; value: FieldSettingsValue; open: boolean; onToggle: () => void;
  onChange: (next: FieldSettingsValue) => void;
}) {
  const panelId = `field-${spec.key}`;
  const set = <K extends keyof FieldSettingsValue>(k: K, v: FieldSettingsValue[K]) => onChange({ ...value, [k]: v });
  const renamed = value.label !== spec.label;
  return (
    <section className="shrink-0 overflow-hidden rounded-panel border border-line-subtle bg-surface">
      {/* One row: the disclosure, then the two states. Buttons cannot nest, so the
         header is a row of siblings rather than one big button. */}
      <div className={cx("flex h-10 items-center pe-1.5 transition-[background-color] duration-150 ease-standard",
        open ? "border-b border-line-subtle bg-surface" : "bg-shell-alt")}>
        <h4 className="flex min-w-0 flex-1">
          <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panelId}
            className="flex h-10 min-w-0 flex-1 cursor-pointer items-center gap-2 ps-3 pe-1 text-start hover:bg-hover">
            <ChevronDown size={14} aria-hidden className={cx("shrink-0 text-fg-tertiary transition-transform ease-standard", !open && "-rotate-90")} />
            <span className={cx("min-w-0 flex-1 truncate text-ui font-semibold", value.hiddenInModel && "text-fg-tertiary line-through")}>{value.label}</span>
            {renamed && <span className="shrink-0 rounded-chip bg-mode-soft px-1.5 text-micro font-semibold text-mode-ink">RENAMED</span>}
            {spec.system && <Lock size={11} aria-label="System field" className="shrink-0 text-fg-tertiary" />}
          </button>
        </h4>
        {/* What a MODEL user gets. Icon only; the words are in the tooltip. */}
        <StateToggle on={value.hiddenInModel} onClick={() => set("hiddenInModel", !value.hiddenInModel)}
          onIcon={<EyeOff size={13} aria-hidden />} offIcon={<Eye size={13} aria-hidden />}
          onLabel={`Hidden in Model mode. Show ${value.label} again`}
          offLabel={`Visible in Model mode. Hide ${value.label}`} tone="danger" />
        <StateToggle on={value.lockedInModel} disabled={value.hiddenInModel}
          onClick={() => set("lockedInModel", !value.lockedInModel)}
          onIcon={<Lock size={13} aria-hidden />} offIcon={<LockOpen size={13} aria-hidden />}
          onLabel={`Read-only in Model mode. Let Model users edit ${value.label}`}
          offLabel={`Editable in Model mode. Make ${value.label} read-only`}
          disabledLabel="A hidden field cannot also be read-only" tone="mode" />
      </div>
      {open && (
        <div id={panelId} className="flex flex-col gap-3 p-3">
          {spec.system && (
            <p className="flex items-start gap-1.5 rounded-control bg-shell px-2.5 py-2 text-caption leading-body text-fg-secondary">
              <Lock size={11} aria-hidden className="mt-0.5 shrink-0 text-fg-tertiary" />
              System field. Its key, type and structure are fixed; the label and the help text are yours.
            </p>
          )}
          <Row label="Field key" hint="Records point at this. It never changes.">
            {(id) => <input id={id} value={spec.key} readOnly className={cx(controlClass, "h-control-form bg-shell text-fg-secondary")} />}
          </Row>
          <Row label="Label" hint="What people see on the pane.">
            {(id) => <input id={id} value={value.label} onChange={(e) => set("label", e.target.value)}
              className={cx(controlClass, "h-control-form")} />}
          </Row>
          <Row label="Type" hint="Declared by the contract.">
            {(id) => <input id={id} value={spec.type} readOnly className={cx(controlClass, "h-control-form bg-shell text-fg-secondary")} />}
          </Row>
          <Row label="Placeholder">
            {(id) => <input id={id} value={value.placeholder} onChange={(e) => set("placeholder", e.target.value)}
              placeholder="e.g. Enter a name" className={cx(controlClass, "h-control-form")} />}
          </Row>
          <Row label="Help text" hint="Shown under the control.">
            {(id) => <textarea id={id} rows={2} value={value.helper} onChange={(e) => set("helper", e.target.value)}
              className={cx(controlClass, "min-h-14 resize-y py-1.5 leading-body")} />}
          </Row>
          <Row label="Default value">
            {(id) => <input id={id} value={value.defaultValue} onChange={(e) => set("defaultValue", e.target.value)}
              placeholder="Leave blank for no default" className={cx(controlClass, "h-control-form")} />}
          </Row>
          <label className="flex items-center gap-2 text-ui text-fg-secondary">
            <Checkbox checked={value.required} onChange={(e) => set("required", e.target.checked)} />
            Required — a value must be given
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Row label="View level" hint="1–100">
              {(id) => <input id={id} inputMode="numeric" value={value.view} onChange={(e) => set("view", e.target.value)}
                className={cx(controlClass, "h-control-form tabular-nums")} />}
            </Row>
            <Row label="Edit level" hint="1–100">
              {(id) => <input id={id} inputMode="numeric" value={value.edit} onChange={(e) => set("edit", e.target.value)}
                className={cx(controlClass, "h-control-form tabular-nums")} />}
            </Row>
          </div>
          <Row label="Order #" hint="0 is first.">
            {(id) => <input id={id} inputMode="numeric" value={value.sort} onChange={(e) => set("sort", e.target.value)}
              className={cx(controlClass, "h-control-form w-24! tabular-nums")} />}
          </Row>
        </div>
      )}
    </section>
  );
}

/*
 * A state, not a command: the label says what is true now, and pressing it changes
 * that. aria-pressed carries the state; the icon and the words both change, so it
 * never depends on colour alone.
 */
function StateToggle({ on, disabled, onClick, onIcon, offIcon, onLabel, offLabel, disabledLabel, tone }: {
  on: boolean; disabled?: boolean; onClick: () => void;
  onIcon: ReactNode; offIcon: ReactNode; onLabel: string; offLabel: string; disabledLabel?: string;
  tone: "danger" | "mode";
}) {
  const label = disabled ? disabledLabel ?? offLabel : on ? onLabel : offLabel;
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on} aria-label={label}
      className={cx(
        "grid size-7 shrink-0 cursor-pointer place-items-center rounded-control border transition-[background-color,border-color,color] duration-150 ease-standard",
        disabled ? "cursor-not-allowed border-transparent text-fg-disabled"
          : on
            ? tone === "danger"
              ? "border-danger-text/35 bg-danger-soft text-danger-text"
              : "border-mode-solid/35 bg-mode-soft text-mode-ink"
            : "border-transparent text-fg-tertiary hover:bg-hover hover:text-fg-primary",
      )}>
      {on ? onIcon : offIcon}
    </button>
  );
}

/* Stacked label: the panel is too narrow for the pane's 168px label gutter. */
function Row({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = `fs-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-caption font-medium text-fg-secondary">{label}</label>
      {children(id)}
      {hint && <p className="mt-1 text-caption text-fg-tertiary">{hint}</p>}
    </div>
  );
}

export { X as FieldSettingsCloseIcon };
