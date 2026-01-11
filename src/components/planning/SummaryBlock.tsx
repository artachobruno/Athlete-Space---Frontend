interface SummaryBlockProps {
  summary: Record<string, unknown>;
}

export function SummaryBlock({ summary }: SummaryBlockProps) {
  return (
    <div className="ml-4 mt-1 text-xs text-muted-foreground">
      {Object.entries(summary).map(([k, v]) => (
        <div key={k}>
          <strong>{k}:</strong> {JSON.stringify(v)}
        </div>
      ))}
    </div>
  );
}
