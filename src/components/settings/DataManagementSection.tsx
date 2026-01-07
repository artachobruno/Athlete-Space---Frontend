import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Database, Download, Trash2, Loader2, FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { fetchActivities, fetchUserProfile } from '@/lib/api';
import { clearAllData } from '@/lib/storage';
import { auth } from '@/lib/auth';

export function DataManagementSection() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // fetchUserProfile now returns null on failure (it's optional)
      const [activities, profile] = await Promise.all([
        fetchActivities({ limit: 1000 }),
        fetchUserProfile(),
      ]);

      const exportData = {
        profile: profile || null, // Explicitly handle null
        activities,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      let blob: Blob;
      let filename: string;
      let mimeType: string;

      if (exportFormat === 'json') {
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        filename = `athlete-space-export-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // CSV format
        const csvRows: string[] = [];
        
        // Profile section
        csvRows.push('Section,Field,Value');
        csvRows.push(`Profile,Name,"${profile?.name || 'N/A'}"`);
        csvRows.push(`Profile,Goals,"${profile?.goals?.join(', ') || 'N/A'}"`);
        csvRows.push(`Profile,Strava Connected,${profile?.strava_connected ? 'Yes' : 'No'}`);
        csvRows.push('');
        
        // Activities section
        csvRows.push('Activity ID,Date,Sport,Title,Duration (min),Distance (km),Training Load');
        activities.forEach(activity => {
          csvRows.push(
            `${activity.id},"${activity.date}",${activity.sport},"${activity.title}",${activity.duration},${activity.distance},${activity.trainingLoad}`
          );
        });

        blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        filename = `athlete-space-export-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data exported successfully',
        description: `Your data has been exported as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Failed to export data:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Could not export your data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    try {
      // Cancel all pending queries to prevent flickering
      await queryClient.cancelQueries();
      
      // Clear all app data
      clearAllData();
      localStorage.removeItem('strava_last_sync');
      localStorage.removeItem('theme');
      
      // Clear auth token - user will need to re-authenticate
      auth.clear();

      // Remove all queries from cache to prevent refetching
      queryClient.removeQueries();
      
      // Clear in-memory query cache so UI reflects the reset immediately
      queryClient.clear();
      
      toast({
        title: 'Data deleted',
        description: 'All your data has been deleted. Redirecting to onboarding...',
      });

      // Small delay to ensure all cleanup completes, then navigate
      setTimeout(() => {
        navigate('/onboarding', { replace: true });
      }, 100);
    } catch (error) {
      console.error('Failed to delete data:', error);
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Could not delete your data',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Database className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Data Management</CardTitle>
            <CardDescription>Export or delete your training data</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Data */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-1">Export Your Data</h3>
            <p className="text-xs text-muted-foreground">
              Download a copy of all your training data, activities, and profile information
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Export Format</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('json')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    exportFormat === 'json'
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <FileJson className="h-4 w-4" />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    exportFormat === 'csv'
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
            <Button onClick={handleExportData} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              {exportFormat === 'json'
                ? 'JSON format includes all data in a structured format, perfect for backups or importing into other tools.'
                : 'CSV format is ideal for viewing in spreadsheet applications like Excel or Google Sheets.'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Delete Data */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-destructive mb-1">Delete All Data</h3>
            <p className="text-xs text-muted-foreground">
              Permanently delete all your local training data. This action cannot be undone.
              Your account will remain, but all stored data will be removed.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All Local Data
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete All Local Data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your local training data including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All cached activities and training data</li>
                    <li>Local preferences and settings</li>
                    <li>Stored profile information</li>
                  </ul>
                  <p className="mt-2 font-medium">
                    This action cannot be undone. Your account will remain active, but you will need to
                    re-sync your data from connected services.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

