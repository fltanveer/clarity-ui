import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Lock } from "lucide-react";
import { Button, Popover, Select, Switch, cx } from "../ui";
import { ToolbarView } from "../shell/ToolbarView";
import { ICONS, type IconName } from "./icons";
import { ACTIONS, ACTION_IDS, DEFAULT_TOOLBAR, iconOf, type ActionId, type Display, type ToolbarItem, type Zone } from "./toolbar";

const ZONES: { value: Zone; label: string; title: string }[] = [
  { value: "main", label: "Bar", title: "On the bar" },
  { value: "menu", label: "Actions menu", title: "In the Actions menu" },
  { value: "end", label: "Right side", title: "Right side" },
];
const DISPLAYS: { value: Display; label: string }[] = [
  { value: "both", label: "Icon + label" }, { value: "icon", label: "Icon only" }, { value: "label", label: "Label only" },
];

/* Every action available in the preview; nothing runs. */
const PREVIEW_RUN = Object.fromEntries(ACTION_IDS.map((id) => [id, id === "add" ? { label: "Add Person" } : {}]));

function IconPicker({ value, onChange, locked, label }: { value: IconName; onChange: (v: IconName) => void; locked?: string; label: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const Current = ICONS[value];
  return (
    <>
      <Button ref={ref} icon size="md" disabled={Boolean(locked)} title={locked ?? "Change icon"}
        aria-label={`${label} icon: ${value}${locked ? " (locked)" : ""}`} aria-haspopup="dialog" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}>
        <Current size={15} aria-hidden />
      </Button>
      <Popover anchorRef={ref} open={open} onClose={() => setOpen(false)} role="dialog" label={`Icon for ${label}`} className="w-64 p-2">
        <div role="radiogroup" aria-label={`Icon for ${label}`} className="grid grid-cols-8 gap-1">
          {(Object.keys(ICONS) as IconName[]).map((name) => {
            const Icon = ICONS[name];
            const on = name === value;
            return (
              <button key={name} type="button" role="radio" aria-checked={on} aria-label={name} title={name}
                onClick={() => { onChange(name); setOpen(false); }}
                className={cx("grid size-7 cursor-pointer place-items-center rounded-chip",
                  on ? "bg-mode-solid text-fg-on-accent" : "text-fg-secondary hover:bg-hover hover:text-fg-primary")}>
                <Icon size={14} aria-hidden />
              </button>
            );
          })}
        </div>
      </Popover>
    </>
  );
}

/*
 * Arrange the action bar: per action — position, zone, icon, label, display,
 * visibility. Locked fields say why. The preview on top is the real bar
 * component drawing the draft.
 */
export function ToolbarEditor({ items, onChange }: { items: ToolbarItem[]; onChange: (next: ToolbarItem[]) => void }) {
  const update = (id: ActionId, patch: Partial<ToolbarItem>) => onChange(items.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  /* Move within its zone: swap with the nearest neighbour in the same zone. */
  const move = (id: ActionId, delta: -1 | 1) => {
    const i = items.findIndex((t) => t.id === id);
    let j = i + delta;
    while (j >= 0 && j < items.length && items[j].zone !== items[i].zone) j += delta;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <p className="mt-4 mb-1.5 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">Preview</p>
      <div className="overflow-hidden rounded-panel border border-line-subtle">
        <ToolbarView items={items} run={PREVIEW_RUN} />
      </div>

      {ZONES.map((z) => {
        const inZone = items.filter((t) => t.zone === z.value);
        return (
          <section key={z.value} aria-label={z.title} className="mt-5">
            <h3 className="mb-1 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">{z.title}</h3>
            <ul className="rounded-panel border border-line-subtle bg-surface">
              {inZone.map((t, i) => {
                const def = ACTIONS[t.id];
                return (
                  <li key={t.id} aria-label={def.label} className={cx("flex flex-col gap-2 px-3 py-2.5", i > 0 && "border-t border-line-subtle", t.hidden && "bg-subtle")}>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <button type="button" onClick={() => move(t.id, -1)} disabled={i === 0} aria-label={`Move ${def.label} up`}
                          className="grid h-3.5 w-5 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover disabled:cursor-default disabled:opacity-30">
                          <ArrowUp size={11} aria-hidden />
                        </button>
                        <button type="button" onClick={() => move(t.id, 1)} disabled={i === inZone.length - 1} aria-label={`Move ${def.label} down`}
                          className="grid h-3.5 w-5 cursor-pointer place-items-center rounded-chip text-fg-tertiary hover:bg-hover disabled:cursor-default disabled:opacity-30">
                          <ArrowDown size={11} aria-hidden />
                        </button>
                      </div>
                      <IconPicker value={iconOf(t)} onChange={(icon) => update(t.id, { icon: icon === def.icon ? null : icon })}
                        locked={def.locks?.icon} label={def.label} />
                      <label className="min-w-0 flex-1">
                        <span className="sr-only">{def.label} label</span>
                        <input value={t.label ?? ""} placeholder={def.label} maxLength={32} disabled={Boolean(def.locks?.label)}
                          title={def.locks?.label} onChange={(e) => update(t.id, { label: e.target.value || null })}
                          className="h-control-h w-full rounded-control border border-line-control bg-surface px-2 text-ui text-fg-primary placeholder:text-fg-tertiary hover:border-line-control-hover disabled:cursor-not-allowed disabled:bg-subtle disabled:text-fg-tertiary" />
                      </label>
                      {def.locks?.hidden ? (
                        <span title={def.locks.hidden} className="flex items-center gap-1 text-caption text-fg-tertiary">
                          <Lock size={12} aria-hidden /> Always shown
                        </span>
                      ) : (
                        <Switch label="Show" checked={!t.hidden} onChange={(on) => update(t.id, { hidden: !on })} />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 ps-7">
                      <Select aria-label={`${def.label} position`} value={t.zone} className="h-button! w-auto! text-caption! sm:text-caption!"
                        onChange={(e) => update(t.id, { zone: e.target.value as Zone })}
                        options={ZONES.map((o) => ({ value: o.value, label: o.label }))} />
                      {t.zone !== "menu" && (
                        <Select aria-label={`${def.label} display`} value={t.display} className="h-button! w-auto! text-caption! sm:text-caption!"
                          onChange={(e) => update(t.id, { display: e.target.value as Display })} options={DISPLAYS} />
                      )}
                      <span className="min-w-0 flex-1 truncate text-caption text-fg-tertiary">{def.description}</span>
                    </div>
                  </li>
                );
              })}
              {!inZone.length && <li className="px-3 py-3 text-caption text-fg-tertiary">Nothing here. Move an action here with its position menu.</li>}
            </ul>
          </section>
        );
      })}

      <div className="mt-3 flex justify-end">
        <Button onClick={() => onChange(DEFAULT_TOOLBAR)} disabled={JSON.stringify(items) === JSON.stringify(DEFAULT_TOOLBAR)}>Reset toolbar</Button>
      </div>
    </div>
  );
}
