export default function DashboardHeader({ total, atrasadas = 0 }) {
  return (
    <div className="dash-title-row">
      <h2 className="dash-title">Dashboard</h2>
      <span className="dash-subtitle">
        {total} ficha{total !== 1 ? "s" : ""} registrada{total !== 1 ? "s" : ""}
        {atrasadas > 0 && (
          <span style={{ marginLeft: 8, color: "var(--red)", fontWeight: 700 }}>
            · {atrasadas} atrasada{atrasadas !== 1 ? "s" : ""}
          </span>
        )}
      </span>
    </div>
  );
}
