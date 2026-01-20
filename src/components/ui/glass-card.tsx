import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface GlassCardProps extends React.ComponentProps<typeof Card> {
  variant?: "default" | "raised" | "blue"
  animated?: boolean
  hover?: boolean
  glowIntensity?: string
}

export const GlassCard = React.forwardRef<
  HTMLDivElement,
  GlassCardProps
>(
  (
    {
      className,
      ...props
    },
    ref
  ) => {
    // Ignore the glass-specific props and just render as standard Card
    const { variant: _variant, animated: _animated, hover: _hover, glowIntensity: _glowIntensity, ...cardProps } = props;
    return (
      <Card
        ref={ref}
        className={cn(className)}
        {...cardProps}
      />
    )
  }
)

GlassCard.displayName = "GlassCard"

// Export card sub-components for backward compatibility
export { CardContent, CardHeader, CardTitle, CardDescription, CardFooter }
