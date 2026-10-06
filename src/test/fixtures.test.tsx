import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "../shell/AppShell";

/* Handoff v0.5 · Company and Workforce, rendered from the declared frames. */

const setup = () => {
  const user = userEvent.setup();
  render(<AppShell />);
  return { user };
};
const leftPane = () => screen.getByRole("complementary", { name: "Members" });
const leftList = () => within(leftPane()).getByRole("list", { name: / in Master list$/ });
const leftNames = () => within(leftList()).queryAllByRole("button").map((b) => b.querySelector("span.truncate")?.textContent ?? "");
const USA = ["Dave", "Jack", "Priya Shah", "Marcus Lee", "Elena Rossi", "Sam Okafor"];
const CAN = ["Liam Tremblay", "Chloé Gagnon", "Noah Wilson", "Olivia Chen", "Ethan MacLeod"];
/* The centre grid's people: each row's name cell, without the row number. */
const peopleNames = () => within(screen.getByRole("list", { name: "People" })).queryAllByRole("listitem")
  .flatMap((li) => within(li).queryAllByRole("button").slice(0, 1)).map((b) => b.textContent?.replace(/^\d+/, "") ?? "");
const props = () => screen.getByRole("complementary", { name: "Properties" });

const openWorkforce = async (user: ReturnType<typeof setup>["user"]) => {
  await user.click(screen.getByRole("button", { name: "Operational" }));
  await user.click(screen.getByRole("tab", { name: "Workforce" }));
  expect(screen.getByRole("tab", { name: /Workforce Plans$/ })).toHaveAttribute("aria-selected", "true");
};

describe("Fixture A · Company", () => {
  it("columns are Name / Code, Short Name, Description, Company Region, Status", () => {
    setup();
    const grid = screen.getByRole("list", { name: "Companies" });
    const head = grid.previousElementSibling!;
    expect([...head.querySelectorAll("span.truncate")].map((s) => s.textContent))
      .toEqual(["Name / Code", "Short Name", "Description", "Company Region", "Status"]);
    expect(within(grid).getAllByRole("listitem")).toHaveLength(8);
    expect(within(grid).getAllByRole("listitem")[1]).toHaveTextContent("Acme NA");
  });

  it("DATA: the single Model is a locked dropdown; neither Add nor Assign is offered", () => {
    setup();
    expectLockedModel("Company");
    expect(screen.queryByRole("button", { name: /^Add / })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Assign/ })).not.toBeInTheDocument();
  });

  it("DATA: clicking a company opens its own pane and never repeats it as a one-row list", async () => {
    const { user } = setup();
    await user.click(within(leftList()).getByRole("button", { name: /^Acme Holdings Inc\./ }));
    expect(within(props()).getByRole("heading", { name: "Acme Holdings Inc." })).toBeInTheDocument();
    const grid = screen.getByRole("list", { name: "Companies" });
    expect(within(grid).getAllByRole("listitem")).toHaveLength(8);
    expect(within(grid).getAllByText("Acme Holdings Inc.")).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" }))
      .toHaveTextContent("Dimensions›Company›Companies›Company›Acme Holdings Inc.");
  });

  it("MODEL: Add Company is offered", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    expect(screen.getAllByRole("button", { name: "Add Company" })[0]).toBeEnabled();
  });

  it("Company Regions: a blank Short Name falls back to Name / Code, marked as a fallback", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("tab", { name: "Company Regions" }));
    const na = within(screen.getByRole("list", { name: "Company Regions" })).getAllByRole("listitem")[1];
    expect(na).toHaveTextContent("North America");
    expect(within(na).getByTitle("No Short Name — falls back to Name / Code")).toHaveTextContent("North America");
  });
});

describe("Company Regions · child structure", () => {
  it("one Model shown as a locked dropdown; Add Company Region in MODEL only", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("tab", { name: "Company Regions" }));
    expectLockedModel("Company Region");
    expect(screen.queryByRole("button", { name: /^Add / })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    expect(screen.getAllByRole("button", { name: "Add Company Region" })[0]).toBeEnabled();
  });

  it("L100 structure configuration opens on the declared Structure Type", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Platform/ }));
    for (const [tab, declared] of [["Company Regions", "Child"], ["Companies", "Parent"]] as const) {
      await user.click(screen.getByRole("button", { name: `${tab} options` }));
      await user.click(screen.getByRole("menuitem", { name: /Edit/ }));
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByRole("radio", { name: declared })).toBeChecked();
      await user.keyboard("{Escape}");
    }
  });

  it("a blank description reads Not supplied, never a dash", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    await user.click(within(leftPane()).getByRole("button", { name: "Add Company" }));
    const dialog = screen.getByRole("dialog", { name: "New company" });
    await user.type(within(dialog).getByRole("textbox", { name: "Name / Code" }), "Acme France SAS");
    await user.click(within(dialog).getByRole("button", { name: "Create company" }));
    await user.click(screen.getByRole("button", { name: /Show all records|Show all members/ }));
    const row = within(screen.getByRole("list", { name: "Companies" })).getAllByRole("listitem").at(-1)!;
    expect(row).toHaveTextContent("Acme France SAS");
    expect(row).toHaveTextContent("Not supplied");
  });
});

/* One Model: the Model dropdown is there, locked to it (Jam, 30 Sep). */
const expectLockedModel = (name: string) => {
  const model = within(leftPane()).getByRole("combobox", { name: "Model" });
  expect(model).toBeDisabled();
  expect(model).toHaveDisplayValue(name);
  expect(model).toHaveAccessibleDescription("Locked: this structure has only one Model");
};

/* The chip's two halves are separate hover targets, so match on the chip's whole text. */
const chip = (t: string) => within(leftPane()).getByText((_, el) => el?.tagName === "SPAN" && el.textContent === t && el.children.length === 2);

describe("Model | Record context (Jams, 30 Sep and 1 Oct)", () => {
  it("a single-Model dimension is all Models: Company and Company Regions read Model in both modes", async () => {
    const { user } = setup();
    expect(chip("Model | Parent")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    expect(chip("Model | Parent")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Company Regions" }));
    expect(chip("Model | Child")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "DATA" }));
    expect(chip("Model | Child")).toBeInTheDocument();
  });

  it("Workforce: Model at All Models; Record once a plan is chosen, and the View card names the plan", async () => {
    const { user } = setup();
    await openWorkforce(user);
    expect(chip("Model | Parent")).toBeInTheDocument();
    expect(within(leftPane()).getByRole("button", { name: /^Workforce Plans: Master list/ })).toBeInTheDocument();
    /* Opening a plan from the list leaves the left pane on the Models. */
    await user.click(within(leftList()).getByRole("button", { name: "Workforce USA" }));
    expect(chip("Model | Parent")).toBeInTheDocument();
    /* Choosing it in the dropdown makes the items Records. */
    await user.selectOptions(within(leftPane()).getByRole("combobox", { name: "Model" }), "wf-usa");
    expect(chip("Record | Parent")).toBeInTheDocument();
    expect(within(leftPane()).getByRole("button", { name: /^Workforce USA: Master list/ })).toBeInTheDocument();
  });

  it("at All Models, choosing a plan in the centre lists its people there", async () => {
    const { user } = setup();
    await openWorkforce(user);
    const grid = () => screen.getByRole("list", { name: /^(Workforce Plans|People)$/ });
    await user.click(within(grid()).getByRole("button", { name: /Workforce USA/ }));
    expect(peopleNames()).toEqual(USA);
  });
});

describe("Structures: add and edit read like a member's Identity", () => {
  it("New Model Category opens the Identity card and adds the tab", async () => {
    const { user } = setup();
    await openWorkforce(user);
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    await user.click(screen.getByRole("button", { name: "New Model Category" }));
    const dialog = screen.getByRole("dialog", { name: "New model category" });
    for (const f of ["Name / Code", "Short Name", "Description", "Memo"]) expect(within(dialog).getByRole("textbox", { name: f })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Create model category" }));
    expect(within(dialog).getByText("Enter a name for this model category.")).toBeInTheDocument();
    await user.type(within(dialog).getByRole("textbox", { name: "Name / Code" }), "Contractor Plans");
    await user.click(within(dialog).getByRole("button", { name: "Create model category" }));
    expect(screen.getByRole("tab", { name: /Contractor Plans$/ })).toHaveAttribute("aria-selected", "true");
  });
});

describe("Fixture B · Workforce", () => {
  it("MODEL: the two plans are the Records; Add Workforce Plan is offered", async () => {
    const { user } = setup();
    await openWorkforce(user);
    await user.click(screen.getByRole("button", { name: "MODEL" }));
    expectLockedModel("Workforce Plan");
    expect(leftNames()).toEqual(["Workforce USA", "Workforce Canada"]);
    expect(screen.getAllByRole("button", { name: "Add Workforce Plan" })[0]).toBeEnabled();
  });

  it("DATA before a Model is chosen: All Models, the Models listed, Add Person disabled, no people", async () => {
    const { user } = setup();
    await openWorkforce(user);
    const model = within(leftPane()).getByRole("combobox", { name: "Model" });
    expect(model).toHaveValue("all");
    expect([...(model as HTMLSelectElement).options].map((o) => o.text)).toEqual(["All Models", "Workforce USA", "Workforce Canada"]);
    expect(leftNames()).toEqual(["Workforce USA", "Workforce Canada"]);
    for (const b of screen.getAllByRole("button", { name: "Add Person" })) expect(b).toBeDisabled();
    expect(within(props()).queryByText("Dave")).not.toBeInTheDocument();
    expect(within(props()).getByRole("heading", { name: "Master list" })).toBeInTheDocument();
  });

  it("DATA: a plan clicked in the list opens in the grid only; the dropdown stays on All Models", async () => {
    const { user } = setup();
    await openWorkforce(user);
    await user.click(within(leftList()).getByRole("button", { name: "Workforce USA" }));
    expect(within(leftPane()).getByRole("combobox", { name: "Model" })).toHaveValue("all");
    expect(peopleNames()).toEqual(USA);
    expect(leftNames()).toEqual(["Workforce USA", "Workforce Canada"]);
    expect(within(leftList()).getByRole("button", { name: "Workforce USA" })).toHaveAttribute("aria-current", "true");
    for (const b of screen.getAllByRole("button", { name: "Add Person" })) expect(b).toBeEnabled();
    /* A second click closes it: back to the plans. */
    await user.click(within(leftList()).getByRole("button", { name: "Workforce USA" }));
    expect(screen.getByRole("list", { name: "Workforce Plans" })).toBeInTheDocument();
  });

  it("DATA: choosing Workforce USA in the dropdown lists its people on the left; a person's drivers open on the right", async () => {
    const { user } = setup();
    await openWorkforce(user);
    await user.selectOptions(within(leftPane()).getByRole("combobox", { name: "Model" }), "wf-usa");
    expect(leftNames()).toEqual(USA);
    expect(peopleNames()).toEqual(USA);
    /* Back returns to the plans; the first plan is never re-picked on the way. */
    await user.click(within(leftPane()).getByRole("button", { name: "All models" }));
    expect(leftNames()).toEqual(["Workforce USA", "Workforce Canada"]);
    expect(within(leftPane()).getByText("Choose a workforce plan")).toBeInTheDocument();
    await user.selectOptions(within(leftPane()).getByRole("combobox", { name: "Model" }), "wf-usa");

    await user.click(within(leftList()).getByRole("button", { name: "Dave" }));
    const pane = props();
    expect(within(pane).getByRole("heading", { name: "Dave" })).toBeInTheDocument();
    expect(within(pane).getByText("Salary").nextElementSibling).toHaveTextContent("95,000");
    expect(within(pane).getByText("Hours worked").nextElementSibling).toHaveTextContent("2,080");
    expect(within(pane).getByText("Hourly rate").nextElementSibling).toHaveTextContent("45.67");
    /* Nothing the fixture does not supply. */
    expect(within(pane).queryByRole("textbox", { name: "Description" })).not.toBeInTheDocument();
    expect(within(pane).queryByRole("button", { name: /System Details/i })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" }))
      .toHaveTextContent("Operational›Workforce›Workforce Plans›Workforce USA›Dave");

    await user.click(within(leftList()).getByRole("button", { name: "Priya Shah" }));
    expect(within(props()).getByText("Hourly rate").nextElementSibling).toHaveTextContent("53.85");
  });

  it("DATA: a person picked in the left pane shows only that person's drivers — no list of people", async () => {
    const { user } = setup();
    await openWorkforce(user);
    await user.selectOptions(within(leftPane()).getByRole("combobox", { name: "Model" }), "wf-usa");
    await user.click(within(leftList()).getByRole("button", { name: "Dave" }));
    const detail = screen.getByRole("region", { name: "Details: Dave" });
    expect(screen.queryByRole("list", { name: "People" })).not.toBeInTheDocument();
    expect(screen.queryByRole("separator", { name: "Resize drivers grid" })).not.toBeInTheDocument();
    const grid = within(detail).getByRole("table", { name: "Dave drivers" });
    expect(within(grid).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Driver", "Value", "Source"]);
    const row = (field: string) => within(grid).getByRole("rowheader", { name: field }).closest("tr")!;
    expect(row("Salary")).toHaveTextContent(/^Salary95,000$/);
    expect(row("Hourly rate")).toHaveTextContent("Hourly rate45.67Derived · Salary ÷ Hours worked");
    /* Back returns to the list. */
    await user.click(within(detail).getByRole("button", { name: "Back to all people" }));
    expect(peopleNames()).toEqual(USA);
  });

  it("DATA: a drilled-in plan splits the work area — people on top, the picked person's drivers below", async () => {
    const { user } = setup();
    await openWorkforce(user);
    await user.selectOptions(within(leftPane()).getByRole("combobox", { name: "Model" }), "wf-usa");
    /* Top grid: records only, no driver columns. */
    expect(peopleNames()).toEqual(USA);
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
    expect(screen.getByRole("separator", { name: "Resize drivers grid" })).toHaveAttribute("aria-orientation", "horizontal");
    expect(within(screen.getByRole("region", { name: "Details" })).getByText("Select a person above to see their drivers.")).toBeInTheDocument();

    await user.click(within(screen.getByRole("list", { name: "People" })).getByRole("button", { name: "Jack" }));
    const drivers = screen.getByRole("table", { name: "Jack drivers" });
    const row = (f: string) => within(drivers).getByRole("rowheader", { name: f }).closest("tr")!;
    expect(row("Salary")).toHaveTextContent(/^Salary78,500$/);
    expect(row("Hours worked")).toHaveTextContent(/^Hours worked1,950$/);
    expect(row("Hourly rate")).toHaveTextContent("Hourly rate40.26Derived · Salary ÷ Hours worked");

    /* Details fold to their header: no table, no splitter; open again restores both. */
    const toggle = screen.getByRole("button", { name: "Details" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("table", { name: "Jack drivers" })).not.toBeInTheDocument();
    expect(screen.queryByRole("separator", { name: "Resize drivers grid" })).not.toBeInTheDocument();
    await user.click(toggle);
    expect(screen.getByRole("table", { name: "Jack drivers" })).toBeInTheDocument();
  });

  it("DATA: Workforce Canada lists its own (dummy) people; Add Person enabled", async () => {
    const { user } = setup();
    await openWorkforce(user);
    await user.selectOptions(within(leftPane()).getByRole("combobox", { name: "Model" }), "wf-can");
    expect(leftNames()).toEqual(CAN);
    for (const b of screen.getAllByRole("button", { name: "Add Person" })) expect(b).toBeEnabled();
  });

  it("Add Person joins the chosen plan only", async () => {
    const { user } = setup();
    await openWorkforce(user);
    await user.selectOptions(within(leftPane()).getByRole("combobox", { name: "Model" }), "wf-can");
    await user.click(within(leftPane()).getByRole("button", { name: "Add Person" }));
    const dialog = screen.getByRole("dialog", { name: "New person" });
    expect(dialog).toHaveTextContent("Workforce Canada");
    await user.type(within(dialog).getByRole("textbox", { name: "Name / Code" }), "Maria");
    await user.click(within(dialog).getByRole("button", { name: "Create person" }));
    expect(leftNames()).toEqual([...CAN, "Maria"]);
    await user.selectOptions(within(leftPane()).getByRole("combobox", { name: "Model" }), "wf-usa");
    expect(leftNames()).toEqual(USA);
    await user.selectOptions(within(leftPane()).getByRole("combobox", { name: "Model" }), "all");
    expect(leftNames()).toEqual(["Workforce USA", "Workforce Canada"]);
  });
});
