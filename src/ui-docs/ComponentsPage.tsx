import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Badge, Input, Segmented, cx } from "../ui";
import { CodeBlock, CopyButton, InlineCopy } from "./CodeBlock";
import { ENTRIES, type Entry } from "./entries";

type Mode = "DATA" | "MODEL" | "L100";
const GROUPS = ["Actions", "Inputs", "Navigation", "Display", "Data", "Overlays"] as const;

/* ── reference content ────────────────────────────────────────────────────── */

const FILES = ["index.ts", "cx.ts", "Button.tsx", "Field.tsx", "Toggles.tsx", "Tabs.tsx", "Feedback.tsx",
  "SectionHeader.tsx", "DataTable.tsx", "Splitter.tsx", "Popover.tsx", "Dialog.tsx"];

const SETUP_INSTALL = `npm i react react-dom lucide-react @fontsource-variable/inter
npm i -D tailwindcss @tailwindcss/vite`;

const SETUP_ROOT = `// main.tsx — once
import "./styles/theme.css";

// The mode colour of every component follows the nearest data-mode.
<div data-mode="DATA">   {/* "DATA" | "MODEL" | "L100" */}
  <App />
</div>`;

const SETUP_USE = `import { Button, Field, Input, DataTable, SectionHeader } from "../ui";`;

const TOKENS: { group: string; items: { cls: string; note: string; swatch?: string; size?: string }[] }[] = [
  { group: "Surfaces", items: [
    { cls: "bg-canvas", note: "App background", swatch: "var(--color-canvas)" },
    { cls: "bg-surface", note: "Panes, grids, cards", swatch: "var(--color-surface)" },
    { cls: "bg-shell", note: "Popovers, footers, code", swatch: "var(--color-shell)" },
    { cls: "bg-hover", note: "Hover fill", swatch: "var(--color-hover)" },
    { cls: "bg-mode-soft", note: "Selected row, section band", swatch: "var(--color-mode-soft)" },
    { cls: "bg-mode-solid", note: "Primary action, mode bar", swatch: "var(--color-mode-solid)" },
  ] },
  { group: "Text", items: [
    { cls: "text-fg-primary", note: "Body, values", swatch: "var(--color-fg-primary)" },
    { cls: "text-fg-secondary", note: "Labels, headers", swatch: "var(--color-fg-secondary)" },
    { cls: "text-fg-tertiary", note: "Hints, placeholders", swatch: "var(--color-fg-tertiary)" },
    { cls: "text-mode-ink", note: "Mode-coloured text", swatch: "var(--color-mode-ink)" },
    { cls: "text-danger-text", note: "Errors", swatch: "var(--color-danger-text)" },
  ] },
  { group: "Lines", items: [
    { cls: "border-line-subtle", note: "Dividers", swatch: "var(--color-line-subtle)" },
    { cls: "border-line-strong", note: "Control edges", swatch: "var(--color-line-strong)" },
    { cls: "border-grid-line", note: "Grid rows", swatch: "var(--color-grid-line)" },
  ] },
  { group: "Type", items: [
    { cls: "text-micro", note: "9px · uppercase eyebrows only", size: "9px" },
    { cls: "text-caption", note: "12px · labels, buttons, hints", size: "12px" },
    { cls: "text-ui", note: "13px · grid cells, inputs", size: "13px" },
    { cls: "text-body", note: "14px · dialogs", size: "14px" },
    { cls: "text-title", note: "15px · record name", size: "15px" },
  ] },
  { group: "Heights", items: [
    { cls: "h-button", note: "26px · sm button, segmented" },
    { cls: "h-control-h", note: "30px · md button" },
    { cls: "h-control-form", note: "32px · inputs" },
    { cls: "h-grid-head", note: "26px · grid header" },
    { cls: "h-grid-row", note: "30px · grid row" },
    { cls: "h-row-toolbar", note: "44px · toolbars, pane headers" },
  ] },
  { group: "Radius", items: [
    { cls: "rounded-chip", note: "4px · badges, icon buttons" },
    { cls: "rounded-control", note: "5px · buttons, inputs" },
    { cls: "rounded-panel", note: "8px · popovers, dialogs, cards" },
  ] },
];

const RULES = [
  ["One of each.", "One Button, one Field, one DataTable. Need a new look? Add a variant here — never a copy in a feature folder."],
  ["Tokens only.", "Tailwind's default palette and type scale are removed. If a class like bg-blue-500 or text-sm works, something is wrong."],
  ["Mode colour is chrome.", "bg-mode-* marks actions and selection. Grid values never change colour with the mode."],
  ["Numbers align end.", "Use align: \"end\" (tabular figures) for every numeric column and input."],
  ["Every control has a name.", "Icon-only buttons take aria-label; every input sits in a Field."],
  ["Never blank.", "Any list, grid or pane that can be empty renders an EmptyState."],
] as const;

/* ── layout pieces ────────────────────────────────────────────────────────── */

function Block({ id, title, kicker, children }: { id: string; title: string; kicker?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20 border-t border-line-subtle py-10 first:border-t-0 first:pt-2">
      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id={`${id}-h`} className="text-heading font-semibold tracking-heading">{title}</h2>
        {kicker}
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">{children}</h3>;
}

function PropsTable({ component, rows }: Entry["props"][number]) {
  return (
    <div className="overflow-x-auto rounded-panel border border-line-subtle bg-surface">
      <table className="w-full min-w-[40rem] border-collapse text-ui">
        <caption className="border-b border-line-subtle bg-grid-header px-3 py-1.5 text-start font-mono text-caption font-semibold text-fg-secondary">{component}</caption>
        <thead>
          <tr className="h-grid-head border-b border-grid-line-col text-caption text-fg-tertiary">
            <th scope="col" className="w-44 px-3 text-start font-medium">Prop</th>
            <th scope="col" className="w-64 px-3 text-start font-medium">Type</th>
            <th scope="col" className="w-24 px-3 text-start font-medium">Default</th>
            <th scope="col" className="px-3 text-start font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-grid-line align-top last:border-b-0">
              <th scope="row" className="px-3 py-2 text-start font-mono text-caption font-semibold text-fg-primary">{r.name}</th>
              <td className="px-3 py-2 font-mono text-caption break-words text-mode-ink">{r.type}</td>
              <td className="px-3 py-2 font-mono text-caption text-fg-secondary">{r.def ?? "—"}</td>
              <td className="px-3 py-2 text-caption text-fg-secondary">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComponentBlock({ e }: { e: Entry }) {
  const importLine = `import { ${e.exports.filter((x) => x !== "Column").join(", ")}${e.exports.includes("Column") ? ", type Column" : ""} } from "../ui";`;
  return (
    <Block id={e.id} title={e.name} kicker={<Badge tone="mode">{e.group}</Badge>}>
      <p className="mb-4 max-w-prose text-body text-pretty text-fg-secondary">{e.summary}</p>
      <div className="mb-6"><InlineCopy text={importLine} /></div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-panel border border-line-subtle bg-surface p-3">
          <Label>Use for</Label>
          <ul className="flex list-disc flex-col gap-1 ps-4 text-caption text-fg-secondary">{e.use.map((u) => <li key={u}>{u}</li>)}</ul>
        </div>
        <div className="rounded-panel border border-line-subtle bg-surface p-3">
          <Label>Avoid</Label>
          <ul className="flex list-disc flex-col gap-1 ps-4 text-caption text-fg-secondary">{e.avoid.map((u) => <li key={u}>{u}</li>)}</ul>
        </div>
      </div>

      <Label>Preview</Label>
      <div className={cx("mb-6 overflow-hidden rounded-panel border border-line-subtle bg-surface", !e.flush && "p-5")}>
        <e.Demo />
      </div>

      <Label>Code</Label>
      <div className="mb-6"><CodeBlock code={e.code} title={`${e.id}.tsx`} /></div>

      <Label>Props</Label>
      <div className="mb-6 flex flex-col gap-3">{e.props.map((p) => <PropsTable key={p.component} {...p} />)}</div>

      <Label>Accessibility</Label>
      <ul className="flex max-w-prose list-disc flex-col gap-1 ps-4 text-caption text-fg-secondary">{e.a11y.map((a) => <li key={a}>{a}</li>)}</ul>
    </Block>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

const INTRO_LINKS = [{ id: "setup", name: "Setup" }, { id: "rules", name: "Rules" }, { id: "tokens", name: "Tokens" }];

/**
 * Component reference at #components. Every preview renders the real library
 * from src/ui, so what you copy is what you see. The mode switch sets
 * data-mode, which recolours all mode chrome on the page.
 */
export function ComponentsPage() {
  const [mode, setMode] = useState<Mode>("DATA");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("setup");

  /* Portalled overlays (Popover, Dialog) render under <body>; mirror the mode there. */
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    return () => { delete document.documentElement.dataset.mode; };
  }, [mode]);

  /* Deep links: #components/<id> opens at that section. */
  useEffect(() => {
    const id = location.hash.split("/")[1];
    if (id) requestAnimationFrame(() => { document.getElementById(id)?.scrollIntoView({ block: "start" }); setActive(id); });
  }, []);

  /* Highlight the section being read. */
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((list) => {
      const seen = list.filter((x) => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (seen) setActive(seen.target.id);
    }, { rootMargin: "-72px 0px -65% 0px" });
    document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const q = query.trim().toLowerCase();
  const shown = useMemo(() => ENTRIES.filter((e) => !q || `${e.name} ${e.summary} ${e.exports.join(" ")}`.toLowerCase().includes(q)), [q]);

  const navLink = (id: string, name: string) => (
    <a key={id} href={`#components/${id}`}
      onClick={(ev) => {
        ev.preventDefault();
        history.replaceState(null, "", `#components/${id}`);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        setActive(id);
      }}
      aria-current={active === id ? "true" : undefined}
      className={cx("block truncate rounded-control px-2 py-1 text-ui",
        active === id ? "bg-mode-soft font-semibold text-mode-ink" : "text-fg-secondary hover:bg-hover hover:text-fg-primary")}>
      {name}
    </a>
  );

  return (
    <div data-mode={mode} className="min-h-full bg-canvas text-ui text-fg-primary">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line-subtle bg-surface/95 px-4 backdrop-blur sm:px-6">
        <a href="#" className="inline-flex h-button items-center gap-1.5 rounded-control px-2 text-caption text-fg-secondary hover:bg-hover hover:text-fg-primary">
          <ArrowLeft size={13} aria-hidden /><span className="hidden sm:inline">App</span>
        </a>
        <h1 className="truncate text-title font-semibold">ClarityOS Components</h1>
        <span className="hidden sm:block"><Badge>v{__APP_VERSION__}</Badge></span>
        <div className="ms-auto flex items-center gap-2">
          <span className="hidden text-caption text-fg-tertiary md:inline">Mode</span>
          <Segmented label="Preview mode" value={mode} onChange={setMode}
            options={[{ value: "DATA", label: "DATA" }, { value: "MODEL", label: "MODEL" }, { value: "L100", label: "L100" }]} />
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 sm:px-6">
        <nav aria-label="Components" className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 flex-col gap-4 overflow-y-auto py-6 lg:flex">
          <Input type="search" aria-label="Filter components" placeholder="Filter components" leading={<Search size={14} />}
            value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="flex flex-col gap-0.5">
            <p className="px-2 pb-1 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">Start</p>
            {INTRO_LINKS.map((l) => navLink(l.id, l.name))}
          </div>
          {GROUPS.map((g) => {
            const items = shown.filter((e) => e.group === g);
            if (!items.length) return null;
            return (
              <div key={g} className="flex flex-col gap-0.5">
                <p className="px-2 pb-1 text-micro font-semibold tracking-eyebrow text-fg-tertiary uppercase">{g}</p>
                {items.map((e) => navLink(e.id, e.name))}
              </div>
            );
          })}
          {!shown.length && <p className="px-2 text-caption text-fg-tertiary">No component matches “{query}”.</p>}
        </nav>

        <main className="min-w-0 flex-1 py-8">
          <div className="mb-10 max-w-prose">
            <p className="mb-2 text-micro font-semibold tracking-eyebrow text-mode-ink uppercase">src/ui · {ENTRIES.length} entries · {FILES.length} files</p>
            <p className="text-display font-semibold tracking-heading text-balance">The smallest set of parts that builds every ClarityOS screen.</p>
            <p className="mt-3 text-body text-pretty text-fg-secondary">
              Each component below is live. Switch the mode to see chrome recolour, copy the code, and check the props table before you reach for anything new.
            </p>
          </div>

          <Block id="setup" title="Setup">
            <ol className="flex max-w-3xl flex-col gap-6">
              <li>
                <p className="mb-2 font-semibold">1 · Copy two folders</p>
                <p className="mb-2 text-caption text-fg-secondary">
                  <code className="font-mono">src/ui/</code> (the library) and <code className="font-mono">src/styles/</code> (tokens: <code className="font-mono">theme.css</code> + generated colours). Nothing else.
                </p>
                <div className="flex flex-wrap gap-1.5">{FILES.map((f) => <Badge key={f} className="font-mono font-normal">{f}</Badge>)}</div>
              </li>
              <li>
                <p className="mb-2 font-semibold">2 · Install</p>
                <CodeBlock code={SETUP_INSTALL} title="terminal" />
              </li>
              <li>
                <p className="mb-2 font-semibold">3 · Load tokens and set the mode</p>
                <CodeBlock code={SETUP_ROOT} title="main.tsx" />
              </li>
              <li>
                <p className="mb-2 font-semibold">4 · Import</p>
                <InlineCopy text={SETUP_USE} />
              </li>
            </ol>
          </Block>

          <Block id="rules" title="Rules">
            <dl className="grid max-w-4xl gap-3 sm:grid-cols-2">
              {RULES.map(([t, d]) => (
                <div key={t} className="rounded-panel border border-line-subtle bg-surface p-4">
                  <dt className="mb-1 font-semibold">{t}</dt>
                  <dd className="text-caption text-fg-secondary">{d}</dd>
                </div>
              ))}
            </dl>
          </Block>

          <Block id="tokens" title="Tokens" kicker={<span className="text-caption text-fg-tertiary">Click a class to copy it</span>}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {TOKENS.map((g) => (
                <div key={g.group} className="overflow-hidden rounded-panel border border-line-subtle bg-surface">
                  <p className="border-b border-line-subtle bg-grid-header px-3 py-1.5 text-caption font-semibold text-fg-secondary">{g.group}</p>
                  <ul>
                    {g.items.map((t) => (
                      <li key={t.cls} className="flex items-center gap-2.5 border-b border-grid-line px-3 py-1.5 last:border-b-0">
                        {t.swatch && <span aria-hidden className="size-5 shrink-0 rounded-chip border border-line-subtle" style={{ background: t.swatch }} />}
                        {t.size && <span aria-hidden className="w-6 shrink-0 text-center leading-none font-semibold" style={{ fontSize: t.size }}>Aa</span>}
                        <span className="min-w-0 flex-1">
                          <code className="block truncate font-mono text-caption font-semibold">{t.cls}</code>
                          <span className="block truncate text-caption text-fg-tertiary">{t.note}</span>
                        </span>
                        <CopyButton text={t.cls} label="Copy" className="h-6" />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Block>

          {shown.map((e) => <ComponentBlock key={e.id} e={e} />)}
          {!shown.length && <p className="py-10 text-caption text-fg-tertiary">No component matches “{query}”.</p>}
        </main>
      </div>
    </div>
  );
}
