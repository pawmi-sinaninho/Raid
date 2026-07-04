import type { HTMLAttributes, ReactNode } from "react";

export function PinnedNote({ title, children, level = "attention", action, className = "", ...props }: HTMLAttributes<HTMLElement> & { title: string; level?: string; action?: ReactNode }) {
  return (
    <article className={`pinned-note note-${level.toLowerCase()} ${className}`.trim()} {...props}>
      <span className="note-pin" aria-hidden="true" />
      <h3>{title}</h3>
      <div className="pinned-note-copy">{children}</div>
      {action && <div className="pinned-note-action">{action}</div>}
    </article>
  );
}
