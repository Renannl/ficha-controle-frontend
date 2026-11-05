import { Users } from "lucide-react";
import { getRoleColor } from "../../utils/roleColors";

export default function DashboardColaboradores({ colaboradores }) {
  if (!colaboradores?.length) return null;

  const max = colaboradores[0].fichas || 1;

  return (
    <div className="dash-section">
      <h3 className="dash-section-h3">
        <Users size={16} /> Colaboradores mais ativos
      </h3>

      <div className="dash-colab-list">
        {colaboradores.slice(0, 8).map((c, i) => (
          <div key={c.username} className="dash-colab-item">
            <span className="dash-colab-pos">#{i + 1}</span>

            <span
              className="dash-colab-avatar"
              style={{ background: getRoleColor(c.role) || "#64748b" }}
            >
              {(c.nome || "?")[0].toUpperCase()}
            </span>

            <div className="dash-colab-info">
              <span className="dash-colab-nome">{c.nome}</span>
              <div className="dash-colab-bar">
                <div
                  className="dash-colab-fill"
                  style={{ width: `${(c.fichas / max) * 100}%` }}
                />
              </div>
            </div>

            <span className="dash-colab-count">
              {c.fichas} {c.fichas === 1 ? "ficha" : "fichas"}
              {c.horas > 0 && (
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 12,
                    display: "block",
                  }}
                >
                  {c.horas}h
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
