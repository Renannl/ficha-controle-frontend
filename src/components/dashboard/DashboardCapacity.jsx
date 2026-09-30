import { useCapacityMetrics } from "../../hooks/useCapacityMetrics";
import {
  Users,
  AlertTriangle,
  Clock,
  Briefcase,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function DashboardCapacity({ fichas, usuarios }) {
  const {
    metricasCargo,
    etaPorFicha,
    maiorGargalo,
    totalFichasAtivas,
    totalFuncionariosAtivos,
  } = useCapacityMetrics(fichas, usuarios);

  if (totalFichasAtivas === 0) {
    return (
      <section className="dash-card">
        <div className="dash-card-header">
          <Briefcase size={18} />
          <h3>Capacidade da Equipe</h3>
        </div>
        <p className="dash-empty-text">
          Nenhuma ficha ativa no momento. Crie ou retome fichas para ver a
          projeção de entrega.
        </p>
      </section>
    );
  }

  return (
    <section className="dash-card">
      <div className="dash-card-header">
        <Briefcase size={18} />
        <h3>Capacidade da Equipe</h3>
      </div>

      <div className="capacity-summary">
        <div className="capacity-summary-item">
          <span className="capacity-summary-label">Fichas ativas</span>
          <span className="capacity-summary-value">{totalFichasAtivas}</span>
        </div>
        <div className="capacity-summary-item">
          <span className="capacity-summary-label">Colaboradores ativos</span>
          <span className="capacity-summary-value">
            {totalFuncionariosAtivos}
          </span>
        </div>
        {maiorGargalo && (
          <div className="capacity-summary-item capacity-summary-gargalo">
            <span className="capacity-summary-label">
              <AlertTriangle size={14} /> Maior gargalo
            </span>
            <span className="capacity-summary-value">
              {maiorGargalo.cargo}
            </span>
          </div>
        )}
      </div>

      <div className="capacity-table-wrap">
        <table className="capacity-table">
          <thead>
            <tr>
              <th>Cargo</th>
              <th>Funcionários</th>
              <th>Demanda (h)</th>
              <th>Capacidade (sem)</th>
              <th>Folga</th>
              <th>ETA</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {metricasCargo.map((m) => (
              <tr
                key={m.cargo}
                className={m.gargalo ? "capacity-row-gargalo" : ""}
              >
                <td>
                  <span className={`role-badge role-${m.cargo}`}>
                    {m.cargo}
                  </span>
                </td>
                <td>
                  <div className="capacity-cell-with-icon">
                    <Users size={14} />
                    {m.nFuncionarios}
                  </div>
                </td>
                <td>{m.horasDemanda}h</td>
                <td>{m.capacidadeSemanal}h</td>
                <td
                  className={
                    m.folgaHoras < 0 ? "capacity-negative" : "capacity-positive"
                  }
                >
                  {m.folgaHoras > 0 ? "+" : ""}
                  {m.folgaHoras}h
                </td>
                <td>
                  <div className="capacity-cell-with-icon">
                    <Clock size={14} />
                    {m.diasParaZerar === null
                      ? "Sem recurso"
                      : `${m.diasParaZerar} dia(s)`}
                  </div>
                </td>
                <td>
                  {m.gargalo ? (
                    <span className="capacity-badge capacity-badge-danger">
                      Gargalo
                    </span>
                  ) : (
                    <span className="capacity-badge capacity-badge-ok">
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="capacity-eta-section">
        <h4 className="capacity-eta-title">
          <Clock size={16} /> Previsão de entrega por ficha
        </h4>
        <div className="capacity-eta-list">
          {etaPorFicha
            .filter((e) => !e.semAlocacao)
            .sort((a, b) => (b.etaDias || 0) - (a.etaDias || 0))
            .slice(0, 8)
            .map(({ ficha, etaDias, horasRestantes }) => (
              <div key={ficha.dbId || ficha.id} className="capacity-eta-item">
                <div className="capacity-eta-info">
                  <span className="capacity-eta-name">
                    {ficha.nomeEquipamento || ficha.numeroInd || "Sem nome"}
                  </span>
                  <span className="capacity-eta-meta">
                    {ficha.cliente || "—"} · {Math.round(horasRestantes)}h
                    restantes
                  </span>
                </div>
                <div className="capacity-eta-value">
                  {etaDias === null ? (
                    <span className="capacity-eta-undefined">
                      sem recurso
                    </span>
                  ) : (
                    <>
                      <ArrowRight size={14} />
                      {etaDias} dia{etaDias > 1 ? "s" : ""}
                    </>
                  )}
                </div>
              </div>
            ))}

          {etaPorFicha.some((e) => e.semAlocacao) && (
            <div className="capacity-eta-warning">
              <AlertTriangle size={14} />
              {etaPorFicha.filter((e) => e.semAlocacao).length} ficha(s) sem
              operador alocado
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
