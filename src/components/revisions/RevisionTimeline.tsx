import React from "react";
import { PlanRevision } from "../../types/revisionDiff";
import { ConfidenceBadge } from "./ConfidenceBadge";

interface RevisionTimelineProps {
  revisions: PlanRevision[];
  onApprove?: (revisionId: string) => void;
  onReject?: (revisionId: string) => void;
  onRollback?: (revisionId: string) => void;
}

interface RevisionItemProps {
  revision: PlanRevision;
  onApprove?: (revisionId: string) => void;
  onReject?: (revisionId: string) => void;
  onRollback?: (revisionId: string) => void;
}

function RevisionItem({
  revision,
  onApprove,
  onReject,
  onRollback,
}: RevisionItemProps) {
  const statusColors = {
    applied: "text-green-600 dark:text-green-400",
    blocked: "text-red-600 dark:text-red-400",
    pending: "text-yellow-600 dark:text-yellow-400",
  };

  const canRollback =
    revision.status === "applied" &&
    revision.revision_type !== "rollback" &&
    !revision.parent_revision_id; // Not already rolled back

  const canApprove = revision.status === "pending" && revision.requires_approval;
  const canReject = revision.status === "pending" && revision.requires_approval;

  return (
    <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 pb-4 relative">
      <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600" />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${statusColors[revision.status]}`}>
              {revision.status.toUpperCase()}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {revision.revision_type.replace("_", " ")}
            </span>
            {revision.confidence !== null && <ConfidenceBadge value={revision.confidence} />}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {new Date(revision.created_at).toLocaleString()}
          </span>
        </div>

        {revision.reason && (
          <p className="text-sm text-gray-700 dark:text-gray-300">{revision.reason}</p>
        )}

        {revision.blocked_reason && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Blocked: {revision.blocked_reason}
          </p>
        )}

        <div className="flex gap-2">
          {canApprove && onApprove && (
            <button
              onClick={() => onApprove(revision.id)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Approve
            </button>
          )}
          {canReject && onReject && (
            <button
              onClick={() => onReject(revision.id)}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject
            </button>
          )}
          {canRollback && onRollback && (
            <button
              onClick={() => onRollback(revision.id)}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              ↩ Rollback
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function RevisionTimeline({
  revisions,
  onApprove,
  onReject,
  onRollback,
}: RevisionTimelineProps) {
  return (
    <div className="space-y-0">
      {revisions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No revisions yet</p>
      ) : (
        revisions.map((revision) => (
          <RevisionItem
            key={revision.id}
            revision={revision}
            onApprove={onApprove}
            onReject={onReject}
            onRollback={onRollback}
          />
        ))
      )}
    </div>
  );
}
