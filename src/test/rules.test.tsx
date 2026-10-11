import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "../shell/AppShell";
import { SettingsProvider } from "../settings/SettingsProvider";
import { DEFAULTS } from "../settings/schema";
import { DEFAULT_TOOLBAR } from "../settings/toolbar";
import { ALWAYS, describe as sentence, evaluate, normalizeRule, type Facts } from "../settings/rules";

const KEY = "clarity.company.mg.settings";
const facts: Facts = { mode: "DATA", role: "Admin", domain: "Company", structure: "Companies", modelChosen: false, recordSelected: false };
beforeEach(() => { window.localStorage.clear(); window.sessionStorage.clear(); });

describe("rules engine", () => {
  it("matches all / any / never, and an empty rule always matches", () => {
    expect(evaluate(ALWAYS, facts)).toBe(true);
    expect(evaluate({ match: "never", clauses: [] }, facts)).toBe(false);
    const dataAdmin = { match: "all" as const, clauses: [{ fact: "mode" as const, op: "is" as const, value: "DATA" }, { fact: "role" as const, op: "isNot" as const, value: "Member" }] };
    expect(evaluate(dataAdmin, facts)).toBe(true);
    expect(evaluate(dataAdmin, { ...facts, mode: "MODEL" })).toBe(false);
    expect(evaluate({ ...dataAdmin, match: "any" }, { ...facts, mode: "MODEL" })).toBe(true);
  });

  it("drops clauses about unknown facts or values and reads as a sentence", () => {
    const r = normalizeRule({ match: "all", clauses: [{ fact: "mode", value: "DATA" }, { fact: "salary", value: 5 }, { fact: "role", value: "Owner" }] });
    expect(r.clauses).toEqual([{ fact: "mode", op: "is", value: "DATA" }]);
    expect(sentence({ match: "any", clauses: [...r.clauses, { fact: "modelChosen", op: "is", value: true }] })).toBe("Mode is DATA or A Model is chosen is Yes");
    expect(normalizeRule("nonsense")).toEqual(ALWAYS);
  });
});

describe("rules in the app", () => {
  it("a toolbar action shows only when its rule matches", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(KEY, JSON.stringify({ ...DEFAULTS, toolbar: DEFAULT_TOOLBAR.map((t) =>
      t.id === "export" ? { ...t, when: { match: "all", clauses: [{ fact: "mode", op: "is", value: "MODEL" }] } } : t) }));
    render(<SettingsProvider><AppShell /></SettingsProvider>);
    expect(screen.queryByRole("button", { name: /^Export$/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    expect(screen.getByRole("button", { name: /^Export$/ })).toBeInTheDocument();
  });

  it("the Details split follows the company rule", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(KEY, JSON.stringify({ ...DEFAULTS, behaviours: { detailsSplit: { match: "never", clauses: [] } } }));
    render(<SettingsProvider><AppShell /></SettingsProvider>);
    await user.click(screen.getByRole("button", { name: "Operational" }));
    await user.click(screen.getByRole("tab", { name: "Workforce" }));
    await user.selectOptions(within(screen.getByRole("complementary", { name: "Members" })).getByRole("combobox", { name: "Model" }), "wf-usa");
    expect(screen.getByRole("list", { name: "People" })).toBeInTheDocument();
    expect(screen.queryByRole("separator", { name: "Resize drivers grid" })).not.toBeInTheDocument();
  });

  it("an admin writes a rule in the Rules tab and it applies live", async () => {
    const user = userEvent.setup();
    render(<SettingsProvider><AppShell /></SettingsProvider>);
    await user.click(screen.getByRole("button", { name: /Jack Davidson/ }));
    await user.click(screen.getByRole("button", { name: /Company settings/ }));
    const panel = screen.getByRole("dialog", { name: "Company settings" });
    await user.click(within(panel).getByRole("tab", { name: "Rules" }));
    await user.click(within(panel).getByText("Export", { selector: "span" }));
    await user.selectOptions(within(panel).getByRole("combobox", { name: "Export: match" }), "never");
    expect(within(panel).getByText("Shows: Never")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /^Export$/, hidden: true }).filter((b) => !panel.contains(b))).toHaveLength(0);
  });
});
