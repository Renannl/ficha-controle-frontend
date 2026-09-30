import { LayoutList, Images, BarChart3 } from "lucide-react";

const sliderPosition = {
  list: "var(--toggle-pad)",
  gallery: "calc(33.33% + var(--toggle-pad))",
  dashboard: "calc(66.66% + var(--toggle-pad))",
};

export default function HomeViewToggle({
  viewMode,
  setViewMode,
  toggleRef,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  selectedColecao,
}) {
  if (selectedColecao) return null;

  return (
    <div
      className="home-view-toggle"
      ref={toggleRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="view-toggle-slider"
        style={{
          left: sliderPosition[viewMode],
        }}
      />

      <button
        onClick={() => setViewMode("list")}
        className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
      >
        <LayoutList size={16} />
        Relatórios
      </button>

      <button
        onClick={() => setViewMode("gallery")}
        className={`view-toggle-btn ${viewMode === "gallery" ? "active" : ""}`}
      >
        <Images size={16} />
        Fotos
      </button>

      <button
        onClick={() => setViewMode("dashboard")}
        className={`view-toggle-btn ${viewMode === "dashboard" ? "active" : ""}`}
      >
        <BarChart3 size={16} />
        Métricas
      </button>
    </div>
  );
}
