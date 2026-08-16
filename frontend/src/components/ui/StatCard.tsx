export default function StatCard({
  eyebrow,
  value,
  delta,
}: {
  eyebrow: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="stat-card">
      <div className="eyebrow">{eyebrow}</div>
      <div className="val">{value}</div>
      {delta && <div className="delta">{delta}</div>}
    </div>
  );
}
