import { useEffect, useRef } from "react";
import { Button } from "../components/Button";

export interface RemoveAllConfirmProps {
  members: number;
  folders: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Inline confirmation. Counts everything the action removes, folders included. */
export function RemoveAllConfirm({ members, folders, onConfirm, onCancel }: RemoveAllConfirmProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);

  const parts = [members && plural(members, "member", "members"), folders && plural(folders, "folder", "folders")]
    .filter(Boolean).join(" and ");

  return (
    <div
      role="group"
      aria-label="Confirm remove all"
      onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onCancel(); } }}
      className="ms-auto flex flex-wrap items-center gap-2"
    >
      <p className="text-ui font-semibold text-danger-text">Remove {parts}?</p>
      <Button variant="danger" onClick={onConfirm}>Remove all</Button>
      <Button ref={cancelRef} variant="secondary" onClick={onCancel}>Cancel</Button>
    </div>
  );
}
