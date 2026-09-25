/* Demo record data shared by the properties pane and member configuration. */
export interface NoteRecord { title: string; body: string; by: string; on: string }
export interface AttachmentRecord { name: string; size: string; by: string; on: string }

export const NOTES: NoteRecord[] = [
  { title: "Reclassified for FY26", body: "Moved under the operating segment for FY26 reporting.", by: "Penny Ledger", on: "04 Aug 2026" },
  { title: "Opening balance agreed", body: "Opening balance agreed to bank confirmation.", by: "Cash King", on: "21 Jul 2026" },
];

export const ATTACHMENTS: AttachmentRecord[] = [
  { name: "Bank_reconciliation_Jul26.pdf", size: "214 KB", by: "Cash King", on: "21 Jul 2026" },
  { name: "Opening_balance_support.xlsx", size: "38 KB", by: "Penny Ledger", on: "04 Aug 2026" },
];

export const initials = (name: string) =>
  name.split(/[\s.]+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
