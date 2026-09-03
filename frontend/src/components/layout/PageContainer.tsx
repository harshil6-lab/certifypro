import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * PageContainer
 * Shared width + horizontal padding for application pages. Matches the
 * AdminNavbar inner wrapper (max-w-7xl, px-4 sm:px-6) so navigation and page
 * content sit on the same grid and their edges align. Replaces the ad-hoc
 * per-page widths (max-w-[1000px|1200px|1240px|1280px]) that caused content to
 * drift relative to the navbar.
 */
const PageContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mx-auto w-full max-w-7xl px-4 py-8 sm:px-6", className)} {...props} />
  ),
);
PageContainer.displayName = "PageContainer";

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * PageHeader
 * Consistent page title block using the sans product type scale (not serif).
 * `actions` renders trailing controls (buttons) aligned to the title row.
 */
const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, actions, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  ),
);
PageHeader.displayName = "PageHeader";

interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Section
 * Groups related content with an optional heading. Grouping comes from spacing
 * and an optional heading rather than wrapping every block in a floating card.
 */
const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ title, description, actions, className, children, ...props }, ref) => (
    <section ref={ref} className={cn("space-y-4", className)} {...props}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            {title ? (
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
            ) : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  ),
);
Section.displayName = "Section";

export { PageContainer, PageHeader, Section };
