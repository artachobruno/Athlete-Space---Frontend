import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.ComponentProps<typeof Card> {
  variant?: "default" | "raised" | "blue"
  animated?: boolean
  hover?: boolean
}

export const GlassCard = React.forwardRef<
  HTMLDivElement,
  GlassCardProps
>(
  (
    {
      className,
      variant = "default",
      animated = true,
      hover = false,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "glass-card",
          animated && "glass-animate glass-focus",
          hover && "glass-hover",
          variant === "raised" && "glass-card--raised",
          variant === "blue" && "glass-card--blue",
          className
        )}
        {...props}
      />
    )
  }
)

GlassCard.displayName = "GlassCard"

// Export card sub-components for backward compatibility
export { CardContent, CardHeader, CardTitle, CardDescription, CardFooter }
