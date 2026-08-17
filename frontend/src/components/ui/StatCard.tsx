export default function StatCard({
  eyebrow,
  value,
  delta,
  onClick,
  onDoubleClick,
  active,
}: {
  eyebrow: string;
  value: string;
  delta?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  active?: boolean;
}) {
  return (
    <div
      className={`stat-card${onClick ? " row-clickable" : ""}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={active ? { borderColor: "var(--color-primary)" } : undefined}
    >
      <div className="eyebrow">{eyebrow}</div>
      <div className="val">{value}</div>
      {delta && <div className="delta">{delta}</div>}
    </div>
  );
}
