import { useEffect, useState } from "react";
import { AppShell } from "./shell/AppShell";
import { StyleguidePage } from "./styleguide/StyleguidePage";

const isStyleguide = () => location.hash === "#styleguide";

/* The product is the shell. The styleguide is a reference page at #styleguide. */
export function App() {
  const [styleguide, setStyleguide] = useState(isStyleguide);
  useEffect(() => {
    const onHash = () => setStyleguide(isStyleguide());
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);
  return styleguide ? <StyleguidePage /> : <AppShell />;
}
