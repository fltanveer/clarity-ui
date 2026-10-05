import { ArrowLeft } from "lucide-react";
import type { Member } from "../lib/members";
import type { PropertySectionDef } from "../lib/properties";
import { initials } from "../lib/records";

export interface RecordDetailProps {
  record: Member;
  /** Business noun for one record, e.g. "Person". */
  noun: string;
  /** Plural, for the way back: "All people". */
  plural: string;
  /** The Model the record follows, e.g. "Workforce USA". */
  within: string | null;
  /** Sections the fixture supplies for this record (Drivers for a person). */
  sections: PropertySectionDef[];
  onBack: () => void;
}

/*
 * One record, in the work area. A record picked in the left pane replaces the
 * list: its name on top, then one grid of its values (Field | Value | Source),
 * sections as group rows. Values are read off the record and the fixture;
 * nothing is computed here.
 */
export function RecordDetail({ record, noun, plural, within, sections, onBack }: RecordDetailProps) {
  const identity: PropertySectionDef = {
    id: "identity", label: "Identity", fields: [
      { l: "Name / Code", v: record.name, t: "read" },
      { l: "Short Name", v: record.code, t: "read" },
      { l: "Description", v: record.description ?? "", t: "read" },
      ...(within ? [{ l: "Model", v: within, t: "read" as const }] : []),
    ],
  };
  return (
    <div aria-label={`${noun}: ${record.name}`} role="region" className="min-h-0 flex-1 overflow-y-auto bg-surface">
      {/* One compact line: back, who, and what it follows. */}
      <header className="flex h-row-toolbar items-center gap-2 border-b border-line-subtle bg-surface px-3">
        <button type="button" onClick={onBack} aria-label={`Back to all ${plural.toLowerCase()}`}
          className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-control text-fg-secondary hover:bg-hover hover:text-fg-primary">
          <ArrowLeft size={14} aria-hidden />
        </button>
        <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-mode-soft text-micro font-bold text-mode-ink">
          {initials(record.name)}
        </span>
        <h2 className="min-w-0 truncate text-ui font-semibold text-fg-primary">{record.name}</h2>
        <span className="truncate text-caption text-fg-tertiary">{noun}{within ? ` · ${within}` : ""}</span>
      </header>

      {/* One grid, built like the member grid: header bar, 30px rows, hairlines; sections are group rows. */}
      <table aria-label={`${record.name} details`} className="w-full table-fixed border-collapse bg-surface text-ui">
        <colgroup>
          <col className="w-[30%]" /><col className="w-[30%]" /><col />
        </colgroup>
        <thead>
          <tr className="h-grid-head border-b border-grid-line-col bg-grid-header text-caption font-semibold whitespace-nowrap text-fg-secondary">
            <th scope="col" className="px-3 text-start font-semibold">Field</th>
            <th scope="col" className="border-s border-grid-line-col px-3 text-end font-semibold">Value</th>
            <th scope="col" className="border-s border-grid-line-col px-3 text-start font-semibold">Source</th>
          </tr>
        </thead>
        {[identity, ...sections].map((sec) => (
          <tbody key={sec.id}>
            <tr className="h-grid-row border-b border-grid-line bg-grid-container">
              <th scope="rowgroup" colSpan={3} className="px-3 text-start text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">
                {sec.label}
              </th>
            </tr>
            {sec.fields.map((f) => {
              const blank = f.v === undefined || f.v === "";
              return (
                <tr key={f.l} className="h-grid-row border-b border-grid-line hover:bg-hover">
                  <th scope="row" className="truncate ps-6 pe-3 text-start font-normal text-fg-primary">{f.l}</th>
                  <td className="truncate border-s border-grid-line px-3 text-end tabular-nums">
                    {blank ? <span className="text-caption text-fg-tertiary italic">Not supplied</span> : String(f.v)}
                  </td>
                  <td className="truncate border-s border-grid-line px-3 text-caption text-fg-tertiary">
                    {f.src ? `Derived · ${f.src}` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}
