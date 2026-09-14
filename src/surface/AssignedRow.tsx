import { memo, type DragEvent, type KeyboardEvent } from "react";
import { Folder, GripVertical, X } from "lucide-react";
import type { ContextDef } from "../lib/registry";
import type { AttributeKey, Row } from "../lib/assignment";
import { SCOPE_MEMBERS } from "../lib/demo-data";
import { Button } from "../components/Button";
import { RowIndex, colWidth } from "../components/Grid";
import { AttributeCell, attributeWidth } from "./AttributeCell";
import { ScopeChip } from "./ScopeChip";
import { cx } from "../lib/cx";

export interface AssignedRowProps {
  row: Row;
  ctx: ContextDef;
  /** Member ordinal (1-based); null for folders. */
  ordinal: number | null;
  position: number;
  count: number;
  /** Reorder allowed (not sorted, not scoping). */
  canReorder: boolean;
  reorderHintId: string;
  dragging: boolean;
  scopeActive: boolean;
  /** Another row is being scoped: this row is inert. */
  dimmed: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDropOn: (id: string) => void;
  onMoveBy: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onToggleScope: (id: string) => void;
  onAttr: (id: string, key: AttributeKey, value: boolean | string) => void;
}

export const AssignedRow = memo(function AssignedRow({
  row, ctx, ordinal, position, count, canReorder, reorderHintId, dragging, scopeActive, dimmed,
  onDragStart, onDragEnd, onDropOn, onMoveBy, onRemove, onToggleScope, onAttr,
}: AssignedRowProps) {
  const isFolder = row.kind === "folder";

  const onGripKey = (e: KeyboardEvent) => {
    if (!canReorder) return;
    if (e.key === "ArrowUp") { e.preventDefault(); onMoveBy(row.id, -1); }
    if (e.key === "ArrowDown") { e.preventDefault(); onMoveBy(row.id, 1); }
  };

  const dragProps = canReorder ? {
    draggable: true,
    onDragStart: (e: DragEvent) => {
      /* Firefox will not start a drag without data. */
      e.dataTransfer.setData("text/plain", row.id);
      e.dataTransfer.effectAllowed = "move";
      onDragStart(row.id);
    },
    onDragEnd,
  } : {};

  return (
    <li
      {...dragProps}
      data-row-id={row.id}
      inert={dimmed}
      onDragOver={(e) => { if (canReorder) e.preventDefault(); }}
      onDrop={(e) => { e.preventDefault(); onDropOn(row.id); }}
      className={cx(
        "flex min-h-row items-center gap-2 border-b border-line-subtle px-3",
        "transition-[opacity,background-color] ease-standard",
        scopeActive ? "bg-selected" : isFolder ? "bg-canvas" : "bg-surface",
        dragging && "opacity-50",
        dimmed && "opacity-40",
      )}
    >
      <RowIndex n={ordinal} />

      <span className={cx(colWidth.grip, "flex shrink-0 justify-center")}>
        <button
          type="button"
          data-grip
          aria-label={`Reorder ${row.name}, position ${position} of ${count}`}
          aria-describedby={reorderHintId}
          aria-disabled={!canReorder}
          onKeyDown={onGripKey}
          className={cx(
            "flex size-control-sm items-center justify-center rounded-sm text-fg-tertiary",
            canReorder ? "cursor-grab hover:bg-hover hover:text-fg-primary active:cursor-grabbing" : "cursor-not-allowed",
          )}
        >
          <GripVertical size={14} strokeWidth={1.5} aria-hidden />
        </button>
      </span>

      <span className={cx("flex min-w-0 flex-1 items-center gap-2 py-2 break-words", isFolder && "font-semibold text-fg-secondary")}>
        {isFolder && <Folder size={14} strokeWidth={2} aria-hidden className="shrink-0" />}
        <span className="min-w-0">{row.name}</span>
        {isFolder && (
          <span className="shrink-0 rounded-full border border-line-strong px-1.5 text-caption font-normal whitespace-nowrap text-fg-secondary">
            Not in totals
          </span>
        )}
      </span>

      {ctx.scope && (row.kind === "member" ? (
        <ScopeChip
          rowName={row.name}
          selected={row.scoped.length}
          total={SCOPE_MEMBERS.length}
          active={scopeActive}
          onToggle={() => onToggleScope(row.id)}
        />
      ) : <span aria-hidden className={cx(colWidth.members, "shrink-0")} />)}

      {ctx.cols.map((col) => row.kind === "member"
        ? <AttributeCell key={col.key} col={col} row={row} onChange={onAttr} />
        : <span key={col.key} aria-hidden className={cx(attributeWidth(col), "shrink-0")} />)}

      <span className={cx(colWidth.action, "flex shrink-0 justify-center")}>
        {/* Hidden while this row is scoped: a mis-click would delete the row mid-task. */}
        {!scopeActive && (
          <Button
            variant="ghost"
            size="icon"
            static
            data-remove
            aria-label={`Remove ${row.name}`}
            onClick={() => onRemove(row.id)}
            className="text-fg-tertiary"
          >
            <X size={14} strokeWidth={1.5} aria-hidden />
          </Button>
        )}
      </span>
    </li>
  );
});
