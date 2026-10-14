import { Ban, CheckCircle2, Clock, PauseCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";

export type StatusTone = "success" | "warning" | "destructive" | "info" | "neutral";

const STATUS_MAP: Record<string, { label: string; tone: StatusTone; icon: typeof CheckCircle2 }> = {
  issued: { label: "Issued", tone: "success", icon: CheckCircle2 },
  active: { label: "Active", tone: "success", icon: CheckCircle2 },
  approved: { label: "Approved", tone: "success", icon: CheckCircle2 },
  verified: { label: "Verified", tone: "success", icon: CheckCircle2 },
  valid: { label: "Valid", tone: "success", icon: CheckCircle2 },
  pending: { label: "Pending", tone: "warning", icon: Clock },
  hold: { label: "On hold", tone: "warning", icon: PauseCircle },
  invited: { label: "Invited", tone: "info", icon: Clock },
  revoked: { label: "Revoked", tone: "destructive", icon: Ban },
  rejected: { label: "Rejected", tone: "destructive", icon: Ban },
  error: { label: "Error", tone: "destructive", icon: Ban },
  expired: { label: "Expired", tone: "neutral", icon: Clock },
  archived: { label: "Archived", tone: "neutral", icon: Clock },
  inactive: { label: "Inactive", tone: "neutral", icon: PauseCircle },
  duplicate: { label: "Duplicate", tone: "warning", icon: PauseCircle },
  removed: { label: "Removed", tone: "neutral", icon: Ban },
};

const FALLBACK = { label: "Unknown", tone: "neutral" as StatusTone, icon: PauseCircle };

export interface StatusBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  status?: string | null;
  label?: string;
  showIcon?: boolean;
}

/**
 * StatusBadge
 * Shared status pill. Centralizes the per-page status→variant configs so
 * Registry / AccessControl / Import can migrate to one mapping later.
 * Unknown statuses fall back to neutral instead of crashing.
 */
export function StatusBadge({ status, label, showIcon = true, className, ...props }: StatusBadgeProps) {
  const key = (status ?? "").toLowerCase();
  const entry = STATUS_MAP[key] ?? FALLBACK;
  const Icon = entry.icon;

  return (
    <Badge variant={entry.tone} className={cn(className)} {...props}>
      {showIcon ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
      {label ?? entry.label}
    </Badge>
  );
}
