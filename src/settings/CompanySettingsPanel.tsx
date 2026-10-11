import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Drawer } from "../shell/Drawer";
import { Button, Notice, Segmented, Tabs } from "../ui";
import { ToolbarEditor } from "./ToolbarEditor";
import { DEFAULTS, isDefault, type CompanySettings, type PaneDefault } from "./schema";
import { useSettings } from "./SettingsProvider";
import { ColorField } from "./ColorField";
import { deriveMode, deriveRail } from "./brand";
import { hueGap } from "./color";
import tokens from "../styleguide/colors.generated.json";

const prim = tokens.primitives as Record<string, string>;
const DEFAULT_COLOURS = { menu: prim["rail-bg"], data: prim["data-solid"], model: prim["model-solid"] };

const MENU_PRESETS = [
  { name: "Graphite", hex: "#1F2937" }, { name: "Navy", hex: "#0F1E3D" }, { name: "Forest", hex: "#0E2A20" },
  { name: "Plum", hex: "#2A1533" }, { name: "Stone", hex: "#E7E3DC" }, { name: "White", hex: "#FFFFFF" },
];
const MODE_PRESETS = [
  { name: "Blue", hex: "#235FE0" }, { name: "Indigo", hex: "#4338CA" }, { name: "Sky", hex: "#0369A1" },
  { name: "Teal", hex: "#0F766E" }, { name: "Green", hex: "#0A7652" }, { name: "Orange", hex: "#C2410C" },
  { name: "Crimson", hex: "#B42318" }, { name: "Slate", hex: "#334155" },
];

/* The colour in use after readability checks, if it is not the one picked. */
const modeAdjusted = (hex: string | null) => { if (!hex) return null; const s = deriveMode(hex).light.solid; return s !== hex ? s : null; };
const menuAdjusted = (hex: string | null) => { if (!hex) return null; const s = deriveRail(hex).bg; return s !== hex ? s : null; };

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
  const [tab, setTab] = useState<"appearance" | "toolbar" | "layout">("appearance");

  /* Each opening starts from what is saved. */
  useEffect(() => { if (open) setDraft(saved); }, [open, saved]);

  const close = () => { preview(null); onClose(); };
  const change = (next: CompanySettings) => { setDraft(next); preview(next); };
  const set = <K extends keyof CompanySettings>(group: K, patch: Partial<CompanySettings[K]>) =>
    change({ ...draft, [group]: { ...(draft[group] as object), ...patch } });
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  return (
    <Drawer open={open} onClose={close} label="Company settings" className="max-w-[34rem]">
      <div className="flex shrink-0 items-center gap-3 border-b border-line-subtle px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-title font-semibold">Company settings</h2>
          <p className="truncate text-caption text-fg-tertiary">{company.name} · applies to everyone</p>
        </div>
        <Button variant="ghost" icon size="md" onClick={close} aria-label="Close company settings"><X size={17} aria-hidden /></Button>
      </div>

      {canAdminister && (
        <Tabs label="Settings sections" panelId="company-settings-panel" value={tab} onChange={setTab} className="shrink-0 px-3"
          items={[{ key: "appearance", label: "Appearance" }, { key: "toolbar", label: "Toolbar" }, { key: "layout", label: "Layout" }]} />
      )}
      <div id="company-settings-panel" role="tabpanel" className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {canAdminister ? (
          <>
            <Notice className="mt-4" title="Live preview.">
              Changes show across the app as you make them. Save applies them for everyone in {company.name}.
            </Notice>

            {tab === "appearance" && <>
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

            <Group title="Brand colours">
              <ColorField label="Menu" hint="Background of the workspace menu on the left. Text turns dark on a light menu."
                value={draft.brand.menu} onChange={(menu) => set("brand", { menu })}
                defaultColor={DEFAULT_COLOURS.menu} presets={MENU_PRESETS} adjusted={menuAdjusted(draft.brand.menu)} />
              <ColorField label="DATA mode" hint="Action bar, selection and primary buttons while reading data."
                value={draft.brand.data} onChange={(data) => set("brand", { data })}
                defaultColor={DEFAULT_COLOURS.data} presets={MODE_PRESETS} adjusted={modeAdjusted(draft.brand.data)} />
              <ColorField label="MODEL mode" hint="The same places while building models."
                value={draft.brand.model} onChange={(model) => set("brand", { model })}
                defaultColor={DEFAULT_COLOURS.model} presets={MODE_PRESETS} adjusted={modeAdjusted(draft.brand.model)} />
            </Group>
            {hueGap(draft.brand.data ?? DEFAULT_COLOURS.data, draft.brand.model ?? DEFAULT_COLOURS.model) < 30 && (
              <Notice className="mt-2" tone="warning" title="DATA and MODEL look alike.">
                People tell the two modes apart by colour. Pick clearly different hues.
              </Notice>
            )}

            </>}

            {tab === "toolbar" && <ToolbarEditor items={draft.toolbar} onChange={(toolbar) => change({ ...draft, toolbar })} />}

            {tab === "layout" && <>
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
            </>}
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
