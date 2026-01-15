import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { intensityToGlow, type Intensity } from "@/lib/intensityGlow"

export interface GlassCardProps extends React.ComponentProps<typeof Card> {
  variant?: "default" | "raised" | "blue"
  animated?: boolean
  hover?: boolean
  glowIntensity?: Intensity
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
      glowIntensity,
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
          glowIntensity && intensityToGlow(glowIntensity),
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
