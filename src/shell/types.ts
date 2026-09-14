export type Mode = "DATA" | "MODEL";

export type GridMode = "reorder" | "delete" | null;

export interface DisplaySettings {
  rowNumbers: boolean;
  gridlines: boolean;
  zebra: boolean;
}

export interface GridColumn {
  id: string;
  label: string;
}

export const DEFAULT_COLUMNS = {
  visible: [
    { id: "name", label: "Name | ID" }, { id: "code", label: "Code" },
    { id: "type", label: "Type" }, { id: "status", label: "Status" },
  ] as GridColumn[],
  available: [
    { id: "desc", label: "Description" }, { id: "owner", label: "Owner" },
    { id: "modified", label: "Last modified" }, { id: "source", label: "Source" },
  ] as GridColumn[],
};
