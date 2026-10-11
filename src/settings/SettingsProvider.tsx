import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { currentCompany, type CompanyRole } from "../lib/session";
import { DEFAULTS, type CompanySettings } from "./schema";
import { browserStore, type SettingsStore } from "./store";
import { brandCss, railTone } from "./brand";

export interface SettingsContextValue {
  company: { id: string; name: string };
  /** In effect right now: the admin's unsaved preview while they edit, otherwise the saved settings. */
  settings: CompanySettings;
  /** Last saved settings. */
  saved: CompanySettings;
  /** The signed-in user's role in this company. */
  role: CompanyRole;
  /** Only admins may change company settings. Every editing control checks this. */
  canAdminister: boolean;
  /** Show a draft everywhere without saving it (null ends the preview). */
  preview: (draft: CompanySettings | null) => void;
  /** Save for everyone in the company. Ignored unless canAdminister. */
  save: (next: CompanySettings) => void;
  /** Demo only, until sign-in exists: try the app as another role. */
  demoRole: CompanyRole | null;
  setDemoRole: (role: CompanyRole | null) => void;
}

const fallbackCompany = { id: "default", name: "Your company" };

/* Without a provider (unit tests of one surface) the app runs on defaults with no admin rights. */
const SettingsContext = createContext<SettingsContextValue>({
  company: fallbackCompany, settings: DEFAULTS, saved: DEFAULTS, role: "Member", canAdminister: false,
  preview: () => {}, save: () => {}, demoRole: null, setDemoRole: () => {},
});

export const useSettings = () => useContext(SettingsContext);

const DEMO_ROLE_KEY = "clarity.demoRole";
const readDemoRole = (): CompanyRole | null => {
  try {
    const v = window.sessionStorage.getItem(DEMO_ROLE_KEY);
    return v === "Admin" || v === "Member" ? v : null;
  } catch { return null; }
};

const prefersDark = () => typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;

/*
 * Company settings for the whole app. Theme and density are written to <html>
 * (data-theme, data-density) so portalled overlays follow them too; the CSS
 * variables in colors.generated.css and theme.css do the rest.
 */
export function SettingsProvider({ children, store = browserStore }: { children: ReactNode; store?: SettingsStore }) {
  const company = useMemo(() => { const c = currentCompany(); return { id: c.id, name: c.name, role: c.role }; }, []);
  const [saved, setSaved] = useState(() => store.load(company.id));
  const [draft, setDraft] = useState<CompanySettings | null>(null);
  const [demoRole, setDemoRoleState] = useState(readDemoRole);
  const [systemDark, setSystemDark] = useState(prefersDark);

  const role = demoRole ?? company.role;
  const canAdminister = role === "Admin";
  const settings = draft ?? saved;

  /* Follow the device when the theme is "system". */
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSystemDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const { theme, density } = settings.appearance;
  const dark = theme === "dark" || (theme === "system" && systemDark);
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = dark ? "dark" : "light";
    html.dataset.density = density;
  }, [dark, density]);

  /* Brand colours: derived CSS variables in one <style>, replaced whenever the brand changes. */
  const { brand } = settings;
  useEffect(() => {
    let el = document.getElementById("clarity-brand") as HTMLStyleElement | null;
    if (!el) { el = document.createElement("style"); el.id = "clarity-brand"; document.head.appendChild(el); }
    el.textContent = brandCss(brand);
    document.documentElement.dataset.railTone = railTone(brand);
  }, [brand]);

  const save = useCallback((next: CompanySettings) => {
    if (!canAdminister) return;
    store.save(company.id, next);
    setSaved(next);
    setDraft(null);
  }, [canAdminister, store, company.id]);

  const setDemoRole = useCallback((r: CompanyRole | null) => {
    setDemoRoleState(r);
    setDraft(null);
    try {
      if (r) window.sessionStorage.setItem(DEMO_ROLE_KEY, r); else window.sessionStorage.removeItem(DEMO_ROLE_KEY);
    } catch { /* storage unavailable */ }
  }, []);

  const value = useMemo<SettingsContextValue>(() => ({
    company: { id: company.id, name: company.name }, settings, saved, role, canAdminister,
    preview: setDraft, save, demoRole, setDemoRole,
  }), [company, settings, saved, role, canAdminister, save, demoRole, setDemoRole]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
