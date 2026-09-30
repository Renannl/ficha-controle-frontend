import { Search, X } from "lucide-react";

export default function HomeFilters({
  showSearch,
  setShowSearch,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
}) {
  return (
    <div
      className="home-list-header flex items-center justify-between mb-2"
      style={{
        flexWrap: "wrap",
        gap: "8px",
        gridColumn: "1 / -1",
        width: "100%",
      }}
    >
      <div className="flex items-center gap-2">
        {!showSearch && (
          <div className="home-list-title" style={{ marginBottom: 0 }}>
            Fichas Recentes
          </div>
        )}

        <div className={`search-container ${showSearch ? "active" : ""}`}>
          <button
            className="search-toggle-btn"
            onClick={() => {
              setShowSearch((prev) => !prev);

              if (showSearch) {
                setSearchTerm("");
              }
            }}
          >
            {showSearch ? <X size={18} /> : <Search size={18} />}
          </button>

          {showSearch && (
            <input
              className="search-input animate-slideInRight"
              type="text"
              placeholder="Nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <select
          className="text-xs font-semibold"
          style={{
            background:
              "var(--blue-glow) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%233CA3AB' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\") no-repeat right 8px center",
            border: "1px solid var(--blue-accent)",
            borderRadius: "var(--radius-xs)",
            padding: "6px 24px 6px 10px",
            color: "var(--blue-primary)",
            outline: "none",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
          }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">Todos</option>
          <option value="taf">TAF</option>
          <option value="controle">Controle</option>
          <option value="foto">Fotos</option>
        </select>

        <select
          className="text-xs font-semibold"
          style={{
            background:
              "var(--bg-elevated) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A8FA6' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\") no-repeat right 8px center",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xs)",
            padding: "6px 24px 6px 10px",
            color: "var(--text-secondary)",
            outline: "none",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
          }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos Status</option>
          <option value="progress">🟡 Andamento</option>
          <option value="done">🔵 Preenchida</option>
          <option value="waiting">🟠 Aguardando</option>
          <option value="approved">🟢 Aprovada</option>
          <option value="rejected">🔴 Reprovada</option>
          <option value="empty">⚪ Nova</option>
        </select>
      </div>
    </div>
  );
}
