import { AlertTriangle, CalendarClock } from "lucide-react";

function formataDias(n) {
  if (n === null || n === undefined) return "";
  const abs = Math.abs(n);
  if (n < 0) return `${abs} dia${abs !== 1 ? "s" : ""} de atraso`;
  return `vence em ${n} dia${n !== 1 ? "s" : ""}`;
}

export default function DashboardPrazos({ atrasadas = [], prazoCritico = [] }) {
  if (!atrasadas.length && !prazoCritico.length) return null;

  const renderItem = (f, cor, Icon) => (
    <div
      key={f.id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderBottom: "1px solid var(--border)",
        borderLeft: `3px solid ${cor}`,
      }}
    >
      <Icon size={16} style={{ color: cor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ display: "block" }}>
          {f.numeroInd || f.codigo || "—"}
        </strong>
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {f.cliente || "—"}
          {f.nomeEquipamento ? ` · ${f.nomeEquipamento}` : ""}
        </span>
      </div>
      <span style={{ color: cor, fontWeight: 700, fontSize: 13 }}>
        {formataDias(f.diasRestantes)}
      </span>
    </div>
  );

  return (
    <div className="dash-section">
      <h3 className="dash-section-h3">
        <CalendarClock size={16} /> Prazos que precisam de atenção
      </h3>
      {atrasadas.map((f) => renderItem(f, "var(--red)", AlertTriangle))}
      {prazoCritico.map((f) => renderItem(f, "var(--amber)", CalendarClock))}
    </div>
  );
}
