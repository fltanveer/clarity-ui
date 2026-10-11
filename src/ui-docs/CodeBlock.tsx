import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cx } from "../ui";

/* Clipboard can be blocked (insecure origin, permissions); fall back to a hidden textarea. */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1400);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button type="button" onClick={async () => setDone(await copyText(text))}
      aria-label={done ? "Copied" : `${label} to clipboard`}
      className={cx("inline-flex h-button shrink-0 cursor-pointer items-center gap-1.5 rounded-control px-2 text-caption font-medium transition-[background-color,color] ease-standard",
        done ? "text-success-text" : "text-fg-secondary hover:bg-hover hover:text-fg-primary", className)}>
      {done ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
      {done ? "Copied" : label}
      <span aria-live="polite" className="sr-only">{done ? "Copied to clipboard" : ""}</span>
    </button>
  );
}

/** Code with a filename strip and a copy button. Plain text: what you see is exactly what is copied. */
export function CodeBlock({ code, title = "tsx" }: { code: string; title?: string }) {
  return (
    <div className="overflow-hidden rounded-panel border border-line-subtle bg-shell">
      <div className="flex h-8 items-center justify-between border-b border-line-subtle ps-3 pe-1">
        <span className="font-mono text-caption text-fg-tertiary">{title}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-caption leading-body text-fg-primary"><code>{code}</code></pre>
    </div>
  );
}

/** One-line copyable snippet, e.g. an import or a class name. */
export function InlineCopy({ text }: { text: string }) {
  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-control border border-line-subtle bg-shell ps-2">
      <code className="truncate font-mono text-caption text-fg-primary">{text}</code>
      <CopyButton text={text} label="Copy" className="h-6" />
    </span>
  );
}
