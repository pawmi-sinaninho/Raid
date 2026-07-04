import type { HTMLAttributes } from "react";

interface RaidweaveMarkProps extends HTMLAttributes<HTMLSpanElement> {
  compact?: boolean;
  label?: string;
}

export function RaidweaveMark({ compact = false, label = "RAIDWEAVE", className = "", ...props }: RaidweaveMarkProps) {
  return (
    <span className={`rw-mark ${compact ? "rw-mark-compact" : ""} ${className}`.trim()} {...props}>
      <svg className="rw-mark-sigil" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 2.8 29.2 16 16 29.2 2.8 16 16 2.8Z" />
        <path d="m9.6 16 6.4-6.4 6.4 6.4-6.4 6.4L9.6 16Z" />
        <path d="M2.8 16h6.8m12.8 0h6.8M16 2.8v6.8m0 12.8v6.8" />
      </svg>
      {!compact && <span>{label}</span>}
    </span>
  );
}
