import { memo } from "react";
import type { AttributeColumn } from "../lib/registry";
import type { AttributeKey, MemberRow } from "../lib/assignment";
import { AccessLevel } from "../components/AccessLevel";
import { Switch } from "../components/Switch";
import { TextField } from "../components/Field";
import { colWidth } from "../components/Grid";
import { cx } from "../lib/cx";

export const attributeWidth = (col: AttributeColumn) =>
  col.type === "toggle" ? colWidth.toggle : col.type === "access" ? colWidth.access : colWidth.qty;

export interface AttributeCellProps {
  col: AttributeColumn;
  row: MemberRow;
  onChange: (id: string, key: AttributeKey, value: boolean | string) => void;
}

/*
 * Module-level component. The source declared this INSIDE the surface's render,
 * so React saw a new component type every render and remounted the cell — the
 * qty input lost focus after each keystroke.
 */
export const AttributeCell = memo(function AttributeCell({ col, row, onChange }: AttributeCellProps) {
  return (
    <span className={cx(attributeWidth(col), "flex shrink-0", col.type === "qty" ? "justify-start" : "justify-center")}>
      {col.type === "toggle" && (
        <Switch
          checked={Boolean(row[col.key])}
          onChange={(v) => onChange(row.id, col.key, v)}
          label={`${col.head} for ${row.name}`}
        />
      )}
      {col.type === "qty" && (
        <TextField
          value={row.qty}
          onChange={(v) => onChange(row.id, "qty", v)}
          inputMode="decimal"
          aria-label={`Qty for ${row.name}`}
          className="w-full"
        />
      )}
      {col.type === "access" && (
        <AccessLevel
          name={`access-${row.id}`}
          value={row.access}
          onChange={(v) => onChange(row.id, "access", v)}
          rowLabel={row.name}
        />
      )}
    </span>
  );
});
