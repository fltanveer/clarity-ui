import { useId, useMemo, useState } from "react";
import type { ContextDef } from "../lib/registry";
import type { Assignment } from "../lib/assignment";
import { MASTER, STRUCTURES, inCatalogueView, type MasterMember } from "../lib/demo-data";
import { MEMBER_VIEWS } from "../lib/members";
import { nextSort, sortBy, type SortState } from "../lib/sort";
import { Button } from "../components/Button";
import { Checkbox, SelectAll } from "../components/Checkbox";
import { EmptyState } from "../components/EmptyState";
import { SearchField } from "../components/Field";
import { FilterBand, GridHead, Pane, PaneBody, PaneTitle, SortHeader, TitleBand, colWidth } from "../components/Grid";
import { SegmentedControl } from "../components/SegmentedControl";
import { ViewBy } from "../components/ViewBy";
import { cx } from "../lib/cx";

export type AssignmentFilter = "all" | "assigned" | "unassigned";

export const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "assigned", label: "Assigned" },
  { value: "unassigned", label: "Unassigned" },
] as const;

type SortKey = "name" | "region";

export interface CataloguePaneProps {
  ctx: ContextDef;
  assignment: Assignment;
  /** Omit to hide "Manage views": the host has no view management, or the user may not author. */
  onManageViews?: () => void;
  className?: string;
}

/** Right-hand tool slot, default mode: the member catalogue to include from. */
export function CataloguePane({ ctx, assignment, onManageViews, className }: CataloguePaneProps) {
  const { rows, toggleMember, setMembers } = assignment;
  const titleId = useId();
  const [structure, setStructure] = useState(STRUCTURES[0]);
  /* Same views as the members pane; the id selects a rule over this catalogue. */
  const [view, setView] = useState<string>("master");
  const [filter, setFilter] = useState<AssignmentFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState<SortKey> | null>(null);

  const assigned = useMemo(
    () => new Set(rows.flatMap((r) => (r.kind === "member" ? [r.name] : []))),
    [rows],
  );

  /* §7-6 — one derivation feeds the count, select-all and the body. */
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = MASTER
      .filter((m) => inCatalogueView(view, m))
      .filter((m) => m.name.toLowerCase().includes(q))
      .filter((m) => filter === "all" || (filter === "assigned") === assigned.has(m.name));
    return sortBy<MasterMember, SortKey>(list, sort, (m, k) => m[k]);
  }, [view, query, filter, assigned, sort]);

  const shownAssigned = shown.filter((m) => assigned.has(m.name)).length;
  const filtersActive = query.trim() !== "" || filter !== "all";

  return (
    <Pane aria-labelledby={titleId} className={className}>
      <TitleBand>
        <div id={titleId}><PaneTitle count={`${shown.length} shown`}>Available</PaneTitle></div>
        <div className="ms-auto min-w-0">
          <ViewBy
            structures={STRUCTURES}
            structure={structure}
            onStructure={setStructure}
            views={MEMBER_VIEWS}
            countOf={(v) => MASTER.filter((m) => inCatalogueView(v.id, m)).length}
            view={view}
            onView={setView}
            lockedReason={ctx.cross ? undefined : "This context assigns within one structure."}
            onManageViews={onManageViews}
          />
        </div>
      </TitleBand>

      <FilterBand>
        <SegmentedControl label="Assignment filter" options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        <SearchField label="Search available members" value={query} onChange={setQuery} className="min-w-24" />
      </FilterBand>

      <GridHead>
        <SelectAll
          total={shown.length}
          selected={shownAssigned}
          onChange={(all) => setMembers(shown.map((m) => m.name), all)}
          label="Assign all shown members"
        />
        <SortHeader sortKey="name" sort={sort} onSort={(k) => setSort(nextSort(sort, k))} className="flex-1">
          Name
        </SortHeader>
        <SortHeader sortKey="region" sort={sort} onSort={(k) => setSort(nextSort(sort, k))} className={cx(colWidth.region, "hidden @4xl:flex")}>
          Region
        </SortHeader>
      </GridHead>

      <PaneBody>
        {shown.length ? (
          <ul aria-label="Available members">
            {shown.map((m) => {
              const on = assigned.has(m.name);
              return (
                <li key={m.name} className="border-b border-line-subtle">
                  <label className={cx(
                    "flex min-h-row cursor-pointer items-center gap-2 px-3 hover:bg-hover",
                    on ? "text-fg-primary" : "text-fg-secondary",
                  )}>
                    <span className="flex size-control-sm shrink-0 items-center justify-center">
                      <Checkbox checked={on} onChange={() => toggleMember(m.name)} />
                    </span>
                    <span className="min-w-0 flex-1 py-2 wrap-break-word">{m.name}</span>
                    <span className={cx(colWidth.region, "hidden shrink-0 text-caption text-fg-secondary @4xl:block")}>{m.region}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title={query.trim() ? `No members match “${query.trim()}”` : "No members in this view"}
            description={filtersActive ? "Try another search or show all members." : "Choose another view to see members."}
            action={filtersActive && (
              <Button variant="secondary" onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</Button>
            )}
          />
        )}
      </PaneBody>
    </Pane>
  );
}
