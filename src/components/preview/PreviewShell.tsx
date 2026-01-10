import { ReactNode } from "react";
import { PreviewBanner } from "./PreviewBanner";

interface PreviewShellProps {
  children: ReactNode;
}

/**
 * PreviewShell wraps content in preview mode.
 * Provides visual indication that preview mode is active.
 * 
 * This component is ONLY rendered when isPreviewMode() returns true.
 * It does NOT affect production security.
 */
export function PreviewShell({ children }: PreviewShellProps) {
  return (
    <div className="min-h-screen">
      <PreviewBanner />
      {children}
    </div>
  );
}
