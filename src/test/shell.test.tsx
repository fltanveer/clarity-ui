import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "../shell/AppShell";

const gridNames = () =>
  within(screen.getByRole("list", { name: "Members" })).getAllByRole("listitem").map((li) => li.textContent ?? "");

const setup = () => {
  const user = userEvent.setup();
  const utils = render(<AppShell />);
  const root = utils.container.firstElementChild as HTMLElement;
  return { user, root };
};

describe("AppShell", () => {
  it("opens on Dimensions › Company › Companies in DATA with the properties pane", () => {
    const { root } = setup();
    expect(root).toHaveAttribute("data-mode", "DATA");
    expect(screen.getByRole("tab", { name: "Company" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Companies" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("complementary", { name: "Properties" })).toBeInTheDocument();
    /* Authoring controls are MODE-gated. */
    expect(screen.queryByRole("button", { name: "Add member" })).not.toBeInTheDocument();
  });

  it("MODEL recolours the chrome, adds authoring controls and removes the master-list properties pane", async () => {
    const { user, root } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    expect(root).toHaveAttribute("data-mode", "MODEL");
    expect(screen.getAllByRole("button", { name: "Add member" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Add Subcategory" })).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Properties" })).not.toBeInTheDocument();
  });

  it("a centre-grid click inspects a row and drives properties without committing the member", async () => {
    const { user } = setup();
    await user.click(within(screen.getByRole("list", { name: "Members" })).getByRole("button", { name: "Member C" }));
    const props = screen.getByRole("complementary", { name: "Properties" });
    expect(within(props).getByRole("heading", { name: "Member C" })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: /Members in/ })).getByRole("button", { name: "Member C" })).not.toHaveAttribute("aria-current");
  });

  it("switching domain resets the structure to that domain's first", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("tab", { name: "Account" }));
    expect(screen.getByRole("tab", { name: "Accounts" })).toHaveAttribute("aria-selected", "true");
    /* Dimensions › Account shows the Company context selector only. */
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("button", { name: /^Company:/ })).toBeInTheDocument();
    expect(within(header).queryByRole("button", { name: /^Version:/ })).not.toBeInTheDocument();
  });

  it("reorder is staged: keyboard moves rows, Cancel discards, Save order commits", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Reorder" }));
    screen.getByRole("button", { name: /Reorder Member A/ }).focus();
    await user.keyboard("{ArrowDown}");
    expect(gridNames()[0]).toContain("Member B");
    expect(screen.getByRole("button", { name: /Reorder Member A, position 2/ })).toHaveFocus();
    await user.click(within(screen.getByRole("region", { name: "Reorder mode" })).getByRole("button", { name: "Cancel" }));
    expect(gridNames()[0]).toContain("Member A");

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Reorder" }));
    screen.getByRole("button", { name: /Reorder Member A/ }).focus();
    await user.keyboard("{ArrowDown}");
    await user.click(screen.getByRole("button", { name: /Save order/ }));
    expect(gridNames()[0]).toContain("Member B");
  });

  it("bulk delete offers no checkbox for system-defined members and Escape leaves the mode", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Bulk delete" }));
    expect(screen.getByRole("button", { name: /Delete 0/ })).toBeDisabled();
    expect(screen.queryByRole("checkbox", { name: "Select Member D" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Select all deletable members" }));
    expect(screen.getByRole("button", { name: /Delete 3/ })).toBeEnabled();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("region", { name: "Bulk delete mode" })).not.toBeInTheDocument();
  });

  it("in MODEL a left-pane member click opens configuration on the Attributes page", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    await user.click(within(screen.getByRole("list", { name: /Members in/ })).getByRole("button", { name: "Member B" }));
    const nav = screen.getByRole("navigation", { name: "Member sections" });
    expect(within(nav).getByRole("button", { name: "Attributes" })).toHaveAttribute("aria-current", "page");
    /* Identity and schema sections share one page; initial info is filled in. */
    expect(screen.getByRole("textbox", { name: "Name | ID" })).toHaveValue("Member B");
    expect(screen.getByRole("combobox", { name: "Company Type" })).toBeInTheDocument();
    /* System Details starts collapsed; Expand all opens it. */
    expect(screen.getByRole("button", { name: /System Details/ })).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getByRole("button", { name: /System Details/ })).toHaveAttribute("aria-expanded", "true");
    /* The list-level toolbars are absent in this state. */
    expect(screen.queryByRole("button", { name: "Actions" })).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "Short Name" }), "MB");
    expect(screen.getAllByText("Unsaved changes").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("textbox", { name: "Short Name" })).toHaveValue("");

    await user.click(within(nav).getByRole("button", { name: "Permissions" }));
    expect(screen.getByText("Security scope")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to master list" }));
    expect(screen.queryByRole("navigation", { name: "Member sections" })).not.toBeInTheDocument();
  });

  it("system-defined members cannot be deleted; others confirm before deleting", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    await user.click(within(screen.getByRole("list", { name: /Members in/ })).getByRole("button", { name: /^Member D/ }));
    expect(screen.getByRole("button", { name: "Delete member" })).toBeDisabled();
    await user.click(within(screen.getByRole("list", { name: /Members in/ })).getByRole("button", { name: "Member A" }));
    await user.click(screen.getByRole("button", { name: "Delete member" }));
    expect(screen.getByRole("alertdialog", { name: "Delete Member A?" })).toBeInTheDocument();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("textbox", { name: "Name | ID" })).toHaveValue("Member A");
    await user.click(screen.getByRole("button", { name: "Delete member" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete member" }));
    expect(within(screen.getByRole("list", { name: /Members in/ })).queryByRole("button", { name: "Member A" })).not.toBeInTheDocument();
  });

  it("Ctrl+Shift+F collapses the chrome and the strip restores it", async () => {
    const { user } = setup();
    await user.keyboard("{Control>}{Shift>}F{/Shift}{/Control}");
    expect(screen.queryByRole("tablist", { name: "Domains" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restore toolbars" }));
    expect(screen.getByRole("tablist", { name: "Domains" })).toBeInTheDocument();
  });

  it("entering L100 replaces the mode pill with the Structure Administration chip", async () => {
    const { user, root } = setup();
    await user.click(screen.getByRole("button", { name: /Platform/ }));
    expect(root).toHaveAttribute("data-mode", "L100");
    expect(screen.queryByRole("group", { name: "Mode" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Exit Structure Administration" }));
    expect(root).toHaveAttribute("data-mode", "DATA");
  });

  const openSwitcher = async (user: ReturnType<typeof setup>["user"]) => {
    await user.click(screen.getByRole("button", { name: "Change model or view" }));
    return screen.getByRole("dialog", { name: "Choose model and view" });
  };
  const openManager = async (user: ReturnType<typeof setup>["user"]) => {
    const sw = await openSwitcher(user);
    await user.click(within(sw).getByRole("button", { name: "Manage views" }));
    return screen.getByRole("region", { name: "View management" });
  };

  it("members header opens a model + view overlay; picking applies and closes; no arranging there", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    const sw = await openSwitcher(user);
    expect(within(sw).queryByRole("button", { name: /Reorder/ })).not.toBeInTheDocument();
    expect(within(sw).getByRole("button", { name: /^Master list/ })).toHaveAttribute("aria-current", "true");

    await user.click(within(sw).getByRole("button", { name: /^Operating companies/ }));
    expect(screen.queryByRole("dialog", { name: "Choose model and view" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Members in Operating companies" })).getAllByRole("button")).toHaveLength(3);
    expect(screen.getByRole("region", { name: "Work area" })).toBeInTheDocument();
  });

  it("the overlay switches model; its views and the structure bar follow", async () => {
    const { user } = setup();
    const sw = await openSwitcher(user);
    await user.selectOptions(within(sw).getByRole("combobox", { name: "Model" }), "IC Elimination Groups");
    const after = screen.getByRole("dialog", { name: "Choose model and view" });
    expect(within(after).getByRole("button", { name: /^Master list/ })).toBeInTheDocument();
    expect(within(after).queryByRole("button", { name: /^Operating companies/ })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "IC Elimination Groups" })).toHaveAttribute("aria-selected", "true");
  });

  it("manage views: select a view, change its rules, save, then apply it", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    const mgr = await openManager(user);
    expect(screen.queryByRole("dialog", { name: "Choose model and view" })).not.toBeInTheDocument();
    const tree = within(mgr).getByRole("navigation", { name: "Views" });
    expect(within(tree).getByRole("button", { name: /^Master list/ })).toHaveAttribute("aria-current", "true");

    await user.click(within(tree).getByRole("button", { name: /^Operating companies/ }));
    expect(within(mgr).getByText("Returns 3 of 5 members")).toBeInTheDocument();
    await user.selectOptions(within(mgr).getByRole("combobox", { name: "Rule 1 value" }), "System");
    expect(within(mgr).getByText("Returns 1 of 5 members")).toBeInTheDocument();
    /* Apply waits for Save: an unsaved definition is never what the pane shows. */
    expect(within(mgr).queryByRole("button", { name: "Apply view" })).not.toBeInTheDocument();
    expect(within(mgr).queryByRole("button", { name: "Back to members" })).not.toBeInTheDocument();
    await user.click(within(mgr).getByRole("button", { name: "Save" }));
    await user.click(within(mgr).getByRole("button", { name: "Apply view" }));

    expect(screen.queryByRole("region", { name: "View management" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Members in Operating companies" })).getAllByRole("button")).toHaveLength(1);
  });

  it("DATA has no manage entry; manage views guards unsaved edits", async () => {
    const { user } = setup();
    /* DATA picks views; managing them is a MODEL task. */
    const sw = await openSwitcher(user);
    expect(within(sw).queryByRole("button", { name: "Manage views" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Choose model and view" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "MODEL" }));
    const mgr = await openManager(user);
    const tree = within(mgr).getByRole("navigation", { name: "Views" });
    await user.click(within(tree).getByRole("button", { name: /^Elimination set/ }));
    await user.click(within(mgr).getByRole("button", { name: "Identity" }));
    const name = within(mgr).getByRole("textbox", { name: "Name" });
    await user.clear(name);
    await user.type(name, "Elims");
    await user.click(within(tree).getByRole("button", { name: /^Master list/ }));
    expect(screen.getByText("Discard unsaved changes?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(within(tree).getByRole("button", { name: /^Master list/ })).toHaveAttribute("aria-current", "true");
    expect(within(tree).getByRole("button", { name: /^Elimination set/ })).toBeInTheDocument();
    await user.click(within(mgr).getByRole("button", { name: "Close view management" }));
    expect(screen.queryByRole("region", { name: "View management" })).not.toBeInTheDocument();
  });

  it("manage views arranges by keyboard with a one-step undo", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    const tree = within(await openManager(user)).getByRole("navigation", { name: "Views" });
    const names = (folder: string) =>
      within(within(tree).getByRole("group", { name: folder })).getAllByRole("listitem")
        .map((li) => li.querySelector("[data-name]")?.textContent);

    expect(within(tree).queryByRole("button", { name: /Reorder Master list/ })).not.toBeInTheDocument();
    within(tree).getByRole("button", { name: /Reorder Acquired entities/ }).focus();
    await user.keyboard("{ArrowUp}");
    expect(names("Consolidation")).toEqual(["Operating companies", "Acquired entities", "Elimination set"]);
    expect(within(tree).getByRole("button", { name: /Reorder Acquired entities/ })).toHaveFocus();
    expect(screen.getByText("Arrangement saved")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(names("Consolidation")).toEqual(["Operating companies", "Elimination set", "Acquired entities"]);
  });

  it("session chip opens the account drawer; plan limits are stated; Escape closes and returns focus", async () => {
    const { user } = setup();
    const chip = screen.getByRole("button", { name: /Jack Davidson/ });
    await user.click(chip);
    const drawer = screen.getByRole("dialog", { name: "Account and plans" });
    expect(within(drawer).getByRole("button", { name: "Meridian Consolidated" })).toHaveAttribute("aria-current", "true");
    /* Meridian Group uses 3 of 3 plans: no dead "New plan" button, the limit is said. */
    expect(within(drawer).getByText("Plan limit reached")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Account and plans" })).not.toBeInTheDocument();
    expect(chip).toHaveFocus();
  });

  it("view card: the change button opens the model + view panel; the card body shows the grid and closes it", async () => {
    const { user } = setup();
    const change = screen.getByRole("button", { name: "Change model or view" });
    await user.click(change);
    expect(change).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Choose model and view" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Companies: Master list. Show all members" }));
    expect(screen.queryByRole("dialog", { name: "Choose model and view" })).not.toBeInTheDocument();
    expect(change).toHaveAttribute("aria-expanded", "false");
    expect(within(screen.getByRole("region", { name: "Work area" })).getAllByText(/^Member [A-E]$/).length).toBeGreaterThan(0);
  });

  it("narrowing the window folds the members pane so two-column work keeps its layout", async () => {
    setup();
    expect(screen.getByRole("complementary", { name: "Members" })).toBeInTheDocument();
    act(() => { window.innerWidth = 1180; window.dispatchEvent(new Event("resize")); });
    expect(screen.getByRole("complementary", { name: "Members (collapsed)" })).toBeInTheDocument();
    act(() => { window.innerWidth = 1440; window.dispatchEvent(new Event("resize")); });
    expect(screen.getByRole("complementary", { name: "Members" })).toBeInTheDocument();
  });

  it("the model + view panel opens while a member's configuration is showing", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    await user.click(within(screen.getByRole("list", { name: /Members in/ })).getByRole("button", { name: "Member B" }));
    expect(screen.getByRole("region", { name: "Member B configuration" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Change model or view" }));
    expect(screen.getByRole("dialog", { name: "Choose model and view" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Member B configuration" })).toBeInTheDocument();
  });
});
