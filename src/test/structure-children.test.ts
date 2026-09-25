import { CHILD_STRUCTURES, childrenOf } from "../lib/nav";
import { schemaSectionsFor } from "../lib/properties";
import { OPTIONS } from "../lib/members";

describe("child structures", () => {
  it("each child adds a dropdown to its parent's Classification, after the parent's own fields", () => {
    const fields = schemaSectionsFor("Companies", "Company").find((s) => s.id === "class")!.fields.map((f) => f.l);
    expect(fields).toEqual(["Functional Currency", "Calendar", "Company Region"]);
    expect(OPTIONS["Company Region"]).toContain("Asia Pacific");
  });

  it("children add their fields in structure-bar tab order", () => {
    CHILD_STRUCTURES["Company:IC Elimination Groups"] = { parent: "Companies", field: "IC Elimination Group" };
    try {
      expect(childrenOf("Company", "Companies").map((c) => c.field)).toEqual(["IC Elimination Group", "Company Region"]);
    } finally {
      delete CHILD_STRUCTURES["Company:IC Elimination Groups"];
    }
  });
});
