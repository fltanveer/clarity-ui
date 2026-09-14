import { useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import tokens from "./colors.generated.json";
import type { AccessLevel as Level } from "../lib/assignment";
import { AccessLevel } from "../components/AccessLevel";
import { Button } from "../components/Button";
import { Checkbox, SelectAll } from "../components/Checkbox";
import { ConsequenceBadge } from "../components/ConsequenceBadge";
import { EmptyState } from "../components/EmptyState";
import { SearchField, TextField } from "../components/Field";
import { Notice } from "../components/Notice";
import { SegmentedControl } from "../components/SegmentedControl";
import { Switch } from "../components/Switch";
import { Tabs } from "../components/Tabs";
import { ViewBy } from "../components/ViewBy";
import { ViewMenu } from "../components/ViewMenu";
import { ScopeChip } from "../surface/ScopeChip";
import { SAVED_VIEWS, STRUCTURES, VIEWS } from "../lib/demo-data";
import { AssignUnassignSurface } from "../surface/AssignUnassignSurface";

/*
 * Living styleguide. Colour values and contrast results come from the same
 * generated JSON the CSS was built from, so this page cannot drift from the
 * tokens. Role swatches render the live CSS variable, so they follow the theme.
 */

function Section({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 border-t border-line-subtle pt-8">
      <div className="flex max-w-prose flex-col gap-1">
        <h2 id={id} className="text-heading font-semibold tracking-heading text-balance">{title}</h2>
        {intro && <p className="text-body text-pretty text-fg-secondary">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface p-4">
      <p className="text-caption font-semibold tracking-label text-fg-secondary uppercase">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded-sm bg-subtle px-1 font-mono text-caption text-fg-primary">{children}</code>
);

function ColourSection() {
  const [mode, setMode] = useState<"all" | "DATA" | "MODEL" | "L100">("all");
  const rows = tokens.report.filter((r) => mode === "all" || r.mode === mode || r.mode === "—");
  const failures = tokens.report.filter((r) => !r.pass).length;
  const primitives = Object.entries(tokens.primitives) as [string, string][];
  const hexOf = (ref: string) => (tokens.primitives as Record<string, string>)[ref];

  return (
    <Section
      id="sg-colour"
      title="Colour"
      intro={<>Prototype 3 palette under its foundation rulings: warm restrained shell; MODEL green, DATA blue, chrome only. Values that failed AA were shifted in lightness only. Components use role utilities; Tailwind’s default palette is removed.</>}
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-2">
        {primitives.map(([name, hex]) => (
          <div key={name} className="flex items-center gap-2.5 rounded-control border border-line-subtle bg-surface p-2">
            <span className="size-8 shrink-0 rounded-chip outline outline-1 -outline-offset-1 outline-line-subtle" style={{ background: hex }} />
            <span className="min-w-0">
              <span className="block truncate font-mono text-caption font-semibold" title={name}>{name}</span>
              <span className="block font-mono text-caption text-fg-tertiary">{hex}</span>
            </span>
          </div>
        ))}
      </div>

      <h3 className="text-title font-semibold">Mode roles</h3>
      <div className="overflow-x-auto rounded-panel border border-line-subtle bg-surface">
        <table className="w-full text-ui">
          <caption className="sr-only">Mode roles by mode</caption>
          <thead className="bg-subtle text-caption text-fg-secondary">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-semibold">Role</th>
              {tokens.modes.map((m) => <th key={m} scope="col" className="px-3 py-2 text-start font-semibold">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {Object.keys(tokens.modeRoles.DATA).map((role) => (
              <tr key={role} className="border-t border-line-subtle">
                <th scope="row" className="px-3 py-1.5 text-start font-mono text-caption font-normal">{role}</th>
                {tokens.modes.map((m) => {
                  const ref = (tokens.modeRoles as Record<string, Record<string, string>>)[m][role];
                  return (
                    <td key={m} className="px-3 py-1.5">
                      <span className="flex items-center gap-2">
                        <span className="size-4 rounded-chip outline outline-1 -outline-offset-1 outline-line-subtle" style={{ background: hexOf(ref) }} />
                        <span className="font-mono text-caption">{hexOf(ref)}</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-title font-semibold">Roles</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-2">
        {Object.entries(tokens.roles as Record<string, string>).map(([role, ref]) => (
          <div key={role} className="flex items-center gap-2.5 rounded-control border border-line-subtle bg-surface p-2">
            <span className="size-7 shrink-0 rounded-chip outline outline-1 -outline-offset-1 outline-line-subtle" style={{ background: `var(--role-${role})` }} />
            <span className="min-w-0">
              <span className="block truncate font-mono text-caption font-semibold" title={role}>{role}</span>
              <span className="block truncate text-caption text-fg-tertiary">{ref}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-title font-semibold">Contrast gate</h3>
          <span className="text-body text-fg-secondary">
            {tokens.report.length} checks · {failures === 0 ? "all pass" : `${failures} failing`}
          </span>
          <SegmentedControl
            label="Mode"
            options={[{ value: "all", label: "All" }, { value: "DATA", label: "DATA" }, { value: "MODEL", label: "MODEL" }, { value: "L100", label: "L100" }]}
            value={mode}
            onChange={setMode}
          />
        </div>
        <div className="overflow-x-auto rounded-panel border border-line-subtle bg-surface">
          <table className="w-full text-ui">
            <caption className="sr-only">Contrast ratios</caption>
            <thead className="bg-subtle text-caption text-fg-secondary">
              <tr>
                <th scope="col" className="px-3 py-2 text-start font-semibold">Mode</th>
                <th scope="col" className="px-3 py-2 text-start font-semibold">Foreground</th>
                <th scope="col" className="px-3 py-2 text-start font-semibold">Background</th>
                <th scope="col" className="px-3 py-2 text-end font-semibold">Ratio</th>
                <th scope="col" className="px-3 py-2 text-end font-semibold">Minimum</th>
                <th scope="col" className="px-3 py-2 text-start font-semibold">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.mode}-${r.fg}-${r.bg}-${i}`} className="border-t border-line-subtle">
                  <td className="px-3 py-1.5 text-caption text-fg-secondary">{r.mode}</td>
                  <td className="px-3 py-1.5 font-mono text-caption">{r.fg}</td>
                  <td className="px-3 py-1.5 font-mono text-caption">{r.bg}</td>
                  <td className="px-3 py-1.5 text-end tabular-nums">{r.ratio.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-end text-fg-secondary tabular-nums">{r.min}</td>
                  <td className="px-3 py-1.5">{r.pass ? "Pass" : <strong className="text-danger-text">Fail</strong>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

const TYPE = [
  { cls: "text-display font-semibold tracking-heading", name: "display", spec: "25 / 30 · 600", use: "Styleguide hero only" },
  { cls: "text-heading font-semibold tracking-heading", name: "heading", spec: "20 / 28 · 600", use: "Page heading" },
  { cls: "text-title font-semibold", name: "title", spec: "16 / 24 · 600", use: "Pane and dialog titles" },
  { cls: "text-body", name: "body", spec: "14 / 22 · 400", use: "Empty states, notices, prose" },
  { cls: "text-ui", name: "ui", spec: "13 / 20 · 400", use: "Rows, controls, menus, tabs" },
  { cls: "text-caption", name: "caption", spec: "12 / 16 · 400", use: "Counts, hints, badges" },
  { cls: "text-caption font-semibold tracking-label uppercase", name: "caption · label", spec: "12 / 16 · 600 · +0.04em", use: "Section labels" },
];

const SPACING = [
  ["0.5", 2], ["1", 4], ["1.5", 6], ["2", 8], ["3", 12], ["4", 16], ["6", 24], ["8", 32], ["12", 48],
] as const;

const GEOMETRY = [
  ["band", 40], ["head", 32], ["row", 36], ["control", 28], ["control-sm", 24],
  ["col-members", 88], ["col-toggle", 88], ["col-access", 84], ["col-qty", 72], ["col-region", 128],
] as const;

export function StyleguidePage() {
  const [on, setOn] = useState(true);
  const [access, setAccess] = useState<Level>("read");
  const [filter, setFilter] = useState<"all" | "assigned" | "unassigned">("unassigned");
  const [q, setQ] = useState("");
  const [qty, setQty] = useState("1");
  const [structure, setStructure] = useState(STRUCTURES[0]);
  const [view, setView] = useState<string>(VIEWS[0]);
  const [tab, setTab] = useState<"a" | "b" | "c">("a");
  const [chip, setChip] = useState(false);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="flex max-w-prose flex-col gap-2">
        <h1 className="text-display font-semibold tracking-heading text-balance">ClarityOS styleguide</h1>
        <p className="text-body text-pretty text-fg-secondary">
          Tokens and components for the Assign / Unassign surface. Source of truth:{" "}
          <Code>tokens/color.mjs</Code> and <Code>src/styles/theme.css</Code>. Specs: <Code>docs/03-components.md</Code>.
        </p>
      </header>

      <ColourSection />

      <Section id="sg-type" title="Typography" intro="Seven styles, three weights. Dense-tool exception: UI text is 13px on desktop; inputs step to 16px on small screens so iOS does not zoom.">
        <div className="flex flex-col divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface">
          {TYPE.map((t) => (
            <div key={t.name} className="grid gap-1 p-4 sm:grid-cols-[10rem_1fr_14rem] sm:items-baseline sm:gap-4">
              <span className="font-mono text-caption text-fg-secondary">{t.name}</span>
              <span className={t.cls}>Assign members to Acme Group</span>
              <span className="text-caption text-fg-tertiary">{t.spec} · {t.use}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="sg-space" title="Spacing and geometry" intro="4px base. Groups separate at 2× the gap inside them. Geometry tokens are shared by headers and rows so columns align.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface p-4">
            {SPACING.map(([step, px]) => (
              <div key={step} className="flex items-center gap-3">
                <span className="w-10 shrink-0 font-mono text-caption text-fg-secondary">{step}</span>
                <span className="h-3 rounded-sm bg-accent-solid" style={{ width: px }} />
                <span className="text-caption text-fg-tertiary tabular-nums">{px}px</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface p-4">
            {GEOMETRY.map(([name, px]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-24 shrink-0 font-mono text-caption text-fg-secondary">{name}</span>
                <span className="h-3 rounded-sm bg-line-control" style={{ width: px }} />
                <span className="text-caption text-fg-tertiary tabular-nums">{px}px</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {(["sm", "md", "lg", "full"] as const).map((r) => (
            <div key={r} className="flex flex-col items-center gap-1">
              <span className={`size-16 border border-line-control bg-surface ${{ sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", full: "rounded-full" }[r]}`} />
              <span className="font-mono text-caption text-fg-secondary">radius-{r}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1">
            <span className="size-16 rounded-lg bg-surface shadow-popover" />
            <span className="font-mono text-caption text-fg-secondary">shadow-popover</span>
          </div>
        </div>
      </Section>

      <Section id="sg-components" title="Components" intro="Every interactive state is keyboard reachable and shows the global focus ring. Tab through this section to check.">
        <div className="grid gap-4 md:grid-cols-2">
          <Specimen label="Button">
            <Button variant="secondary"><Plus size={14} strokeWidth={1.5} aria-hidden />Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Remove all</Button>
            <Button variant="danger-outline"><X size={14} strokeWidth={1.5} aria-hidden />Remove all</Button>
            <Button variant="secondary" disabled>Disabled</Button>
          </Specimen>
          <Specimen label="Switch · edge attributes">
            <Switch checked={on} onChange={setOn} label="Drill-down" />
            <Switch checked={!on} onChange={(v) => setOn(!v)} label="Drill-through" />
            <Switch checked={false} onChange={() => {}} label="Disabled example" disabled />
          </Specimen>
          <Specimen label="Checkbox · select-all">
            <label className="flex items-center gap-2 text-ui"><Checkbox defaultChecked /> Assigned</label>
            <label className="flex items-center gap-2 text-ui"><Checkbox /> Unassigned</label>
            <SelectAll total={8} selected={3} onChange={() => {}} label="Select all (partial)" />
            <span className="text-caption text-fg-tertiary">3 of 8 → indeterminate</span>
          </Specimen>
          <Specimen label="Access level">
            <AccessLevel name="sg-access" value={access} onChange={setAccess} rowLabel="Acme UK Ltd." />
            <span className="text-caption text-fg-secondary">Different icon per level, not just colour</span>
          </Specimen>
          <Specimen label="Segmented control">
            <SegmentedControl
              label="Assignment filter"
              options={[{ value: "all", label: "All" }, { value: "assigned", label: "Assigned" }, { value: "unassigned", label: "Unassigned" }]}
              value={filter}
              onChange={setFilter}
            />
          </Specimen>
          <Specimen label="Fields">
            <SearchField label="Search example" value={q} onChange={setQ} className="max-w-60" />
            <TextField value={qty} onChange={setQty} aria-label="Qty example" inputMode="decimal" className="w-col-qty" />
          </Specimen>
          <Specimen label="View by">
            <ViewBy structures={STRUCTURES} structure={structure} onStructure={setStructure} views={VIEWS} view={view} onView={setView} />
          </Specimen>
          <Specimen label="View by · locked">
            <ViewBy structures={STRUCTURES} structure={STRUCTURES[0]} onStructure={() => {}} views={VIEWS} view={view} onView={setView}
              lockedReason="This context assigns within one structure." />
          </Specimen>
          <Specimen label="Consequence badge">
            <ConsequenceBadge consequence="results" />
            <ConsequenceBadge consequence="security" />
            <ConsequenceBadge consequence="display" />
            <ConsequenceBadge consequence="unruled" />
          </Specimen>
          <Specimen label="Scope chip">
            <ScopeChip rowName="Acme US" selected={0} total={6} active={false} onToggle={() => {}} />
            <ScopeChip rowName="Acme CA" selected={2} total={6} active={false} onToggle={() => {}} />
            <ScopeChip rowName="Acme MX" selected={2} total={6} active={chip} onToggle={() => setChip((c) => !c)} />
          </Specimen>
          <Specimen label="View menu">
            <ViewMenu views={SAVED_VIEWS} onManageViews={() => {}} />
          </Specimen>
          <Specimen label="Tabs">
            <Tabs
              label="Example tabs"
              panelId="sg-tabs-panel"
              items={[{ key: "a", label: "Rollup", group: "1" }, { key: "b", label: "Composition", group: "2" }, { key: "c", label: "Permissions", group: "2" }]}
              value={tab}
              onChange={setTab}
            />
            <span id="sg-tabs-panel" className="sr-only">Example panel</span>
          </Specimen>
        </div>
        <div className="overflow-hidden rounded-lg border border-line-subtle bg-surface">
          <Notice action={<Button variant="secondary">Clear sort</Button>}>
            <strong className="font-semibold">Sorted view.</strong> Stored order is unchanged. Reordering is off until you clear the sort.
          </Notice>
          <EmptyState title="No members match “quarterly”" description="Try another search or show all members." action={<Button variant="secondary">Clear filters</Button>} />
        </div>
      </Section>

      <Section id="sg-surface" title="Composed surface · hosted mode" intro={<>Host owns the tabs (<Code>hideTabs</Code>) and fixes the context to Permissions. The consequence badge stays visible.</>}>
        <div className="h-[32rem] overflow-hidden rounded-lg border border-line-subtle">
          <AssignUnassignSurface ctx="PERMISSIONS" hideTabs />
        </div>
      </Section>
    </div>
  );
}
