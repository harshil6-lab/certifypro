import * as React from "react";

import { cn } from "@/lib/utils";

export interface SectionCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * SectionCard
 * Flat bordered panel that replaces the copy-pasted
 * "rounded-2xl border bg-card p-6" pattern. Pages migrate to this later;
 * no existing usages are changed in this phase.
 */
const SectionCard = React.forwardRef<HTMLDivElement, SectionCardProps>(
  ({ title, description, actions, className, children, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-lg border bg-card p-5 shadow-elevation-1", className)} {...props}>
      {title || description || actions ? (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  ),
);
SectionCard.displayName = "SectionCard";

export { SectionCard };
