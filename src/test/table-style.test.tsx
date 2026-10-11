import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "../shell/AppShell";
import { SettingsProvider } from "../settings/SettingsProvider";
import { DEFAULTS } from "../settings/schema";
import { DEFAULT_TABLE, TABLE_PRESETS, normalizeTable, presetOf } from "../settings/table";

const KEY = "clarity.company.mg.settings";
beforeEach(() => { window.localStorage.clear(); window.sessionStorage.clear(); });

describe("table style", () => {
  it("repairs bad input and recognises presets", () => {
    expect(normalizeTable({ header: "loud", zebra: "yes" })).toEqual(DEFAULT_TABLE);
    expect(presetOf(TABLE_PRESETS.banded.style)).toBe("banded");
    expect(presetOf({ ...DEFAULT_TABLE, zebra: true })).toBeNull();
  });

  it("a saved preset styles every grid and sets where the main grid starts", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ ...DEFAULTS, table: TABLE_PRESETS.minimal.style }));
    render(<SettingsProvider><AppShell /></SettingsProvider>);
    const d = document.documentElement.dataset;
    expect([d.tableHeader, d.tableColumns, d.tableRows, d.tableZebra]).toEqual(["plain", "none", "on", "off"]);
    expect(screen.queryByText("Row number")).not.toBeInTheDocument();
  });

  it("an admin picks a preset in the Tables tab and the grid follows live", async () => {
    const user = userEvent.setup();
    render(<SettingsProvider><AppShell /></SettingsProvider>);
    await user.click(screen.getByRole("button", { name: /Jack Davidson/ }));
    await user.click(screen.getByRole("button", { name: /Company settings/ }));
    const panel = screen.getByRole("dialog", { name: "Company settings" });
    await user.click(within(panel).getByRole("tab", { name: "Tables" }));
    await user.click(within(panel).getByRole("radio", { name: /Spreadsheet/ }));
    expect(document.documentElement.dataset.tableColumns).toBe("all");
    expect(document.documentElement.dataset.tableHeader).toBe("strong");
  });
});
