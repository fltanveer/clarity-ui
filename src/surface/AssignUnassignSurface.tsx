import { useId, useRef, useState } from "react";
import { CONTEXT_KEYS, REGISTRY, getContext, type ContextKey } from "../lib/registry";
import { newMember, useAssignment, type Row } from "../lib/assignment";
import { MASTER } from "../lib/demo-data";
import { MEMBER_VIEWS } from "../lib/members";
import type { ViewListItem } from "../components/ViewList";
import type { SortState } from "../lib/sort";
import { EmptyState } from "../components/EmptyState";
import { Tabs } from "../components/Tabs";
import { ToastRegion } from "../components/Toast";
import { AssignedPane } from "./AssignedPane";
import { CataloguePane } from "./CataloguePane";
import { ScopePane } from "./ScopePane";

export interface AssignUnassignSurfaceProps {
  /** Host-controlled context. When omitted the surface shows its own context tabs. */
  ctx?: string;
  /** Host owns the tab row; do not render a second one. */
  hideTabs?: boolean;
  /**
   * Bottom of a recursive structure (CH-018). Inside a view's own facet there is
   * no view menu and no Add folder — both would be category errors there.
   */
  leaf?: boolean;
  savedViews?: readonly ViewListItem[];
  /** View-management seam (CH-016). Passed in, never a module global. */
  onManageViews?: () => void;
  initialRows?: Row[];
}

const TAB_ITEMS = CONTEXT_KEYS.map((k) => ({ key: k, label: REGISTRY[k].label, group: REGISTRY[k].registry }));

export function AssignUnassignSurface({
  ctx: hostCtx, hideTabs, leaf, savedViews = MEMBER_VIEWS, onManageViews,
  initialRows,
}: AssignUnassignSurfaceProps) {
  const panelId = useId();
  const [ownCtx, setOwnCtx] = useState<ContextKey>("STRUCTURES");
  const [scopeOn, setScopeOn] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState<"name"> | null>(null);
  const [seedRows] = useState(() => initialRows ?? [newMember(MASTER[0].name), newMember(MASTER[1].name)]);
  const assignment = useAssignment(seedRows);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const ctxKey = hostCtx ?? ownCtx;
  const ctx = getContext(ctxKey);

  const switchCtx = (k: ContextKey) => {
    setOwnCtx(k);
    /* A sub-task never survives a context switch. */
    setScopeOn(null);
    setSort(null);
  };

  const exitScope = () => {
    const id = scopeOn;
    setScopeOn(null);
    requestAnimationFrame(() =>
      surfaceRef.current?.querySelector<HTMLElement>(`[data-row-id="${id}"] [aria-pressed]`)?.focus());
  };

  const target = assignment.rows.find((r) => r.id === scopeOn && r.kind === "member");
  const { removed } = assignment;

  return (
    <div ref={surfaceRef} className="@container flex h-full min-h-0 min-w-0 flex-1 flex-col bg-canvas text-ui text-fg-primary">
      {!hideTabs && (
        <div className="flex shrink-0 border-b border-line-subtle bg-surface px-3">
          <Tabs label="Assignment context" items={TAB_ITEMS} value={ctxKey as ContextKey} onChange={switchCtx} panelId={panelId} />
        </div>
      )}

      <div
        id={panelId}
        role={hideTabs ? undefined : "tabpanel"}
        /* Always side by side — assignment reads as "what is in" beside "what could be";
           stacking breaks that comparison. Narrow windows collapse the members pane
           first (AppShell); below the grid's minimum the shell scrolls sideways. */
        className="grid min-h-0 min-w-[40rem] flex-1 grid-cols-[minmax(20rem,1fr)_minmax(20rem,1fr)] grid-rows-[auto_auto_auto_minmax(0,1fr)]"
      >
        {!ctx ? (
          <div className="col-span-2">
          <EmptyState
            title="This context is not registered"
            description={`“${ctxKey}” has no entry in the context registry, so its rules are unknown. Register it before assigning.`}
          />
          </div>
        ) : (
          <>
            <AssignedPane
              ctx={ctx}
              assignment={assignment}
              scopeOn={scopeOn}
              onToggleScope={(id) => (scopeOn === id ? exitScope() : setScopeOn(id))}
              sort={sort}
              onSort={setSort}
              leaf={leaf}
              savedViews={savedViews}
              onManageViews={onManageViews}
              className="border-e border-line-strong"
            />
            {target && target.kind === "member" && ctx.scope
              ? <ScopePane key={target.id} target={target} assignment={assignment} onExit={exitScope} />
              : <CataloguePane ctx={ctx} assignment={assignment} />}
          </>
        )}
      </div>

      <ToastRegion
        message={removed && <>Removed <strong className="font-semibold">{removed.row.name}</strong></>}
        action={removed ? { label: "Undo", onClick: assignment.undoRemove } : undefined}
        onDismiss={assignment.dismissUndo}
      />
    </div>
  );
}
