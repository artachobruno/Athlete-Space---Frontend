import React from "react";

interface ConfidenceBadgeProps {
  value: number | null; // 0.0-1.0
}

export function ConfidenceBadge({ value }: ConfidenceBadgeProps) {
  if (value === null) {
    return (
      <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        Unknown
      </span>
    );
  }

  const percentage = Math.round(value * 100);
  let colorClass: string;
  let label: string;

  if (value >= 0.8) {
    colorClass = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
    label = "High";
  } else if (value >= 0.5) {
    colorClass = "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
    label = "Medium";
  } else {
    colorClass = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
    label = "Low";
  }

  return (
    <span className={`px-2 py-1 text-xs rounded font-medium ${colorClass}`}>
      {label} ({percentage}%)
    </span>
  );
}
