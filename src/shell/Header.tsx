import { Fragment, useRef, useState } from "react";
import { Archive, Check, ChevronDown, Lock, LogOut, Plus, Search, Star, UserCog, X } from "lucide-react";
import { contextSelectors, workspaceLabel, type WorkspaceId } from "../lib/nav";
import { SUBSCRIBERS, USER, initials } from "../lib/session";
import { Popover } from "./Popover";
import { ChromeButton } from "./controls";
import { Drawer } from "./Drawer";
import { cx } from "../lib/cx";

export interface HeaderProps {
  workspace: WorkspaceId;
  domain: string | null;
  structure: string | null;
  memberName: string | null;
  l100: boolean;
}

const TITLES: Partial<Record<WorkspaceId, string>> = { dimensions: "Dimensions & Attributes" };

/* Row 1 · window title over breadcrumb, context selectors, search, session chip. */
export function Header({ workspace, domain, structure, memberName, l100 }: HeaderProps) {
  const path = [workspaceLabel(workspace), domain, structure, memberName].filter(Boolean) as string[];
  const ctx = contextSelectors(workspace, domain);
  return (
    <header className="flex h-row-header shrink-0 items-center gap-4 border-b border-line-subtle bg-shell px-edge">
      <div className="min-w-0">
        <h1 className="text-body leading-tight font-bold tracking-title whitespace-nowrap uppercase">
          {TITLES[workspace] ?? workspaceLabel(workspace)}
        </h1>
        <Breadcrumb path={path} />
      </div>

      {ctx && (
        <div className="flex items-end gap-3">
          {ctx.company && <Selector label="Company" options={["All Companies", "My Company"]} />}
          {ctx.version && <Selector label="Version" options={["Actual", "FY26 Budget", "Forecast 3"]} narrowed />}
        </div>
      )}

      <div className="ms-auto flex min-w-0 items-center gap-2.5">
        <ChromeButton variant="icon" aria-label="Search this window" className="size-8">
          <Search size={15} strokeWidth={1.75} aria-hidden />
        </ChromeButton>
        <SessionChip l100={l100} />
      </div>
    </header>
  );
}

/* Fixed at 4 visible segments; deeper paths collapse in the middle. */
function Breadcrumb({ path }: { path: string[] }) {
  const shown = path.length <= 4 ? path : [path[0], "…", ...path.slice(-2)];
  return (
    <nav aria-label="Breadcrumb">
      <ol className="mt-px flex gap-1.5 text-caption whitespace-nowrap text-fg-tertiary">
        {shown.map((seg, i) => (
          <Fragment key={`${seg}-${i}`}>
            {i > 0 && <li aria-hidden className="text-fg-icon">›</li>}
            <li aria-current={i === shown.length - 1 ? "location" : undefined}
              className={cx(i === shown.length - 1 && path.length > 1 && "italic")}>
              {seg}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

/*
 * Context selectors are the coordinates of every number below them, so they
 * rest borderless (current state, not a form) and frame on hover/focus. A
 * narrowed selector gets a dot and heavier value — two channels, not colour.
 */
function Selector({ label, options, narrowed }: { label: string; options: string[]; narrowed?: boolean }) {
  const [value, setValue] = useState(narrowed ? options[1] : options[0]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const isNarrowed = value !== options[0];
  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-micro tracking-eyebrow text-fg-tertiary uppercase">{label}</span>
      <button
        ref={ref}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        aria-label={`${label}: ${value}${isNarrowed ? ", narrowed" : ""}`}
        className={cx(
          "flex h-control-h cursor-pointer items-center gap-1.5 rounded-control border border-transparent border-b-line-subtle px-2.5 text-ui whitespace-nowrap text-fg-primary",
          "hover:border-line-strong hover:bg-surface focus-visible:border-line-strong focus-visible:bg-surface",
          isNarrowed ? "font-bold" : "font-semibold",
        )}
      >
        {isNarrowed && <span aria-hidden className="size-[5px] shrink-0 rounded-full bg-fg-primary" />}
        {value}
        <ChevronDown size={13} aria-hidden className="text-fg-tertiary" />
      </button>
      <Popover anchorRef={ref} open={open} onClose={() => setOpen(false)} label={label} className="min-w-40 py-1">
        {options.map((o) => (
          <button key={o} type="button" role="menuitemradio" aria-checked={o === value} tabIndex={-1}
            onClick={() => { setValue(o); setOpen(false); ref.current?.focus(); }}
            className={cx("flex w-full cursor-pointer items-center px-3 py-1.5 text-start text-ui hover:bg-hover", o === value && "font-semibold")}>
            {o}
          </button>
        ))}
      </Popover>
    </span>
  );
}

/* B4 · one session chip: who you are and which plan you are in. Opens the account drawer. */
function SessionChip({ l100 }: { l100: boolean }) {
  const [open, setOpen] = useState(false);
  const current = SUBSCRIBERS.flatMap((s) => s.plans.map((p) => ({ s, p }))).find((x) => x.p.current);
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex min-w-0 cursor-pointer items-center gap-2 rounded-control px-1 py-0.5 text-start hover:bg-hover aria-expanded:bg-hover"
      >
        <span aria-hidden className="grid size-[1.625rem] shrink-0 place-items-center rounded-full border border-line-strong bg-mode-soft text-caption font-bold text-mode-ink">
          {USER.initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-caption text-fg-secondary">{USER.name}</span>
          <span className="block truncate text-caption font-semibold">
            {l100 ? "Platform / System" : `${current?.s.name} / ${current?.p.name}`}
          </span>
        </span>
        <ChevronDown size={13} aria-hidden className="shrink-0 text-fg-tertiary" />
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} label="Account and plans">
        <SwitcherPanel onClose={() => setOpen(false)} l100={l100} />
      </Drawer>
    </>
  );
}

/*
 * Account drawer. Reading order follows the questions a person has:
 *   who am I → where am I now → where else can I go → account actions.
 * Colour is reserved for "you are here" (the mode tint on the current plan);
 * everything else is neutral, so the current plan is findable at a glance.
 */
function SwitcherPanel({ onClose, l100 }: { onClose: () => void; l100: boolean }) {
  const [q, setQ] = useState("");
  const [openSub, setOpenSub] = useState<string | null>("mg");
  const [pinned, setPinned] = useState("mc");
  const [archive, setArchive] = useState<string | null>(null);
  const query = q.trim().toLowerCase();
  const plansOf = (s: (typeof SUBSCRIBERS)[number]) =>
    s.name.toLowerCase().includes(query) ? s.plans : s.plans.filter((p) => p.name.toLowerCase().includes(query));
  const shown = SUBSCRIBERS.filter((s) => plansOf(s).length || s.name.toLowerCase().includes(query));
  const current = SUBSCRIBERS.flatMap((s) => s.plans.map((p) => ({ s, p }))).find((x) => x.p.current);

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-line-subtle px-5 py-4">
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-inverse text-body font-semibold text-fg-on-inverse">
          {USER.initials}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-title font-semibold">{USER.name}</h2>
          <p className="truncate text-caption text-fg-tertiary">{USER.email}</p>
        </div>
        <ChromeButton variant="icon" className="size-8" onClick={onClose} aria-label="Close account panel" title="Close (Esc)">
          <X size={17} aria-hidden />
        </ChromeButton>
      </div>

      <div className="shrink-0 px-5 pt-4">
        <p className="mb-1.5 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">You are in</p>
        <div className="flex items-center gap-3 rounded-panel bg-mode-soft px-3 py-2.5">
          <Badge text={initials(l100 ? "Platform System" : current?.p.name ?? "")} square large />
          <div className="min-w-0 flex-1">
            <p className="truncate text-ui font-semibold text-fg-primary">{l100 ? "System" : current?.p.name}</p>
            <p className="truncate text-caption text-fg-secondary">{l100 ? "Platform" : current?.s.name}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-caption font-semibold text-mode-ink">
            <Check size={13} aria-hidden /> Current
          </span>
        </div>
      </div>

      <div className="shrink-0 px-5 pt-4 pb-2">
        <label className="flex h-control-form items-center gap-2 rounded-control border border-line-control bg-surface px-2.5 hover:border-line-control-hover">
          <Search size={14} aria-hidden className="shrink-0 text-fg-tertiary" />
          <span className="sr-only">Search organisations and plans</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search organisations and plans"
            className="min-w-0 flex-1 bg-transparent text-ui outline-none placeholder:text-fg-tertiary" />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="grid size-5 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover">
              <X size={12} aria-hidden />
            </button>
          )}
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <p className="px-2 pt-2 pb-1 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">Organisations</p>
        {shown.map((s) => {
          const expanded = openSub === s.id || query.length > 0;
          const atLimit = s.plans.length >= s.planLimit;
          return (
            <section key={s.id} aria-label={s.name} className="mb-0.5">
              <button type="button" onClick={() => setOpenSub(expanded && !query ? null : s.id)} aria-expanded={expanded}
                className="flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-control px-2 text-start hover:bg-hover">
                <Badge text={initials(s.name)} />
                <span className="min-w-0 flex-1 truncate text-ui font-semibold">{s.name}</span>
                <span className="shrink-0 rounded-full bg-shell px-2 py-px text-caption text-fg-secondary tabular-nums">
                  {s.plans.length} plan{s.plans.length === 1 ? "" : "s"}
                </span>
                <ChevronDown size={14} aria-hidden className={cx("shrink-0 text-fg-tertiary transition-transform ease-standard", !expanded && "-rotate-90")} />
              </button>
              {expanded && (
                <ul className="mb-2 ms-6 flex flex-col gap-0.5">
                  {plansOf(s).map((p) => (
                    <li key={p.id} className={cx("caret-host flex h-10 items-center gap-0.5 rounded-control pe-1", p.current ? "bg-mode-soft" : "hover:bg-hover")}>
                      <button type="button" onClick={onClose} aria-current={p.current ? "true" : undefined}
                        className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2.5 ps-2 text-start">
                        <Badge text={initials(p.name)} square />
                        <span className={cx("min-w-0 flex-1 truncate text-ui", p.current ? "font-semibold text-mode-ink" : "text-fg-primary")}>{p.name}</span>
                        {p.current && <Check size={14} aria-hidden className="shrink-0 text-mode-ink" />}
                      </button>
                      <button type="button" onClick={() => setPinned(p.id)} aria-pressed={pinned === p.id}
                        aria-label={`Pin ${p.name} as default`} title={pinned === p.id ? "Default plan" : "Make default"}
                        className={cx("grid size-7 cursor-pointer place-items-center rounded-chip hover:bg-surface",
                          pinned === p.id ? "text-warning-icon" : "caret-reveal text-fg-icon")}>
                        <Star size={13} aria-hidden fill={pinned === p.id ? "currentColor" : "none"} />
                      </button>
                      {/* Archive, not delete: a plan is a whole modelling universe with history. */}
                      {!p.current && (
                        <button type="button" onClick={() => setArchive(p.name)} aria-label={`Archive ${p.name}`} title="Archive plan"
                          className="caret-reveal grid size-7 cursor-pointer place-items-center rounded-chip text-fg-icon hover:bg-surface">
                          <Archive size={13} aria-hidden />
                        </button>
                      )}
                    </li>
                  ))}
                  <li>
                    {atLimit ? (
                      <p className="flex h-10 items-center gap-2.5 ps-2 pe-2 text-caption text-fg-tertiary">
                        <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-control border border-dashed border-line-strong">
                          <Lock size={11} />
                        </span>
                        <span className="flex-1">Plan limit reached</span>
                        <span className="tabular-nums">{s.plans.length} of {s.planLimit}</span>
                      </p>
                    ) : (
                      <button type="button"
                        className="flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-control ps-2 pe-2 text-start text-ui font-semibold text-mode-ink hover:bg-mode-soft">
                        <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-control border border-dashed border-mode-solid">
                          <Plus size={12} />
                        </span>
                        <span className="flex-1">New plan</span>
                        <span className="text-caption font-normal text-fg-tertiary tabular-nums">{s.plans.length} of {s.planLimit} used</span>
                      </button>
                    )}
                  </li>
                </ul>
              )}
            </section>
          );
        })}
        {!shown.length && <p className="p-4 text-center text-ui text-fg-tertiary">No organisations or plans match “{q}”.</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-line-subtle bg-shell px-5 py-3">
        <ChromeButton className="h-control-h flex-1 text-ui">
          <UserCog size={14} aria-hidden /> Account settings
        </ChromeButton>
        <ChromeButton className="h-control-h flex-1 text-ui hover:border-danger-text hover:text-danger-text">
          <LogOut size={14} aria-hidden /> Sign out
        </ChromeButton>
      </div>

      {archive && (
        <div className="absolute inset-0 grid place-items-center bg-scrim p-5"
          onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setArchive(null); } }}>
          <div role="alertdialog" aria-labelledby="archive-title" className="max-w-80 rounded-panel border border-line-strong bg-surface p-4 shadow-popover">
            <p id="archive-title" className="mb-1.5 text-body font-semibold">Archive {archive}?</p>
            <p className="mb-4 text-ui leading-body text-fg-secondary">
              The plan leaves active navigation and stops using a plan slot. History is kept and it can be restored during the retention window.
            </p>
            <div className="flex justify-end gap-2">
              <ChromeButton onClick={() => setArchive(null)} autoFocus>Cancel</ChromeButton>
              <ChromeButton variant="primary" onClick={() => setArchive(null)}>Archive plan</ChromeButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* Shape encodes level: circle = organisation, rounded square = plan. */
const Badge = ({ text, square, large }: { text: string; square?: boolean; large?: boolean }) => (
  <span aria-hidden className={cx(
    "grid shrink-0 place-items-center border font-bold",
    large ? "size-9 border-transparent bg-surface text-caption text-mode-ink" : "size-7 border-line-subtle bg-shell text-micro text-fg-secondary",
    square ? "rounded-control" : "rounded-full",
  )}>{text}</span>
);
