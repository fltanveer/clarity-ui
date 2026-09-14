import { useCallback, useReducer } from "react";

export type AccessLevel = "none" | "read" | "write";

export interface MemberRow {
  id: string;
  kind: "member";
  name: string;
  down: boolean;
  through: boolean;
  qty: string;
  access: AccessLevel;
  /** Explicit scope. Empty = scoped to all members. */
  scoped: string[];
}

export interface FolderRow {
  id: string;
  kind: "folder";
  name: string;
}

export type Row = MemberRow | FolderRow;

export type AttributeKey = "down" | "through" | "qty" | "access";

/* Monotonic ids: Date.now() collides on a fast double click. */
let seq = 0;
const nextId = (prefix: string) => `${prefix}${++seq}`;

export const newMember = (name: string): MemberRow => ({
  id: nextId("m"), kind: "member", name,
  down: false, through: false, qty: "1", access: "read", scoped: [],
});

export const newFolder = (name = "New folder"): FolderRow => ({
  id: nextId("f"), kind: "folder", name,
});

export interface Removed {
  row: Row;
  index: number;
}

interface State {
  rows: Row[];
  /** Last single-row removal, held so it can be undone. */
  removed: Removed | null;
}

type Action =
  | { type: "toggleMember"; name: string }
  | { type: "setMembers"; names: string[]; assigned: boolean }
  | { type: "addFolder" }
  | { type: "remove"; id: string }
  | { type: "undoRemove" }
  | { type: "dismissUndo" }
  | { type: "clear" }
  | { type: "move"; id: string; toIndex: number }
  | { type: "setAttr"; id: string; key: AttributeKey; value: boolean | string }
  | { type: "toggleScope"; id: string; member: string }
  | { type: "setScope"; id: string; members: string[]; included: boolean };

const isMember = (r: Row, name: string) => r.kind === "member" && r.name === name;

function reducer(state: State, action: Action): State {
  const { rows } = state;
  switch (action.type) {
    case "toggleMember":
      return {
        ...state,
        rows: rows.some((r) => isMember(r, action.name))
          ? rows.filter((r) => !isMember(r, action.name))
          : [...rows, newMember(action.name)],
      };
    case "setMembers": {
      if (action.assigned) {
        const missing = action.names.filter((n) => !rows.some((r) => isMember(r, n)));
        return { ...state, rows: [...rows, ...missing.map(newMember)] };
      }
      const drop = new Set(action.names);
      return { ...state, rows: rows.filter((r) => !(r.kind === "member" && drop.has(r.name))) };
    }
    case "addFolder": {
      const count = rows.filter((r) => r.kind === "folder").length;
      return { ...state, rows: [...rows, newFolder(count ? `New folder ${count + 1}` : "New folder")] };
    }
    case "remove": {
      const index = rows.findIndex((r) => r.id === action.id);
      if (index < 0) return state;
      return { rows: rows.filter((r) => r.id !== action.id), removed: { row: rows[index], index } };
    }
    case "undoRemove": {
      if (!state.removed) return state;
      const next = [...rows];
      next.splice(Math.min(state.removed.index, next.length), 0, state.removed.row);
      return { rows: next, removed: null };
    }
    case "dismissUndo":
      return { ...state, removed: null };
    case "clear":
      return { rows: [], removed: null };
    case "move": {
      const from = rows.findIndex((r) => r.id === action.id);
      const to = Math.max(0, Math.min(action.toIndex, rows.length - 1));
      if (from < 0 || from === to) return state;
      const next = [...rows];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return { ...state, rows: next };
    }
    case "setAttr":
      return {
        ...state,
        rows: rows.map((r) =>
          r.id === action.id && r.kind === "member" ? { ...r, [action.key]: action.value } : r),
      };
    case "toggleScope":
      return {
        ...state,
        rows: rows.map((r) => {
          if (r.id !== action.id || r.kind !== "member") return r;
          const has = r.scoped.includes(action.member);
          return { ...r, scoped: has ? r.scoped.filter((x) => x !== action.member) : [...r.scoped, action.member] };
        }),
      };
    case "setScope":
      return {
        ...state,
        rows: rows.map((r) => {
          if (r.id !== action.id || r.kind !== "member") return r;
          const set = new Set(r.scoped);
          for (const m of action.members) (action.included ? set.add(m) : set.delete(m));
          return { ...r, scoped: [...set] };
        }),
      };
  }
}

export function useAssignment(initial: Row[]) {
  const [state, dispatch] = useReducer(reducer, { rows: initial, removed: null });
  return {
    rows: state.rows,
    removed: state.removed,
    toggleMember: useCallback((name: string) => dispatch({ type: "toggleMember", name }), []),
    setMembers: useCallback((names: string[], assigned: boolean) =>
      dispatch({ type: "setMembers", names, assigned }), []),
    addFolder: useCallback(() => dispatch({ type: "addFolder" }), []),
    remove: useCallback((id: string) => dispatch({ type: "remove", id }), []),
    undoRemove: useCallback(() => dispatch({ type: "undoRemove" }), []),
    dismissUndo: useCallback(() => dispatch({ type: "dismissUndo" }), []),
    clear: useCallback(() => dispatch({ type: "clear" }), []),
    move: useCallback((id: string, toIndex: number) => dispatch({ type: "move", id, toIndex }), []),
    setAttr: useCallback((id: string, key: AttributeKey, value: boolean | string) =>
      dispatch({ type: "setAttr", id, key, value }), []),
    toggleScope: useCallback((id: string, member: string) =>
      dispatch({ type: "toggleScope", id, member }), []),
    setScope: useCallback((id: string, members: string[], included: boolean) =>
      dispatch({ type: "setScope", id, members, included }), []),
  };
}

export type Assignment = ReturnType<typeof useAssignment>;
