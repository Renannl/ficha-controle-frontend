import { useDashboardMetrics } from "../../hooks/useDashboardMetrics";
import DashboardHeader from "./DashboardHeader";
import DashboardKpis from "./DashboardKpis";
import DashboardPrazos from "./DashboardPrazos";
import DashboardAprovacaoPendente from "./DashboardAprovacaoPendente";
import DashboardProgress from "./DashboardProgress";
import DashboardDonut from "./DashboardDonut";
import DashboardQualidade from "./DashboardQualidade";
import DashboardCapacity from "./DashboardCapacity";
import DashboardProducaoMensal from "./DashboardProducaoMensal";
import DashboardColaboradores from "./DashboardColaboradores";
import DashboardClientes from "./DashboardClientes";
import DashboardTempo from "./DashboardTempo";
import DashboardWorkload from "./DashboardWorkload";
import DashboardEmpty from "./DashboardEmpty";

export default function Dashboard({ fichas, user, onApprove, usuarios }) {
  const metrics = useDashboardMetrics(fichas);

  if (metrics.total === 0) {
    return (
      <div className="dashboard animate-scaleIn">
        <DashboardHeader total={0} />
        <DashboardEmpty total={0} />
      </div>
    );
  }

  return (
    <div className="dashboard animate-scaleIn">
      <DashboardHeader total={metrics.total} atrasadas={metrics.atrasadas} />

      <DashboardKpis metrics={metrics} />

      <div className="dash-grid-2">
        <DashboardProgress metrics={metrics} />
        <DashboardWorkload metrics={metrics} />
      </div>

      <div className="dash-grid-2">
        <DashboardDonut metrics={metrics} />
        <DashboardQualidade metrics={metrics} />
      </div>

      <DashboardCapacity fichas={fichas} usuarios={usuarios} />

      <div className="dash-grid-1">
        <DashboardPrazos
          atrasadas={metrics.fichasAtrasadas}
          prazoCritico={metrics.fichasPrazoCritico}
        />
      </div>

      <div className="dash-grid-2">
        <DashboardTempo metrics={metrics} />
        <DashboardProducaoMensal producaoMensal={metrics.producaoMensal} />
      </div>

      <div className="dash-grid-2">
        <DashboardColaboradores colaboradores={metrics.colaboradores} />
        <DashboardClientes clientes={metrics.clientesRanking} />
      </div>
    </div>
  );
}
