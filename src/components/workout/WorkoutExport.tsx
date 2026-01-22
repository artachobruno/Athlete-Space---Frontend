import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { createWorkoutExport } from '@/api/workouts'

interface WorkoutExportProps {
  workoutId: string
}

export function WorkoutExport({ workoutId }: WorkoutExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Create export (runs inline, should be ready immediately)
      const exportData = await createWorkoutExport(workoutId)
      
      if (exportData.status === 'failed') {
        throw new Error(exportData.error || 'Export failed')
      }
      
      if (exportData.status !== 'ready') {
        // If not ready, wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // Download the file using the download endpoint
      const response = await api.get(`/workouts/exports/${exportData.id}/download`, {
        responseType: 'blob',
      })
      
      const blob = response as unknown as Blob
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `workout-${workoutId}.fit`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Export successful',
        description: 'Workout exported to Garmin format',
      })
    } catch (error) {
      console.error('[WorkoutExport] Failed to export workout:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to export workout'
      toast({
        title: 'Export failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Export to Garmin
        </>
      )}
    </Button>
  )
}
