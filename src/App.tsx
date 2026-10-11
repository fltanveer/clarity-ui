import { lazy, Suspense, useEffect, useState } from "react";
import { AppShell } from "./shell/AppShell";
import { SettingsProvider } from "./settings/SettingsProvider";

/* Reference pages load only when opened, so the product bundle stays lean. */
const StyleguidePage = lazy(() => import("./styleguide/StyleguidePage").then((m) => ({ default: m.StyleguidePage })));
const ComponentsPage = lazy(() => import("./ui-docs/ComponentsPage").then((m) => ({ default: m.ComponentsPage })));

type Route = "app" | "styleguide" | "components";
const route = (): Route => location.hash === "#styleguide" ? "styleguide"
  : location.hash.startsWith("#components") ? "components" : "app";

/* The product is the shell. Reference pages: #styleguide (tokens), #components (component library). */
export function App() {
  const [page, setPage] = useState(route);
  useEffect(() => {
    const onHash = () => setPage(route());
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);
  return (
    <SettingsProvider>
      {page === "app" ? <AppShell />
        : <Suspense fallback={null}>{page === "styleguide" ? <StyleguidePage /> : <ComponentsPage />}</Suspense>}
    </SettingsProvider>
  );
}
