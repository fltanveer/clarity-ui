import { PanelLeftClose, PanelLeftOpen, Settings, Settings2, ShieldAlert } from "lucide-react";
import { WORKSPACES, WORKSPACE_ICON, type WorkspaceId } from "../lib/nav";
import { cx } from "../lib/cx";

export interface RailProps {
  workspace: WorkspaceId;
  onWorkspace: (id: WorkspaceId) => void;
  expanded: boolean;
  onExpanded: (expanded: boolean) => void;
  l100: boolean;
  onL100: (on: boolean) => void;
  /** L100 only: configure the workspace this gear sits on. */
  onConfigure: (id: WorkspaceId) => void;
  chromeCollapsed: boolean;
}

/*
 * Global workspace menu. Dark ground (the reference screenshots; prototype S5
 * "dark"). The active workspace keeps a 3px bar and 600 weight on every
 * ground, so selection never depends on colour.
 *
 * Platform is not a destination: it is the door to Structure Administration
 * (L100). The footer holds commands and a mode, not workspaces, so they stay
 * out of the list.
 */
export function Rail({ workspace, onWorkspace, expanded, onExpanded, l100, onL100, onConfigure, chromeCollapsed }: RailProps) {
  return (
    <nav
      aria-label="Workspaces"
      className={cx(
        /* on-bar: white focus ring — orange fails on the deep mode tint. */
        "on-bar flex shrink-0 flex-col overflow-hidden border-e border-rail-line bg-rail-bg text-rail-fg-secondary",
        "transition-[width] ease-standard",
        expanded ? "w-rail" : "w-rail-icon",
      )}
    >
      <div className={cx(
        "flex shrink-0 items-center gap-2 border-b border-rail-line",
        chromeCollapsed ? "h-[1.375rem]" : "h-row-header",
        expanded ? "ps-edge pe-1.5" : "justify-center",
      )}>
        {expanded && (
          <>
            <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-[0.3125rem] bg-mode-solid text-caption font-bold text-fg-on-accent">C</span>
            {!chromeCollapsed && <span className="text-ui font-semibold whitespace-nowrap text-rail-fg">ClarityOS</span>}
          </>
        )}
        <button
          type="button"
          onClick={() => onExpanded(!expanded)}
          aria-label={expanded ? "Collapse navigation" : "Expand navigation"}
          aria-expanded={expanded}
          className={cx("grid size-6 cursor-pointer place-items-center rounded-chip text-rail-fg-secondary hover:bg-rail-active hover:text-rail-fg", expanded && "ms-auto")}
        >
          {expanded ? <PanelLeftClose size={15} strokeWidth={1.75} aria-hidden /> : <PanelLeftOpen size={15} strokeWidth={1.75} aria-hidden />}
        </button>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto py-1.5">
        {WORKSPACES.map((ws, i) => {
          if (ws.type === "divider") {
            return <li key={`d${i}`} aria-hidden className={cx("my-1.5 h-px bg-rail-line", expanded ? "mx-edge" : "mx-3.5")} />;
          }
          const platform = ws.id === "platform";
          const on = platform ? l100 : ws.id === workspace;
          const Icon = WORKSPACE_ICON[ws.id];
          /* At L100 the workspace itself is configurable. Only the open one carries the
             gear: nine gears would read as nine settings screens. */
          const gear = l100 && expanded && !platform && on;
          return (
            <li key={ws.id} className="group/ws relative">
              <button
                type="button"
                onClick={() => (platform ? onL100(!l100) : onWorkspace(ws.id))}
                aria-current={!platform && on ? "page" : undefined}
                aria-pressed={platform ? l100 : undefined}
                aria-label={expanded ? undefined : ws.label}
                title={platform ? (l100 ? "Leave Structure Administration" : "Enter Structure Administration") : expanded ? undefined : ws.label}
                className={cx(
                  "relative flex h-8 w-full cursor-pointer items-center gap-2.5 text-start text-ui whitespace-nowrap",
                  expanded ? "px-edge" : "justify-center",
                  /* Active: deep mode tint, white text, light 3px bar — in every mode.
                     Platform is active only in L100, where the mode is violet. */
                  on ? "bg-mode-deep font-semibold text-rail-fg" : "text-rail-fg-secondary hover:bg-rail-control hover:text-rail-fg",
                  gear && "pe-9",
                )}
              >
                {on && (
                  <span aria-hidden className="absolute inset-y-1.5 start-0 w-[3px] rounded-e-sm bg-rail-fg" />
                )}
                <Icon size={16} strokeWidth={1.75} aria-hidden className="shrink-0" />
                {expanded && <span className="truncate">{ws.label}</span>}
                {expanded && platform && (
                  <span className="ms-auto rounded-[3px] bg-l100-soft px-1.5 text-micro font-semibold tracking-eyebrow text-l100-ink">L100</span>
                )}
              </button>
              {gear && (
                <button
                  type="button"
                  onClick={() => onConfigure(ws.id)}
                  aria-label={`Configure ${ws.label} workspace`}
                  title={`Configure ${ws.label}`}
                  /* Present at L100 so the door is discoverable; quiet until the row
                     is hovered, so the rail still reads as a list of destinations. */
                  className={cx(
                    "absolute end-1.5 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-chip",
                    "transition-[color,background-color] duration-150 ease-standard hover:bg-rail-active hover:text-rail-fg",
                    "text-rail-fg",
                  )}
                >
                  <Settings2 size={13} strokeWidth={1.75} aria-hidden />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Collapsed rail cannot carry a command field; the footer goes with it. */}
      {expanded && (
        <div className="flex shrink-0 flex-col gap-1.5 border-t border-rail-line px-edge py-2">
          <button
            type="button"
            title="Jump to structure — not built yet"
            className="flex h-7 w-full cursor-pointer items-center gap-2 rounded-control border border-rail-control-edge bg-rail-control px-2 text-start text-caption text-rail-fg-tertiary hover:text-rail-fg"
          >
            <kbd aria-hidden className="rounded-[3px] border border-rail-control-edge px-1 font-sans text-micro font-bold text-rail-fg-quiet">⌘K</kbd>
            Jump to structure
          </button>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onL100(!l100)}
              aria-pressed={l100}
              className={cx(
                "flex h-control-h min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-control border px-2 text-caption font-semibold whitespace-nowrap",
                l100 ? "border-l100-solid bg-l100-solid text-fg-on-accent" : "border-rail-control-edge text-rail-fg-secondary hover:text-rail-fg",
              )}
            >
              <ShieldAlert size={13} strokeWidth={2} aria-hidden className="shrink-0" />
              <span className="truncate">Structure Administration</span>
            </button>
            <button
              type="button"
              aria-label="Structure Administration settings"
              title="Settings — not built yet"
              className="grid size-control-h shrink-0 cursor-pointer place-items-center rounded-chip text-rail-fg-secondary hover:bg-rail-active hover:text-rail-fg"
            >
              <Settings size={14} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <p className="text-center text-micro tracking-eyebrow text-rail-fg-quiet">DEV BUILD ONLY</p>
        </div>
      )}
    </nav>
  );
}
