import { getFichaStatus, getProgressPct } from "../../utils/fichaStatus";
import { OPERACOES } from "../../data/fichaTemplate";
import { canDeleteFicha, canGeneratePdf } from "../../utils/hasPermission";
import FichaTimerBadge from "./FichaTimerBadge";
import { getRoleColor, getRoleLabel } from "../../utils/roleColors";
import {
  User,
  Tag,
  Trash2,
  AlertCircle,
  Clock3,
  CheckCircle2,
  FileText,
  Circle,
} from "lucide-react";
import { FaFilePdf } from "react-icons/fa";
import OperatorSelector from "./OperatorSelector";

export default function FichaCard({
  ficha,
  index,
  selected,
  selectionOrder,
  onToggleSelection,
  user,
  listaUsuarios,
  onOpen,
  onDelete,
  onToggleOperador,
  podeGerenciarOperadores,
  activeDropdownFichaId,
  setActiveDropdownFichaId,
  disabledParaPdf = false,
}) {
  const status = getFichaStatus(ficha);
  const pct = getProgressPct(ficha);
  const operadores = ficha.operadores || [];

  const podeExcluirFicha =
    user?.username === "master" ||
    user?.permissoes?.includes("excluir_ficha") === true;

  function getOperadorRole(op) {
    const doBanco = listaUsuarios?.find(
      (u) => u.id === op.id || u.username === op.username,
    );
    return doBanco?.role || op.role || null;
  }

  function getCodigoTagClass(codigo) {
    if (!codigo) return "ficha-meta-code";
    const prefixo = codigo.split("-")[0]?.toUpperCase();

    switch (prefixo) {
      case "PRO":
        return "ficha-meta-code ficha-meta-code--pro";
      case "TAF":
        return "ficha-meta-code ficha-meta-code--taf";
      case "FOTO":
        return "ficha-meta-code ficha-meta-code--foto";
      case "QUA":
        return "ficha-meta-code ficha-meta-code--qua";
      default:
        return "ficha-meta-code";
    }
  }

  function getOperacaoNome(ficha) {
    const op = String(ficha.operacao);

    if (op === "80") {
      const tipo = ficha.tipoFotografico || ficha.dados?.tipoFotografico;
      return tipo === "tecnica"
        ? "Ficha Fotográfica Técnica"
        : "Ficha Fotográfica";
    }

    return OPERACOES[op]?.nome || "—";
  }

  return (
    <div
      key={ficha.dbId}
      className={`ficha-card status-${status}`}
      style={{
        animationDelay: `${index * 0.05}s`,
        zIndex: activeDropdownFichaId === ficha.dbId ? 999 : 1,
      }}
      onClick={() => onOpen(ficha.dbId)}
    >
      <div className="ficha-card-top">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="ficha-card-title"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {ficha.dados?.nomeEquipamento ||
              ficha.nomeEquipamento ||
              "Sem nome"}
            <FichaTimerBadge
              sessaoAtiva={ficha.sessao_ativa}
              tempoAcumulado={ficha.tempo_acumulado_segundos}
            />
          </div>

          <div className="ficha-card-sub">
            <strong>{ficha.numeroInd || "—"}</strong> · {getOperacaoNome(ficha)}{" "}
            · {ficha.cliente || "—"}
          </div>

          <div className="ficha-card-meta">
            <span className="ficha-meta-user">
              <User size={14} />
              {ficha.criadoPor || ficha.userId || "-"}
            </span>

            <span className={getCodigoTagClass(ficha.codigo)}>
              <Tag size={14} />
              {ficha.codigo || "-"}
            </span>
            {canGeneratePdf(user) && (
              <div className="pdf-selector">
                <div
                  className={`pdf-badge ${disabledParaPdf ? "pdf-badge--disabled" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (disabledParaPdf) return;
                    onToggleSelection(ficha.dbId);
                  }}
                  title={
                    disabledParaPdf
                      ? "Ficha de outro IND — não pode entrar neste Book"
                      : ""
                  }
                >
                  <FaFilePdf className="pdf-icon" />
                  <span className="pdf-label">PDF</span>
                  <label className="ficha-checkbox">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={disabledParaPdf}
                      onChange={() =>
                        !disabledParaPdf && onToggleSelection(ficha.dbId)
                      }
                    />
                    <span
                      className="checkmark"
                      data-order={selected ? selectionOrder : ""}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
        {podeExcluirFicha && (
          <button
            className="delete-btn"
            onClick={(e) => onDelete(e, ficha.dbId)}
            title="Excluir"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div
        className="ficha-card-operators-section"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "10px",
          marginBottom: "6px",
          paddingTop: "8px",
          borderTop: "1px solid var(--border)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            overflow: "hidden",
          }}
        >
          {operadores.length === 0 ? (
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                fontStyle: "italic",
              }}
            >
              Nenhum operador atribuído
            </span>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: "4px",
              }}
            >
              {operadores.map((op, idx) => {
                const role = getOperadorRole(op);

                return (
                  <div
                    key={op.id || idx}
                    title={`${op.nome} (${
                      role ? getRoleLabel(role) : "sem cargo"
                    })`}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: getRoleColor(role),
                      color: "#ffffff",
                      border: "2px solid var(--bg-card)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "bold",
                      marginLeft: idx === 0 ? 0 : -8,
                      position: "relative",
                      zIndex: operadores.length - idx,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      flexShrink: 0,
                    }}
                  >
                    {(op.nome || "?")[0].toUpperCase()}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {podeGerenciarOperadores && (
          <OperatorSelector
            ficha={ficha}
            operadores={operadores}
            listaUsuarios={listaUsuarios}
            user={user}
            activeDropdownFichaId={activeDropdownFichaId}
            setActiveDropdownFichaId={setActiveDropdownFichaId}
            onToggleOperador={onToggleOperador}
          />
        )}
      </div>

      <div className="ficha-card-bottom">
        <div className="flex items-center gap-2">
          {status === "rejected" && (
            <span className="badge badge-red">
              <AlertCircle size={14} />
              Reprovada
            </span>
          )}

          {status === "waiting" && (
            <span className="badge badge-amber">
              <Clock3 size={14} />
              Aguardando análise
            </span>
          )}

          {status === "approved" && (
            <span className="badge badge-green">
              <CheckCircle2 size={14} />
              Aprovada
            </span>
          )}

          {status === "done" && (
            <span className="badge badge-blue">
              <FileText size={14} />
              Preenchida
            </span>
          )}

          {status === "progress" && (
            <span className="badge badge-amber">
              <Clock3 size={14} />
              Em andamento
            </span>
          )}

          {status === "empty" && (
            <span className="badge badge-muted">
              <Circle size={12} />
              Nova
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="progress-bar" style={{ width: 50 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-bold text-blue">{pct}%</span>
        </div>
      </div>
    </div>
  );
}
