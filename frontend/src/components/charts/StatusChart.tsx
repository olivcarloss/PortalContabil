const STATUS_COLORS: Record<string, string> = {
  concluida: "#16a34a",
  concluída: "#16a34a",
  ativa: "#16a34a",
  em_andamento: "#f59e0b",
  pendente: "#6b7280",
  suspensa: "#f59e0b",
  cancelada: "#c0392b",
  vencida: "#c0392b",
};

const FALLBACK_COLOR = "#7F77DD";

function colorFor(status: string): string {
  return STATUS_COLORS[status.toLowerCase()] ?? FALLBACK_COLOR;
}

function labelFor(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function StatusChart({ items }: { items: { status: string; total: number }[] }) {
  const total = items.reduce((sum, i) => sum + i.total, 0);

  if (items.length === 0 || total === 0) {
    return <div className="empty-state">Sem conciliações para exibir.</div>;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: 14,
          borderRadius: 999,
          overflow: "hidden",
          gap: 2,
          marginBottom: "0.9rem",
        }}
      >
        {items.map((item) => (
          <div
            key={item.status}
            title={`${labelFor(item.status)}: ${item.total}`}
            style={{
              width: `${(item.total / total) * 100}%`,
              background: colorFor(item.status),
              minWidth: 4,
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.9rem" }}>
        {items.map((item) => (
          <div key={item.status} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: colorFor(item.status),
                display: "inline-block",
              }}
            />
            <span style={{ color: "var(--color-text-secondary)" }}>{labelFor(item.status)}</span>
            <span style={{ fontWeight: 600 }}>{item.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
