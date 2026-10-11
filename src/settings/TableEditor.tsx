import { useId } from "react";
import { Check } from "lucide-react";
import { DataTable, Segmented, Switch, cx, type Column } from "../ui";
import { TABLE_PRESETS, presetOf, type ColumnLines, type TableHeader, type TablePreset, type TableStyle } from "./table";

interface Row { id: string; name: string; salary: string; hours: string; rate: string }
const SAMPLE: Row[] = [
  { id: "dave", name: "Dave", salary: "95,000", hours: "2,080", rate: "45.67" },
  { id: "jack", name: "Jack", salary: "78,500", hours: "1,950", rate: "40.26" },
  { id: "priya", name: "Priya Shah", salary: "112,000", hours: "2,080", rate: "53.85" },
  { id: "marcus", name: "Marcus Lee", salary: "68,000", hours: "2,000", rate: "34.00" },
];
const COLUMNS: Column<Row>[] = [
  { key: "name", header: "Name / Code" },
  { key: "salary", header: "Salary", align: "end", width: "w-24" },
  { key: "hours", header: "Hours", align: "end", width: "w-20" },
  { key: "rate", header: "Rate", align: "end", width: "w-20" },
];

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line-subtle py-2.5 last:border-b-0">
      <span className="text-ui font-medium text-fg-primary">{label}</span>
      {children}
    </div>
  );
}

/*
 * Table style: pick a preset, then fine-tune. The sample grid is the library
 * DataTable, which reads the same data-table-* attributes as every grid in
 * the app, so it previews the draft exactly (the app behind does too).
 */
export function TableEditor({ value, onChange }: { value: TableStyle; onChange: (next: TableStyle) => void }) {
  const name = useId();
  const current = presetOf(value);
  const set = (patch: Partial<TableStyle>) => onChange({ ...value, ...patch });
  return (
    <div>
      <p className="mt-4 mb-1.5 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">Preset</p>
      <div role="radiogroup" aria-label="Table preset" className="grid grid-cols-2 gap-2">
        {(Object.keys(TABLE_PRESETS) as TablePreset[]).map((k) => {
          const p = TABLE_PRESETS[k];
          const on = current === k;
          return (
            <label key={k} className={cx("relative flex cursor-pointer flex-col gap-0.5 rounded-panel border p-3",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
              on ? "border-mode-solid bg-mode-soft" : "border-line-subtle bg-surface hover:bg-hover")}>
              <input type="radio" name={name} checked={on} onChange={() => onChange(p.style)} className="sr-only" />
              <span className={cx("text-ui font-semibold", on ? "text-mode-ink" : "text-fg-primary")}>{p.label}</span>
              <span className="text-caption text-fg-tertiary">{p.hint}</span>
              {on && <Check size={14} aria-hidden className="absolute top-3 right-3 text-mode-ink" />}
            </label>
          );
        })}
      </div>
      {!current && <p className="mt-1.5 text-caption text-fg-tertiary">Custom — fine-tuned from a preset.</p>}

      <p className="mt-5 mb-1 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">Fine-tune</p>
      <div className="rounded-panel border border-line-subtle bg-surface px-3">
        <Line label="Header">
          <Segmented label="Header" value={value.header} onChange={(header: TableHeader) => set({ header })}
            options={[{ value: "tinted", label: "Tinted" }, { value: "plain", label: "Plain" }, { value: "strong", label: "Strong" }]} />
        </Line>
        <Line label="Column lines">
          <Segmented label="Column lines" value={value.columnLines} onChange={(columnLines: ColumnLines) => set({ columnLines })}
            options={[{ value: "detail", label: "Detail grids" }, { value: "all", label: "All" }, { value: "none", label: "None" }]} />
        </Line>
        <Line label="Row lines"><Switch aria-label="Row lines" checked={value.rowLines} onChange={(rowLines) => set({ rowLines })} /></Line>
        <Line label="Zebra rows"><Switch aria-label="Zebra rows" checked={value.zebra} onChange={(zebra) => set({ zebra })} /></Line>
        <Line label="Row numbers"><Switch aria-label="Row numbers" checked={value.rowNumbers} onChange={(rowNumbers) => set({ rowNumbers })} /></Line>
      </div>
      <p className="mt-1.5 text-caption text-fg-tertiary">Row lines, zebra and numbers are where the main grid starts; people can still change them from Display.</p>

      <p className="mt-5 mb-1.5 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">Preview</p>
      <div className="overflow-hidden rounded-panel border border-line-subtle">
        <DataTable label="Table style preview" columns={COLUMNS} rows={SAMPLE} rowKey={(r) => r.id}
          rowNumbers={value.rowNumbers} selectedKey="jack" />
      </div>
    </div>
  );
}
