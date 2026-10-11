import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentsPage } from "../ui-docs/ComponentsPage";
import { ENTRIES } from "../ui-docs/entries";

describe("Components page", () => {
  it("documents every entry with a preview, copyable code and a props table", () => {
    render(<ComponentsPage />);
    for (const e of ENTRIES) {
      const section = screen.getByRole("region", { name: new RegExp(`^${e.name}`) });
      expect(within(section).getAllByText(/^import \{/).length).toBeGreaterThan(0);
      expect(within(section).getAllByRole("button", { name: /to clipboard/ }).length).toBeGreaterThanOrEqual(2);
      expect(within(section).getAllByRole("table").length).toBeGreaterThanOrEqual(e.props.length);
    }
  });

  it("the mode switch recolours the page through data-mode", async () => {
    const user = userEvent.setup();
    const { container } = render(<ComponentsPage />);
    expect(container.firstElementChild).toHaveAttribute("data-mode", "DATA");
    await user.click(screen.getByRole("radio", { name: "MODEL" }));
    expect(container.firstElementChild).toHaveAttribute("data-mode", "MODEL");
    expect(document.documentElement.dataset.mode).toBe("MODEL");
  });

  it("the filter narrows the component list", async () => {
    const user = userEvent.setup();
    render(<ComponentsPage />);
    await user.type(screen.getByRole("searchbox", { name: "Filter components" }), "splitter");
    const nav = screen.getByRole("navigation", { name: "Components" });
    expect(within(nav).getByRole("link", { name: "Splitter" })).toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Button" })).not.toBeInTheDocument();
  });
});
