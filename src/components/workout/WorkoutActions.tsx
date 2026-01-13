import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { createWorkoutExport, getWorkoutExportStatus, type WorkoutExport } from "@/api/workouts"
import { api } from "@/lib/api"
import { getToken } from "@/auth/token"

interface WorkoutActionsProps {
  workoutId: string
}

type ExportState = "idle" | "queued" | "building" | "ready" | "failed"

export function WorkoutActions({ workoutId }: WorkoutActionsProps) {
  const [exportState, setExportState] = useState<ExportState>("idle")
  const [exportId, setExportId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const downloadFile = useCallback(async (url: string) => {
    try {
      // Construct full URL if relative
      let fullUrl: string
      if (url.startsWith("http://") || url.startsWith("https://")) {
        fullUrl = url
      } else {
        // Get base URL from axios instance
        const baseURL = api.defaults.baseURL || ""
        // Ensure URL starts with / if it's relative
        const cleanUrl = url.startsWith("/") ? url : `/${url}`
        fullUrl = `${baseURL}${cleanUrl}`
      }
      
      // Get auth token for Authorization header
      const token = getToken()
      const headers: Record<string, string> = {}
      if (token && token !== "null" && token.trim() !== "") {
        headers.Authorization = `Bearer ${token}`
      }
      
      // Fetch the file with credentials and auth header
      const response = await fetch(fullUrl, {
        credentials: "include",
        headers,
      })
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `workout-${workoutId}.fit`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      // Reset state after successful download
      setExportState("idle")
      setExportId(null)
      setError(null)
    } catch (err) {
      console.error("[WorkoutActions] Failed to download file:", err)
      setExportState("failed")
      setError(err instanceof Error ? err.message : "Failed to download file")
    }
  }, [workoutId])

  // Poll export status when export is in progress
  useEffect(() => {
    if (exportId && (exportState === "queued" || exportState === "building")) {
      const pollStatus = async () => {
        try {
          const status = await getWorkoutExportStatus(workoutId, exportId)
          
          if (status.status === "ready") {
            setExportState("ready")
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            
            // Auto-download when ready
            if (status.download_url) {
              downloadFile(status.download_url)
            }
          } else if (status.status === "failed") {
            setExportState("failed")
            setError(status.error || "Export failed")
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
          } else {
            // Update state for queued/building
            setExportState(status.status as ExportState)
          }
        } catch (err) {
          console.error("[WorkoutActions] Failed to poll export status:", err)
          setExportState("failed")
          setError(err instanceof Error ? err.message : "Failed to check export status")
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        }
      }

      // Poll every 2 seconds
      pollingIntervalRef.current = setInterval(pollStatus, 2000)
      
      // Initial poll
      pollStatus()

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    }
  }, [exportId, exportState, workoutId, downloadFile])

  const handleExport = async () => {
    // If already ready, try to download again
    if (exportState === "ready" && exportId) {
      try {
        const status = await getWorkoutExportStatus(workoutId, exportId)
        if (status.status === "ready" && status.download_url) {
          downloadFile(status.download_url)
        } else {
          // Status changed, restart export
          setError(null)
          setExportState("queued")
          const exportData = await createWorkoutExport(workoutId)
          setExportId(exportData.id)
          setExportState(exportData.status as ExportState)
          if (exportData.status === "ready" && exportData.download_url) {
            downloadFile(exportData.download_url)
          }
        }
      } catch (err) {
        console.error("[WorkoutActions] Failed to get export status:", err)
        // Fall back to creating new export
        setError(null)
        setExportState("queued")
        try {
          const exportData = await createWorkoutExport(workoutId)
          setExportId(exportData.id)
          setExportState(exportData.status as ExportState)
          if (exportData.status === "ready" && exportData.download_url) {
            downloadFile(exportData.download_url)
          }
        } catch (createErr) {
          console.error("[WorkoutActions] Failed to create export:", createErr)
          setExportState("failed")
          setError(createErr instanceof Error ? createErr.message : "Failed to create export")
          setExportId(null)
        }
      }
      return
    }
    
    // Start new export
    setError(null)
    setExportState("queued")
    
    try {
      const exportData = await createWorkoutExport(workoutId)
      setExportId(exportData.id)
      setExportState(exportData.status as ExportState)
      
      // If already ready, download immediately
      if (exportData.status === "ready" && exportData.download_url) {
        downloadFile(exportData.download_url)
      }
    } catch (err) {
      console.error("[WorkoutActions] Failed to create export:", err)
      setExportState("failed")
      setError(err instanceof Error ? err.message : "Failed to create export")
      setExportId(null)
    }
  }

  const getButtonContent = () => {
    switch (exportState) {
      case "queued":
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing file...
          </>
        )
      case "building":
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Building file...
          </>
        )
      case "ready":
        return (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Download
          </>
        )
      case "failed":
        return (
          <>
            <AlertCircle className="h-4 w-4" />
            Retry Export
          </>
        )
      default:
        return (
          <>
            <Download className="h-4 w-4" />
            Download Garmin Workout
          </>
        )
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleExport}
        disabled={exportState === "queued" || exportState === "building"}
        variant={exportState === "ready" ? "default" : "outline"}
        size="sm"
      >
        {getButtonContent()}
      </Button>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
