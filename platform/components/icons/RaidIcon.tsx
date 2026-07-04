import type { SVGProps } from "react";

export type RaidIconName =
  | "weave" | "route" | "transfer" | "lock" | "check" | "warning" | "person" | "team"
  | "leaf" | "garden" | "guardian" | "crown" | "life" | "depth" | "lumen" | "pressure"
  | "cargo" | "unique" | "return" | "mission" | "raid" | "alerts" | "copy" | "chevron";

const paths: Record<RaidIconName, React.ReactNode> = {
  weave: <><path d="M12 2 22 12 12 22 2 12 12 2Z"/><path d="m7.5 12 4.5-4.5 4.5 4.5-4.5 4.5L7.5 12Z"/></>,
  route: <><circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 17c4-1 3-7 7-8l3-1"/></>,
  transfer: <><path d="M3 12h16"/><path d="m14 7 5 5-5 5"/><circle cx="4" cy="12" r="2"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  check: <path d="m4 12 5 5L20 6"/>,
  warning: <><path d="M12 3 22 21H2L12 3Z"/><path d="M12 9v5m0 3v.2"/></>,
  person: <><circle cx="12" cy="8" r="4"/><path d="M4 22c.7-5 3.4-7 8-7s7.3 2 8 7"/></>,
  team: <><circle cx="8" cy="9" r="3"/><circle cx="17" cy="9" r="3"/><path d="M2 21c.5-4 2.4-6 6-6s5.5 2 6 6m0-5c1-.7 2-1 3-1 3 0 4.5 2 5 6"/></>,
  leaf: <><path d="M20 4C11 4 5 8 5 15c0 3 2 5 5 5 7 0 10-7 10-16Z"/><path d="M6 20c3-5 7-8 12-12"/></>,
  garden: <><path d="M3 20c4-5 7-8 9-16 2 8 5 11 9 16"/><path d="M5 16h14M8 11h8"/></>,
  guardian: <><path d="M12 2 20 6v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-4Z"/><path d="m8 12 3 3 5-6"/></>,
  crown: <><path d="m3 7 5 5 4-8 4 8 5-5-2 12H5L3 7Z"/><path d="M5 19h14"/></>,
  life: <><path d="M12 21S3 16 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 12-9 12Z"/></>,
  depth: <><path d="M12 2v18"/><path d="m7 15 5 5 5-5"/><path d="M5 5h14M7 9h10"/></>,
  lumen: <><path d="M8 17h8m-7 4h6"/><path d="M12 3a7 7 0 0 0-4 12c1 1 1 2 1 2h6s0-1 1-2a7 7 0 0 0-4-12Z"/></>,
  pressure: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5m0 8v5M3 12h5m8 0h5"/></>,
  cargo: <><path d="M3 8h18v13H3V8Z"/><path d="M7 8V4h10v4M3 13h18M10 13v3h4v-3"/></>,
  unique: <><path d="M12 2 21 8v8l-9 6-9-6V8l9-6Z"/><path d="m12 6 2 4 4 .5-3 3 .8 4.5-3.8-2-3.8 2 .8-4.5-3-3 4-.5 2-4Z"/></>,
  return: <><path d="M7 8H3l4-4"/><path d="M4 8h10a7 7 0 1 1-6 11"/></>,
  mission: <><path d="M6 3h12v18H6V3Z"/><path d="M9 8h6m-6 4h6m-6 4h4"/></>,
  raid: <><path d="M3 18c4-7 8-10 18-12"/><circle cx="6" cy="16" r="2"/><circle cx="13" cy="10" r="2"/><circle cx="20" cy="6" r="2"/></>,
  alerts: <><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Z"/><path d="M10 20h4"/></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="1"/><path d="M16 8V4H4v12h4"/></>,
  chevron: <path d="m8 4 8 8-8 8"/>
};

export function RaidIcon({ name, className = "", ...props }: SVGProps<SVGSVGElement> & { name: RaidIconName }) {
  return <svg className={`raid-icon ${className}`.trim()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
