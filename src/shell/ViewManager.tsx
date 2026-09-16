import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import {
  Archive, Boxes, Check, ChevronDown, CircleAlert, Copy, Filter, Folder, FolderPlus, GripVertical, Info,
  ListChecks, Lock, Pencil, Plus, Search, Server, Settings2, Shield, Sliders, Trash2, Undo2, X,
} from "lucide-react";
import {
  RULE_FIELDS, resolveView, type Member, type MemberView, type RuleField, type ViewRule,
} from "../lib/members";
import { ATTACHMENTS, NOTES } from "../lib/records";
import { AttachmentsList, NotesList } from "../components/RecordLists";
import { AssignUnassignSurface } from "../surface/AssignUnassignSurface";
import { SegmentedControl } from "../components/SegmentedControl";
import { PaneTitle, TitleBand } from "../components/Grid";
import { ConfigIndex, DerivedHint, FieldRow, TextInput, controlClass, type IndexGroup } from "../components/ConfigFields";
import { ChromeButton, Pipe } from "./controls";
import { MenuDivider, MenuItem, Popover } from "./Popover";
import { isAddToken, isPipe } from "../lib/nav";
import { ConfirmDialog } from "./ConfirmDialog";
import { cx } from "../lib/cx";

/*
 * View management (opened from the members pane header).
 *
 *   ┌ header: ‹ STRUCTURE | View name [Active] · Section ……… Duplicate  Apply view  × ┐
 *   │ views tree (folders, drag) │ section index          │ page                      │
 *   │ search  [+folder] [+view]  │ ATTRIBUTES             │                           │
 *   │ ▾ CONSOLIDATION            │   Identity             │                           │
 *   │   ⠿ ⚲ Operating cos     3  │   Data scope           │                           │
 *   │ …                          │   System Details       │                           │
 *   │ ✓ Arrangement saved  Undo  │ [🗑]  [Cancel] [Save]   │                           │
 *
 * A view is a configured object, not a list entry: it has an identity, a data
 * scope (which members it returns), system details, the reports that use it,
 * who may use it, and records. It is configured with the same index + page
 * pattern as a member, so both read as one family.
 *
 * Arrangement (order, folder) saves immediately with one-step Undo; a view's
 * definition is drafted and needs Save. Apply is disabled while a draft is
 * unsaved, so the members pane never shows a definition that does not exist.
 */

type SectionId = "identity" | "scope" | "system" | "report" | "permissions" | "notes" | "attachments";

const INDEX: IndexGroup[] = [
  { group: "Attributes", items: [
    { id: "identity", label: "Identity", Icon: Info },
    { id: "scope", label: "Data scope", Icon: Filter },
    { id: "system", label: "System Details", Icon: Server },
  ] },
  { group: "Relations", items: [
    { id: "report", label: "Report & Metric Views", Icon: Sliders },
    { id: "permissions", label: "Permissions", Icon: Shield },
  ] },
  { group: "Records", items: [
    { id: "notes", label: "Notes", Icon: Pencil },
    { id: "attachments", label: "Attachments", Icon: Archive },
  ] },
];
const LABEL = Object.fromEntries(INDEX.flatMap((g) => g.items).map((i) => [i.id, i.label])) as Record<SectionId, string>;
const IDENTITY_KEYS: (keyof MemberView)[] = ["name", "description", "folder"];
const SCOPE_KEYS: (keyof MemberView)[] = ["on", "kind", "match", "rules", "ids"];
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export interface ViewManagerProps {
  structure: string | null;
  /** Structure-bar tokens for the domain: the models a view can be built for. */
  structureTokens: readonly string[];
  onStructure: (structure: string) => void;
  /** Members that currently exist (deleted ones excluded). */
  members: Member[];
  views: MemberView[];
  onViews: (views: MemberView[]) => void;
  /** The view the members pane is showing. */
  activeId: string;
  onActivate: (id: string) => void;
  canAuthor: boolean;
  onClose: () => void;
}

type Drop = { id: string; where: "before" | "after" } | { folder: string } | { folderTarget: string; where: "before" | "after" };

export function ViewManager({ structure, structureTokens, onStructure, members, views, onViews, activeId, onActivate, canAuthor, onClose }: ViewManagerProps) {
  const [selectedId, setSelectedId] = useState(activeId);
  const selected = views.find((v) => v.id === selectedId) ?? views[0];
  const [draft, setDraft] = useState<MemberView>(selected);
  const [section, setSection] = useState<SectionId>("scope");
  const [confirm, setConfirm] = useState<{ kind: "discard"; run: (base: MemberView[]) => void } | { kind: "delete" } | null>(null);
  /* Views created here (New view, Duplicate) stay drafts until their first Save. */
  const [newIds, setNewIds] = useState<string[]>([]);
  const returnTo = useRef<string | null>(null);

  const dirtyIds = [
    ...(IDENTITY_KEYS.some((k) => !same(draft[k], selected[k])) ? ["identity"] : []),
    ...(SCOPE_KEYS.some((k) => !same(draft[k], selected[k])) ? ["scope"] : []),
  ];
  const isNew = newIds.includes(selected.id);
  const dirty = dirtyIds.length > 0 || isNew;
  const isActive = selected.id === activeId;

  /* Every exit from an unsaved draft asks first. `base` is the view list after any discard. */
  const guard = (run: (base: MemberView[]) => void) => (dirty ? setConfirm({ kind: "discard", run }) : run(views));
  const select = (id: string) => {
    if (id === selected.id) return;
    guard((base) => { setSelectedId(id); setDraft(base.find((v) => v.id === id)!); });
  };
  /* Drop an unsaved new view and return to where the author was. */
  const withoutNew = () => views.filter((v) => v.id !== selected.id);
  const discardNew = () => {
    const rest = withoutNew();
    onViews(rest);
    setNewIds((n) => n.filter((x) => x !== selected.id));
    const back = rest.find((v) => v.id === returnTo.current) ?? rest[0];
    setSelectedId(back.id); setDraft(back);
  };
  const cancel = () => (isNew ? discardNew() : setDraft(selected));

  const save = () => {
    const next = { ...draft, ids: resolveView(draft, members), updated: "Just now" };
    onViews(views.map((v) => (v.id === next.id ? next : v)));
    setDraft(next);
    setNewIds((n) => n.filter((x) => x !== next.id));
  };
  const saveAndApply = () => { save(); onActivate(draft.id); onClose(); };
  const addView = () => guard((base) => {
    const id = `view-${Date.now()}`;
    const v: MemberView = {
      id, name: "Untitled view", on: structure ?? "Structure", folder: null, kind: "rule", match: "all", rules: [],
      ids: members.map((m) => m.id), description: "", owner: "J. Davidson", updated: "Just now", uuid: crypto.randomUUID(),
    };
    returnTo.current = selected.id;
    onViews([...base, v]);
    setNewIds((n) => [...n, id]);
    setSelectedId(id); setDraft(v); setSection("identity");
  });
  const duplicate = () => guard((base) => {
    const id = `view-${Date.now()}`;
    const v: MemberView = { ...selected, id, name: `${selected.name} copy`, system: false, owner: "J. Davidson", updated: "Just now", uuid: crypto.randomUUID() };
    const i = base.findIndex((x) => x.id === selected.id);
    returnTo.current = selected.id;
    onViews([...base.slice(0, i + 1), v, ...base.slice(i + 1)]);
    setNewIds((n) => [...n, id]);
    setSelectedId(id); setDraft(v); setSection("identity");
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || confirm) return;
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select")) return;
    e.preventDefault();
    guard(onClose);
  };

  return (
    <section aria-label="View management" onKeyDown={onKeyDown}
      className="flex min-h-0 min-w-0 flex-1 flex-col border-s border-line-strong">
      {/* Modal chrome: what this is and a way out. Everything about the selected view lives on its own bar. */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line-strong bg-surface ps-4 pe-3">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-control bg-mode-soft text-mode-ink">
          <Settings2 size={16} />
        </span>
        <h2 className="shrink-0 text-heading font-semibold">Manage views</h2>
        <span className="flex min-w-0 items-center gap-1.5 rounded-chip bg-shell px-2 py-0.5 text-ui text-fg-secondary">
          <Boxes size={13} aria-hidden className="shrink-0 text-mode-ink" />
          <span className="truncate">Model / Structure: <span className="font-semibold text-fg-primary">{structure ?? "—"}</span></span>
        </span>
        <span className="min-w-3 flex-1" />
        <ChromeButton variant="icon" className="size-8" onClick={() => guard(onClose)} aria-label="Close view management" title="Close (Esc)">
          <X size={18} aria-hidden />
        </ChromeButton>
      </header>

      <div className="flex min-h-0 flex-1">
        <ViewTree views={views} onViews={onViews} members={members} selectedId={selected.id} onSelect={select}
          activeId={activeId} canAuthor={canAuthor} onAdd={addView}
          structure={structure} structureTokens={structureTokens}
          onStructure={(st) => { if (st !== structure) guard(() => onStructure(st)); }}
          onMoved={(id, folder) => { if (id === draft.id) setDraft((d) => ({ ...d, folder })); }} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/*
            View bar: the selected view and every action on it, ordered by state.
              saved view  → [Duplicate] [Delete] | [Cancel] [Save] [Apply view]
                            Cancel / Save enable once something changes; Apply becomes Save & apply
              new view    → Not saved yet …… [Cancel] [Save] [Save & apply]   (Cancel removes it)
              active view → Save is the primary action; there is nothing to apply
              DATA        → Read-only …… [Apply view]
          */}
          <div className="flex h-row-toolbar shrink-0 items-center gap-2 border-b border-line-strong bg-surface ps-4 pe-3">
            <h3 title={selected.name} className="min-w-0 truncate text-title font-semibold">{selected.name}</h3>
            {isActive && <ActiveBadge />}
            {dirty && (
              <span role="status" className="flex shrink-0 items-center gap-1 text-caption font-semibold text-warning-text">
                <CircleAlert size={12} aria-hidden /> {isNew ? "Not saved yet" : "Unsaved changes"}
              </span>
            )}
            {!canAuthor && (
              <span className="flex shrink-0 items-center gap-1 text-caption text-fg-tertiary">
                <Lock size={11} aria-hidden /> Read-only in DATA mode
              </span>
            )}
            <span className="min-w-3 flex-1" />
            {canAuthor && (
              <>
                {!isNew && (
                  <>
                    <ChromeButton className="h-control-h px-3" disabled={dirty} onClick={duplicate}
                      title={dirty ? "Save or cancel your changes first" : undefined}>
                      <Copy size={13} aria-hidden /> Duplicate
                    </ChromeButton>
                    <ChromeButton variant="danger-ghost" className="h-control-h w-control-h shrink-0 px-0" disabled={selected.system}
                      onClick={() => setConfirm({ kind: "delete" })} aria-label="Delete view"
                      title={selected.system ? "System view — cannot be deleted" : "Delete view"}>
                      <Trash2 size={14} aria-hidden className="size-3.5 shrink-0" />
                    </ChromeButton>
                    <Pipe className="mx-1" />
                  </>
                )}
                <ChromeButton className="h-control-h px-3" disabled={!dirty} onClick={cancel}>Cancel</ChromeButton>
                <ChromeButton variant={isActive ? "primary" : "ghost"} className={cx(!isActive && "h-control-h px-3")}
                  disabled={!dirty} onClick={save}>Save</ChromeButton>
              </>
            )}
            {!isActive && (dirty && canAuthor ? (
              <ChromeButton variant="primary" onClick={saveAndApply} title="Save, then show this view in the members pane">
                <Check size={12} aria-hidden /> Save &amp; apply
              </ChromeButton>
            ) : (
              <ChromeButton variant="primary" title="Show this view in the members pane"
                onClick={() => { onActivate(selected.id); onClose(); }}>
                <Check size={12} aria-hidden /> Apply view
              </ChromeButton>
            ))}
          </div>

          <div className="flex min-h-0 flex-1">
            <div className="flex w-cfg-index shrink-0 flex-col border-e border-line-strong bg-shell-alt">
              <ConfigIndex groups={INDEX} section={section} onSection={(id) => setSection(id as SectionId)}
                label="View sections" controls="view-section" dirty={dirtyIds} />
            </div>
          <div id="view-section" role="region" aria-label={LABEL[section]} className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
            {/* Native disabled cascades to every control on the page: DATA reads, MODEL edits. */}
            {(section === "identity" || section === "scope" || section === "system") && (
              <fieldset disabled={!canAuthor} className="flex min-h-0 min-w-0 flex-1 flex-col">
                {section === "identity" && <IdentityPage draft={draft} onDraft={setDraft} views={views} />}
                {section === "scope" && <ScopePage draft={draft} onDraft={setDraft} members={members} structure={structure} />}
                {section === "system" && <SystemPage view={selected} structure={structure} />}
              </fieldset>
            )}
            {section === "report" && <AssignUnassignSurface key={`${selected.id}-report`} ctx="REPORT_LAYOUT" hideTabs />}
            {section === "permissions" && <AssignUnassignSurface key={`${selected.id}-perm`} ctx="PERMISSIONS" hideTabs />}
            {section === "notes" && <RecordsPage kind="notes" />}
            {section === "attachments" && <RecordsPage kind="attachments" />}
          </div>
          </div>
        </div>
      </div>

      {confirm?.kind === "discard" && (
        <ConfirmDialog title="Discard unsaved changes?" confirmLabel="Discard changes"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const run = confirm.run;
            let base = views;
            if (isNew) { base = withoutNew(); onViews(base); setNewIds((n) => n.filter((x) => x !== selected.id)); }
            else setDraft(selected);
            setConfirm(null);
            run(base);
          }}>
          {isNew ? <>“{draft.name}” has not been saved yet and will be removed.</> : <>Changes to “{draft.name}” have not been saved and will be lost.</>}
        </ConfirmDialog>
      )}
      {confirm?.kind === "delete" && (
        <ConfirmDialog title={`Delete ${selected.name}?`} confirmLabel="Delete view"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const rest = views.filter((v) => v.id !== selected.id);
            onViews(rest);
            if (isActive) onActivate(rest[0].id);
            setSelectedId(rest[0].id); setDraft(rest[0]); setConfirm(null);
          }}>
          Reports and people using this view fall back to {views[0].name}. Members are not affected.
        </ConfirmDialog>
      )}
    </section>
  );
}

const ActiveBadge = () => (
  <span title="Shown in the members pane"
    className="shrink-0 rounded-chip border border-mode-solid bg-surface px-1.5 text-caption leading-4 font-semibold text-mode-ink">
    Active
  </span>
);

/* ── Views tree ───────────────────────────────────────────────────────────── */
function ViewTree({ views, onViews, members, selectedId, onSelect, activeId, canAuthor, onAdd, onMoved, structure, structureTokens, onStructure }: {
  structure: string | null; structureTokens: readonly string[]; onStructure: (s: string) => void;
  views: MemberView[]; onViews: (v: MemberView[]) => void; members: Member[];
  selectedId: string; onSelect: (id: string) => void; activeId: string; canAuthor: boolean;
  onAdd: () => void; onMoved: (id: string, folder: string | null) => void;
}) {
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [emptyFolders, setEmptyFolders] = useState<string[]>([]);
  const [newFolder, setNewFolder] = useState<string | null>(null);
  const folderCancelled = useRef(false);
  const [undo, setUndo] = useState<{ views: MemberView[]; folderOrder: string[] | null } | null>(null);
  /* Explicit folder order once someone arranges folders; otherwise first-appearance order. */
  const [folderOrder, setFolderOrder] = useState<string[] | null>(null);
  const dragId = useRef<string | null>(null);
  const dragKind = useRef<"view" | "folder" | null>(null);
  const [focusFolder, setFocusFolder] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const [focusGrip, setFocusGrip] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const query = q.trim().toLowerCase();
  const memberIds = new Set(members.map((m) => m.id));
  const present = [...new Set([...views.map((v) => v.folder).filter(Boolean) as string[], ...emptyFolders])];
  const folders = folderOrder
    ? [...folderOrder.filter((f) => present.includes(f)), ...present.filter((f) => !folderOrder.includes(f))]
    : present;
  const groups = [
    { folder: null as string | null, items: views.filter((v) => !v.folder) },
    ...folders.map((f) => ({ folder: f as string | null, items: views.filter((v) => v.folder === f) })),
  ].map((g) => ({ ...g, items: g.items.filter((v) => v.name.toLowerCase().includes(query)) }))
    .filter((g) => (query ? g.items.length : g.folder !== null || g.items.length));
  const flat = groups.flatMap((g) => g.items);
  const canDrag = canAuthor && !query;

  useEffect(() => {
    if (!focusGrip) return;
    rootRef.current?.querySelector<HTMLElement>(`[data-grip="${focusGrip}"]`)?.focus();
    setFocusGrip(null);
  }, [views, focusGrip]);
  useEffect(() => {
    if (focusFolder === null) return;
    rootRef.current?.querySelector<HTMLElement>(`[data-folder-grip="${CSS.escape(focusFolder)}"]`)?.focus();
    setFocusFolder(null);
  }, [folderOrder, focusFolder]);

  const commit = (next: MemberView[], item: MemberView, folder: string | null) => {
    setUndo({ views, folderOrder });
    onViews(next);
    onMoved(item.id, folder);
    const peers = next.filter((v) => v.folder === folder);
    setAnnounce(`${item.name} moved to position ${peers.findIndex((v) => v.id === item.id) + 1} of ${peers.length} in ${folder ?? "Unfiled"}`);
  };
  /* Place `id` next to `targetId`, adopting the target's folder. Master list stays first. */
  const move = (id: string, targetId: string, where: "before" | "after") => {
    const item = views.find((v) => v.id === id);
    const target = views.find((v) => v.id === targetId);
    if (!item || !target || item.id === target.id || item.system) return;
    if (target.system) where = "after";
    const rest = views.filter((v) => v.id !== id);
    const moved = { ...item, folder: target.folder };
    rest.splice(rest.indexOf(target) + (where === "after" ? 1 : 0), 0, moved);
    commit(rest, moved, target.folder);
  };
  const moveToFolder = (id: string, folder: string) => {
    const item = views.find((v) => v.id === id);
    if (!item || item.system) return;
    const moved = { ...item, folder };
    const rest = views.filter((v) => v.id !== id);
    const lastInFolder = rest.map((v) => v.folder).lastIndexOf(folder);
    rest.splice(lastInFolder === -1 ? rest.length : lastInFolder + 1, 0, moved);
    setEmptyFolders((f) => f.filter((x) => x !== folder));
    commit(rest, moved, folder);
  };
  /* Move folder `name` before/after `target`. Views are re-sequenced to match, so order persists. */
  const moveFolder = (name: string, target: string, where: "before" | "after") => {
    if (name === target) return;
    const order = folders.filter((f) => f !== name);
    order.splice(order.indexOf(target) + (where === "after" ? 1 : 0), 0, name);
    setUndo({ views, folderOrder });
    setFolderOrder(order);
    onViews([...views.filter((v) => !v.folder), ...order.flatMap((f) => views.filter((v) => v.folder === f))]);
    setAnnounce(`Folder ${name} moved to position ${order.indexOf(name) + 1} of ${order.length}`);
  };
  const onFolderGripKey = (e: KeyboardEvent, name: string) => {
    const d = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!d) return;
    e.preventDefault();
    const i = folders.indexOf(name);
    const other = folders[i + d];
    if (!other) return;
    moveFolder(name, other, d < 0 ? "before" : "after");
    setFocusFolder(name);
  };
  const endDrag = () => { dragId.current = null; dragKind.current = null; setDragging(null); setDrop(null); };

  const onGripKey = (e: KeyboardEvent, v: MemberView) => {
    const i = flat.indexOf(v);
    const d = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!d) return;
    e.preventDefault();
    const other = flat[i + d];
    if (!other || (other.system && other.folder === v.folder)) return;
    /* Crossing a folder boundary lands at the near end of the neighbouring folder. */
    const crossing = other.folder !== v.folder;
    move(v.id, other.id, d < 0 ? (crossing ? "after" : "before") : (crossing ? "before" : "after"));
    setFocusGrip(v.id);
  };

  const commitFolder = () => {
    if (folderCancelled.current) { folderCancelled.current = false; return; }
    const name = (newFolder ?? "").trim();
    if (name && !folders.includes(name)) setEmptyFolders((f) => [...f, name]);
    setNewFolder(null);
  };

  const overRow = (e: DragEvent<HTMLLIElement>, v: MemberView) => {
    if (!dragId.current || dragKind.current !== "view") return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    setDrop({ id: v.id, where: e.clientY < r.top + r.height / 2 ? "before" : "after" });
  };
  const dropNow = () => {
    const id = dragId.current;
    if (id && drop) {
      if ("folderTarget" in drop) { if (dragKind.current === "folder") moveFolder(id, drop.folderTarget, drop.where); }
      else if ("folder" in drop) moveToFolder(id, drop.folder);
      else move(id, drop.id, drop.where);
    }
    endDrag();
  };

  return (
    <div ref={rootRef} className="flex w-72 shrink-0 flex-col border-e border-line-strong bg-shell">
      {/* Locked here: switching model changes which views exist, so it happens in the view panel, not mid-edit. */}
      <ModelPicker structure={structure} tokens={structureTokens} onStructure={onStructure} disabled />
      <div className="flex h-row-toolbar shrink-0 items-center gap-2 border-b border-line-subtle bg-surface px-3">
        <h3 className="text-caption font-semibold tracking-label text-fg-tertiary uppercase">View</h3>
        <span className="ms-auto text-caption text-fg-tertiary tabular-nums">{views.length} {views.length === 1 ? "view" : "views"}</span>
      </div>
      <div className="flex h-12 shrink-0 items-center gap-1.5 border-b border-line-subtle px-2">
        <label className="flex h-control-form min-w-0 flex-1 items-center gap-1.5 rounded-control border border-line-control bg-surface px-2 hover:border-line-control-hover">
          <Search size={13} aria-hidden className="shrink-0 text-fg-tertiary" />
          <span className="sr-only">Search views</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search views"
            className="min-w-0 flex-1 bg-transparent text-ui outline-none placeholder:text-fg-tertiary [&::-webkit-search-cancel-button]:hidden" />
        </label>
        {canAuthor && (
          <>
            <button type="button" onClick={() => setNewFolder("")} aria-label="New folder" title="New folder"
              className="grid size-control-form shrink-0 cursor-pointer place-items-center rounded-control border border-line-strong bg-surface text-fg-secondary hover:bg-hover">
              <FolderPlus size={14} aria-hidden />
            </button>
            <button type="button" onClick={onAdd} aria-label="New view" title="New view"
              className="grid size-control-form shrink-0 cursor-pointer place-items-center rounded-control border border-mode-solid bg-surface text-mode-ink hover:bg-mode-soft">
              <Plus size={15} aria-hidden />
            </button>
          </>
        )}
      </div>

      <span role="status" className="sr-only">{announce}</span>
      <nav aria-label="Views" className="min-h-0 flex-1 overflow-y-auto py-1.5">
        {newFolder !== null && (
          <div className="flex h-9 items-center gap-1.5 px-2">
            <Folder size={13} aria-hidden className="ms-5 shrink-0 text-fg-tertiary" />
            <input autoFocus value={newFolder} aria-label="New folder name" placeholder="Folder name"
              onChange={(e) => setNewFolder(e.target.value)} onBlur={commitFolder}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitFolder(); }
                if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); folderCancelled.current = true; setNewFolder(null); }
              }}
              className={cx(controlClass, "h-control")} />
          </div>
        )}

        {groups.map((g) => {
          const isClosed = g.folder !== null && closed[g.folder] && !query;
          const folderDrop = drop && "folder" in drop && drop.folder === g.folder;
          const folderLine = drop && "folderTarget" in drop && drop.folderTarget === g.folder && dragging !== `folder:${g.folder}` ? drop.where : null;
          const folderIndex = g.folder === null ? -1 : folders.indexOf(g.folder);
          return (
            <div key={g.folder ?? "__unfiled"} role="group" aria-label={g.folder ?? "Unfiled"}
              className={cx("pb-1", dragging === `folder:${g.folder}` && "opacity-40")}>
              {g.folder !== null && (
                <div draggable={canDrag}
                  onDragStart={(e) => {
                    dragId.current = g.folder; dragKind.current = "folder"; setDragging(`folder:${g.folder}`);
                    e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", g.folder!);
                  }}
                  onDragOver={(e) => {
                    if (!dragId.current) return;
                    e.preventDefault();
                    if (dragKind.current === "folder") {
                      const r = e.currentTarget.getBoundingClientRect();
                      setDrop({ folderTarget: g.folder!, where: e.clientY < r.top + r.height / 2 ? "before" : "after" });
                    } else setDrop({ folder: g.folder! });
                  }}
                  onDrop={(e) => { e.preventDefault(); dropNow(); }}
                  onDragEnd={endDrag}
                  className={cx("relative mx-1 flex h-8 items-center rounded-chip", folderDrop && "bg-mode-soft outline-1 -outline-offset-1 outline-mode-solid")}>
                  {folderLine && (
                    <span aria-hidden className={cx("pointer-events-none absolute inset-x-1 z-10 h-0.5 rounded-full bg-mode-solid",
                      folderLine === "before" ? "-top-1" : "-bottom-1")} />
                  )}
                  <span className="flex w-6 shrink-0 justify-center">
                    {canAuthor && (
                      <button type="button" data-folder-grip={g.folder} disabled={Boolean(query)}
                        aria-label={`Reorder folder ${g.folder}, position ${folderIndex + 1} of ${folders.length}`}
                        aria-roledescription="drag handle" title={query ? "Clear the search to reorder" : "Drag to reorder folder"}
                        onKeyDown={(e) => onFolderGripKey(e, g.folder!)}
                        className="grid h-7 w-5 cursor-grab place-items-center rounded-chip text-fg-icon hover:bg-hover hover:text-fg-primary active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40">
                        <GripVertical size={13} aria-hidden />
                      </button>
                    )}
                  </span>
                  <button type="button" aria-expanded={!isClosed}
                    onClick={() => setClosed((c) => ({ ...c, [g.folder!]: !c[g.folder!] }))}
                    className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-chip pe-2 text-start hover:bg-hover">
                    <ChevronDown size={12} aria-hidden className={cx("shrink-0 text-fg-tertiary transition-transform ease-standard", isClosed && "-rotate-90")} />
                    <Folder size={13} aria-hidden className="shrink-0 text-fg-tertiary" />
                    <span className="min-w-0 flex-1 truncate text-caption font-semibold tracking-label text-fg-secondary uppercase">{g.folder}</span>
                    <span className="shrink-0 text-caption text-fg-tertiary tabular-nums">{g.items.length}</span>
                  </button>
                </div>
              )}
              {!isClosed && (
                <ul>
                  {g.items.map((v) => {
                    const on = v.id === selectedId;
                    const KindIcon = v.system ? Lock : v.kind === "rule" ? Filter : ListChecks;
                    const kindLabel = v.system ? "system view" : v.kind === "rule" ? "rule-based" : "static list";
                    const count = v.ids.filter((id) => memberIds.has(id)).length;
                    const rowDrop = drop && "id" in drop && drop.id === v.id && dragging !== v.id ? drop.where : null;
                    return (
                      <li key={v.id} draggable={canDrag && !v.system}
                        onDragStart={(e) => { dragId.current = v.id; dragKind.current = "view"; setDragging(v.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", v.id); }}
                        onDragOver={(e) => overRow(e, v)} onDrop={(e) => { e.preventDefault(); dropNow(); }} onDragEnd={endDrag}
                        className={cx("relative mx-1", dragging === v.id && "opacity-40")}>
                        {rowDrop && (
                          <span aria-hidden className={cx("pointer-events-none absolute inset-x-1 z-10 h-0.5 rounded-full bg-mode-solid",
                            rowDrop === "before" ? "-top-px" : "-bottom-px")} />
                        )}
                        <div className={cx("flex h-9 items-center rounded-chip", on ? "bg-mode-soft" : "hover:bg-hover")}>
                          <span className="flex w-6 shrink-0 justify-center">
                            {canAuthor && !v.system && (
                              <button type="button" data-grip={v.id} disabled={Boolean(query)}
                                aria-label={`Reorder ${v.name}, position ${flat.indexOf(v) + 1} of ${flat.length}`}
                                aria-roledescription="drag handle" title={query ? "Clear the search to reorder" : "Drag to reorder"}
                                onKeyDown={(e) => onGripKey(e, v)}
                                className="grid h-7 w-5 cursor-grab place-items-center rounded-chip text-fg-icon hover:bg-hover hover:text-fg-primary active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40">
                                <GripVertical size={13} aria-hidden />
                              </button>
                            )}
                          </span>
                          {g.folder !== null && <span aria-hidden className="w-4 shrink-0" />}
                          <button type="button" onClick={() => onSelect(v.id)} aria-current={on ? "true" : undefined}
                            className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 pe-2 text-start">
                            <KindIcon size={13} aria-hidden className={cx("shrink-0", on ? "text-mode-ink" : "text-fg-tertiary")} />
                            <span data-name className={cx("min-w-0 flex-1 truncate text-ui", on ? "font-semibold text-mode-ink" : "text-fg-primary")}>{v.name}</span>
                            <span className="sr-only">, {kindLabel}</span>
                            {v.id === activeId && <ActiveBadge />}
                            <span className="w-5 shrink-0 text-end text-caption text-fg-tertiary tabular-nums">
                              {count}<span className="sr-only"> members</span>
                            </span>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {g.folder !== null && !isClosed && !g.items.length && (
                <p className="ms-11 me-3 mb-1 rounded-chip border border-dashed border-line-strong px-2 py-1.5 text-caption text-fg-tertiary">
                  Drag views here
                </p>
              )}
            </div>
          );
        })}
        {query && !flat.length && (
          <p className="px-3 py-3 text-ui text-fg-tertiary">
            No views match “{q}”.{" "}
            <button type="button" onClick={() => setQ("")} className="cursor-pointer font-semibold text-mode-ink underline">Clear search</button>
          </p>
        )}
      </nav>

      <div className="flex h-11 shrink-0 items-center gap-2 border-t border-line-subtle bg-shell px-3 text-caption">
        {undo ? (
          <>
            <Check size={12} aria-hidden className="text-success-text" />
            <span className="text-fg-secondary">Arrangement saved</span>
            <ChromeButton className="ms-auto" onClick={() => {
              onViews(undo.views);
              setFolderOrder(undo.folderOrder);
              const sel = undo.views.find((v) => v.id === selectedId);
              if (sel) onMoved(sel.id, sel.folder);
              setUndo(null);
              setAnnounce("Arrangement restored");
            }}>
              <Undo2 size={12} aria-hidden /> Undo
            </ChromeButton>
          </>
        ) : (
          <span className="text-fg-tertiary">{canAuthor ? "Drag handles to arrange views and folders" : "Views are arranged in MODEL mode"}</span>
        )}
      </div>
    </div>
  );
}

/* Model / Structure = the structure whose views are listed. Pipes in the structure bar become dividers. */
function ModelPicker({ structure, tokens, onStructure, disabled }: {
  structure: string | null; tokens: readonly string[]; onStructure: (s: string) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const items = tokens.filter((t) => !isAddToken(t))
    .filter((t, i, a) => !(isPipe(t) && (i === 0 || i === a.length - 1 || isPipe(a[i - 1]))));
  return (
    <>
    {/* Section headers match the members view panel: 44px white band, caption, hairline. */}
    <div className="flex h-row-toolbar shrink-0 items-center border-b border-line-subtle bg-surface px-3">
      <h3 className="text-caption font-semibold tracking-label text-fg-tertiary uppercase">Model / Structure</h3>
    </div>
    <div className="shrink-0 border-b border-line-subtle px-2 py-2.5">
      <button ref={ref} type="button" aria-haspopup={disabled ? undefined : "menu"} aria-expanded={disabled ? undefined : open}
        disabled={disabled} onClick={() => setOpen((o) => !o)}
        aria-label={`Model / Structure: ${structure ?? "none"}${disabled ? "" : ". Change"}`}
        title={disabled ? "Switch model or structure from the view panel" : undefined}
        className="flex h-control-form w-full cursor-pointer items-center gap-2 rounded-control border border-line-control bg-surface px-2.5 text-start hover:border-line-control-hover aria-expanded:border-mode-solid disabled:cursor-not-allowed disabled:bg-shell-alt disabled:hover:border-line-control">
        <Boxes size={14} aria-hidden className={cx("shrink-0", disabled ? "text-fg-tertiary" : "text-mode-ink")} />
        <span className={cx("min-w-0 flex-1 truncate text-ui font-semibold", disabled ? "text-fg-secondary" : "text-fg-primary")}>{structure ?? "Choose a model"}</span>
        {disabled
          ? <Lock size={12} aria-hidden className="shrink-0 text-fg-tertiary" />
          : <ChevronDown size={14} aria-hidden className={cx("shrink-0 text-fg-tertiary transition-transform ease-standard", open && "rotate-180")} />}
      </button>
      {!disabled && (
        <Popover anchorRef={ref} open={open} onClose={() => setOpen(false)} label="Models" className="w-68 bg-surface py-1">
          {items.map((t, i) => isPipe(t)
            ? <MenuDivider key={`pipe-${i}`} />
            : (
              <MenuItem key={t} checked={t === structure} onSelect={() => { setOpen(false); onStructure(t); }}>
                <span className="flex w-4 shrink-0 justify-center text-mode-ink">{t === structure && <Check size={13} aria-hidden />}</span>
                <span className={cx("min-w-0 flex-1 truncate", t === structure && "font-semibold")}>{t}</span>
              </MenuItem>
            ))}
        </Popover>
      )}
    </div>
    </>
  );
}

/* ── Pages ────────────────────────────────────────────────────────────────── */
type PageProps = { draft: MemberView; onDraft: (v: MemberView) => void };

function IdentityPage({ draft, onDraft, views }: PageProps & { views: MemberView[] }) {
  const folders = [...new Set(views.map((v) => v.folder).filter(Boolean) as string[])];
  return (
    <>
      <TitleBand><PaneTitle>Identity</PaneTitle></TitleBand>
      <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4">
        <div className="max-w-3xl rounded-panel border border-line-subtle bg-surface px-4">
          <FieldRow label="Name" hint={draft.system ? <DerivedHint>System view — the name is fixed</DerivedHint> : undefined}>
            {(id) => <TextInput id={id} value={draft.name} disabled={draft.system} onChange={(name) => onDraft({ ...draft, name })} />}
          </FieldRow>
          <FieldRow label="Description">
            {(id) => <TextInput id={id} area value={draft.description ?? ""} onChange={(description) => onDraft({ ...draft, description })} />}
          </FieldRow>
          <FieldRow label="Folder">
            {(id) => (
              <select id={id} value={draft.folder ?? ""} disabled={draft.system}
                onChange={(e) => onDraft({ ...draft, folder: e.target.value || null })}
                className={cx(controlClass, "h-control-form cursor-pointer")}>
                <option value="">Unfiled</option>
                {folders.map((f) => <option key={f}>{f}</option>)}
              </select>
            )}
          </FieldRow>
          <FieldRow label="Owner">{(id) => <output id={id} className="block pt-1.5 text-ui">{draft.owner ?? "—"}</output>}</FieldRow>
          <FieldRow label="Last modified">{(id) => <output id={id} className="block pt-1.5 text-ui">{draft.updated ?? "—"}</output>}</FieldRow>
        </div>
      </div>
    </>
  );
}

function ScopePage({ draft, onDraft, members, structure }: PageProps & { members: Member[]; structure: string | null }) {
  const result = resolveView(draft, members);
  const included = members.filter((m) => result.includes(m.id)).length;
  const rules = draft.rules ?? [];
  const setRule = (i: number, patch: Partial<ViewRule>) =>
    onDraft({ ...draft, rules: rules.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const locked = Boolean(draft.system);

  return (
    <>
      <TitleBand>
        <PaneTitle count={`Returns ${included} of ${members.length} members`}>Data scope</PaneTitle>
      </TitleBand>
      <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4">
        <div className="flex max-w-3xl flex-col gap-3">
            {locked && (
              <p className="flex items-start gap-2 rounded-panel border border-line-subtle bg-surface px-3 py-2 text-caption leading-body text-fg-secondary">
                <Lock size={12} aria-hidden className="mt-0.5 shrink-0 text-fg-tertiary" />
                The master list always returns every member. Duplicate it to build a narrower view.
              </p>
            )}
            <div className="rounded-panel border border-line-subtle bg-surface px-4">
            <FieldRow label="Built on" hint={<p className="mt-1 text-caption text-fg-tertiary">Which attribute the view reads members through.</p>}>
              {(id) => (
                <select id={id} value={draft.on} disabled={locked} onChange={(e) => onDraft({ ...draft, on: e.target.value })}
                  className={cx(controlClass, "h-control-form cursor-pointer")}>
                  {[...new Set([structure ?? draft.on, "Region", "Status"])].map((o) => <option key={o}>{o}</option>)}
                </select>
              )}
            </FieldRow>
            <div className="flex items-start gap-4 border-b border-line-subtle py-2.5">
              <span className="w-42 shrink-0 pt-1.5 text-ui text-fg-secondary">Membership</span>
              <div className={cx("min-w-0 flex-1", locked && "pointer-events-none opacity-60")}>
                <SegmentedControl label="Membership" value={draft.kind ?? "static"}
                  options={[{ value: "rule", label: "Rule-based" }, { value: "static", label: "Static list" }]}
                  onChange={(kind) => onDraft(kind === "static"
                    ? { ...draft, kind, ids: result }
                    : { ...draft, kind, match: draft.match ?? "all", rules })} />
                <p className="mt-1.5 text-caption leading-body text-fg-tertiary">
                  {draft.kind === "rule"
                    ? "Members that match are included automatically, including members added later."
                    : "Exactly the members picked below. New members are not added."}
                </p>
              </div>
            </div>

            {draft.kind === "rule" ? (
              <div className="flex items-start gap-4 py-2.5">
                <span className="w-42 shrink-0 pt-1.5 text-ui text-fg-secondary">Rules</span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {rules.length > 1 && (
                    <p className="flex flex-wrap items-center gap-1.5 text-ui text-fg-secondary">
                      Include members matching
                      <select aria-label="Match" value={draft.match ?? "all"} disabled={locked}
                        onChange={(e) => onDraft({ ...draft, match: e.target.value as "all" | "any" })}
                        className={cx(controlClass, "h-control w-auto! cursor-pointer")}>
                        <option value="all">all</option>
                        <option value="any">any</option>
                      </select>
                      of these rules
                    </p>
                  )}
                  {rules.map((r, i) => {
                    const def = RULE_FIELDS[r.field];
                    return (
                      <div key={i} className="flex flex-wrap items-center gap-1.5 rounded-panel border border-line-subtle bg-shell p-1.5">
                        <select aria-label={`Rule ${i + 1} field`} value={r.field}
                          onChange={(e) => {
                            const field = e.target.value as RuleField;
                            const d = RULE_FIELDS[field];
                            setRule(i, { field, op: d.ops[0], value: d.values?.[0] ?? "" });
                          }}
                          className={cx(controlClass, "h-control w-36! cursor-pointer")}>
                          {(Object.keys(RULE_FIELDS) as RuleField[]).map((f) => <option key={f} value={f}>{RULE_FIELDS[f].label}</option>)}
                        </select>
                        <select aria-label={`Rule ${i + 1} operator`} value={r.op} onChange={(e) => setRule(i, { op: e.target.value })}
                          className={cx(controlClass, "h-control w-28! cursor-pointer")}>
                          {def.ops.map((o) => <option key={o}>{o}</option>)}
                        </select>
                        {def.values ? (
                          <select aria-label={`Rule ${i + 1} value`} value={r.value} onChange={(e) => setRule(i, { value: e.target.value })}
                            className={cx(controlClass, "h-control w-auto! min-w-28 flex-1 cursor-pointer")}>
                            {def.values.map((o) => <option key={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input aria-label={`Rule ${i + 1} value`} value={r.value} placeholder="Value"
                            onChange={(e) => setRule(i, { value: e.target.value })}
                            className={cx(controlClass, "h-control w-auto! min-w-28 flex-1")} />
                        )}
                        <ChromeButton variant="icon" aria-label={`Remove rule ${i + 1}`} title="Remove rule"
                          onClick={() => onDraft({ ...draft, rules: rules.filter((_, j) => j !== i) })}>
                          <X size={13} aria-hidden />
                        </ChromeButton>
                      </div>
                    );
                  })}
                  {!rules.length && <p className="pt-1.5 text-ui text-fg-tertiary">No rules — every member is included.</p>}
                  {!locked && (
                    <ChromeButton className="self-start"
                      onClick={() => onDraft({ ...draft, rules: [...rules, { field: "type", op: "is", value: "Standard" }] })}>
                      <Plus size={12} aria-hidden /> Add rule
                    </ChromeButton>
                  )}
                </div>
              </div>
            ) : (
              <fieldset className="flex items-start gap-4 py-2.5">
                <legend className="sr-only">Members in this view</legend>
                <span aria-hidden className="w-42 shrink-0 pt-1.5 text-ui text-fg-secondary">Members</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <ChromeButton onClick={() => onDraft({ ...draft, ids: members.map((m) => m.id) })}>Select all</ChromeButton>
                    <ChromeButton onClick={() => onDraft({ ...draft, ids: [] })}>Clear</ChromeButton>
                  </div>
                  <ul className="divide-y divide-line-subtle overflow-hidden rounded-panel border border-line-subtle">
                    {members.map((m) => (
                      <li key={m.id}>
                        <label className="flex h-9 cursor-pointer items-center gap-2.5 px-3 hover:bg-shell">
                          <input type="checkbox" className="size-4 accent-mode-solid" checked={draft.ids.includes(m.id)}
                            onChange={(e) => onDraft({ ...draft, ids: e.target.checked ? [...draft.ids, m.id] : draft.ids.filter((x) => x !== m.id) })} />
                          <span className="min-w-0 flex-1 truncate text-ui">{m.name}</span>
                          <span className="shrink-0 text-caption text-fg-tertiary">{m.code}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </fieldset>
            )}
            </div>
        </div>
      </div>
    </>
  );
}

function SystemPage({ view, structure }: { view: MemberView; structure: string | null }) {
  const Out = ({ id, children }: { id: string; children: string }) => <output id={id} className="block pt-1.5 text-ui break-all">{children}</output>;
  return (
    <>
      <TitleBand><PaneTitle>System Details</PaneTitle></TitleBand>
      <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4">
        <div className="max-w-3xl rounded-panel border border-line-subtle bg-surface px-4">
          <FieldRow label="Type" hint={<DerivedHint>derived · Spec 68 · model_type_key</DerivedHint>}>{(id) => <Out id={id}>composition.view</Out>}</FieldRow>
          <FieldRow label="Context" hint={<DerivedHint>derived · context_key governs which constraints apply</DerivedHint>}>{(id) => <Out id={id}>NAV_ORGANIZE — Navigation</Out>}</FieldRow>
          <FieldRow label="Target dimension" hint={<DerivedHint>derived · target_dimension_id</DerivedHint>}>{(id) => <Out id={id}>{structure ?? view.on}</Out>}</FieldRow>
          <FieldRow label="System-defined">
            {(id) => (
              <label className="flex h-control-form items-center gap-2 text-ui text-fg-secondary">
                <input id={id} type="checkbox" checked={Boolean(view.system)} disabled className="size-4 accent-mode-solid" />
                {view.system ? "Yes" : "No"}
              </label>
            )}
          </FieldRow>
          <FieldRow label="View ID" hint={<DerivedHint>derived · UUID is the authoritative identity; the name is mutable</DerivedHint>}>
            {(id) => <Out id={id}>{view.uuid ?? view.id}</Out>}
          </FieldRow>
        </div>
      </div>
    </>
  );
}

function RecordsPage({ kind }: { kind: "notes" | "attachments" }) {
  return (
    <>
      <TitleBand>
        <PaneTitle count={kind === "notes" ? `${NOTES.length} notes` : `${ATTACHMENTS.length} files`}>
          {kind === "notes" ? "Notes" : "Attachments"}
        </PaneTitle>
      </TitleBand>
      <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4">
        {kind === "notes" ? <NotesList /> : <AttachmentsList />}
      </div>
    </>
  );
}

/*
 * Manage views as a modal over the shell. The background is inert while it is
 * open; closing returns focus to whatever opened it.
 */
export function ViewManagerDialog(props: ViewManagerProps) {
  useEffect(() => {
    const root = document.getElementById("root");
    const opener = document.activeElement as HTMLElement | null;
    root?.setAttribute("inert", "");
    return () => { root?.removeAttribute("inert"); opener?.focus(); };
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-40 grid place-items-center overscroll-contain bg-scrim p-4 sm:p-8">
      <div role="dialog" aria-modal="true" aria-label="Manage views"
        className="flex h-full max-h-[56rem] w-full max-w-[96rem] overflow-hidden rounded-panel border border-line-strong bg-surface shadow-popover">
        <ViewManager {...props} />
      </div>
    </div>,
    document.body,
  );
}
