import type { HTMLAttributes, ReactNode } from "react";

export function RouteFrame({ label, title, action, children, className = "", ...props }: HTMLAttributes<HTMLElement> & { label: string; title: string; action?: ReactNode }) {
  return (
    <section className={`route-frame material-sheet ${className}`.trim()} {...props}>
      <header className="material-heading"><div><span className="kicker">{label}</span><h2>{title}</h2></div>{action}</header>
      {children}
    </section>
  );
}
