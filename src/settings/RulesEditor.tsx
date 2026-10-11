import { ChevronRight, Plus, X } from "lucide-react";
import { Button, Select } from "../ui";
import { ACTIONS, labelOf, type ToolbarItem } from "./toolbar";
import { ALWAYS, BEHAVIOURS, FACTS, FACT_IDS, describe, type BehaviourId, type Behaviours, type Clause, type FactId, type Rule } from "./rules";

const small = "h-button! w-auto! text-caption! sm:text-caption!";
const enc = (v: string | boolean) => String(v);
const dec = (fact: FactId, raw: string) => FACTS[fact].values.find((v) => String(v) === raw) ?? FACTS[fact].values[0];
const show = (v: string | boolean) => (v === true ? "Yes" : v === false ? "No" : v);

/** One rule: match all / any / never, then a flat list of "fact is value" clauses. */
export function RuleEditor({ value, onChange, name }: { value: Rule; onChange: (next: Rule) => void; name: string }) {
  const setClause = (i: number, patch: Partial<Clause>) =>
    onChange({ ...value, clauses: value.clauses.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-caption text-fg-secondary">Show</span>
        <Select aria-label={`${name}: match`} className={small} value={value.match}
          onChange={(e) => onChange({ ...value, match: e.target.value as Rule["match"] })}
          options={[{ value: "all", label: value.clauses.length ? "when all of these" : "always" },
            { value: "any", label: "when any of these" }, { value: "never", label: "never" }]} />
      </div>
      {value.match !== "never" && (
        <>
          {value.clauses.map((c, i) => (
            <div key={i} className="flex flex-wrap items-center gap-1.5 ps-3">
              <Select aria-label={`${name}: condition ${i + 1} fact`} className={small} value={c.fact}
                onChange={(e) => { const fact = e.target.value as FactId; setClause(i, { fact, value: FACTS[fact].values[0] }); }}
                options={FACT_IDS.map((f) => ({ value: f, label: FACTS[f].label }))} />
              <Select aria-label={`${name}: condition ${i + 1} test`} className={small} value={c.op}
                onChange={(e) => setClause(i, { op: e.target.value as Clause["op"] })}
                options={[{ value: "is", label: "is" }, { value: "isNot", label: "is not" }]} />
              <Select aria-label={`${name}: condition ${i + 1} value`} className={small} value={enc(c.value)}
                onChange={(e) => setClause(i, { value: dec(c.fact, e.target.value) })}
                options={FACTS[c.fact].values.map((v) => ({ value: enc(v), label: show(v) }))} />
              <Button variant="ghost" icon aria-label={`Remove condition ${i + 1}`}
                onClick={() => onChange({ ...value, clauses: value.clauses.filter((_, j) => j !== i) })}>
                <X size={13} aria-hidden />
              </Button>
            </div>
          ))}
          {value.clauses.length < 8 && (
            <div className="ps-3">
              <Button variant="ghost" onClick={() => onChange({ ...value, clauses: [...value.clauses, { fact: "mode", op: "is", value: "DATA" }] })}>
                <Plus size={13} aria-hidden /> Add condition
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RuleCard({ title, description, rule, onChange, onReset, resetDisabled }: {
  title: string; description?: string; rule: Rule; onChange: (r: Rule) => void; onReset: () => void; resetDisabled: boolean;
}) {
  return (
    <details className="group rounded-panel border border-line-subtle bg-surface [&[open]]:bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 hover:bg-hover [&::-webkit-details-marker]:hidden">
        <ChevronRight size={14} aria-hidden className="shrink-0 text-fg-tertiary transition-transform ease-standard group-open:rotate-90" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-ui font-medium text-fg-primary">{title}</span>
          <span className="block truncate text-caption text-fg-tertiary">Shows: {describe(rule)}</span>
        </span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-line-subtle px-3 py-3">
        {description && <p className="text-caption text-fg-tertiary">{description}</p>}
        <RuleEditor name={title} value={rule} onChange={onChange} />
        <div className="flex justify-end">
          <Button onClick={onReset} disabled={resetDisabled}>Reset</Button>
        </div>
      </div>
    </details>
  );
}

const same = (a: Rule, b: Rule) => JSON.stringify(a) === JSON.stringify(b);

/*
 * Rules tab: built-in behaviours the company may tune, then a "show when"
 * rule per toolbar action. Each card reads as a sentence when closed.
 */
export function RulesEditor({ behaviours, onBehaviours, toolbar, onToolbar }: {
  behaviours: Behaviours; onBehaviours: (b: Behaviours) => void;
  toolbar: ToolbarItem[]; onToolbar: (t: ToolbarItem[]) => void;
}) {
  return (
    <div>
      <p className="mt-4 mb-1.5 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">Behaviour</p>
      <div className="flex flex-col gap-2">
        {(Object.keys(BEHAVIOURS) as BehaviourId[]).map((id) => (
          <RuleCard key={id} title={BEHAVIOURS[id].label} description={BEHAVIOURS[id].description} rule={behaviours[id]}
            onChange={(r) => onBehaviours({ ...behaviours, [id]: r })}
            onReset={() => onBehaviours({ ...behaviours, [id]: BEHAVIOURS[id].default })}
            resetDisabled={same(behaviours[id], BEHAVIOURS[id].default)} />
        ))}
      </div>

      <p className="mt-5 mb-1.5 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">Toolbar actions</p>
      <div className="flex flex-col gap-2">
        {toolbar.filter((t) => !ACTIONS[t.id].locks?.hidden).map((t) => (
          <RuleCard key={t.id} title={labelOf(t)} rule={t.when}
            onChange={(when) => onToolbar(toolbar.map((x) => (x.id === t.id ? { ...x, when } : x)))}
            onReset={() => onToolbar(toolbar.map((x) => (x.id === t.id ? { ...x, when: ALWAYS } : x)))}
            resetDisabled={same(t.when, ALWAYS)} />
        ))}
      </div>
      <p className="mt-3 text-caption text-fg-tertiary">Rules can only ask about the facts listed; they never hide Collapse header.</p>
    </div>
  );
}
