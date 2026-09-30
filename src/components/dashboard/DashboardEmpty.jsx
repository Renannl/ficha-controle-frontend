export default function DashboardEmpty({ total }) {
  if (total !== 0) return null;

  return (
    <div className="dash-empty">
      <p>Crie fichas para visualizar métricas e gráficos aqui.</p>
    </div>
  );
}
