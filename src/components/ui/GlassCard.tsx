import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { glass } from "@/styles/designTokens";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <Card className={cn(glass.card, className)} {...props}>
      {children}
    </Card>
  );
}

export { CardContent, CardHeader, CardTitle, CardDescription, CardFooter };
