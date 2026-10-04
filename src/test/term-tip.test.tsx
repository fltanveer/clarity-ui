import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "../shell/AppShell";

describe("TermTip", () => {
  it("names the system term on hover and clears when the pointer leaves", async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.hover(screen.getByRole("tab", { name: "Company" }));
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveTextContent("Domain");
    expect(screen.getByRole("tab", { name: "Company" })).toHaveAttribute("aria-describedby", tip.id);

    await user.hover(screen.getByRole("tab", { name: "Companies" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Domain Structure");

    await user.unhover(screen.getByRole("tab", { name: "Companies" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows on keyboard focus and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    screen.getByRole("tab", { name: "Company" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tooltip")).toHaveTextContent("Domain");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
