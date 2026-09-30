import { useState } from "react";
import HomeFilters from "./HomeFilters";
import FichaCard from "./FichaCard";
import {
  FolderOpen,
  Plus,
  Calendar,
  Search,
  X,
  Trash2,
  ChevronDown,
  FileSpreadsheet,
} from "lucide-react";
import { getFichaStatus } from "../../utils/fichaStatus";
import { getColecaoStatus } from "../../utils/colecaoStatus";

function getStatusColor(status) {
  const cores = {
    vazia: "var(--text-muted)",
    andamento: "#f59e0b",
    completa: "#22c55e",
    erro: "#ef4444",
  };
  return cores[status] || "var(--blue-accent)";
}

function getFichaStatusColor(status) {
  const cores = {
    empty: "var(--text-muted)",
    progress: "#eab308",
    done: "#22c55e",
    waiting: "#eab308",
    approved: "#22c55e",
    rejected: "#ef4444",
  };
  return cores[status] || "var(--blue-accent)";
}

export default function HomeList({
  mode = "fichas",
  colecoes = [],
  fichas = [],
  filteredFichas = [],
  showSearch,
  setShowSearch,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  user,
  listaUsuarios,
  onOpen,
  onDelete,
  onDeleteColecao,
  onToggleOperador,
  podeGerenciarOperadores,
  activeDropdownFichaId,
  setActiveDropdownFichaId,
  selectedFichas = [],
  toggleFichaSelection,
  onOpenColecao,
  onColecaoImportada,
  fichaPodeSerSelecionada = () => true,
}) {
  const [expandedColecaoId, setExpandedColecaoId] = useState(null);
  const [rascunhoSelecionado, setRascunhoSelecionado] = useState(null);

  const isAdmin = user?.role === "admin";

  if (mode === "colecoes") {
    const LIMITE_PREVIEW = 3;

    const rascunhos = colecoes.filter((col) => col.status === "rascunho");
    const completas = colecoes.filter((col) => col.status !== "rascunho");

    return (
      <div className="home-list animate-scaleIn">
        {isAdmin && rascunhos.length > 0 && (
          <div className="secao-rascunhos">
            <div className="home-list-header">
              <h2 className="home-list-title">
                Rascunhos
              </h2>
            </div>
            <div className="colecoes-grid">
              {rascunhos.map((col) => {
                const dataCriacao = col.created_at
                  ? new Date(col.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : null;

                return (
                  <div
                    key={col.id}
                    className="colecao-card rascunho"
                    onClick={() => setRascunhoSelecionado(col)}
                  >
                    <div className="colecao-card-top">
                      <div className="colecao-card-icon">
                        <FileSpreadsheet size={18} />
                      </div>
                      <div className="colecao-card-info">
                        <div className="colecao-card-title">
                          {col.cliente ?? "Aguardando planilha"}
                        </div>
                        <div className="colecao-card-sub">
                          {col.descricao ?? "Rascunho - aguardando Excel"}
                        </div>
                      </div>
                      <div className="colecao-card-actions">
                        <div
                          className="colecao-card-badge rascunho-badge"
                          style={{
                            color: "#f59e0b",
                            borderColor: "#f59e0b",
                          }}
                        >
                          Rascunho
                        </div>
                      </div>
                    </div>

                    <div className="colecao-preview">
                      <div className="colecao-card-empty">
                        <FileSpreadsheet size={13} /> Aguardando planilha Excel
                      </div>
                    </div>

                    {dataCriacao && (
                      <div className="colecao-card-date">
                        <Calendar size={11} />
                        Criado em {dataCriacao}
                      </div>
                    )}

                    <button
                      className="btn btn-primary btn-completar-rascunho"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRascunhoSelecionado(col);
                      }}
                    >
                      <FileSpreadsheet size={16} />
                      Completar Coleção
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="home-list-header">
          <div className="flex items-center gap-2">
            {!showSearch && (
              <h2 className="home-list-title" style={{ marginBottom: 0 }}>
                {rascunhos.length > 0
                  ? "Coleções Completas"
                  : "Coleções Recentes"}
              </h2>
            )}

            <div className={`search-container ${showSearch ? "active" : ""}`}>
              <button
                className="search-toggle-btn"
                onClick={() => {
                  setShowSearch((prev) => !prev);
                  if (showSearch) setSearchTerm("");
                }}
              >
                {showSearch ? <X size={18} /> : <Search size={18} />}
              </button>

              {showSearch && (
                <input
                  className="search-input animate-slideInRight"
                  type="text"
                  placeholder="Buscar coleção por cliente ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              )}
            </div>
          </div>
        </div>

        {completas.length === 0 ? (
          <div className="colecoes-empty">
            <p>Nenhuma coleção encontrada.</p>
            <small>Use o botão + para criar uma coleção para um cliente.</small>
          </div>
        ) : (
          <div className="colecoes-grid">
            {completas.map((col) => {
              const fichasDaCol = fichas.filter((f) => f.colecao_id === col.id);
              const isExpanded = expandedColecaoId === col.id;

              const preview = isExpanded
                ? fichasDaCol
                : fichasDaCol.slice(0, LIMITE_PREVIEW);

              const resto = fichasDaCol.length - LIMITE_PREVIEW;
              const colecaoStatus = getColecaoStatus(fichasDaCol);

              const temTrabalhoEmAndamento = fichasDaCol.some(
                (f) => f.sessao_ativa,
              );

              const dataCriacao = col.created_at
                ? new Date(col.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : null;

              return (
                <div
                  key={col.id}
                  className={`colecao-card ${colecaoStatus !== "vazia" ? `status-${colecaoStatus}` : ""}`}
                  onClick={() => onOpenColecao(col)}
                >
                  <div className="colecao-card-top">
                    <div className="colecao-card-icon">
                      <FolderOpen size={18} />
                    </div>
                    <div className="colecao-card-info">
                      <div className="colecao-card-title">
                        {col.cliente ?? "Sem nome"}
                        {temTrabalhoEmAndamento && (
                          <span
                            className="colecao-card-timer-badge"
                            title={`Em andamento: ${fichasDaCol
                              .filter((f) => f.sessao_ativa)
                              .map((f) => f.sessao_ativa.usuario)
                              .join(", ")}`}
                          >
                            ● em andamento
                          </span>
                        )}
                      </div>
                      <div className="colecao-card-sub">
                        {col.descricao ?? "Sem descrição"}{" "}
                      </div>
                    </div>

                    <div className="colecao-card-actions">
                      <div
                        className="colecao-card-badge"
                        style={{
                          color: getStatusColor(colecaoStatus),
                          borderColor: getStatusColor(colecaoStatus),
                        }}
                      >
                        {fichasDaCol.length}{" "}
                        {fichasDaCol.length === 1 ? "ficha" : "fichas"}
                      </div>

                      {onDeleteColecao && (
                        <button
                          className="colecao-card-delete-btn"
                          title={
                            fichasDaCol.length > 0
                              ? "Não é possível excluir: coleção possui fichas"
                              : "Excluir coleção"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteColecao(e, col.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="colecao-preview">
                    {fichasDaCol.length === 0 ? (
                      <div className="colecao-card-empty">
                        <Plus size={13} /> Nenhuma ficha ainda
                      </div>
                    ) : (
                      <>
                        {preview.map((f) => (
                          <div key={f.dbId} className="preview-ficha">
                            <span
                              className="preview-ficha-dot"
                              style={{
                                background: getFichaStatusColor(
                                  getFichaStatus(f),
                                ),
                              }}
                            />
                            {f.nomeEquipamento ?? f.tipo ?? "Ficha"}
                          </div>
                        ))}
                        {resto > 0 && (
                          <div
                            className="preview-ficha-more"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedColecaoId(isExpanded ? null : col.id);
                            }}
                          >
                            {isExpanded
                              ? "ver menos"
                              : `+${resto} ficha${resto > 1 ? "s" : ""}`}
                            <ChevronDown
                              size={12}
                              style={{
                                transform: isExpanded
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {dataCriacao && (
                    <div className="colecao-card-date">
                      <Calendar size={11} />
                      Criada em {dataCriacao}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {rascunhoSelecionado && (
          <CompletarColecaoModal
            show={!!rascunhoSelecionado}
            colecaoId={rascunhoSelecionado.id}
            onClose={() => setRascunhoSelecionado(null)}
            onCompletado={() => {
              setRascunhoSelecionado(null);
              onColecaoImportada?.();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="home-list animate-scaleIn">
      <HomeFilters
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      {filteredFichas.length === 0 ? (
        <div className="fichas-empty">
          Nenhuma ficha encontrada nesta coleção.
        </div>
      ) : (
        filteredFichas.map((ficha, i) => (
          <FichaCard
            key={ficha.dbId}
            ficha={ficha}
            index={i}
            user={user}
            listaUsuarios={listaUsuarios}
            selected={selectedFichas.includes(ficha.dbId)}
            selectionOrder={selectedFichas.indexOf(ficha.dbId) + 1}
            onToggleSelection={toggleFichaSelection}
            onOpen={onOpen}
            onDelete={onDelete}
            onToggleOperador={onToggleOperador}
            podeGerenciarOperadores={podeGerenciarOperadores}
            activeDropdownFichaId={activeDropdownFichaId}
            disabledParaPdf={!fichaPodeSerSelecionada(ficha)}
            setActiveDropdownFichaId={setActiveDropdownFichaId}
          />
        ))
      )}
    </div>
  );
}
