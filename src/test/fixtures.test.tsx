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

  it("DATA: the single Model is text, not a picker; neither Add nor Assign is offered", () => {
    setup();
    expect(within(leftPane()).getByText("Company", { selector: "p" })).toBeInTheDocument();
    expect(within(leftPane()).queryByRole("combobox")).not.toBeInTheDocument();
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
  it("one Model shown as text; Add Company Region in MODEL only", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("tab", { name: "Company Regions" }));
    expect(within(leftPane()).getByText("Company Region", { selector: "p" })).toBeInTheDocument();
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
    await user.click(within(leftList()).getByRole("button", { name: "Workforce USA" }));
    expect(chip("Record | Parent")).toBeInTheDocument();
    expect(within(leftPane()).getByRole("button", { name: /^Workforce USA: Master list/ })).toBeInTheDocument();
  });

  it("at All Models, choosing a plan in the centre lists its people there", async () => {
    const { user } = setup();
    await openWorkforce(user);
    const grid = () => screen.getByRole("list", { name: /^(Workforce Plans|People)$/ });
    await user.click(within(grid()).getByRole("button", { name: /Workforce USA/ }));
    expect(within(grid()).getAllByRole("listitem").map((li) => li.textContent)).toEqual([expect.stringContaining("Dave"), expect.stringContaining("Jack")]);
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
    expect(within(leftPane()).getByText("Workforce Plan", { selector: "p" })).toBeInTheDocument();
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

  it("DATA: choosing Workforce USA in the left pane lists Dave and Jack; Dave's values open", async () => {
    const { user } = setup();
    await openWorkforce(user);
    await user.click(within(leftList()).getByRole("button", { name: "Workforce USA" }));
    expect(within(leftPane()).getByRole("combobox", { name: "Model" })).toHaveValue("wf-usa");
    expect(leftNames()).toEqual(["Dave", "Jack"]);
    /* Back returns to the plans; the first plan is never re-picked on the way. */
    await user.click(within(leftPane()).getByRole("button", { name: "All models" }));
    expect(leftNames()).toEqual(["Workforce USA", "Workforce Canada"]);
    expect(within(leftPane()).getByText("Choose a workforce plan")).toBeInTheDocument();
    await user.click(within(leftList()).getByRole("button", { name: "Workforce USA" }));
    for (const b of screen.getAllByRole("button", { name: "Add Person" })) expect(b).toBeEnabled();

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
  });

  it("DATA: Workforce Canada has no people — empty state, none invented, Add Person enabled", async () => {
    const { user } = setup();
    await openWorkforce(user);
    await user.selectOptions(within(leftPane()).getByRole("combobox", { name: "Model" }), "wf-can");
    expect(leftNames()).toEqual([]);
    expect(within(leftPane()).getByText("No people in Workforce Canada.")).toBeInTheDocument();
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
    expect(leftNames()).toEqual(["Maria"]);
    await user.selectOptions(within(leftPane()).getByRole("combobox", { name: "Model" }), "wf-usa");
    expect(leftNames()).toEqual(["Dave", "Jack"]);
    await user.selectOptions(within(leftPane()).getByRole("combobox", { name: "Model" }), "all");
    expect(leftNames()).toEqual(["Workforce USA", "Workforce Canada"]);
  });
});
