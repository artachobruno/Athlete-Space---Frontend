import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, FileCheck, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadActivityFile } from '@/lib/api';
import { auth } from '@/lib/auth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ALLOWED_EXTENSIONS = ['.fit', '.gpx', '.tcx'];
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function ActivityUploadSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  const isAuthenticated = auth.isLoggedIn();

  const validateFile = (file: File): string | null => {
    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(', ')} files are accepted.`;
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
    }
    
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    
    if (!file) {
      setSelectedFile(null);
      return;
    }
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !isAuthenticated) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const response = await uploadActivityFile(selectedFile);
      
      // Show appropriate toast based on deduplicated flag
      if (response.deduplicated) {
        toast({
          title: 'Activity already exists',
          description: 'This activity already exists',
        });
      } else {
        toast({
          title: 'Activity uploaded successfully',
          description: 'Activity uploaded successfully',
        });
      }
      
      // Refresh relevant queries
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['training-load'] });
      queryClient.invalidateQueries({ queryKey: ['pmc'] });
      
      // Clear the file input
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('[Upload] Failed to upload activity:', error);
      
      // Handle specific error statuses
      const apiError = error as { status?: number; message?: string };
      let errorMessage = 'Upload failed, please try again';
      
      switch (apiError.status) {
        case 400:
          errorMessage = 'Invalid file format';
          break;
        case 401:
          errorMessage = 'Please sign in to upload activities';
          // Could redirect to login here if needed
          break;
        case 413:
          errorMessage = `File too large (max ${MAX_FILE_SIZE_MB}MB)`;
          break;
        case 422:
          errorMessage = 'Could not parse activity file';
          break;
        case 429:
          errorMessage = 'Too many uploads today';
          break;
        case 500:
        default:
          errorMessage = apiError.message || 'Upload failed, please try again';
      }
      
      setError(errorMessage);
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const isUploadDisabled = !selectedFile || !isAuthenticated || isUploading;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Upload className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Upload Activity</CardTitle>
            <CardDescription>Import workout files from external devices or platforms</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* File input */}
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".fit,.gpx,.tcx"
                      onChange={handleFileChange}
                      disabled={!isAuthenticated || isUploading}
                      className={!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}
                    />
                  </div>
                </TooltipTrigger>
                {!isAuthenticated && (
                  <TooltipContent>
                    <p>Sign in to upload activities</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            <p className="text-xs text-muted-foreground">
              Upload FIT, GPX, or TCX files from Garmin, Apple Watch, TrainingPeaks, or other platforms.
            </p>
          </div>

          {/* Selected file indicator */}
          {selectedFile && !error && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
              <FileCheck className="h-4 w-4 text-accent" />
              <span className="truncate">{selectedFile.name}</span>
              <span className="text-xs">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploadDisabled}
                    className="w-full sm:w-auto"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Activity
                      </>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              {!isAuthenticated && (
                <TooltipContent>
                  <p>Sign in to upload activities</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
