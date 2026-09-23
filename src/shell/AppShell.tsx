import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MEMBERS, defaultViews, memberById, type MemberView } from "../lib/members";
import { BOTTOM_TABS, CLOSED_DOMAINS, TOP_TABS, WORKSPACE_ICON, firstDomain, firstStructure, isAddToken, isPipe, workspaceLabel, type WorkspaceId } from "../lib/nav";
import { Boxes, Layers } from "lucide-react";
import { Rail } from "./Rail";
import { Header } from "./Header";
import { DomainBar } from "./DomainBar";
import { ActionToolbar, GridModeBar, PovBar, ViewToolbar } from "./Toolbars";
import { LeftPane } from "./LeftPane";
import { MemberGrid } from "./MemberGrid";
import { PropertiesPane } from "./PropertiesPane";
import { StructureBar } from "./StructureBar";
import { CollapsedChromeStrip, Footer, WorkspaceStub } from "./Chrome";
import { MemberConfiguration } from "./MemberConfiguration";
import { ViewManagerDialog } from "./ViewManager";
import { ViewSwitcher } from "./ViewSwitcher";
import { ContainerConfigDialog, type ContainerSubject } from "./ContainerConfiguration";
import { Splitter } from "./Splitter";
import { DEFAULT_COLUMNS, type DisplaySettings, type GridMode, type Mode } from "./types";

/* Below this width the centre would fall under its 600px minimum with the rail open. */
const NARROW = 1360;
/* Below this the members pane folds to its 32px strip, so two-column work
   (assign surfaces, configuration) keeps its side-by-side layout. */
const MEMBERS_NARROW = 1280;

/* Resizable panes: defaults match the shell tokens (left-pane 240, right-pane 280). */
const LEFT = { key: "clarity.membersWidth", def: 240, min: 200, max: 420 };
/* 280 min: the properties tabs (Properties · Notes · Attachments) need it without truncating. */
const RIGHT = { key: "clarity.propertiesWidth", def: 280, min: 280, max: 520 };
/* The grid never goes below the centre minimum (centre-min token), and collapsed panes keep their rails. */
const CENTRE_MIN = 600;
const LEFT_RAIL = 32;
const RIGHT_RAIL = 28;
/* Per-viewer convenience only; storage can be unavailable, so every access is guarded. */
const readWidth = ({ key, def, min, max }: typeof LEFT) => {
  try {
    const v = Number(window.localStorage.getItem(key));
    return v >= min && v <= max ? v : def;
  } catch { return def; }
};

const tabsOf = (list: string[] | undefined) => (list ?? []).filter((t) => !isPipe(t) && !isAddToken(t));

/* Fixture identifiers, so a read-only field shows its shape instead of a blank. */
const FIXTURE_ID = (seed: string) => `7507a820-9573-4d1d-84be-${seed}`;
/* Seeds only: the real plural is a stored field, and irregular ones are edited by hand. */
const singular = (s: string) => s.replace(/ies$/, "y").replace(/s$/, "");
const plural = (s: string) => (/[^aeiou]y$/.test(s) ? `${s.slice(0, -1)}ies` : /(s|x|z|ch|sh)$/.test(s) ? `${s}es` : `${s}s`);

const workspaceSubject = (ws: WorkspaceId): ContainerSubject => ({
  kind: "Workspace", label: workspaceLabel(ws), name: singular(workspaceLabel(ws)), plural: workspaceLabel(ws),
  Icon: WORKSPACE_ICON[ws],
  keyValue: ws, idValue: FIXTURE_ID("5f82df24bb01"), windowTitle: true,
  children: { kind: "Domains in this workspace", items: tabsOf(TOP_TABS[ws]) },
});

const structureSubject = (domain: string, structure: string, members: string[]): ContainerSubject => ({
  kind: "Domain Structure", label: structure, name: singular(structure), plural: structure, Icon: Layers,
  keyValue: structure.toLowerCase().replace(/[^a-z0-9]+/g, "_"), idValue: FIXTURE_ID("5f82df24bb03"),
  parent: { kind: "Domain", name: domain },
  children: { kind: "Records in this structure", items: members },
  roles: { kind: "Domain Structure", note: "One shared contract. Cardinality applies in the child role only." },
  /* Internal taxonomy: visible at L100, read-only, never a Clean UI control (orientation §2). */
  classification: [
    { label: "Structure type", hint: "Navigation taxonomy · not a user-controlled value",
      value: { Parent: "Parent — member instances", Child: "Child — classification values" } },
    { label: "Model class", value: "Dimension", hint: "Controlled vocabulary · declared by the contract" },
    { label: "Model type", value: "company", hint: "Type registry key · shared by every record of this kind" },
    { label: "Is dimensional", value: "Yes", hint: "Participates in dimensional classification" },
    { label: "Canonical field template", value: "None linked", hint: "Optional · picks a field-template package" },
    { label: "Assumption driver structure", value: "No", hint: "Hosts assumption-driver members" },
    { label: "Cardinality", value: "1-to-many — grid in the centre pane",
      hint: "Child role only · 1-to-1 renders a dropdown in Properties", childOnly: true },
  ],
});

const domainSubject = (ws: WorkspaceId, domain: string): ContainerSubject => ({
  kind: "Domain", label: domain, name: domain, plural: plural(domain), Icon: Boxes,
  keyValue: domain.toLowerCase().replace(/[^a-z0-9]+/g, "_"), idValue: FIXTURE_ID("5f82df24bb02"),
  parent: { kind: "Workspace", name: workspaceLabel(ws) },
  children: { kind: "Structures in this domain", items: tabsOf(BOTTOM_TABS[domain]) },
  closed: CLOSED_DOMAINS.has(domain),
});

/*
 * Universal window shell (Spec 110 §5.1, adapted by Prototype 3 A2):
 *   rail │ Row 1 header · Row 2 domain bar
 *        │ Row 4 members │ [3a action · 3b view · POV · grid] │ properties
 *        │ Row 5 structure bar · Row 6 footer
 *
 * Mode colour is chrome only (DEC-2026-08-17-C): data-mode on this root drives
 * every mode-tinted surface beneath it; grid cells never change with mode.
 */
export function AppShell() {
  const [mode, setMode] = useState<Mode>("DATA");
  const [l100, setL100] = useState(false);
  /* Which container L100 opened for configuration: the rail gear, or a domain's Edit. */
  const [config, setConfig] = useState<ContainerSubject | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceId>("dimensions");
  const [domain, setDomain] = useState<string | null>(firstDomain("dimensions"));
  const [structure, setStructure] = useState<string | null>(firstStructure(firstDomain("dimensions")));
  const [railExpanded, setRailExpanded] = useState(() => window.innerWidth >= NARROW);
  const [chromeCollapsed, setChromeCollapsed] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(() => window.innerWidth < MEMBERS_NARROW);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(() => readWidth(LEFT));
  const [rightWidth, setRightWidth] = useState(() => readWidth(RIGHT));
  useEffect(() => { try { window.localStorage.setItem(LEFT.key, String(leftWidth)); } catch { /* storage unavailable */ } }, [leftWidth]);
  useEffect(() => { try { window.localStorage.setItem(RIGHT.key, String(rightWidth)); } catch { /* storage unavailable */ } }, [rightWidth]);
  /* Space the panes share with the grid; 0 until measured (and in environments without layout). */
  const mainRef = useRef<HTMLElement>(null);
  const [mainWidth, setMainWidth] = useState(0);
  useEffect(() => {
    const el = mainRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setMainWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [viewId, setViewId] = useState("master");
  /* Views are per structure; seeded lazily the first time a structure is shown. */
  const [viewsBy, setViewsBy] = useState<Record<string, MemberView[]>>({});
  const [chooserOpen, setChooserOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [member, setMember] = useState<string | null>(null);
  const [peek, setPeek] = useState<string | null>(null);
  const [gridQuery, setGridQuery] = useState("");
  const [display, setDisplay] = useState<DisplaySettings>({ rowNumbers: true, gridlines: true, zebra: false });
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);

  const [gridMode, setGridMode] = useState<GridMode>(null);
  const [bulkSel, setBulkSel] = useState<string[]>([]);
  /* Reorder is STAGED: order can be load-bearing (allocation sequence), so it
     never changes on a stray drag. Cancel discards; Save commits. */
  const [order, setOrder] = useState<string[] | null>(null);
  const [committedOrder, setCommittedOrder] = useState<string[]>(MEMBERS.map((m) => m.id));
  const [deleted, setDeleted] = useState<string[]>([]);

  const canAuthor = mode === "MODEL" || l100;
  const exitGridMode = useCallback(() => { setGridMode(null); setBulkSel([]); setOrder(null); }, []);

  /* Workspace → first domain → first structure; subject changes reset selection. */
  const changeWorkspace = (ws: WorkspaceId) => {
    setWorkspace(ws);
    const d = firstDomain(ws);
    setDomain(d);
    setStructure(firstStructure(d));
    setMember(null);
    setPeek(null);
    setChooserOpen(false);
    exitGridMode();
  };
  const changeDomain = (d: string) => { setDomain(d); setStructure(firstStructure(d)); setPeek(null); setChooserOpen(false); };
  const changeMode = (m: Mode) => { setMode(m); setMember(null); setPeek(null); exitGridMode(); };
  /* Leaving L100 closes what only L100 could open. */
  const changeL100 = (on: boolean) => { setL100(on); if (!on) setConfig(null); };

  /* Portalled surfaces (popovers, the view picker, Manage views, confirms)
     render under <body>, outside this root; mirror the mode onto <html> so
     their mode colour matches the chrome that opened them. */
  const shellMode = l100 ? "L100" : mode;
  useEffect(() => {
    document.documentElement.dataset.mode = shellMode;
    return () => { delete document.documentElement.dataset.mode; };
  }, [shellMode]);

  /* Auto-collapse the rail at the width where the default would be wrong;
     never override a deliberate collapse on a wide screen. */
  useEffect(() => {
    let narrow = window.innerWidth < NARROW;
    let membersNarrow = window.innerWidth < MEMBERS_NARROW;
    const onResize = () => {
      const now = window.innerWidth < NARROW;
      if (now !== narrow) { narrow = now; setRailExpanded(!now); }
      /* Same rule for the members pane: act only when the threshold is crossed. */
      const membersNow = window.innerWidth < MEMBERS_NARROW;
      if (membersNow !== membersNarrow) { membersNarrow = membersNow; setLeftCollapsed(membersNow); }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* Shell shortcuts (Spec 110 §6.1). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); setChromeCollapsed((c) => !c); return; }
      if (e.key === "Escape" && gridMode) { exitGridMode(); return; }
      if ((e.key === "PageUp" || e.key === "PageDown") && (e.ctrlKey || e.altKey)) {
        e.preventDefault();
        const d = e.key === "PageDown" ? 1 : -1;
        if (e.ctrlKey) {
          const tabs = tabsOf(TOP_TABS[workspace]);
          if (!tabs.length) return;
          changeDomain(tabs[(tabs.indexOf(domain ?? "") + d + tabs.length) % tabs.length]);
        } else {
          const tabs = tabsOf(domain ? BOTTOM_TABS[domain] : []);
          if (!tabs.length) return;
          setStructure(tabs[(tabs.indexOf(structure ?? "") + d + tabs.length) % tabs.length]);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  /* A structure change always lands on its Master list. */
  useEffect(() => { setViewId("master"); }, [structure]);
  const views = viewsBy[structure ?? ""] ?? defaultViews(structure);
  const setViews = (next: MemberView[]) => setViewsBy((m) => ({ ...m, [structure ?? ""]: next }));
  const view = views.find((v) => v.id === viewId) ?? views[0];
  const baseRows = useMemo(() => {
    const ids = order ?? committedOrder;
    return ids.filter((id) => view.ids.includes(id) && !deleted.includes(id))
      .map((id) => memberById(id)!)
      .filter((m) => {
        const q = gridQuery.trim().toLowerCase();
        return !q || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q);
      });
  }, [order, committedOrder, view, deleted, gridQuery]);

  const moveRow = (index: number, delta: number) => {
    const ids = baseRows.map((m) => m.id);
    const j = index + delta;
    if (j < 0 || j >= ids.length) return;
    ids.splice(j, 0, ids.splice(index, 1)[0]);
    const rest = (order ?? committedOrder).filter((id) => !ids.includes(id));
    setOrder([...ids, ...rest]);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-grip="${ids[j]}"]`)?.focus());
  };

  const isDimensions = workspace === "dimensions";
  /* MODEL + member selected → member configuration (CH-002), no far-right pane. */
  const memberMode = isDimensions && mode === "MODEL" && member !== null;
  /* MODEL master list has no properties pane: it could only restate the name. */
  const showProperties = isDimensions && !memberMode && !(mode === "MODEL" && member === null);
  const memberName = memberById(peek ?? member)?.name ?? null;
  /* A pane can only grow into space the grid does not need. */
  const rightTaken = showProperties ? (rightOpen ? rightWidth : RIGHT_RAIL) : 0;
  const leftTaken = isDimensions ? (leftCollapsed ? LEFT_RAIL : leftWidth) : 0;
  const leftMax = mainWidth ? Math.max(LEFT.min, Math.min(LEFT.max, mainWidth - CENTRE_MIN - rightTaken)) : LEFT.max;
  const rightMax = mainWidth ? Math.max(RIGHT.min, Math.min(RIGHT.max, mainWidth - CENTRE_MIN - leftTaken)) : RIGHT.max;
  const leftShown = Math.min(leftWidth, leftMax);
  const rightShown = Math.min(rightWidth, rightMax);
  const pathLabel = [workspaceLabel(workspace), domain, structure].filter(Boolean).join(" › ");

  return (
    <div data-mode={l100 ? "L100" : mode} className="flex h-full min-w-0 bg-canvas text-ui text-fg-primary">
      <Rail workspace={workspace} onWorkspace={changeWorkspace} expanded={railExpanded} onExpanded={setRailExpanded}
        onConfigure={(ws) => setConfig(workspaceSubject(ws))}
        l100={l100} onL100={changeL100} chromeCollapsed={chromeCollapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        {chromeCollapsed ? (
          <CollapsedChromeStrip label={l100 ? "L100" : mode} path={pathLabel} onRestore={() => setChromeCollapsed(false)} />
        ) : (
          <>
            <Header workspace={workspace} domain={domain} structure={structure}
              memberName={memberById(member)?.name ?? null} l100={l100} />
            <DomainBar workspace={workspace} domain={domain} onDomain={changeDomain}
              mode={mode} onMode={changeMode} l100={l100} onL100={changeL100}
              onConfigure={(d) => setConfig(domainSubject(workspace, d))} />
          </>
        )}

        {/* Never scrolls sideways: pane widths are clamped to leave the grid CENTRE_MIN, and the grid
            narrows below that only when the window cannot fit the panes' own minimums. */}
        <main ref={mainRef} className="flex min-h-0 flex-1 overflow-hidden bg-canvas">
          {isDimensions && (
            <LeftPane collapsed={leftCollapsed} width={leftShown} onCollapsed={setLeftCollapsed} canAuthor={canAuthor}
              member={member} onMember={(id) => { setMember(id); setPeek(null); }} peek={peek}
              structure={structure} view={view} hidden={deleted}
              chooserOpen={chooserOpen} onChooser={(o) => { setChooserOpen(o); if (o) exitGridMode(); }}
 />
          )}
          {isDimensions && !leftCollapsed && (
            <Splitter label="Resize members pane" side="start" value={leftShown}
              min={LEFT.min} max={leftMax} defaultValue={LEFT.def} onChange={setLeftWidth} />
          )}

          {/* Positioning context for the model + view panel. It docks below the
              44px toolbar row that both the work area (action toolbar) and member
              configuration (its header) start with, so it opens from either. */}
          <div className="relative flex min-h-0 min-w-0 flex-1">
          {memberMode ? (
            <MemberConfiguration key={member} name={memberById(member)!.name} structure={structure}
              locked={Boolean(memberById(member)?.locked)}
              chromeCollapsed={chromeCollapsed} onChromeCollapsed={setChromeCollapsed}
              onExit={() => setMember(null)}
              onManageViews={canAuthor ? () => { setChooserOpen(false); setManageOpen(true); } : undefined}
              onDelete={() => { setDeleted((d) => [...d, member!]); setMember(null); }} />
          ) : (
            <section aria-label="Work area" className="flex min-w-0 flex-1 flex-col overflow-hidden border-s border-line-subtle bg-grid-container">
              {gridMode ? (
                <GridModeBar kind={gridMode} count={bulkSel.length} onCancel={exitGridMode}
                  onSave={() => {
                    if (gridMode === "reorder" && order) setCommittedOrder(order);
                    if (gridMode === "delete") setDeleted((d) => [...d, ...bulkSel]);
                    exitGridMode();
                  }} />
              ) : (
                <ActionToolbar canAuthor={canAuthor} onGridMode={setGridMode}
                  chromeCollapsed={chromeCollapsed} onChromeCollapsed={setChromeCollapsed} />
              )}
              <div className="flex min-h-0 flex-1 flex-col">
                {!chromeCollapsed && (
                  <ViewToolbar query={gridQuery} onQuery={setGridQuery} display={display} onDisplay={setDisplay}
                    columns={columns} onColumns={setColumns} />
                )}
                <PovBar />
                {isDimensions ? (
                  <MemberGrid members={baseRows} columns={columns.visible} display={display}
                    member={member} peek={peek} onPeek={setPeek}
                    gridMode={gridMode} bulkSel={bulkSel} onBulkSel={setBulkSel} onMove={moveRow}
                    /* Configuration is a MODEL surface; in DATA the gear inspects the member in Properties. */
                    configureLabel={mode === "MODEL" ? "Configure" : "Show properties for"}
                    onConfigure={(id) => {
                      if (mode === "MODEL") { setMember(id); setPeek(null); setChooserOpen(false); }
                      else { setPeek(id); setRightOpen(true); }
                    }}
                    emptyMessage={gridQuery ? `No members match “${gridQuery}”.` : undefined} />
                ) : (
                  <WorkspaceStub name={workspaceLabel(workspace)} />
                )}
              </div>
            </section>
          )}
          {isDimensions && (
            <ViewSwitcher open={chooserOpen} onClose={() => setChooserOpen(false)}
              structure={structure} structureTokens={domain ? BOTTOM_TABS[domain] ?? [] : []}
              onStructure={(st) => { setStructure(st); setPeek(null); }}
              views={views} activeId={view.id} onActivate={(id) => { setViewId(id); setPeek(null); }}
              memberIds={MEMBERS.filter((m) => !deleted.includes(m.id)).map((m) => m.id)}
              canManage={canAuthor} onManage={() => { setChooserOpen(false); setManageOpen(true); }} />
          )}
          </div>

          {showProperties && rightOpen && (
            <Splitter label="Resize properties pane" side="end" value={rightShown}
              min={RIGHT.min} max={rightMax} defaultValue={RIGHT.def} onChange={setRightWidth} />
          )}
          {showProperties && (
            <PropertiesPane open={rightOpen} width={rightShown} onOpen={setRightOpen} domain={domain} structure={structure}
              memberName={memberName} memberLocked={Boolean(memberById(peek ?? member)?.locked)} />
          )}
        </main>

        {isDimensions && manageOpen && (
          <ViewManagerDialog key={structure ?? ""} structure={structure}
            structureTokens={domain ? BOTTOM_TABS[domain] ?? [] : []} onStructure={(st) => { setStructure(st); setPeek(null); }}
            members={MEMBERS.filter((m) => !deleted.includes(m.id))}
            views={views} onViews={setViews} activeId={view.id} canAuthor={canAuthor}
            onActivate={(id) => { setViewId(id); setPeek(null); }} onClose={() => setManageOpen(false)} />
        )}

        {config && <ContainerConfigDialog subject={config} onClose={() => setConfig(null)} />}

        <StructureBar workspace={workspace} domain={domain} structure={structure} onStructure={setStructure}
          canAuthor={canAuthor} l100={l100}
          onConfigure={(st) => domain && setConfig(structureSubject(domain, st,
            MEMBERS.filter((m) => !deleted.includes(m.id)).map((m) => m.name)))} />
        <Footer />
      </div>
    </div>
  );
}
