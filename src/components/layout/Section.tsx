import React from "react";

export function Section({ children }: { children: React.ReactNode }) {
  return <section className="py-16">{children}</section>;
}
