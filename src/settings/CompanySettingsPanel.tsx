import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Drawer } from "../shell/Drawer";
import { Button, Notice, Segmented } from "../ui";
import { DEFAULTS, isDefault, type CompanySettings, type PaneDefault } from "./schema";
import { useSettings } from "./SettingsProvider";

function Row({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line-subtle py-3 last:border-b-0">
      <div className="min-w-0 flex-1 basis-40">
        <p className="text-ui font-medium text-fg-primary">{label}</p>
        <p className="text-caption text-fg-tertiary">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="mt-5">
      <h3 className="mb-1 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">{title}</h3>
      <div className="rounded-panel border border-line-subtle bg-surface px-3">{children}</div>
    </section>
  );
}

const PANE_OPTIONS = [{ value: "open", label: "Open" }, { value: "collapsed", label: "Collapsed" }] as const;

/*
 * Company settings, admins only. Every change previews live across the app
 * (the drawer sits over it); Save applies it for everyone in the company,
 * Cancel or closing throws the draft away.
 */
export function CompanySettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { company, saved, save, preview, canAdminister } = useSettings();
  const [draft, setDraft] = useState(saved);

  /* Each opening starts from what is saved. */
  useEffect(() => { if (open) setDraft(saved); }, [open, saved]);

  const close = () => { preview(null); onClose(); };
  const change = (next: CompanySettings) => { setDraft(next); preview(next); };
  const set = <K extends keyof CompanySettings>(group: K, patch: Partial<CompanySettings[K]>) =>
    change({ ...draft, [group]: { ...(draft[group] as object), ...patch } });
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  return (
    <Drawer open={open} onClose={close} label="Company settings" className="max-w-[30rem]">
      <div className="flex shrink-0 items-center gap-3 border-b border-line-subtle px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-title font-semibold">Company settings</h2>
          <p className="truncate text-caption text-fg-tertiary">{company.name} · applies to everyone</p>
        </div>
        <Button variant="ghost" icon size="md" onClick={close} aria-label="Close company settings"><X size={17} aria-hidden /></Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {canAdminister ? (
          <>
            <Notice className="mt-4" title="Live preview.">
              Changes show across the app as you make them. Save applies them for everyone in {company.name}.
            </Notice>

            <Group title="Appearance">
              <Row label="Theme" hint="Match device follows each person's system setting.">
                <Segmented label="Theme" value={draft.appearance.theme} onChange={(theme) => set("appearance", { theme })}
                  options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "Match device" }]} />
              </Row>
              <Row label="Density" hint="Compact fits more rows: shorter bars, buttons and grid rows.">
                <Segmented label="Density" value={draft.appearance.density} onChange={(density) => set("appearance", { density })}
                  options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]} />
              </Row>
            </Group>

            <Group title="Layout defaults">
              <Row label="Members pane" hint="Left pane listing records.">
                <Segmented label="Members pane" value={draft.layout.membersPane} options={PANE_OPTIONS}
                  onChange={(v: PaneDefault) => set("layout", { membersPane: v })} />
              </Row>
              <Row label="Properties pane" hint="Right pane with the picked record's properties.">
                <Segmented label="Properties pane" value={draft.layout.propertiesPane} options={PANE_OPTIONS}
                  onChange={(v: PaneDefault) => set("layout", { propertiesPane: v })} />
              </Row>
              <Row label="Details under records" hint="Details grid below a chosen Model's records.">
                <Segmented label="Details under records" value={draft.layout.details} options={PANE_OPTIONS}
                  onChange={(v: PaneDefault) => set("layout", { details: v })} />
              </Row>
            </Group>
            <p className="mt-3 text-caption text-fg-tertiary">People can still open and close panes as they work; these set how the app starts.</p>
          </>
        ) : (
          <Notice className="mt-4" tone="warning" title="Admins only.">Your company admin manages these settings.</Notice>
        )}
      </div>

      {canAdminister && (
        <div className="flex shrink-0 items-center gap-2 border-t border-line-subtle bg-shell px-5 py-3">
          <Button size="md" variant="ghost" disabled={isDefault(draft)} onClick={() => change(DEFAULTS)}>Reset to defaults</Button>
          <span className="ms-auto" />
          <Button size="md" onClick={close}>Cancel</Button>
          <Button size="md" variant="primary" disabled={!dirty} onClick={() => { save(draft); onClose(); }}>Save</Button>
        </div>
      )}
    </Drawer>
  );
}
