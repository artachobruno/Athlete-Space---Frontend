import React from "react";
import { PlanDiff, SessionDiff, SessionFieldDiff } from "../../types/revisionDiff";
import { capitalizeTitle } from "@/adapters/calendarAdapter";

const styles = {
  added: "border-l-4 border-green-400 bg-green-50 dark:bg-green-900/20",
  removed: "border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20",
  modified: "border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
  blocked: "border-l-4 border-gray-400 bg-gray-50 dark:bg-gray-900/20",
};

type DiffType = "added" | "removed" | "modified" | "blocked";

interface DiffSessionCardProps {
  type: DiffType;
  children: React.ReactNode;
}

export function DiffSessionCard({ type, children }: DiffSessionCardProps) {
  return (
    <div className={`p-3 rounded ${styles[type]}`}>
      {children}
    </div>
  );
}

interface AddedSessionProps {
  session: SessionDiff;
}

export function AddedSession({ session }: AddedSessionProps) {
  return (
    <DiffSessionCard type="added">
      <div className="flex items-center gap-2">
        <span className="text-green-600 dark:text-green-400 font-semibold">+ Added</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {session.type} - {capitalizeTitle(session.title || "Untitled")}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {new Date(session.date).toLocaleDateString()}
        </span>
      </div>
    </DiffSessionCard>
  );
}

interface RemovedSessionProps {
  session: SessionDiff;
}

export function RemovedSession({ session }: RemovedSessionProps) {
  return (
    <DiffSessionCard type="removed">
      <div className="flex items-center gap-2">
        <span className="text-red-600 dark:text-red-400 font-semibold">- Removed</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {session.type} - {capitalizeTitle(session.title || "Untitled")}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {new Date(session.date).toLocaleDateString()}
        </span>
      </div>
    </DiffSessionCard>
  );
}

interface ModifiedSessionProps {
  diff: SessionFieldDiff;
}

export function ModifiedSession({ diff }: ModifiedSessionProps) {
  return (
    <DiffSessionCard type="modified">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 dark:text-yellow-400 font-semibold">~ Modified</span>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            Session {diff.session_id.slice(0, 8)}...
          </span>
        </div>
        <div className="ml-4 space-y-1">
          {diff.changes.map((change, idx) => (
            <div key={idx} className="text-sm">
              <span className="font-medium">{change.field}:</span>{" "}
              <span className="text-red-600 dark:text-red-400 line-through">
                {String(change.before)}
              </span>{" "}
              →{" "}
              <span className="text-green-600 dark:text-green-400">
                {String(change.after)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DiffSessionCard>
  );
}
