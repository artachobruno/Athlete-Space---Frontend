import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Glass card styling - transparent with blur effect
 * Used across the app for consistent visual treatment
 */
const glassCardStyles = "bg-muted/40 border-border/50 shadow-none backdrop-blur-sm";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
));
Card.displayName = "Card";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "raised" | "blue"
  animated?: boolean
  hover?: boolean
  glowIntensity?: string
}

/**
 * GlassCard - Card with transparent glass effect
 * Matches the styling used in History/Schedule pages
 */
const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant: _variant, animated: _animated, hover: _hover, glowIntensity: _glowIntensity, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-lg border text-card-foreground", glassCardStyles, className)} {...props} />
  )
);
GlassCard.displayName = "GlassCard";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, GlassCard, glassCardStyles, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, type GlassCardProps };
