import React from "react";

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100svh] text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
    </main>
  );
}
