/* Rewrites the generated tables in docs/02-styleguide.md between AUTO markers. */
import { readFileSync, writeFileSync } from "node:fs";

const j = JSON.parse(readFileSync(new URL("../src/styleguide/colors.generated.json", import.meta.url)));
const docUrl = new URL("../docs/02-styleguide.md", import.meta.url);

const blocks = {
  primitives: ["| Primitive | Hex |", "|---|---|",
    ...Object.entries(j.primitives).map(([k, v]) => `| \`${k}\` | ${v} |`)].join("\n"),
  roles: ["| Role | Primitive | Hex |", "|---|---|---|",
    ...Object.entries(j.roles).map(([r, ref]) => `| \`${r}\` | \`${ref}\` | ${j.primitives[ref]} |`)].join("\n"),
  modes: [`| Role | ${j.modes.join(" | ")} |`, `|---|${j.modes.map(() => "---").join("|")}|`,
    ...Object.keys(j.modeRoles[j.modes[0]]).map((r) =>
      `| \`${r}\` | ${j.modes.map((m) => j.primitives[j.modeRoles[m][r]]).join(" | ")} |`)].join("\n"),
  pairs: ["| Mode | Pair | Ratio | Min | Result |", "|---|---|---|---|---|",
    ...j.report.map((x) => `| ${x.mode} | \`${x.fg}\` on \`${x.bg}\` | ${x.ratio.toFixed(2)} | ${x.min} | ${x.pass ? "Pass" : "**FAIL**"} |`)].join("\n"),
};

let doc = readFileSync(docUrl, "utf8");
const missing = [];
for (const [name, table] of Object.entries(blocks)) {
  const re = new RegExp(`(<!-- AUTO:${name} -->)[\\s\\S]*?(<!-- /AUTO:${name} -->)`);
  if (!re.test(doc)) { missing.push(name); continue; }
  doc = doc.replace(re, () => `<!-- AUTO:${name} -->\n${table}\n<!-- /AUTO:${name} -->`);
}
writeFileSync(docUrl, doc);
if (missing.length) throw new Error(`docs/02-styleguide.md is missing AUTO markers: ${missing.join(", ")}`);
console.log(`docs: synced ${Object.keys(blocks).length} tables (${j.report.length} checks)`);
