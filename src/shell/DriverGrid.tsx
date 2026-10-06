import { ArrowLeft, ChevronDown } from "lucide-react";
import { cx } from "../lib/cx";
import type { Member } from "../lib/members";
import type { PropertySectionDef } from "../lib/properties";

export interface DriverGridProps {
  /** The record picked in the grid above; null until one is picked. */
  record: Member | null;
  /** Business noun for one record, e.g. "Person". */
  noun: string;
  /** Sections the fixture supplies for the record (Drivers for a person). */
  sections: PropertySectionDef[];
  /** Shown when the drivers stand alone (record picked in the left pane): the way back to the list. */
  onBack?: () => void;
  /** Plural noun for the way back, e.g. "People". */
  plural?: string;
  /** In the split work area the details fold to their header; absent = always open. */
  collapsed?: boolean;
  onCollapsed?: (next: boolean) => void;
}

/*
 * Lower half of the split work area: the driver values of the record picked
 * in the grid above (Driver | Value | Source). Values are read off the
 * fixture; nothing is computed here.
 */
/* Inset of the member grid's content (3px row accent + px-3), so both grids share one left edge. */
const NAME_INSET = "ps-[15px]";
const CHIP_INSET = NAME_INSET;

export function DriverGrid({ record, noun, sections, onBack, plural, collapsed = false, onCollapsed }: DriverGridProps) {
  const fields = sections.flatMap((s) => s.fields);
  return (
    <section aria-label={record ? `Details: ${record.name}` : "Details"} className={cx("flex min-h-0 flex-col bg-surface", !collapsed && "flex-1")}>
      {/* Compact mode-tinted band, so the lower grid reads as its own part; the picked record sits on a solid chip. */}
      <header className={cx("flex shrink-0 items-center gap-2 bg-mode-soft py-2 pe-3", onBack ? "ps-3" : CHIP_INSET, !collapsed && "border-b border-line-subtle")}>
        {onBack && (
          <button type="button" onClick={onBack} aria-label={`Back to all ${(plural ?? noun).toLowerCase()}`}
            className="grid size-5 shrink-0 cursor-pointer place-items-center rounded-chip text-mode-ink hover:bg-hover">
            <ArrowLeft size={13} aria-hidden />
          </button>
        )}
        {record ? (
          <span className="min-w-0 truncate rounded-chip bg-mode-solid px-2 py-0.5 text-caption font-semibold text-fg-on-accent">{record.name}</span>
        ) : (
          <span className="min-w-0 truncate text-caption text-fg-tertiary">No {noun.toLowerCase()} selected</span>
        )}
        {onCollapsed ? (
          <h2 className="ms-auto shrink-0">
            <button type="button" onClick={() => onCollapsed(!collapsed)} aria-expanded={!collapsed}
              className="flex cursor-pointer items-center gap-1 rounded-chip px-1 text-micro font-semibold tracking-eyebrow text-mode-ink uppercase hover:bg-hover">
              Details
              <ChevronDown size={13} aria-hidden className={cx("transition-transform duration-150 ease-standard", collapsed && "rotate-180")} />
            </button>
          </h2>
        ) : (
          <h2 className="ms-auto shrink-0 text-micro font-semibold tracking-eyebrow text-mode-ink uppercase">Details</h2>
        )}
      </header>
      {collapsed ? null : record ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table aria-label={`${record.name} drivers`} className="w-full table-fixed border-collapse bg-surface text-ui">
            <colgroup>
              <col className="w-[30%]" /><col className="w-[30%]" /><col />
            </colgroup>
            <thead>
              <tr className="h-grid-head border-b border-grid-line-col bg-grid-header text-caption font-semibold whitespace-nowrap text-fg-secondary">
                <th scope="col" className={cx(NAME_INSET, "pe-3 text-start font-semibold")}>Driver</th>
                <th scope="col" className="border-s border-grid-line-col px-3 text-end font-semibold">Value</th>
                <th scope="col" className="border-s border-grid-line-col px-3 text-start font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => {
                const blank = f.v === undefined || f.v === "";
                return (
                  <tr key={f.l} className="h-grid-row border-b border-grid-line hover:bg-hover">
                    <th scope="row" className={cx(NAME_INSET, "truncate pe-3 text-start font-normal text-fg-primary")}>{f.l}</th>
                    <td className="truncate border-s border-grid-line px-3 text-end tabular-nums">
                      {blank ? <span className="text-caption text-fg-tertiary italic">Not supplied</span> : String(f.v)}
                    </td>
                    <td className="truncate border-s border-grid-line px-3 text-caption text-fg-tertiary">
                      {f.src ? `Derived · ${f.src}` : ""}
                    </td>
                  </tr>
                );
              })}
              {!fields.length && (
                <tr><td colSpan={3} className="px-3 py-4.5 text-caption text-fg-tertiary">No drivers supplied for {record.name}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-3 py-4.5 text-caption text-fg-tertiary">Select a {noun.toLowerCase()} above to see their drivers.</p>
      )}
    </section>
  );
}
