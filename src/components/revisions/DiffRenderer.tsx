import React from "react";
import { PlanDiff } from "../../types/revisionDiff";
import { AddedSession, ModifiedSession, RemovedSession } from "./DiffSessionCard";

interface DiffRendererProps {
  diff: PlanDiff;
}

export function DiffRenderer({ diff }: DiffRendererProps) {
  return (
    <div className="space-y-4">
      {diff.added.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Added Sessions ({diff.added.length})
          </h3>
          <div className="space-y-2">
            {diff.added.map((s) => (
              <AddedSession key={s.session_id} session={s} />
            ))}
          </div>
        </div>
      )}

      {diff.removed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Removed Sessions ({diff.removed.length})
          </h3>
          <div className="space-y-2">
            {diff.removed.map((s) => (
              <RemovedSession key={s.session_id} session={s} />
            ))}
          </div>
        </div>
      )}

      {diff.modified.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Modified Sessions ({diff.modified.length})
          </h3>
          <div className="space-y-2">
            {diff.modified.map((m) => (
              <ModifiedSession key={m.session_id} diff={m} />
            ))}
          </div>
        </div>
      )}

      {diff.unchanged.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {diff.unchanged.length} unchanged session{diff.unchanged.length !== 1 ? "s" : ""}
        </div>
      )}

      {diff.added.length === 0 &&
        diff.removed.length === 0 &&
        diff.modified.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No changes detected
          </div>
        )}
    </div>
  );
}
