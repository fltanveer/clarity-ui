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
    await user.click(within(screen.getByRole("list", { name: "Members" })).getByRole("button", { name: "Acme Europe Ltd." }));
    const props = screen.getByRole("complementary", { name: "Properties" });
    expect(within(props).getByRole("heading", { name: "Acme Europe Ltd." })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: /Members in/ })).getByRole("button", { name: "Acme Europe Ltd." })).not.toHaveAttribute("aria-current");
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
    screen.getByRole("button", { name: /Reorder Acme Holdings Inc./ }).focus();
    await user.keyboard("{ArrowDown}");
    expect(gridNames()[0]).toContain("Acme North America Inc.");
    expect(screen.getByRole("button", { name: /Reorder Acme Holdings Inc., position 2/ })).toHaveFocus();
    await user.click(within(screen.getByRole("region", { name: "Reorder mode" })).getByRole("button", { name: "Cancel" }));
    expect(gridNames()[0]).toContain("Acme Holdings Inc.");

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Reorder" }));
    screen.getByRole("button", { name: /Reorder Acme Holdings Inc./ }).focus();
    await user.keyboard("{ArrowDown}");
    await user.click(screen.getByRole("button", { name: /Save order/ }));
    expect(gridNames()[0]).toContain("Acme North America Inc.");
  });

  it("bulk delete offers no checkbox for system-defined members and Escape leaves the mode", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Bulk delete" }));
    expect(screen.getByRole("button", { name: /Delete 0/ })).toBeDisabled();
    expect(screen.queryByRole("checkbox", { name: "Select Acme Holdings Inc." })).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Select all deletable members" }));
    expect(screen.getByRole("button", { name: /Delete 7/ })).toBeEnabled();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("region", { name: "Bulk delete mode" })).not.toBeInTheDocument();
  });

  it("in MODEL a member click opens configuration; each attribute section is its own menu item", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    await user.click(within(screen.getByRole("list", { name: /Members in/ })).getByRole("button", { name: "Acme North America Inc." }));
    const nav = screen.getByRole("navigation", { name: "Member sections" });
    /* Opens on Identity, with initial info filled in. */
    expect(within(nav).getByRole("button", { name: "Identity" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("textbox", { name: "Name | ID" })).toHaveValue("Acme North America Inc.");
    /* Schema sections and System Details are separate pages under Attributes. */
    await user.click(within(nav).getByRole("button", { name: "Classification" }));
    expect(screen.getByRole("combobox", { name: "Functional Currency" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Name | ID" })).not.toBeInTheDocument();
    await user.click(within(nav).getByRole("button", { name: "System Details" }));
    expect(screen.getByText("Member ID")).toBeInTheDocument();
    await user.click(within(nav).getByRole("button", { name: "Identity" }));
    /* The list-level toolbars are absent in this state. */
    expect(screen.queryByRole("button", { name: "Actions" })).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "Short Name" }), " Inc");
    expect(screen.getAllByText("Unsaved changes").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("textbox", { name: "Short Name" })).toHaveValue("Acme NA");

    await user.click(within(nav).getByRole("button", { name: "Permissions" }));
    expect(screen.getByText("Security scope")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to master list" }));
    expect(screen.queryByRole("navigation", { name: "Member sections" })).not.toBeInTheDocument();
  });

  it("system-defined members cannot be deleted; others confirm before deleting", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    await user.click(within(screen.getByRole("list", { name: /Members in/ })).getByRole("button", { name: /^Acme Holdings Inc\./ }));
    expect(screen.getByRole("button", { name: "Delete member" })).toBeDisabled();
    await user.click(within(screen.getByRole("list", { name: /Members in/ })).getByRole("button", { name: "Acme UK Ltd." }));
    await user.click(screen.getByRole("button", { name: "Delete member" }));
    expect(screen.getByRole("alertdialog", { name: "Delete Acme UK Ltd.?" })).toBeInTheDocument();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("textbox", { name: "Name | ID" })).toHaveValue("Acme UK Ltd.");
    await user.click(screen.getByRole("button", { name: "Delete member" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete member" }));
    expect(within(screen.getByRole("list", { name: /Members in/ })).queryByRole("button", { name: "Acme UK Ltd." })).not.toBeInTheDocument();
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

    await user.click(within(sw).getByRole("button", { name: /^Core Operating Companies/ }));
    expect(screen.queryByRole("dialog", { name: "Choose model and view" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Members in Core Operating Companies" })).getAllByRole("button")).toHaveLength(5);
    expect(screen.getByRole("region", { name: "Work area" })).toBeInTheDocument();
  });

  it("the overlay's model / structure dropdown is locked; the structure tabs switch it and the overlay follows", async () => {
    const { user } = setup();
    const sw = await openSwitcher(user);
    expect(within(sw).getByRole("combobox", { name: "Model / Structure" })).toBeDisabled();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("tab", { name: "IC Elimination Groups" }));
    const after = await openSwitcher(user);
    expect(within(after).getByRole("combobox", { name: "Model / Structure" })).toHaveValue("IC Elimination Groups");
    expect(within(after).queryByRole("button", { name: /^Core Operating Companies/ })).not.toBeInTheDocument();
  });

  it("manage views: select a view, change its rules, save, then apply it", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    const mgr = await openManager(user);
    expect(screen.queryByRole("dialog", { name: "Choose model and view" })).not.toBeInTheDocument();
    const tree = within(mgr).getByRole("navigation", { name: "Views" });
    expect(within(tree).getByRole("button", { name: /^Master list/ })).toHaveAttribute("aria-current", "true");

    await user.click(within(tree).getByRole("button", { name: /^Europe/ }));
    expect(within(mgr).getByText("Returns 2 of 8 members")).toBeInTheDocument();
    await user.selectOptions(within(mgr).getByRole("combobox", { name: "Rule 1 value" }), "Asia Pacific");
    expect(within(mgr).getByText("Returns 1 of 8 members")).toBeInTheDocument();
    /* Apply waits for Save: an unsaved definition is never what the pane shows. */
    expect(within(mgr).queryByRole("button", { name: "Apply view" })).not.toBeInTheDocument();
    expect(within(mgr).queryByRole("button", { name: "Back to members" })).not.toBeInTheDocument();
    await user.click(within(mgr).getByRole("button", { name: "Save" }));
    await user.click(within(mgr).getByRole("button", { name: "Apply view" }));

    expect(screen.queryByRole("region", { name: "View management" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Members in Europe" })).getAllByRole("button")).toHaveLength(1);
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
    await user.click(within(tree).getByRole("button", { name: /^International Operations/ }));
    await user.click(within(mgr).getByRole("button", { name: "Identity" }));
    const name = within(mgr).getByRole("textbox", { name: "Name" });
    await user.clear(name);
    await user.type(name, "Intl");
    await user.click(within(tree).getByRole("button", { name: /^Master list/ }));
    expect(screen.getByText("Discard unsaved changes?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(within(tree).getByRole("button", { name: /^Master list/ })).toHaveAttribute("aria-current", "true");
    expect(within(tree).getByRole("button", { name: /^International Operations/ })).toBeInTheDocument();
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
    within(tree).getByRole("button", { name: /Reorder EMEA Operations/ }).focus();
    await user.keyboard("{ArrowUp}");
    expect(names("Company groups")).toEqual(["Core Operating Companies", "EMEA Operations", "International Operations"]);
    expect(within(tree).getByRole("button", { name: /Reorder EMEA Operations/ })).toHaveFocus();
    expect(screen.getByText("Arrangement saved")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(names("Company groups")).toEqual(["Core Operating Companies", "International Operations", "EMEA Operations"]);
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
    expect(within(screen.getByRole("region", { name: "Work area" })).getAllByText(/^Acme /).length).toBeGreaterThan(0);
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
    await user.click(within(screen.getByRole("list", { name: /Members in/ })).getByRole("button", { name: "Acme North America Inc." }));
    expect(screen.getByRole("region", { name: "Acme North America Inc. configuration" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Change model or view" }));
    expect(screen.getByRole("dialog", { name: "Choose model and view" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Acme North America Inc. configuration" })).toBeInTheDocument();
  });

  it("structure Edit opens a modal that renames the tab and rejects duplicate names", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    await user.click(screen.getByRole("button", { name: "Companies options" }));
    await user.click(screen.getByRole("menuitem", { name: /Edit/ }));
    const dialog = screen.getByRole("dialog", { name: "Edit structure" });
    const name = within(dialog).getByRole("textbox", { name: "Name" });
    expect(name).toHaveValue("Companies");

    await user.clear(name);
    await user.type(name, "Custom Rollups");
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(within(dialog).getByText(/already called “Custom Rollups”/)).toBeInTheDocument();

    await user.clear(name);
    await user.type(name, "Legal entities{Enter}");
    expect(screen.queryByRole("dialog", { name: "Edit structure" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Legal entities" })).toHaveAttribute("aria-selected", "true");
  });

  it("structure Delete stays locked until the exact name is typed", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    await user.click(screen.getByRole("button", { name: "IC Elimination Groups options" }));
    await user.click(screen.getByRole("menuitem", { name: /Delete/ }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete IC Elimination Groups?" });
    const confirm = within(dialog).getByRole("button", { name: "Delete structure" });
    expect(confirm).toBeDisabled();

    const input = within(dialog).getByRole("textbox", { name: /To confirm, type/ });
    await user.type(input, "ic elimination groups");
    expect(confirm).toBeDisabled();
    await user.clear(input);
    await user.type(input, "IC Elimination Groups");
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "IC Elimination Groups" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Companies" })).toBeInTheDocument();
  });

  it("manage views rearranges folders by keyboard with undo; its model / structure picker is locked", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    const mgr = await openManager(user);
    const tree = within(mgr).getByRole("navigation", { name: "Views" });
    const order = () => within(tree).getAllByRole("group").map((g) => g.getAttribute("aria-label"));
    expect(order()).toEqual(["Unfiled", "Company groups", "By region"]);

    within(tree).getByRole("button", { name: /Reorder folder By region/ }).focus();
    await user.keyboard("{ArrowUp}");
    expect(order()).toEqual(["Unfiled", "By region", "Company groups"]);
    expect(within(tree).getByRole("button", { name: /Reorder folder By region/ })).toHaveFocus();

    await user.click(within(mgr).getByRole("button", { name: "Undo" }));
    expect(order()).toEqual(["Unfiled", "Company groups", "By region"]);

    expect(within(mgr).getByRole("button", { name: "Model / Structure: Companies" })).toBeDisabled();
  });

  it("manage views: a new view is a draft — Cancel removes it; Save & apply saves and applies it", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    let mgr = await openManager(user);
    const tree = () => within(screen.getByRole("region", { name: "View management" })).getByRole("navigation", { name: "Views" });

    /* Saved view at rest: Cancel / Save present but disabled until something changes. */
    await user.click(within(tree()).getByRole("button", { name: /^Core Operating Companies/ }));
    expect(within(mgr).getByRole("button", { name: "Save" })).toBeDisabled();
    expect(within(mgr).getByRole("button", { name: "Cancel" })).toBeDisabled();

    await user.click(within(mgr).getByRole("button", { name: "New view" }));
    expect(within(tree()).getByRole("button", { name: /^Untitled view/ })).toHaveAttribute("aria-current", "true");
    expect(within(mgr).getByText("Not saved yet")).toBeInTheDocument();
    expect(within(mgr).getByRole("button", { name: "Save" })).toBeEnabled();
    expect(within(mgr).getByRole("button", { name: "Save & apply" })).toBeEnabled();
    await user.click(within(mgr).getByRole("button", { name: "Cancel" }));
    expect(within(tree()).queryByRole("button", { name: /^Untitled view/ })).not.toBeInTheDocument();
    expect(within(tree()).getByRole("button", { name: /^Core Operating Companies/ })).toHaveAttribute("aria-current", "true");

    await user.click(within(mgr).getByRole("button", { name: "New view" }));
    const name = within(mgr).getByRole("textbox", { name: "Name" });
    await user.clear(name);
    await user.type(name, "Board pack");
    await user.click(within(mgr).getByRole("button", { name: "Save & apply" }));
    expect(screen.queryByRole("region", { name: "View management" })).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Members in Board pack" })).toBeInTheDocument();
    mgr = await openManager(user);
    expect(within(tree()).getByRole("button", { name: /^Board pack/ })).toBeInTheDocument();
  });

  it("row gear opens the member's configuration in MODEL and its properties in DATA", async () => {
    const { user } = setup();
    /* DATA: inspect in the properties pane, no mode change. */
    await user.click(screen.getByRole("button", { name: "Show properties for Acme Europe Ltd." }));
    const props = screen.getByRole("complementary", { name: "Properties" });
    expect(within(props).getByRole("heading", { name: "Acme Europe Ltd." })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "MODEL" }));
    await user.click(screen.getByRole("button", { name: "Configure Acme Holdings Inc." }));
    expect(screen.getByRole("region", { name: "Acme Holdings Inc. configuration" })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: /Members in/ })).getByRole("button", { name: /^Acme Holdings Inc\./ })).toHaveAttribute("aria-current", "true");
  });

  it("members and properties panes resize from their splitters by keyboard, within limits", async () => {
    window.localStorage.clear();
    const { user } = setup();
    const left = screen.getByRole("separator", { name: "Resize members pane" });
    expect(left).toHaveAttribute("aria-valuenow", "240");
    left.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(left).toHaveAttribute("aria-valuenow", "272");
    expect(screen.getByRole("complementary", { name: "Members" })).toHaveStyle({ width: "272px" });
    await user.keyboard("{End}");
    expect(left).toHaveAttribute("aria-valuenow", "420");

    /* The properties splitter sits on the pane's leading edge: moving it left widens the pane. */
    const right = screen.getByRole("separator", { name: "Resize properties pane" });
    right.focus();
    await user.keyboard("{ArrowLeft}");
    expect(right).toHaveAttribute("aria-valuenow", "296");
    expect(screen.getByRole("complementary", { name: "Properties" })).toHaveStyle({ width: "296px" });
    await user.keyboard("{Enter}");
    expect(right).toHaveAttribute("aria-valuenow", "280");
    window.localStorage.clear();
  });
  it("a new dimension is created from the domain bar and joins the end, after Picklist", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    await user.click(screen.getByRole("button", { name: "+ Add Dimension" }));
    const dialog = screen.getByRole("dialog", { name: "New dimension" });
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "company");
    await user.click(within(dialog).getByRole("button", { name: "Create dimension" }));
    expect(within(dialog).getByText(/already has a dimension called “company”/)).toBeInTheDocument();
    await user.clear(within(dialog).getByRole("textbox", { name: "Name" }));
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "Project{Enter}");
    expect(screen.queryByRole("dialog", { name: "New dimension" })).not.toBeInTheDocument();
    const names = within(screen.getByRole("tablist", { name: "Domains" })).getAllByRole("tab").map((t) => t.textContent);
    expect(names.slice(-2)).toEqual(["Picklist", "Project"]);
    expect(screen.getByRole("tab", { name: "Project" })).toHaveAttribute("aria-selected", "true");
  });
  it("L100 deletes a new dimension after the exact name is typed, and lands on another", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Platform/ }));
    await user.click(screen.getByRole("button", { name: "+ Add Dimension" }));
    await user.type(within(screen.getByRole("dialog", { name: "New dimension" })).getByRole("textbox", { name: "Name" }), "Project{Enter}");
    await user.click(screen.getByRole("button", { name: "Project options" }));
    await user.click(screen.getByRole("menuitem", { name: /Delete/ }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete Project?" });
    expect(within(dialog).getByText(/It has no structures/)).toBeInTheDocument();
    const confirm = within(dialog).getByRole("button", { name: "Delete dimension" });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByRole("textbox", { name: /To confirm, type/ }), "Project");
    await user.click(confirm);
    expect(screen.queryByRole("tab", { name: "Project" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Company" })).toHaveAttribute("aria-selected", "true");
  });
  it("the members pane + adds a company: identity and classification in one dialog, then its configuration opens", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    await user.click(within(screen.getByRole("complementary", { name: "Members" })).getByRole("button", { name: "Add member" }));
    const dialog = screen.getByRole("dialog", { name: "New company" });
    expect(within(dialog).getAllByRole("combobox").map((c) => dialog.querySelector(`label[for="${c.id}"]`)?.textContent))
      .toEqual(["Functional Currency", "Calendar", "Company Region"]);

    await user.type(within(dialog).getByRole("textbox", { name: "Name | ID" }), "acme uk ltd.");
    await user.click(within(dialog).getByRole("button", { name: "Create company" }));
    expect(within(dialog).getByText(/already has a company called/)).toBeInTheDocument();

    await user.clear(within(dialog).getByRole("textbox", { name: "Name | ID" }));
    await user.type(within(dialog).getByRole("textbox", { name: "Name | ID" }), "Acme France SAS");
    await user.type(within(dialog).getByRole("textbox", { name: "Short Name" }), "Acme FR");
    await user.selectOptions(within(dialog).getByRole("combobox", { name: "Company Region" }), "Europe");
    await user.click(within(dialog).getByRole("button", { name: "Create company" }));

    expect(screen.queryByRole("dialog", { name: "New company" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Acme France SAS configuration" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Short Name" })).toHaveValue("Acme FR");
    expect(within(screen.getByRole("list", { name: /Members in/ })).getByRole("button", { name: "Acme France SAS" })).toBeInTheDocument();
  });
  it("Security › User and Role use the member layout: users carry a role, roles list their users", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Security" }));
    await user.click(within(screen.getByRole("list", { name: "Members" })).getByRole("button", { name: "Penny Ledger" }));
    const props = screen.getByRole("complementary", { name: "Properties" });
    expect(within(props).getByRole("combobox", { name: "Role" })).toHaveValue("Controller");
    expect(within(props).getByRole("textbox", { name: "Email" })).toHaveValue("penny.ledger@acme.example");

    await user.click(screen.getByRole("tab", { name: "Role" }));
    await user.click(within(screen.getByRole("list", { name: "Members" })).getByRole("button", { name: "Controller" }));
    expect(within(screen.getByRole("complementary", { name: "Properties" })).getByText("Penny")).toBeInTheDocument();
    /* Something must always hold L100. */
    expect(within(screen.getByRole("list", { name: "Members" })).getByText("Platform Administrator").closest("li")).toHaveTextContent("System-defined");
  });
});
