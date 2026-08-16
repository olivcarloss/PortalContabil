import type { ReactNode } from "react";

export default function Table({ children }: { children: ReactNode }) {
  return (
    <div className="card" style={{ padding: 0, overflowX: "auto" }}>
      <table>{children}</table>
    </div>
  );
}
