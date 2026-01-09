import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, FileCheck, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadActivityFile } from '@/lib/api';
import { auth } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AxiosError } from 'axios';

const ALLOWED_EXTENSIONS = ['.fit', '.gpx', '.tcx'];
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type FileType = 'FIT' | 'GPX' | 'TCX';

const getFileType = (filename: string): FileType | null => {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.fit')) return 'FIT';
  if (lower.endsWith('.gpx')) return 'GPX';
  if (lower.endsWith('.tcx')) return 'TCX';
  return null;
};

const formatFileSize = (bytes: number): string => {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
};

export function ActivityUploadSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { status: authStatus } = useAuth();
  
  const isAuthenticated = authStatus === 'authenticated' && auth.isLoggedIn();

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
    const files = e.target.files;
    
    // Enforce single file selection
    if (!files || files.length === 0) {
      setSelectedFile(null);
      return;
    }
    
    // Only take the first file if multiple are somehow selected
    const file = files[0];
    
    // Explicit validation before upload
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
    if (!selectedFile || !isAuthenticated || isUploading) return;
    
    // Log upload start (no PII)
    console.log('[Upload] upload_started');
    
    setIsUploading(true);
    setError(null);
    
    try {
      const response = await uploadActivityFile(selectedFile);
      
      // Handle dedup response explicitly
      if (response.deduplicated) {
        console.log('[Upload] upload_duplicate');
        toast({
          title: 'Activity already exists',
          description: 'This activity already exists',
        });
      } else {
        console.log('[Upload] upload_success');
        toast({
          title: 'Activity uploaded successfully',
          description: 'Activity uploaded successfully',
        });
      }
      
      // Force data refresh after success (both dedup + new)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activities'] }),
        queryClient.invalidateQueries({ queryKey: ['calendar'] }),
        queryClient.invalidateQueries({ queryKey: ['trainingLoad'] }),
        queryClient.invalidateQueries({ queryKey: ['training', 'state'] }),
        queryClient.invalidateQueries({ queryKey: ['calendarToday'] }),
        queryClient.invalidateQueries({ queryKey: ['calendarWeek'] }),
        queryClient.invalidateQueries({ queryKey: ['calendarSeason'] }),
      ]);
      
      // Clear the file input
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('[Upload] upload_error:', error);
      
      // Extract error status from axios error
      let status: number | undefined;
      let errorMessage = 'Upload failed, please try again';
      
      if (error && typeof error === 'object' && 'isAxiosError' in error) {
        const axiosError = error as AxiosError<{ message?: string; detail?: string }>;
        status = axiosError.response?.status;
        const responseData = axiosError.response?.data;
        
        // Try to extract message from response
        if (responseData) {
          if (typeof responseData === 'object' && 'message' in responseData) {
            errorMessage = String(responseData.message);
          } else if (typeof responseData === 'object' && 'detail' in responseData) {
            errorMessage = String(responseData.detail);
          }
        }
      } else if (error && typeof error === 'object' && 'status' in error) {
        status = (error as { status?: number }).status;
      }
      
      // Map backend errors → user messages
      switch (status) {
        case 400:
          errorMessage = 'Invalid file format';
          break;
        case 401:
          errorMessage = 'Please sign in to upload activities';
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
          // Keep the extracted message or use default
          if (status === 500) {
            errorMessage = 'Upload failed, try again';
          }
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
                      className={`${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''} min-h-[44px]`}
                      aria-label="Select activity file (FIT, GPX, or TCX)"
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
          {selectedFile && !error && (() => {
            const fileType = getFileType(selectedFile.name);
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                <FileCheck className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="truncate">{selectedFile.name}</span>
                <span className="text-xs">· {formatFileSize(selectedFile.size)}</span>
                {fileType && <span className="text-xs">· {fileType}</span>}
              </div>
            );
          })()}

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
                    className="w-full sm:w-auto min-h-[44px]"
                    aria-label="Upload activity file"
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
