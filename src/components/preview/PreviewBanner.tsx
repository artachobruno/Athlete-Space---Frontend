import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Preview banner that displays when app is running in preview mode.
 * Shows a clear warning that data is not real.
 */
export function PreviewBanner() {
  return (
    <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 rounded-none border-x-0 border-t-0">
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertDescription className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
        🔒 Preview mode – data not real
      </AlertDescription>
    </Alert>
  );
}
