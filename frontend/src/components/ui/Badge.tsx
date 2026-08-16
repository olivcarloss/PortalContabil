import type { ReactNode } from "react";

export type BadgeStatus = "ativa" | "suspensa" | "cancelada" | "neutral";

export default function Badge({ status, children }: { status: BadgeStatus; children: ReactNode }) {
  return <span className={`badge badge-${status}`}>{children}</span>;
}
