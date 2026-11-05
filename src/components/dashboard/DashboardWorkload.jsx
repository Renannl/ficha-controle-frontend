import { Gauge } from "lucide-react";

export default function DashboardWorkload({ metrics }) {
  return (
    <div className="dash-section">
      <h3 className="dash-section-h3">
        <Gauge size={16} /> Carga de Trabalho & Gargalos
      </h3>

      <div className="dash-workload-grid">
        <div className="dash-workload-item">
          <span className="dash-workload-value" style={{ color: "var(--amber)" }}>
            {metrics.itemsPendentes}
          </span>
          <span className="dash-workload-label">itens pendentes de verificação</span>
        </div>

        <div className="dash-workload-item">
          <span className="dash-workload-value" style={{ color: "var(--red)" }}>
            {metrics.fichasEstagnadas}
          </span>
          <span className="dash-workload-label">fichas paradas há 3+ dias</span>
        </div>

        <div className="dash-workload-item">
          <span className="dash-workload-value">{metrics.mediaDiasAndamento}</span>
          <span className="dash-workload-label">dias médios em andamento</span>
        </div>
      </div>
    </div>
  );
}
