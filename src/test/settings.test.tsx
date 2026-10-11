import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "../shell/AppShell";
import { SettingsProvider } from "../settings/SettingsProvider";
import { DEFAULTS, normalize } from "../settings/schema";

const KEY = "clarity.company.mg.settings";

const setup = () => {
  const user = userEvent.setup();
  render(<SettingsProvider><AppShell /></SettingsProvider>);
  return { user };
};
const openAccount = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: /Jack Davidson/ }));

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.density;
});

describe("company settings schema", () => {
  it("repairs anything it is given: bad values fall back, unknown keys drop", () => {
    expect(normalize(null)).toEqual(DEFAULTS);
    expect(normalize({ appearance: { theme: "neon", density: "compact" }, extra: 1 }))
      .toEqual({ ...DEFAULTS, appearance: { theme: "light", density: "compact" } });
  });
});

describe("company settings", () => {
  it("an admin previews live, Cancel restores, Save applies for the company", async () => {
    const { user } = setup();
    expect(document.documentElement.dataset.theme).toBe("light");
    await openAccount(user);
    await user.click(screen.getByRole("button", { name: /Company settings/ }));
    const panel = screen.getByRole("dialog", { name: "Company settings" });

    await user.click(within(panel).getByRole("radio", { name: "Dark" }));
    await user.click(within(panel).getByRole("radio", { name: "Compact" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.density).toBe("compact");

    await user.click(within(panel).getByRole("button", { name: "Cancel" }));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.dataset.density).toBe("comfortable");
    expect(window.localStorage.getItem(KEY)).toBeNull();

    await openAccount(user);
    await user.click(screen.getByRole("button", { name: /Company settings/ }));
    await user.click(within(screen.getByRole("dialog", { name: "Company settings" })).getByRole("radio", { name: "Dark" }));
    await user.click(within(screen.getByRole("dialog", { name: "Company settings" })).getByRole("button", { name: "Save" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(JSON.parse(window.localStorage.getItem(KEY)!).appearance.theme).toBe("dark");
  });

  it("a member has no way in", async () => {
    const { user } = setup();
    await openAccount(user);
    await user.click(screen.getByRole("radio", { name: "Member" }));
    expect(screen.queryByRole("button", { name: /Company settings/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Company settings are managed by your admin/)).toBeInTheDocument();
  });

  it("layout defaults set how the work area starts", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ ...DEFAULTS, layout: { ...DEFAULTS.layout, membersPane: "collapsed" } }));
    setup();
    expect(screen.queryByRole("separator", { name: "Resize members pane" })).not.toBeInTheDocument();
  });
});
