import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "../shell/AppShell";
import { SettingsProvider } from "../settings/SettingsProvider";
import { DEFAULTS } from "../settings/schema";
import { DEFAULT_TOOLBAR, normalizeToolbar, type ToolbarItem } from "../settings/toolbar";

const KEY = "clarity.company.mg.settings";
const withToolbar = (toolbar: ToolbarItem[]) => window.localStorage.setItem(KEY, JSON.stringify({ ...DEFAULTS, toolbar }));
const edit = (id: string, patch: Partial<ToolbarItem>) => DEFAULT_TOOLBAR.map((t) => (t.id === id ? { ...t, ...patch } : t));

beforeEach(() => { window.localStorage.clear(); window.sessionStorage.clear(); });

describe("toolbar schema", () => {
  it("drops unknown and duplicate actions, enforces locks, and restores missing actions", () => {
    const out = normalizeToolbar([
      { id: "export", zone: "end", display: "icon", label: "  Download CSV  ", icon: "FileDown" },
      { id: "export", zone: "main" },
      { id: "launchMissiles" },
      { id: "toggleHeader", hidden: true, icon: "Star" },
      { id: "add", label: "Create", icon: "nope" },
    ]);
    expect(out[0]).toMatchObject({ id: "export", zone: "end", display: "icon", label: "Download CSV", icon: "FileDown" });
    expect(out.find((t) => t.id === "toggleHeader")).toMatchObject({ hidden: false, icon: null });
    expect(out.find((t) => t.id === "add")).toMatchObject({ label: null, icon: null });
    expect(out.map((t) => t.id).sort()).toEqual(DEFAULT_TOOLBAR.map((t) => t.id).sort());
  });
});

describe("toolbar from settings", () => {
  it("hides, renames and moves actions as the company set them", async () => {
    const user = userEvent.setup();
    withToolbar(edit("export", { label: "Download CSV" }).map((t) =>
      t.id === "refresh" ? { ...t, hidden: true } : t.id === "import" ? { ...t, zone: "menu" } : t));
    render(<SettingsProvider><AppShell /></SettingsProvider>);
    expect(screen.getByRole("button", { name: /Download CSV/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Import" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Actions/ }));
    expect(within(screen.getByRole("menu", { name: "Actions" })).getByRole("menuitem", { name: /Import/ })).toBeInTheDocument();
  });

  it("an empty Actions menu disappears", () => {
    withToolbar(DEFAULT_TOOLBAR.map((t) => (t.zone === "menu" ? { ...t, zone: "main" } : t)));
    render(<SettingsProvider><AppShell /></SettingsProvider>);
    expect(screen.queryByRole("button", { name: /^Actions/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Bulk delete/ }).length).toBeGreaterThan(0);
  });

  it("an admin renames Export in the editor and saves it for the company", async () => {
    const user = userEvent.setup();
    render(<SettingsProvider><AppShell /></SettingsProvider>);
    await user.click(screen.getByRole("button", { name: /Jack Davidson/ }));
    await user.click(screen.getByRole("button", { name: /Company settings/ }));
    const panel = screen.getByRole("dialog", { name: "Company settings" });
    await user.click(within(panel).getByRole("tab", { name: "Toolbar" }));
    await user.type(within(panel).getByRole("textbox", { name: "Export label" }), "Download");
    await user.click(within(panel).getByRole("button", { name: "Save" }));
    expect(screen.getByRole("button", { name: /^Download$/ })).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(KEY)!).toolbar.find((t: ToolbarItem) => t.id === "export").label).toBe("Download");
  });
});
