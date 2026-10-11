import { normalize, type CompanySettings } from "./schema";

/*
 * Where company settings live. There is no backend yet, so the browser holds
 * them. A server store implements the same two methods; nothing else in the
 * app changes when it arrives.
 */
export interface SettingsStore {
  load(companyId: string): CompanySettings;
  save(companyId: string, settings: CompanySettings): void;
}

const key = (companyId: string) => `clarity.company.${companyId}.settings`;

/* Storage can be unavailable (private window, blocked site data): fall back to defaults, never throw. */
export const browserStore: SettingsStore = {
  load(companyId) {
    try {
      const raw = window.localStorage.getItem(key(companyId));
      return normalize(raw ? JSON.parse(raw) : null);
    } catch {
      return normalize(null);
    }
  },
  save(companyId, settings) {
    try { window.localStorage.setItem(key(companyId), JSON.stringify(settings)); } catch { /* storage unavailable */ }
  },
};
