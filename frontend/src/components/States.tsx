import * as React from "react";
import { AlertTriangle, Inbox, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface StateShellProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function StateShell({ icon, title, description, action, className, ...props }: StateShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export interface EmptyStateProps extends Omit<StateShellProps, "icon"> {
  icon?: React.ReactNode;
}

/** Friendly placeholder for lists/tables with zero rows. */
export function EmptyState({ icon, title, ...props }: EmptyStateProps) {
  return <StateShell icon={icon ?? <Inbox className="h-5 w-5" aria-hidden="true" />} title={title} {...props} />;
}

export interface ErrorStateProps extends Omit<StateShellProps, "icon"> {
  icon?: React.ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
}

/** Failure placeholder with an optional retry action. */
export function ErrorState({ icon, title, retryLabel = "Try again", onRetry, action, ...props }: ErrorStateProps) {
  return (
    <StateShell
      icon={icon ?? <AlertTriangle className="h-5 w-5" aria-hidden="true" />}
      title={title}
      action={
        action ??
        (onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {retryLabel}
          </Button>
        ) : undefined)
      }
      {...props}
    />
  );
}

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  labelledBy?: string;
}

/** Skeleton placeholder for loading tables/lists. */
export function LoadingState({ rows = 5, labelledBy, className, ...props }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-labelledby={labelledBy}
      className={cn("space-y-2", className)}
      {...props}
    >
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-9 w-full" />
      ))}
    </div>
  );
}
