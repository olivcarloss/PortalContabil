interface BarItem {
  label: string;
  value: number;
}

export default function BarChart({
  items,
  color = "#185fa5",
  formatValue = (v: number) => String(v),
}: {
  items: BarItem[];
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  if (items.length === 0) {
    return <div className="empty-state">Sem dados para exibir.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      {items.map((item) => {
        const pct = Math.max(2, (item.value / max) * 100);
        return (
          <div key={item.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.78rem",
                marginBottom: "0.25rem",
                color: "var(--color-text-secondary)",
              }}
            >
              <span>{item.label}</span>
              <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{formatValue(item.value)}</span>
            </div>
            <div
              role="img"
              aria-label={`${item.label}: ${formatValue(item.value)}`}
              title={`${item.label}: ${formatValue(item.value)}`}
              style={{
                height: 10,
                borderRadius: 999,
                background: "var(--color-surface-alt)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: color,
                  borderRadius: 999,
                  transition: "width 0.2s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
