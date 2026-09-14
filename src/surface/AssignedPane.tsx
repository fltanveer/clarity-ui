import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { FolderPlus, X } from "lucide-react";
import type { ContextDef } from "../lib/registry";
import { allowsFolders } from "../lib/registry";
import type { Assignment } from "../lib/assignment";
import { MASTER, type SavedView } from "../lib/demo-data";
import { nextSort, sortBy, type SortState } from "../lib/sort";
import { Button } from "../components/Button";
import { ConsequenceBadge } from "../components/ConsequenceBadge";
import { EmptyState } from "../components/EmptyState";
import { FilterBand, GridHead, HeadCell, Pane, PaneBody, PaneTitle, SortHeader, TitleBand, colWidth } from "../components/Grid";
import { Notice } from "../components/Notice";
import { ViewMenu } from "../components/ViewMenu";
import { attributeWidth } from "./AttributeCell";
import { AssignedRow } from "./AssignedRow";
import { RemoveAllConfirm } from "./RemoveAllConfirm";
import { cx } from "../lib/cx";

type SortKey = "name";

export interface AssignedPaneProps {
  ctx: ContextDef;
  assignment: Assignment;
  scopeOn: string | null;
  onToggleScope: (id: string) => void;
  sort: SortState<SortKey> | null;
  onSort: (sort: SortState<SortKey> | null) => void;
  leaf?: boolean;
  savedViews: SavedView[];
  onManageViews?: () => void;
  className?: string;
}

export function AssignedPane({
  ctx, assignment, scopeOn, onToggleScope, sort, onSort, leaf, savedViews, onManageViews, className,
}: AssignedPaneProps) {
  const { rows, move, remove, clear, addFolder, setAttr } = assignment;
  const uid = useId();
  const titleId = `${uid}-title`;
  const hintId = `${uid}-reorder-hint`;
  const [confirmClear, setConfirmClear] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const removeAllRef = useRef<HTMLButtonElement>(null);
  const restoreRemoveAll = useRef(false);
  const listRef = useRef<HTMLOListElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  /* Focus target to restore after the list re-renders: [row id, which control]. */
  const pendingFocus = useRef<[string | null, "grip" | "remove"] | null>(null);

  const viewRows = useMemo(() => sortBy(rows, sort, (r) => r.name), [rows, sort]);
  const ordinals = useMemo(() => {
    let n = 0;
    return viewRows.map((r) => (r.kind === "member" ? ++n : null));
  }, [viewRows]);

  const memberCount = rows.filter((r) => r.kind === "member").length;
  const folderCount = rows.length - memberCount;
  const canReorder = !sort && !scopeOn;

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    const [id, control] = target;
    const el = id && listRef.current?.querySelector<HTMLElement>(`[data-row-id="${id}"] [data-${control}]`);
    (el || headingRef.current)?.focus();
  }, [rows]);

  useEffect(() => {
    if (!confirmClear && restoreRemoveAll.current) {
      restoreRemoveAll.current = false;
      removeAllRef.current?.focus();
    }
  }, [confirmClear]);

  const onMoveBy = useCallback((id: string, delta: number) => {
    const from = rows.findIndex((r) => r.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= rows.length) return;
    pendingFocus.current = [id, "grip"];
    move(id, to);
    setAnnouncement(`${rows[from].name} moved to position ${to + 1} of ${rows.length}`);
  }, [rows, move]);

  const onDropOn = useCallback((targetId: string) => {
    if (!dragId || !canReorder) return;
    move(dragId, rows.findIndex((r) => r.id === targetId));
    setDragId(null);
  }, [dragId, canReorder, rows, move]);

  const onRemove = useCallback((id: string) => {
    const i = rows.findIndex((r) => r.id === id);
    const neighbour = rows[i + 1] ?? rows[i - 1] ?? null;
    pendingFocus.current = [neighbour?.id ?? null, "remove"];
    remove(id);
  }, [rows, remove]);

  const onDragEnd = useCallback(() => setDragId(null), []);

  return (
    <Pane aria-labelledby={titleId} className={className}>
      <TitleBand>
        <div ref={headingRef} tabIndex={-1} id={titleId} className="outline-offset-2">
          <PaneTitle count={`${memberCount} of ${MASTER.length}`}>Assigned</PaneTitle>
        </div>

        {/* Sub-task safety (§6.6): bulk actions are unavailable while scoping. */}
        {!scopeOn && (confirmClear ? (
          <RemoveAllConfirm
            members={memberCount}
            folders={folderCount}
            onConfirm={() => { clear(); setConfirmClear(false); pendingFocus.current = [null, "remove"]; }}
            onCancel={() => { restoreRemoveAll.current = true; setConfirmClear(false); }}
          />
        ) : (
          <div className="ms-auto flex items-center gap-2">
            {ctx.consequence === "display" && !leaf && (
              <ViewMenu views={savedViews} onManageViews={onManageViews} />
            )}
            {allowsFolders(ctx) && !leaf && (
              <Button size="icon" variant="secondary" aria-label="Add folder" title="Add folder"
                onClick={addFolder} className="size-control">
                <FolderPlus size={14} strokeWidth={1.5} aria-hidden />
              </Button>
            )}
            <Button
              ref={removeAllRef}
              variant="danger-outline"
              disabled={!rows.length}
              onClick={() => setConfirmClear(true)}
            >
              <X size={14} strokeWidth={1.5} aria-hidden />
              Remove all
            </Button>
          </div>
        ))}
      </TitleBand>

      {/* One home for the consequence signal, whether or not the host owns the tabs. */}
      <FilterBand>
        <ConsequenceBadge consequence={ctx.consequence} />
      </FilterBand>

      <GridHead>
        <HeadCell className={cx(colWidth.index, "text-end")}><span className="sr-only">Position</span>#</HeadCell>
        <HeadCell className={colWidth.grip} />
        <SortHeader sortKey="name" sort={sort} onSort={(k) => onSort(nextSort(sort, k))} className="flex-1">
          Name
        </SortHeader>
        {ctx.scope && <HeadCell className={colWidth.members}>Members</HeadCell>}
        {ctx.cols.map((c) => (
          <HeadCell key={c.key} className={cx(attributeWidth(c), c.type !== "qty" && "text-center")}>{c.head}</HeadCell>
        ))}
        <HeadCell className={colWidth.action} />
      </GridHead>

      <PaneBody>
        {sort && (
          <div className="sticky top-0 z-10">
            <Notice action={<Button variant="secondary" onClick={() => onSort(null)}>Clear sort</Button>}>
              <strong className="font-semibold">Sorted view.</strong> Stored order is unchanged. Reordering is off until you clear the sort.
            </Notice>
          </div>
        )}

        <p id={hintId} className="sr-only">Use the up and down arrow keys to move this row.</p>
        <p role="status" className="sr-only">{announcement}</p>

        {rows.length ? (
          <ol ref={listRef} aria-label="Assigned members">
            {viewRows.map((row, i) => (
              <AssignedRow
                key={row.id}
                row={row}
                ctx={ctx}
                ordinal={ordinals[i]}
                position={i + 1}
                count={viewRows.length}
                canReorder={canReorder}
                reorderHintId={hintId}
                dragging={dragId === row.id}
                scopeActive={scopeOn === row.id}
                dimmed={Boolean(scopeOn) && scopeOn !== row.id}
                onDragStart={setDragId}
                onDragEnd={onDragEnd}
                onDropOn={onDropOn}
                onMoveBy={onMoveBy}
                onRemove={onRemove}
                onToggleScope={onToggleScope}
                onAttr={setAttr}
              />
            ))}
          </ol>
        ) : (
          <EmptyState
            title="No members assigned"
            description="Select members in Available to add them here. Order is kept as you add them."
          />
        )}
      </PaneBody>
    </Pane>
  );
}
