import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, TrendingUp } from "lucide-react";
import { capitalizeTitle } from "@/adapters/calendarAdapter";

interface ParsedActivity {
  date: string;
  sport?: string;
  title?: string;
  duration?: number; // minutes
  distance?: number; // km
}

interface ActivityUploadPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: ParsedActivity[];
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function ActivityUploadPreview({
  open,
  onOpenChange,
  activities,
  onConfirm,
  isLoading = false,
}: ActivityUploadPreviewProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const activityCount = activities.length;
  const activityText = activityCount === 1 ? "activity" : "activities";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Review Activity Upload</DialogTitle>
          <DialogDescription>
            I found {activityCount} {activityText}. Add to calendar?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="rounded-lg border p-3 bg-muted/30 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {activity.title 
                      ? capitalizeTitle(activity.title)
                      : `${activity.sport || "Activity"} on ${activity.date}`}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    {activity.date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {(() => {
                            try {
                              return format(new Date(activity.date), "MMM d, yyyy");
                            } catch {
                              return activity.date;
                            }
                          })()}
                        </span>
                      </div>
                    )}
                    {activity.duration !== undefined && activity.duration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{activity.duration} min</span>
                      </div>
                    )}
                    {activity.distance !== undefined && activity.distance > 0 && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{activity.distance.toFixed(1)} km</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-coach hover:bg-coach/90 text-coach-foreground"
          >
            {isLoading ? "Adding..." : `Add ${activityCount} ${activityText}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
