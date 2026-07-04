import type { HTMLAttributes } from "react";
import { RaidIcon } from "@/components/icons/RaidIcon";

export function StatusStamp({ children, tone = "neutral", className = "", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "active" | "success" | "warning" | "danger" | "source" }) {
  return <span className={`status-stamp stamp-${tone} ${className}`.trim()} {...props}><RaidIcon name={tone === "success" ? "check" : tone === "danger" || tone === "warning" ? "warning" : tone === "source" ? "lock" : "weave"} />{children}</span>;
}
