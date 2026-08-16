import type { ReactNode } from "react";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: "1rem" }}>
      <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.35rem" }}>
        {label}
      </span>
      {children}
      {hint && (
        <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>;
}
