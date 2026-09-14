import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssignUnassignSurface } from "../surface/AssignUnassignSurface";
import { ViewMenu } from "../components/ViewMenu";
import { SAVED_VIEWS } from "../lib/demo-data";
import { sortBy } from "../lib/sort";

const assignedNames = () =>
  within(screen.getByRole("list", { name: "Assigned members" }))
    .getAllByRole("listitem")
    .map((li) => li.textContent ?? "");

describe("AssignUnassignSurface", () => {
  it("keeps focus in the qty input while typing (AttrCell remount regression)", async () => {
    const user = userEvent.setup();
    render(<AssignUnassignSurface />);
    await user.click(screen.getByRole("tab", { name: "Composition" }));
    const qty = screen.getByRole("textbox", { name: "Qty for Acme US Corporation" });
    await user.click(qty);
    await user.type(qty, "25");
    const after = screen.getByRole("textbox", { name: "Qty for Acme US Corporation" });
    expect(after).toHaveValue("125");
    expect(after).toHaveFocus();
    expect(after).toBe(qty);
  });

  it("reorders a row with the keyboard and announces the new position", async () => {
    const user = userEvent.setup();
    render(<AssignUnassignSurface />);
    const grip = screen.getByRole("button", { name: /Reorder Acme US Corporation/ });
    grip.focus();
    await user.keyboard("{ArrowDown}");
    expect(assignedNames()[0]).toContain("Acme Canada Ltd.");
    expect(assignedNames()[1]).toContain("Acme US Corporation");
    expect(screen.getByText("Acme US Corporation moved to position 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reorder Acme US Corporation, position 2 of 2/ })).toHaveFocus();
  });

  it("disables reordering while sorted and says so", async () => {
    const user = userEvent.setup();
    render(<AssignUnassignSurface />);
    const assigned = screen.getByRole("region", { name: /Assigned/ });
    await user.click(within(assigned).getByRole("button", { name: "Name" }));
    expect(screen.getByText(/Reordering is off until you clear the sort/)).toBeInTheDocument();
    const grip = screen.getAllByRole("button", { name: /^Reorder/ })[0];
    expect(grip).toHaveAttribute("aria-disabled", "true");
    grip.focus();
    const before = assignedNames();
    await user.keyboard("{ArrowDown}");
    expect(assignedNames()).toEqual(before);
  });

  it("offers Undo after removing a row and restores it in place", async () => {
    const user = userEvent.setup();
    render(<AssignUnassignSurface />);
    await user.click(screen.getByRole("button", { name: "Remove Acme US Corporation" }));
    expect(screen.queryByRole("button", { name: "Remove Acme US Corporation" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(assignedNames()[0]).toContain("Acme US Corporation");
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });

  it("counts folders in the remove-all confirmation and never shows an invented view count", async () => {
    const user = userEvent.setup();
    render(<AssignUnassignSurface />);
    await user.click(screen.getByRole("tab", { name: "Members" }));
    await user.click(screen.getByRole("button", { name: "Add folder" }));
    await user.click(screen.getByRole("button", { name: "Remove all" }));
    expect(screen.getByText("Remove 2 members and 1 folder?")).toBeInTheDocument();
    expect(screen.queryByText(/views lose members/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Remove all" })).toHaveFocus();
  });

  it("keeps the consequence badge when the host owns the tabs", () => {
    render(<AssignUnassignSurface ctx="COMPOSITION_QTY" hideTabs />);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByText("Changes results")).toBeInTheDocument();
  });

  it("renders an explicit state for an unregistered context instead of throwing", () => {
    render(<AssignUnassignSurface ctx="NOT_A_CONTEXT" hideTabs />);
    expect(screen.getByText("This context is not registered")).toBeInTheDocument();
  });

  it("moves between context tabs with arrow keys", async () => {
    const user = userEvent.setup();
    render(<AssignUnassignSurface />);
    const current = screen.getByRole("tab", { selected: true });
    expect(current).toHaveTextContent("Allocation & Structures");
    current.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Composition" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Composition" })).toHaveFocus();
  });

  it("enters and leaves member scoping from the chip only; Escape also leaves", async () => {
    const user = userEvent.setup();
    render(<AssignUnassignSurface />);
    const chip = screen.getByRole("button", { name: /Member scope for Acme US Corporation/ });
    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("checkbox", { name: "Corp" }));
    expect(chip).toHaveTextContent("1 of 6");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: /Member scope for Acme US Corporation/ })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("ViewMenu", () => {
  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<ViewMenu views={SAVED_VIEWS} onManageViews={() => {}} />);
    const trigger = screen.getByRole("button", { name: /Master list/ });
    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /Master list/ })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitemradio", { name: "Operating companies" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe("sortBy", () => {
  it("is a stable projection that leaves the input untouched", () => {
    const input = [{ n: "b" }, { n: "A" }, { n: "a" }, { n: "c" }];
    const out = sortBy(input, { key: "n", dir: "asc" }, (x) => x.n);
    expect(out.map((x) => x.n)).toEqual(["A", "a", "b", "c"]);
    expect(input.map((x) => x.n)).toEqual(["b", "A", "a", "c"]);
    expect(sortBy(input, { key: "n", dir: "desc" }, (x) => x.n).map((x) => x.n)).toEqual(["c", "b", "A", "a"]);
  });
});
