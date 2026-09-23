import { useRef, useState, type KeyboardEvent } from "react";
import { BarChart3, ChevronDown, Menu, Pencil, ShieldAlert, Trash2, X } from "lucide-react";
import { CLOSED_DOMAINS, TOP_TABS, isAddToken, isPipe, type WorkspaceId } from "../lib/nav";
import type { Mode } from "./types";
import { MenuDivider, MenuItem, Popover } from "./Popover";
import { Pipe } from "./controls";
import { cx } from "../lib/cx";

export interface DomainBarProps {
  workspace: WorkspaceId;
  domain: string | null;
  onDomain: (d: string) => void;
  mode: Mode;
  onMode: (m: Mode) => void;
  l100: boolean;
  onL100: (on: boolean) => void;
  /** L100 only: Edit opens the domain's configuration window. */
  onConfigure: (domain: string) => void;
  /** data_only users: the MODE toggle is absent from the DOM (Spec 110 §7.4). */
  dataOnly?: boolean;
}

/*
 * Row 2 · domain tabs + MODE pill. The 2px bottom rule carries the mode colour.
 * [+ Add · ☰] sit outside the scrollport so complete access survives any
 * scroll position (CLA-611). Ctrl+PgUp / Ctrl+PgDn switch tabs (Excel parity).
 */
export function DomainBar({ workspace, domain, onDomain, mode, onMode, l100, onL100, onConfigure, dataOnly }: DomainBarProps) {
  const raw = TOP_TABS[workspace] ?? [];
  const addToken = raw.find(isAddToken);
  const items = raw.filter((t) => !isAddToken(t));
  const tabs = items.filter((t) => !isPipe(t));
  const canAuthor = mode === "MODEL" || l100;
  const [allOpen, setAllOpen] = useState(false);
  const allRef = useRef<HTMLButtonElement>(null);

  const onKeyDown = (e: KeyboardEvent) => {
    const i = tabs.indexOf(domain ?? "");
    const go = (n: number) => {
      const next = tabs[(n + tabs.length) % tabs.length];
      onDomain(next);
      document.getElementById(`domain-tab-${next}`)?.focus();
    };
    if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
    if (e.key === "Home") { e.preventDefault(); go(0); }
    if (e.key === "End") { e.preventDefault(); go(tabs.length - 1); }
  };

  return (
    <div className="flex h-row-domain shrink-0 items-stretch gap-0.5 border-b-2 border-mode-solid bg-shell ps-[calc(var(--spacing-edge)-var(--spacing-tab-inset))] pe-edge">
      <div className="me-1.5 flex shrink-0 items-center gap-0.5 self-center">
        {addToken && canAuthor && (
          <button type="button" className="h-[1.375rem] cursor-pointer rounded-control px-2 text-caption font-medium whitespace-nowrap text-fg-secondary hover:bg-hover">
            {addToken}
          </button>
        )}
        <button ref={allRef} type="button" aria-label="All domains" aria-haspopup="menu" aria-expanded={allOpen}
          onClick={() => setAllOpen((o) => !o)}
          className="grid size-[1.375rem] cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover">
          <Menu size={14} aria-hidden />
        </button>
        <Pipe className="ms-1.5" />
        <Popover anchorRef={allRef} open={allOpen} onClose={() => setAllOpen(false)} label="All domains" className="min-w-44 py-1">
          {tabs.length ? tabs.map((t) => (
            <MenuItem key={t} checked={t === domain} onSelect={() => { onDomain(t); setAllOpen(false); }}>{t}</MenuItem>
          )) : <p className="px-3 py-1.5 text-caption text-fg-tertiary">No domains defined</p>}
        </Popover>
      </div>

      <div role="tablist" aria-label="Domains" onKeyDown={onKeyDown}
        className="no-scrollbar flex min-w-0 items-stretch overflow-x-auto">
        {tabs.length === 0 ? (
          <span className="self-center ps-tab-inset text-caption text-fg-tertiary">No domains defined for this workspace</span>
        ) : items.map((t, i) => isPipe(t)
          ? <Pipe key={`p${i}`} className="mx-1.5" />
          : <DomainTab key={t} name={t} on={t === domain} onSelect={() => onDomain(t)} canEdit={canAuthor}
              system={CLOSED_DOMAINS.has(t)} onConfigure={() => onConfigure(t)} />)}
      </div>

      <div className="ms-auto flex shrink-0 items-center gap-2.5 ps-3">
        {l100 ? <L100Chip onExit={() => onL100(false)} />
          : dataOnly ? null : <ModePill mode={mode} onMode={onMode} />}
      </div>
    </div>
  );
}

function DomainTab({ name, on, onSelect, canEdit, system, onConfigure }: {
  name: string; on: boolean; onSelect: () => void; canEdit: boolean; system: boolean; onConfigure: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const caretRef = useRef<HTMLButtonElement>(null);
  return (
    <span className="caret-host relative flex items-stretch">
      <button
        id={`domain-tab-${name}`}
        type="button"
        role="tab"
        aria-selected={on}
        tabIndex={on ? 0 : -1}
        onClick={onSelect}
        className={cx(
          "-mb-0.5 cursor-pointer border-b-2 px-tab-inset text-ui whitespace-nowrap",
          on ? "border-mode-solid font-semibold text-fg-primary" : "border-transparent text-fg-tertiary hover:text-fg-primary",
        )}
      >
        {name}
      </button>
      {canEdit && (
        <button ref={caretRef} type="button" aria-label={`${name} options`} aria-haspopup="menu" aria-expanded={menu}
          onClick={() => setMenu((m) => !m)}
          className={cx("-ms-2.5 grid w-4 cursor-pointer place-items-center self-center rounded-chip text-fg-tertiary hover:bg-hover", !on && "caret-reveal")}>
          <ChevronDown size={12} aria-hidden />
        </button>
      )}
      <Popover anchorRef={caretRef} open={menu} onClose={() => setMenu(false)} label={`${name} options`} className="min-w-37 py-1">
        <MenuItem onSelect={() => { setMenu(false); onConfigure(); }}><Pencil size={13} aria-hidden /> Edit</MenuItem>
        <MenuDivider />
        <MenuItem tone="danger" disabled={system} onSelect={() => setMenu(false)}>
          <Trash2 size={13} aria-hidden /> Delete{system && <span className="ms-auto text-caption">closed domain</span>}
        </MenuItem>
      </Popover>
    </span>
  );
}

/* Two-button pill [DATA | MODEL]; the active side takes the mode colour. */
export function ModePill({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  return (
    <div role="group" aria-label="Mode" className="flex gap-0.5 rounded-panel border border-line-subtle bg-shell-alt p-0.5">
      {(["DATA", "MODEL"] as const).map((m) => {
        const on = m === mode;
        return (
          /* Each side previews its own mode colour so the choice reads before it is made. */
          <button key={m} type="button" data-mode={m} aria-pressed={on} onClick={() => onMode(m)}
            className={cx(
              "flex h-[1.625rem] cursor-pointer items-center gap-1.5 rounded-md px-3 text-caption",
              on ? "bg-mode-solid font-semibold text-fg-on-accent shadow-lift" : "text-fg-tertiary hover:text-fg-primary",
            )}>
            {m === "DATA" ? <BarChart3 size={13} aria-hidden /> : <Pencil size={13} aria-hidden />}
            {m}
          </button>
        );
      })}
    </div>
  );
}

function L100Chip({ onExit }: { onExit: () => void }) {
  return (
    <span role="status" className="flex h-control-h shrink-0 items-center gap-2 rounded-panel whitespace-nowrap bg-l100-solid ps-2.5 pe-1 text-caption font-semibold text-fg-on-accent shadow-lift on-bar">
      <ShieldAlert size={13} aria-hidden /> L100 · Structure Administration
      <button type="button" onClick={onExit} aria-label="Exit Structure Administration"
        className="grid size-5 cursor-pointer place-items-center rounded-[3px] hover:bg-on-bar-hover">
        <X size={13} aria-hidden />
      </button>
    </span>
  );
}
