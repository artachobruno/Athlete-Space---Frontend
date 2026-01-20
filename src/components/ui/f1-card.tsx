import * as React from "react";
import { cn } from "@/lib/utils";

/* ===============================
   F1 Card Component
   Telemetry-grade card surfaces
   =============================== */

type F1CardVariant = "glass" | "strong" | "flat";
type F1CardStatus = "safe" | "caution" | "danger" | "active";
type F1CardGlow = "recovery" | "aerobic" | "tempo" | "threshold" | "vo2";

interface F1CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Surface variant: glass (default), strong (elevated), flat (background) */
  variant?: F1CardVariant;
  /** Enable hover elevation effect for actionable cards */
  actionable?: boolean;
  /** Status indicator - applies background tint and border */
  status?: F1CardStatus;
  /** Intensity glow - training zone visual indicator */
  glow?: F1CardGlow;
  /** Card padding size */
  padding?: "sm" | "md" | "lg" | "none";
}

const variantClasses: Record<F1CardVariant, string> = {
  glass: "f1-surface",
  strong: "f1-surface-strong",
  flat: "f1-surface-flat",
};

const statusClasses: Record<F1CardStatus, string> = {
  safe: "f1-status-safe-bg",
  caution: "f1-status-caution-bg",
  danger: "f1-status-danger-bg",
  active: "f1-status-active-bg",
};

const glowClasses: Record<F1CardGlow, string> = {
  recovery: "f1-glow-recovery",
  aerobic: "f1-glow-aerobic",
  tempo: "f1-glow-tempo",
  threshold: "f1-glow-threshold",
  vo2: "f1-glow-vo2",
};

const paddingClasses: Record<"sm" | "md" | "lg" | "none", string> = {
  none: "",
  sm: "p-2.5",
  md: "p-3.5",
  lg: "p-4",
};

export const F1Card = React.forwardRef<HTMLDivElement, F1CardProps>(
  (
    {
      variant = "glass",
      actionable = false,
      status,
      glow,
      padding = "md",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          actionable && "f1-surface-actionable cursor-pointer",
          status && statusClasses[status],
          glow && glowClasses[glow],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

F1Card.displayName = "F1Card";

/* ===============================
   F1 Card Sub-components
   =============================== */

interface F1CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional action element (button, badge, etc.) */
  action?: React.ReactNode;
}

export const F1CardHeader = React.forwardRef<HTMLDivElement, F1CardHeaderProps>(
  ({ className, children, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between gap-3 mb-3",
          className
        )}
        {...props}
      >
        <div className="flex-1">{children}</div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    );
  }
);

F1CardHeader.displayName = "F1CardHeader";

export const F1CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn("f1-headline f1-headline-md", className)}
      {...props}
    >
      {children}
    </h3>
  );
});

F1CardTitle.displayName = "F1CardTitle";

export const F1CardLabel = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, children, ...props }, ref) => {
  return (
    <span ref={ref} className={cn("f1-label", className)} {...props}>
      {children}
    </span>
  );
});

F1CardLabel.displayName = "F1CardLabel";

export const F1CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("f1-element-gap", className)} {...props}>
      {children}
    </div>
  );
});

F1CardContent.displayName = "F1CardContent";

export const F1CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "mt-4 pt-4 border-t border-[var(--border-subtle)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

F1CardFooter.displayName = "F1CardFooter";

/* ===============================
   F1 Metric Component
   Telemetry-style data display
   =============================== */

type F1MetricSize = "xs" | "sm" | "md" | "lg";

interface F1MetricProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The metric value */
  value: string | number;
  /** Label displayed above the value */
  label?: string;
  /** Unit displayed after the value */
  unit?: string;
  /** Size variant */
  size?: F1MetricSize;
  /** Status color */
  status?: F1CardStatus;
  /** Show trend indicator */
  trend?: "up" | "down" | "stable";
}

const metricSizeClasses: Record<F1MetricSize, string> = {
  xs: "f1-metric f1-metric-xs",
  sm: "f1-metric f1-metric-sm",
  md: "f1-metric f1-metric-md",
  lg: "f1-metric f1-metric-lg",
};

const trendSymbols: Record<"up" | "down" | "stable", string> = {
  up: "↑",
  down: "↓",
  stable: "→",
};

export const F1Metric = React.forwardRef<HTMLDivElement, F1MetricProps>(
  (
    {
      value,
      label,
      unit,
      size = "md",
      status,
      trend,
      className,
      ...props
    },
    ref
  ) => {
    const statusTextClass = status ? `f1-status-${status}` : "";

    return (
      <div ref={ref} className={cn("flex flex-col", className)} {...props}>
        {label && <span className="f1-label mb-1">{label}</span>}
        <div className="flex items-baseline gap-1">
          {trend && (
            <span
              className={cn(
                "f1-metric-sm",
                trend === "up" && "f1-status-safe",
                trend === "down" && "f1-status-danger",
                trend === "stable" && "f1-status-active"
              )}
            >
              {trendSymbols[trend]}
            </span>
          )}
          <span className={cn(metricSizeClasses[size], statusTextClass)}>
            {value}
          </span>
          {unit && (
            <span className="f1-label ml-0.5 self-end mb-0.5">{unit}</span>
          )}
        </div>
      </div>
    );
  }
);

F1Metric.displayName = "F1Metric";

/* ===============================
   F1 Divider Component
   =============================== */

interface F1DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Divider style variant */
  variant?: "subtle" | "glow" | "vertical";
}

export const F1Divider = React.forwardRef<HTMLDivElement, F1DividerProps>(
  ({ variant = "subtle", className, ...props }, ref) => {
    const variantClass =
      variant === "glow"
        ? "f1-divider-glow"
        : variant === "vertical"
        ? "f1-divider-vertical"
        : "f1-divider";

    return (
      <div ref={ref} className={cn(variantClass, className)} {...props} />
    );
  }
);

F1Divider.displayName = "F1Divider";

/* ===============================
   F1 Status Badge Component
   =============================== */

interface F1StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: F1CardStatus;
  /** Show status dot indicator */
  dot?: boolean;
}

export const F1StatusBadge = React.forwardRef<
  HTMLSpanElement,
  F1StatusBadgeProps
>(({ status, dot = true, className, children, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-f1-sm",
        "f1-label-md border",
        statusClasses[status],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            status === "safe" && "bg-[hsl(var(--accent-success))]",
            status === "caution" && "bg-[hsl(var(--accent-warning))]",
            status === "danger" && "bg-[hsl(var(--accent-danger))]",
            status === "active" && "bg-[hsl(var(--accent-telemetry))]"
          )}
        />
      )}
      {children}
    </span>
  );
});

F1StatusBadge.displayName = "F1StatusBadge";
