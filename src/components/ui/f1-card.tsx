// Backward compatibility - re-export standard Card components
// The F1 theme has been removed, but we keep this file to avoid breaking imports
import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

// F1Card is now just a styled Card wrapper
interface F1CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "strong" | "flat";
  actionable?: boolean;
  status?: "safe" | "caution" | "danger" | "active";
  glow?: string;
  padding?: "sm" | "md" | "lg" | "none";
}

const paddingClasses: Record<"sm" | "md" | "lg" | "none", string> = {
  none: "p-0",
  sm: "p-2.5",
  md: "p-4",
  lg: "p-6",
};

export const F1Card = React.forwardRef<HTMLDivElement, F1CardProps>(
  ({ className, padding = "md", children, ...props }, ref) => {
    // Strip F1-specific props
    const { variant: _v, actionable: _a, status: _s, glow: _g, ...cardProps } = props;
    return (
      <Card ref={ref} className={cn(paddingClasses[padding], className)} {...cardProps}>
        {children}
      </Card>
    );
  }
);
F1Card.displayName = "F1Card";

// F1CardHeader maps to standard CardHeader
interface F1CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode;
}

export const F1CardHeader = React.forwardRef<HTMLDivElement, F1CardHeaderProps>(
  ({ className, children, action, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-between gap-3 mb-3", className)} {...props}>
      <div className="flex-1">{children}</div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
);
F1CardHeader.displayName = "F1CardHeader";

// F1CardTitle maps to standard CardTitle with smaller size
export const F1CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <CardTitle ref={ref} className={cn("text-base font-semibold", className)} {...props} />
  )
);
F1CardTitle.displayName = "F1CardTitle";

// F1CardLabel is a styled span
export const F1CardLabel = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn("text-xs uppercase tracking-wider text-muted-foreground", className)} {...props} />
  )
);
F1CardLabel.displayName = "F1CardLabel";

// F1CardContent maps to standard CardContent
export const F1CardContent = CardContent;
F1CardContent.displayName = "F1CardContent";

// F1CardFooter maps to standard CardFooter
export const F1CardFooter = CardFooter;
F1CardFooter.displayName = "F1CardFooter";

// F1StatusBadge maps to standard Badge
interface F1StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "safe" | "caution" | "danger" | "active";
  dot?: boolean;
}

const statusToVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  safe: "secondary",
  caution: "outline",
  danger: "destructive",
  active: "default",
};

export const F1StatusBadge = React.forwardRef<HTMLSpanElement, F1StatusBadgeProps>(
  ({ status, dot = true, className, children, ...props }, ref) => (
    <Badge ref={ref} variant={statusToVariant[status]} className={className} {...props}>
      {children}
    </Badge>
  )
);
F1StatusBadge.displayName = "F1StatusBadge";

// Re-export unused F1 components as simple wrappers
export const F1Metric = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("text-2xl font-semibold", className)} {...props}>{children}</div>
  )
);
F1Metric.displayName = "F1Metric";

export const F1Divider = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("h-px bg-border my-4", className)} {...props} />
  )
);
F1Divider.displayName = "F1Divider";
