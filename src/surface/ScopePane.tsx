import { useId, useMemo, useState } from "react";
import type { Assignment, MemberRow } from "../lib/assignment";
import { SCOPE_MEMBERS, SCOPE_VIEWS, inScopeView } from "../lib/demo-data";
import { Button } from "../components/Button";
import { Checkbox, SelectAll } from "../components/Checkbox";
import { EmptyState } from "../components/EmptyState";
import { SearchField } from "../components/Field";
import { FilterBand, GridHead, HeadCell, Pane, PaneBody, PaneTitle, TitleBand } from "../components/Grid";
import { SegmentedControl } from "../components/SegmentedControl";
import { ViewBy } from "../components/ViewBy";
import { FILTER_OPTIONS, type AssignmentFilter } from "./CataloguePane";
import { cx } from "../lib/cx";

const SCOPE_STRUCTURES = ["Entity hierarchy"];
const indent = ["", "ps-4", "ps-8"];

export interface ScopePaneProps {
  target: MemberRow;
  assignment: Assignment;
  /** Escape leaves scoping; the chip remains the visible control for it. */
  onExit: () => void;
  className?: string;
}

/** Right-hand tool slot, scoping mode: which members the target row is scoped to. */
export function ScopePane({ target, assignment, onExit, className }: ScopePaneProps) {
  const titleId = useId();
  const [view, setView] = useState<string>(SCOPE_VIEWS[0]);
  const [filter, setFilter] = useState<AssignmentFilter>("all");
  const [query, setQuery] = useState("");

  const scoped = useMemo(() => new Set(target.scoped), [target.scoped]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SCOPE_MEMBERS
      .filter((m) => inScopeView(view, m))
      .filter((m) => m.name.toLowerCase().includes(q))
      .filter((m) => filter === "all" || (filter === "assigned") === scoped.has(m.name));
  }, [view, query, filter, scoped]);

  const shownSelected = shown.filter((m) => scoped.has(m.name)).length;
  const filtersActive = query.trim() !== "" || filter !== "all";

  return (
    <Pane
      aria-labelledby={titleId}
      className={className}
      onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onExit(); } }}
    >
      <TitleBand>
        <div id={titleId}>
          <PaneTitle count={target.scoped.length ? `${target.scoped.length} of ${SCOPE_MEMBERS.length} selected` : "All members"}>
            Available<span className="sr-only"> for {target.name}</span>
          </PaneTitle>
        </div>
        <div className="ms-auto min-w-0">
          <ViewBy
            structures={SCOPE_STRUCTURES}
            structure={SCOPE_STRUCTURES[0]}
            onStructure={() => {}}
            views={SCOPE_VIEWS}
            view={view}
            onView={setView}
            lockedReason="Scope members come from the entity hierarchy."
          />
        </div>
      </TitleBand>

      <FilterBand>
        <SegmentedControl label="Scope filter" options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        <SearchField label={`Search scope members for ${target.name}`} value={query} onChange={setQuery} className="min-w-24" />
      </FilterBand>

      <GridHead>
        <SelectAll
          total={shown.length}
          selected={shownSelected}
          onChange={(all) => assignment.setScope(target.id, shown.map((m) => m.name), all)}
          label={`Scope ${target.name} to all shown members`}
        />
        <HeadCell className="flex-1">Name</HeadCell>
      </GridHead>

      <PaneBody>
        {shown.length ? (
          <ul aria-label={`Scope members for ${target.name}`}>
            {shown.map((m) => {
              const on = scoped.has(m.name);
              return (
                <li key={m.name} className="border-b border-line-subtle">
                  <label className={cx("flex min-h-row cursor-pointer items-center gap-2 px-3 hover:bg-hover",
                    on ? "text-fg-primary" : "text-fg-secondary")}>
                    <span className="flex size-control-sm shrink-0 items-center justify-center">
                      <Checkbox checked={on} onChange={() => assignment.toggleScope(target.id, m.name)} />
                    </span>
                    <span className={cx("min-w-0 flex-1 py-2 wrap-break-word", indent[m.depth])}>{m.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title={query.trim() ? `No members match “${query.trim()}”` : "No members in this view"}
            action={filtersActive && (
              <Button variant="secondary" onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</Button>
            )}
          />
        )}
      </PaneBody>
    </Pane>
  );
}
