import { useRef, useState, type ReactNode } from "react";
import { Check, MoreHorizontal, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import {
  Badge, Button, Checkbox, DataTable, Dialog, EmptyState, Field, Input, MenuDivider, MenuItem, Notice,
  Popover, SectionHeader, Segmented, Select, Splitter, Switch, Tabs, Textarea, type Column,
} from "../ui";

export interface Prop { name: string; type: string; def?: string; desc: string }

export interface Entry {
  id: string;
  name: string;
  group: "Actions" | "Inputs" | "Navigation" | "Display" | "Data" | "Overlays";
  /** One sentence: what it is. */
  summary: string;
  use: string[];
  avoid: string[];
  /** Named exports this entry documents. */
  exports: string[];
  Demo: () => ReactNode;
  /** Preview without inner padding (grids, bands). */
  flush?: boolean;
  code: string;
  props: { component: string; rows: Prop[] }[];
  a11y: string[];
}

/* ── demo data ────────────────────────────────────────────────────────────── */

interface Person { id: string; name: string; salary: number; hours: number }
const PEOPLE: Person[] = [
  { id: "dave", name: "Dave", salary: 95000, hours: 2080 },
  { id: "jack", name: "Jack", salary: 78500, hours: 1950 },
  { id: "priya", name: "Priya Shah", salary: 112000, hours: 2080 },
  { id: "marcus", name: "Marcus Lee", salary: 68000, hours: 2000 },
];
const n = (v: number) => v.toLocaleString("en-US");

/* ── demos ────────────────────────────────────────────────────────────────── */

function ButtonDemo() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary">Save</Button>
        <Button>Cancel</Button>
        <Button variant="ghost">Skip</Button>
        <Button variant="danger">Delete</Button>
        <Button variant="danger-outline"><Trash2 size={13} aria-hidden />Delete</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="md" variant="primary"><Plus size={14} aria-hidden />Add Person</Button>
        <Button size="md">Export</Button>
        <Button icon aria-label="Edit"><Pencil size={13} aria-hidden /></Button>
        <Button icon variant="ghost" aria-label="More actions"><MoreHorizontal size={14} aria-hidden /></Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-control bg-mode-solid p-2.5 on-bar">
        <Button variant="on-bar"><Plus size={13} aria-hidden />Add Person</Button>
        <Button variant="on-bar">Actions</Button>
        <Button variant="on-bar" icon aria-label="Upload"><Upload size={13} aria-hidden /></Button>
      </div>
    </div>
  );
}

function FieldDemo() {
  const [name, setName] = useState("Workforce USA");
  const [q, setQ] = useState("");
  const [rate, setRate] = useState("abc");
  const [region, setRegion] = useState("United States");
  return (
    <div className="grid max-w-xl gap-4 sm:grid-cols-2">
      <Field label="Search members" hideLabel className="sm:col-span-2">
        <Input type="search" placeholder="Search members" leading={<Search size={14} />} value={q} onChange={(e) => setQ(e.target.value)} />
      </Field>
      <Field label="Name / Code" hint="Shown in lists and breadcrumbs." required>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Hourly rate" error={/^\d*\.?\d*$/.test(rate) ? undefined : "Enter a number, e.g. 45.67"}>
        <Input inputMode="decimal" className="text-end tabular-nums" value={rate} onChange={(e) => setRate(e.target.value)} />
      </Field>
      <Field label="Company Region">
        <Select value={region} onChange={(e) => setRegion(e.target.value)} options={["United States", "Canada", "Mexico"]} />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <Textarea placeholder="What this plan covers" />
      </Field>
      <Field label="Locked field" hint="System-defined — cannot be changed.">
        <Input value="7507a820-9573" disabled />
      </Field>
    </div>
  );
}

function ToggleDemo() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const [sw, setSw] = useState(true);
  const [seg, setSeg] = useState<"all" | "assigned" | "unassigned">("all");
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-5">
        <Checkbox label="Include Dave" checked={a} onChange={(e) => setA(e.target.checked)} />
        <Checkbox label="Include Jack" checked={b} onChange={(e) => setB(e.target.checked)} />
        <Checkbox label="Select all" checked={a && b} indeterminate={a !== b} onChange={(e) => { setA(e.target.checked); setB(e.target.checked); }} />
        <Checkbox label="Locked" checked disabled readOnly />
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <Switch label="Drill-down" checked={sw} onChange={setSw} />
        <Switch aria-label="Zebra rows" checked={!sw} onChange={(v) => setSw(!v)} />
        <Switch label="Disabled" checked={false} onChange={() => {}} disabled />
      </div>
      <Segmented label="Assignment filter" value={seg} onChange={setSeg}
        options={[{ value: "all", label: "All" }, { value: "assigned", label: "Assigned" }, { value: "unassigned", label: "Unassigned" }]} />
    </div>
  );
}

function TabsDemo() {
  const [tab, setTab] = useState<"properties" | "notes" | "attachments">("properties");
  return (
    <div className="max-w-md rounded-panel border border-line-subtle bg-surface">
      <Tabs label="Record panes" panelId="demo-tab-panel" value={tab} onChange={setTab}
        items={[{ key: "properties", label: "Properties" }, { key: "notes", label: "Notes" }, { key: "attachments", label: "Attachments" }]} />
      <div id="demo-tab-panel" role="tabpanel" className="p-3 text-caption text-fg-secondary">
        Showing <strong className="text-fg-primary">{tab}</strong>.
      </div>
    </div>
  );
}

function FeedbackDemo() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Draft</Badge>
        <Badge tone="mode">Workforce USA</Badge>
        <Badge tone="info">4 fields</Badge>
        <Badge tone="success">Active</Badge>
        <Badge tone="warning">Needs review</Badge>
        <Badge tone="danger">Failed</Badge>
        <Badge tone="mode" solid>Dave</Badge>
        <Badge tone="neutral" solid>System</Badge>
      </div>
      <div className="flex max-w-2xl flex-col gap-2">
        <Notice title="Sorted view." action={<Button>Clear sort</Button>}>Stored order is unchanged. Reordering is off until you clear the sort.</Notice>
        <Notice tone="success" title="Saved.">Workforce USA now has 6 people.</Notice>
        <Notice tone="warning" title="Unassigned.">2 people have no company region.</Notice>
        <Notice tone="danger" title="Could not save.">The server rejected Hourly rate. Check the value and try again.</Notice>
      </div>
      <div className="max-w-md rounded-panel border border-line-subtle bg-surface">
        <EmptyState title="No people in Workforce USA." description="Add the first person to start planning." action={<Button variant="primary"><Plus size={13} aria-hidden />Add Person</Button>} />
      </div>
    </div>
  );
}

function SectionHeaderDemo() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="bg-surface">
      <SectionHeader title="Details" lead={<Badge tone="mode" solid>Dave</Badge>}
        collapsed={collapsed} onCollapsedChange={setCollapsed} controls="demo-details" />
      {!collapsed && (
        <div id="demo-details" className="px-3.75 py-3 text-caption text-fg-secondary">Salary 95,000 · Hours worked 2,080 · Hourly rate 45.67</div>
      )}
      <SectionHeader title="Drivers" lead={<span className="text-caption text-fg-tertiary">No person selected</span>} />
    </div>
  );
}

const PERSON_COLUMNS: Column<Person>[] = [
  { key: "name", header: "Name / Code" },
  { key: "salary", header: "Salary", align: "end", width: "w-28", render: (p) => n(p.salary) },
  { key: "hours", header: "Hours worked", align: "end", width: "w-32", render: (p) => n(p.hours) },
  { key: "rate", header: "Hourly rate", align: "end", width: "w-28", render: (p) => (p.salary / p.hours).toFixed(2) },
];

function DataTableDemo() {
  const [sel, setSel] = useState<string | null>("jack");
  return (
    <div className="max-h-72 overflow-auto">
      <DataTable label="People" columns={PERSON_COLUMNS} rows={PEOPLE} rowKey={(p) => p.id}
        rowNumbers selectedKey={sel} onRowClick={(p) => setSel(p.id)} />
    </div>
  );
}

function SplitDemo() {
  const [h, setH] = useState(120);
  const [sel, setSel] = useState<Person>(PEOPLE[0]);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-96 flex-col bg-surface">
      <div className="min-h-0 flex-1 overflow-auto">
        <DataTable label="People" rowNumbers columns={[{ key: "name", header: "Name / Code" }]} rows={PEOPLE}
          rowKey={(p) => p.id} selectedKey={sel.id} onRowClick={setSel} />
      </div>
      {!collapsed && <Splitter label="Resize details" orientation="horizontal" side="end" value={h} min={72} max={260} defaultValue={120} onChange={setH} />}
      <div style={collapsed ? undefined : { height: h }} className="flex shrink-0 flex-col border-t border-line-subtle">
        <SectionHeader title="Details" lead={<Badge tone="mode" solid>{sel.name}</Badge>} collapsed={collapsed} onCollapsedChange={setCollapsed} />
        {!collapsed && (
          <div className="min-h-0 flex-1 overflow-auto">
            <DataTable label={`${sel.name} drivers`} rowKey={(r) => r.k}
              columns={[{ key: "k", header: "Driver", width: "w-[40%]" }, { key: "v", header: "Value", align: "end" }]}
              rows={[{ k: "Salary", v: n(sel.salary) }, { k: "Hours worked", v: n(sel.hours) }, { k: "Hourly rate", v: (sel.salary / sel.hours).toFixed(2) }]} />
          </div>
        )}
      </div>
    </div>
  );
}

function PopoverDemo() {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [zebra, setZebra] = useState(false);
  const [last, setLast] = useState("—");
  return (
    <div className="flex items-center gap-3">
      <Button ref={ref} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>Actions</Button>
      <span className="text-caption text-fg-tertiary">Last action: {last}</span>
      <Popover anchorRef={ref} open={open} onClose={() => setOpen(false)} label="Actions" className="w-menu py-1">
        <MenuItem onSelect={() => { setLast("Rename"); setOpen(false); }}><Pencil size={13} aria-hidden />Rename</MenuItem>
        <MenuItem checked={zebra} onSelect={() => setZebra((z) => !z)}>
          <span className="grid w-3.5 place-items-center">{zebra && <Check size={13} aria-hidden />}</span>Zebra rows
        </MenuItem>
        <MenuItem disabled>Reorder (sorted view)</MenuItem>
        <MenuDivider />
        <MenuItem tone="danger" onSelect={() => { setLast("Delete"); setOpen(false); }}><Trash2 size={13} aria-hidden />Delete</MenuItem>
      </Popover>
    </div>
  );
}

function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <>
      <Button variant="primary" size="md" onClick={() => setOpen(true)}><Plus size={14} aria-hidden />Add Person</Button>
      {open && (
        <Dialog title="Add Person" subtitle="Joins Workforce USA" onClose={() => setOpen(false)}
          onSubmit={() => { if (name.trim()) setOpen(false); }}
          footer={<>
            <Button size="md" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="md" variant="primary" type="submit" disabled={!name.trim()}>Add Person</Button>
          </>}>
          <Field label="Name / Code" required hint="Enter submits.">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </Dialog>
      )}
    </>
  );
}

/* ── entries ──────────────────────────────────────────────────────────────── */

export const ENTRIES: Entry[] = [
  {
    id: "button", name: "Button", group: "Actions", exports: ["Button"],
    summary: "The only button in the product: six variants, two sizes, optional square icon form.",
    use: ["Any click that does something: save, add, open a menu, close.", "primary once per area — the action most people take next."],
    avoid: ["Navigation to another page (use a link).", "Colouring a button with className — pick a variant instead."],
    Demo: ButtonDemo,
    code: `import { Plus, Pencil } from "lucide-react";
import { Button } from "../ui";

<Button variant="primary" onClick={save}>Save</Button>
<Button onClick={cancel}>Cancel</Button>
<Button variant="danger-outline">Delete</Button>

{/* 30px, with an icon */}
<Button size="md" variant="primary"><Plus size={14} aria-hidden />Add Person</Button>

{/* Icon only — aria-label is required */}
<Button icon aria-label="Edit"><Pencil size={13} aria-hidden /></Button>

{/* On a mode-coloured bar: add className="on-bar" to the bar for a white focus ring */}
<div className="on-bar bg-mode-solid">
  <Button variant="on-bar">Actions</Button>
</div>`,
    props: [{ component: "Button", rows: [
      { name: "variant", type: '"primary" | "secondary" | "ghost" | "danger" | "danger-outline" | "on-bar"', def: '"secondary"', desc: "Visual weight. primary = mode colour, the main action." },
      { name: "size", type: '"sm" | "md"', def: '"sm"', desc: "sm 26px for toolbars and panes; md 30px for dialog footers and forms." },
      { name: "icon", type: "boolean", def: "false", desc: "Square icon-only button. Requires aria-label." },
      { name: "type", type: '"button" | "submit" | "reset"', def: '"button"', desc: "Defaults to button so it never submits a form by accident." },
      { name: "…rest", type: "ButtonHTMLAttributes", desc: "onClick, disabled, aria-*, ref — all forwarded." },
    ] }],
    a11y: ["Real <button>; Enter and Space work.", "Icon-only buttons need aria-label; icons inside get aria-hidden.", "Disabled buttons drop to 45% opacity and stop hover; prefer a disabled reason nearby."],
  },
  {
    id: "field", name: "Field · Input · Select · Textarea", group: "Inputs", exports: ["Field", "Input", "Select", "Textarea"],
    summary: "Field wraps one control with its label, hint and error, and wires the ids for you.",
    use: ["Every form value. Always inside a Field, even when the label is visually hidden.", "Select for a fixed list (native picker on mobile)."],
    avoid: ["Placeholder as the only label.", "Validating on every keystroke for long values — validate on blur or submit."],
    Demo: FieldDemo,
    code: `import { Search } from "lucide-react";
import { Field, Input, Select, Textarea } from "../ui";

<Field label="Name / Code" hint="Shown in lists and breadcrumbs." required>
  <Input value={name} onChange={(e) => setName(e.target.value)} />
</Field>

<Field label="Hourly rate" error={invalid ? "Enter a number, e.g. 45.67" : undefined}>
  <Input inputMode="decimal" className="text-end tabular-nums" value={rate} onChange={onRate} />
</Field>

<Field label="Search members" hideLabel>
  <Input type="search" leading={<Search size={14} />} placeholder="Search members" />
</Field>

<Field label="Company Region">
  <Select value={region} onChange={(e) => setRegion(e.target.value)}
    options={["United States", "Canada"]} />
</Field>

<Field label="Description">
  <Textarea rows={3} />
</Field>`,
    props: [
      { component: "Field", rows: [
        { name: "label", type: "string", desc: "Required. Visible label (or screen-reader only with hideLabel)." },
        { name: "hint", type: "ReactNode", desc: "Helper line under the control." },
        { name: "error", type: "ReactNode", desc: "Replaces the hint, turns the border red, sets aria-invalid." },
        { name: "required", type: "boolean", desc: "Adds a red asterisk to the label." },
        { name: "hideLabel", type: "boolean", def: "false", desc: "Keeps the label for screen readers only." },
        { name: "children", type: "ReactNode", desc: "One Input, Select or Textarea." },
      ] },
      { component: "Input", rows: [
        { name: "leading", type: "ReactNode", desc: "Icon inside the start edge." },
        { name: "…rest", type: "InputHTMLAttributes", desc: "Native props: value, onChange(event), type, inputMode, disabled, ref." },
      ] },
      { component: "Select", rows: [
        { name: "options", type: "Array<string | { value; label }>", desc: "Shorthand for <option>s. Children also work." },
        { name: "…rest", type: "SelectHTMLAttributes", desc: "Native props: value, onChange(event), disabled, ref." },
      ] },
      { component: "Textarea", rows: [{ name: "rows", type: "number", def: "3", desc: "Visible lines. Other native props pass through." }] },
    ],
    a11y: ["Label is linked by id; hint/error by aria-describedby.", "Errors set aria-invalid; the message is read with the field.", "Inputs are 16px on phones so iOS does not zoom."],
  },
  {
    id: "toggles", name: "Checkbox · Switch · Segmented", group: "Inputs", exports: ["Checkbox", "Switch", "Segmented"],
    summary: "Three ways to choose: include something, turn a setting on, or pick one of a few.",
    use: ["Checkbox: inclusion, selection, select-all (indeterminate).", "Switch: a setting that applies immediately.", "Segmented: 2–4 exclusive options, all visible, e.g. a filter."],
    avoid: ["Switch inside a form that needs Save — use Checkbox.", "Segmented with 5+ options — use Select."],
    Demo: ToggleDemo,
    code: `import { Checkbox, Switch, Segmented } from "../ui";

<Checkbox label="Include Dave" checked={on} onChange={(e) => setOn(e.target.checked)} />
<Checkbox aria-label="Select all" checked={all} indeterminate={some} onChange={toggleAll} />

<Switch label="Drill-down" checked={drill} onChange={setDrill} />

<Segmented label="Assignment filter" value={filter} onChange={setFilter}
  options={[
    { value: "all", label: "All" },
    { value: "assigned", label: "Assigned" },
    { value: "unassigned", label: "Unassigned" },
  ]} />`,
    props: [
      { component: "Checkbox", rows: [
        { name: "label", type: "ReactNode", desc: "Text beside the box; makes the whole row clickable. Omit → pass aria-label." },
        { name: "indeterminate", type: "boolean", def: "false", desc: "Partial selection (select-all)." },
        { name: "…rest", type: "InputHTMLAttributes", desc: "checked, onChange(event), disabled, ref." },
      ] },
      { component: "Switch", rows: [
        { name: "checked", type: "boolean", desc: "Required." },
        { name: "onChange", type: "(checked: boolean) => void", desc: "Required. Receives the new value." },
        { name: "label", type: "ReactNode", desc: "Visible text. Without it, pass aria-label." },
        { name: "disabled", type: "boolean", desc: "" },
      ] },
      { component: "Segmented", rows: [
        { name: "options", type: "{ value; label }[]", desc: "2–4 options." },
        { name: "value / onChange", type: "V / (value: V) => void", desc: "Typed to your option values." },
        { name: "label", type: "string", desc: "Accessible name of the group." },
      ] },
    ],
    a11y: ["Checkbox and Segmented are native inputs: Space toggles, arrows move between segments.", "Switch is role=switch with aria-checked.", "State never relies on colour alone (check mark, thumb position, fill)."],
  },
  {
    id: "tabs", name: "Tabs", group: "Navigation", exports: ["Tabs"],
    summary: "Underline tabs that switch one panel in place.",
    use: ["Peer views of the same thing: Properties · Notes · Attachments."],
    avoid: ["Steps in a sequence.", "More than ~6 tabs — use a Select or a side list."],
    Demo: TabsDemo,
    code: `import { Tabs } from "../ui";

<Tabs label="Record panes" panelId="record-panel" value={tab} onChange={setTab}
  items={[
    { key: "properties", label: "Properties" },
    { key: "notes", label: "Notes" },
    { key: "attachments", label: "Attachments" },
  ]} />
<div id="record-panel" role="tabpanel">…</div>`,
    props: [{ component: "Tabs", rows: [
      { name: "items", type: "{ key: K; label: ReactNode }[]", desc: "Tabs in order." },
      { name: "value / onChange", type: "K / (key: K) => void", desc: "Controlled selection." },
      { name: "label", type: "string", desc: "Accessible name of the tab list." },
      { name: "panelId", type: "string", desc: "id of the panel (role=tabpanel) the tabs control." },
    ] }],
    a11y: ["One tab stop; ←/→ move and select, Home/End jump.", "role=tablist / tab with aria-selected and aria-controls."],
  },
  {
    id: "feedback", name: "Badge · Notice · EmptyState", group: "Display", exports: ["Badge", "Notice", "EmptyState"],
    summary: "Status labels, inline messages, and what to show when there is nothing to show.",
    use: ["Badge: short status or the picked record (solid).", "Notice: a condition of this area (sorted view, save failed).", "EmptyState: every list, grid or pane that can be empty."],
    avoid: ["Badge as a button.", "Notice for a passing confirmation that needs no action — keep it short or skip it.", "Blank areas."],
    Demo: FeedbackDemo,
    code: `import { Badge, Notice, EmptyState, Button } from "../ui";

<Badge tone="success">Active</Badge>
<Badge tone="mode" solid>Dave</Badge>

<Notice title="Sorted view." action={<Button>Clear sort</Button>}>
  Stored order is unchanged.
</Notice>
<Notice tone="danger" title="Could not save.">Check the value and try again.</Notice>

<EmptyState
  title="No people in Workforce USA."
  description="Add the first person to start planning."
  action={<Button variant="primary">Add Person</Button>} />`,
    props: [
      { component: "Badge", rows: [
        { name: "tone", type: '"neutral" | "mode" | "info" | "success" | "warning" | "danger"', def: '"neutral"', desc: "Meaning. mode follows DATA / MODEL / L100." },
        { name: "solid", type: "boolean", def: "false", desc: "Filled — for the one thing to notice." },
      ] },
      { component: "Notice", rows: [
        { name: "tone", type: '"info" | "success" | "warning" | "danger"', def: '"info"', desc: "Sets colour and icon. danger is announced (role=alert)." },
        { name: "title", type: "ReactNode", desc: "Bold lead-in." },
        { name: "action", type: "ReactNode", desc: "One button at the end." },
      ] },
      { component: "EmptyState", rows: [
        { name: "title", type: "ReactNode", desc: "What this place is or why it is empty." },
        { name: "description", type: "ReactNode", desc: "How to fill it." },
        { name: "action", type: "ReactNode", desc: "One next step." },
      ] },
    ],
    a11y: ["Notice is role=status (danger: role=alert), so changes are announced.", "Every tone pairs an icon or words with colour."],
  },
  {
    id: "section-header", name: "SectionHeader", group: "Display", exports: ["SectionHeader"],
    summary: "Compact mode-tinted band that opens a section — e.g. a record's Details under a grid. Optionally collapsible.",
    use: ["Starting a second region inside the work area so people see it is a separate part.", "Collapsible detail regions."],
    avoid: ["Page titles.", "Stacking several on top of each other without content between."],
    Demo: SectionHeaderDemo, flush: true,
    code: `import { SectionHeader, Badge } from "../ui";

<SectionHeader
  title="Details"
  lead={<Badge tone="mode" solid>{person.name}</Badge>}
  collapsed={collapsed}
  onCollapsedChange={setCollapsed}
  controls="details-body" />
{!collapsed && <div id="details-body">…</div>}`,
    props: [{ component: "SectionHeader", rows: [
      { name: "title", type: "string", desc: "Uppercase label at the end of the band." },
      { name: "lead", type: "ReactNode", desc: "Start of the band — usually a solid Badge with the record name." },
      { name: "actions", type: "ReactNode", desc: "Buttons before the title." },
      { name: "collapsed / onCollapsedChange", type: "boolean / (next) => void", desc: "Pass both to make it collapsible. Chevron: down = open, up = collapsed." },
      { name: "controls", type: "string", desc: "id of the content it hides (aria-controls)." },
    ] }],
    a11y: ["Title is an <h2>; when collapsible it is a button with aria-expanded."],
  },
  {
    id: "data-table", name: "DataTable", group: "Data", exports: ["DataTable", "Column"],
    summary: "The product grid: 26px header, 30px rows, hairlines, right-aligned numbers, optional row selection.",
    use: ["Lists of records with columns.", "Field | Value | Source detail grids."],
    avoid: ["Layout (use flex/grid).", "Editing many cells at once — that needs a dedicated grid."],
    Demo: DataTableDemo, flush: true,
    code: `import { DataTable, type Column } from "../ui";

const columns: Column<Person>[] = [
  { key: "name", header: "Name / Code" },
  { key: "salary", header: "Salary", align: "end", width: "w-28",
    render: (p) => p.salary.toLocaleString("en-US") },
  { key: "rate", header: "Hourly rate", align: "end", width: "w-28",
    render: (p) => (p.salary / p.hours).toFixed(2) },
  { key: "src", header: "Source", muted: true },
];

<div className="min-h-0 flex-1 overflow-auto">   {/* scroll parent; header sticks */}
  <DataTable label="People" columns={columns} rows={people} rowKey={(p) => p.id}
    rowNumbers selectedKey={selectedId} onRowClick={(p) => setSelectedId(p.id)}
    empty="No people in this view." />
</div>`,
    props: [
      { component: "DataTable", rows: [
        { name: "columns", type: "Column<T>[]", desc: "Column definitions, in order." },
        { name: "rows / rowKey", type: "T[] / (row) => string", desc: "Data and a stable key per row." },
        { name: "label", type: "string", desc: "Accessible name of the table." },
        { name: "selectedKey", type: "string | null", desc: "Highlights one row (mode tint + leading bar)." },
        { name: "onRowClick", type: "(row: T) => void", desc: "Makes rows focusable and clickable (Enter / Space)." },
        { name: "rowNumbers", type: "boolean", desc: "Leading # column." },
        { name: "empty", type: "ReactNode", def: '"Nothing here yet."', desc: "Shown with no rows." },
      ] },
      { component: "Column<T>", rows: [
        { name: "key / header", type: "string / ReactNode", desc: "Identity and header text." },
        { name: "render", type: "(row: T) => ReactNode", desc: "Cell content. Defaults to row[key]." },
        { name: "align", type: '"start" | "end"', def: '"start"', desc: "end = numbers (tabular figures)." },
        { name: "width", type: "string", desc: "Width utility, e.g. w-28 or w-[30%]." },
        { name: "muted", type: "boolean", desc: "Secondary text (sources, notes)." },
      ] },
    ],
    a11y: ["Real <table> with scoped headers and an aria-label.", "Clickable rows are focusable with aria-selected."],
  },
  {
    id: "splitter", name: "Splitter", group: "Data", exports: ["Splitter"],
    summary: "Drag handle between two panes — side by side (vertical) or stacked (horizontal). Example: records on top, details below.",
    use: ["Panes whose size people tune to their screen and task."],
    avoid: ["Fixed layouts where both sides always need the same size."],
    Demo: SplitDemo, flush: true,
    code: `import { Splitter, SectionHeader, DataTable, Badge } from "../ui";

const [height, setHeight] = useState(220);

<div className="flex h-full flex-col">
  <div className="min-h-0 flex-1 overflow-auto">{/* records */}</div>
  <Splitter label="Resize details" orientation="horizontal" side="end"
    value={height} min={96} max={640} defaultValue={220} onChange={setHeight} />
  <div style={{ height }} className="flex shrink-0 flex-col">
    <SectionHeader title="Details" lead={<Badge tone="mode" solid>Dave</Badge>} />
    {/* details */}
  </div>
</div>`,
    props: [{ component: "Splitter", rows: [
      { name: "value / onChange", type: "number / (next: number) => void", desc: "Size in px of the pane it resizes." },
      { name: "min / max / defaultValue", type: "number", desc: "Clamp range; defaultValue is restored by double-click or Enter." },
      { name: "side", type: '"start" | "end"', desc: "start = resizes the pane before it (drag right/down grows); end = the pane after it." },
      { name: "orientation", type: '"vertical" | "horizontal"', def: '"vertical"', desc: "horizontal for stacked panes (resizes height)." },
      { name: "label", type: "string", desc: "Accessible name, e.g. \"Resize details\"." },
    ] }],
    a11y: ["WAI-ARIA window splitter: role=separator with aria-valuenow.", "Arrow keys resize (Shift = larger step), Home/End jump to limits, Enter resets."],
  },
  {
    id: "popover", name: "Popover · MenuItem", group: "Overlays", exports: ["Popover", "MenuItem", "MenuDivider"],
    summary: "Floating panel anchored to a button: menus, pickers, small forms. Portalled, so overflow never clips it.",
    use: ["Action menus (Actions ▾).", "Small pickers that belong to one control."],
    avoid: ["Anything that needs the user's full attention — use Dialog."],
    Demo: PopoverDemo,
    code: `import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button, Popover, MenuItem, MenuDivider } from "../ui";

const anchor = useRef<HTMLButtonElement>(null);
const [open, setOpen] = useState(false);

<Button ref={anchor} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
  Actions
</Button>
<Popover anchorRef={anchor} open={open} onClose={() => setOpen(false)} label="Actions" className="w-menu py-1">
  <MenuItem onSelect={rename}>Rename</MenuItem>
  <MenuItem checked={zebra} onSelect={toggleZebra}>
    <span className="grid w-3.5 place-items-center">{zebra && <Check size={13} aria-hidden />}</span>
    Zebra rows
  </MenuItem>
  <MenuDivider />
  <MenuItem tone="danger" onSelect={remove}>Delete</MenuItem>
</Popover>`,
    props: [
      { component: "Popover", rows: [
        { name: "anchorRef", type: "RefObject<HTMLElement>", desc: "The control it opens from." },
        { name: "open / onClose", type: "boolean / () => void", desc: "Closes on Escape (focus returns) and outside click." },
        { name: "placement", type: '"bottom-start" | "bottom-end" | "top-start"', def: '"bottom-start"', desc: "" },
        { name: "role", type: '"menu" | "dialog"', def: '"menu"', desc: "menu adds arrow-key navigation over MenuItems." },
        { name: "label", type: "string", desc: "Accessible name." },
      ] },
      { component: "MenuItem", rows: [
        { name: "onSelect", type: "() => void", desc: "Click or Enter." },
        { name: "checked", type: "boolean", desc: "Makes it a menuitemcheckbox (aria-checked). Draw the check mark yourself in a fixed-width slot, as in the example, so labels stay aligned." },
        { name: "tone", type: '"default" | "danger"', def: '"default"', desc: "" },
        { name: "disabled", type: "boolean", desc: "Stays focusable, does nothing (aria-disabled)." },
      ] },
    ],
    a11y: ["Menus: ↑/↓ move, Home/End jump, Tab closes, first item focused on open.", "Escape closes and returns focus to the trigger."],
  },
  {
    id: "dialog", name: "Dialog", group: "Overlays", exports: ["Dialog"],
    summary: "Modal for short tasks and confirmations. Traps focus, Escape closes, Enter submits when onSubmit is set.",
    use: ["Add / edit a record with a few fields.", "Confirm a destructive action (role=\"alertdialog\")."],
    avoid: ["Long or multi-step work — give it a page or pane.", "Information people need while working — use a Notice."],
    Demo: DialogDemo,
    code: `import { Dialog, Button, Field, Input } from "../ui";

{open && (
  <Dialog title="Add Person" subtitle="Joins Workforce USA"
    onClose={() => setOpen(false)}
    onSubmit={create}                       // Enter submits
    footer={<>
      <Button size="md" onClick={() => setOpen(false)}>Cancel</Button>
      <Button size="md" variant="primary" type="submit">Add Person</Button>
    </>}>
    <Field label="Name / Code" required>
      <Input value={name} onChange={(e) => setName(e.target.value)} />
    </Field>
  </Dialog>
)}`,
    props: [{ component: "Dialog", rows: [
      { name: "title / subtitle", type: "string / ReactNode", desc: "Heading and one line of context." },
      { name: "onClose", type: "() => void", desc: "Escape, × button." },
      { name: "onSubmit", type: "() => void", desc: "Wraps body + footer in a <form>; Enter submits." },
      { name: "footer", type: "ReactNode", desc: "Buttons, right-aligned. Cancel first, primary last." },
      { name: "role", type: '"dialog" | "alertdialog"', def: '"dialog"', desc: "alertdialog for destructive confirmations." },
      { name: "icon", type: "ReactNode", desc: "Optional icon before the title." },
    ] }],
    a11y: ["The app behind is inert while open; Tab cycles inside.", "Focus starts on the first field and returns to the opener on close."],
  },
];
