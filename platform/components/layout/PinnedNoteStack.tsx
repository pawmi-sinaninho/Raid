import type { ReactNode } from "react";

export function PinnedNoteStack({ eyebrow, title, children, footer }: { eyebrow: string; title: string; children: ReactNode; footer?: ReactNode }) {
  return <aside className="decision-stack material-sheet"><span className="kicker">{eyebrow}</span><h2>{title}</h2><div className="decision-notes">{children}</div>{footer && <footer>{footer}</footer>}</aside>;
}
