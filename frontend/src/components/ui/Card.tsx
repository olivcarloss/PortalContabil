import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`card ${className}`.trim()} style={padded ? undefined : { padding: 0 }}>
      {children}
    </div>
  );
}
