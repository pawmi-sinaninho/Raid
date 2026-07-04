import type { HTMLAttributes, ReactNode } from "react";

export function WorkbenchSheet({ label, title, status, children, footer, className = "", ...props }: HTMLAttributes<HTMLElement> & { label: string; title: string; status?: ReactNode; footer?: ReactNode }) {
  return (
    <article className={`workbench-sheet material-sheet ${className}`.trim()} {...props}>
      <header className="workbench-head"><div><span className="kicker">{label}</span><h3>{title}</h3></div>{status}</header>
      <div className="workbench-body">{children}</div>
      {footer && <footer className="workbench-footer">{footer}</footer>}
    </article>
  );
}
