import ChecklistSessions from "./ChecklistSessions";
import { useState } from "react";
import ChecklistObservationModal from "../buttons/ChecklistObservationModal";
import { FileText, X } from "lucide-react";

export default function ChecklistItem({
  item,
  index,
  numero,
  template,
  isExpanded,
  isTaf,
  isPainel,
  onToggleExpand,
  onToggleMark,
  onResultado,
  readOnly = false,
  liberado = true,
}) {
  const hideExpand = isTaf || isPainel;

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingResultado, setPendingResultado] = useState(null);

  function abrirModalResultado(valor) {
    setPendingResultado(valor);
    setModalOpen(true);
  }

  function handleConfirmObservacao(observacao) {
    onResultado(index, pendingResultado, observacao);
    setModalOpen(false);
    setPendingResultado(null);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setPendingResultado(null);
  }

  function handleOkClick(e) {
    e.stopPropagation();
    if (readOnly) return;
    onResultado(index, "ok", "");
  }

  return (
    <div
      className={`checklist-item ${isExpanded ? "expanded" : ""} ${
        readOnly ? "readonly" : ""
      } ${!liberado ? "locked-order" : ""}`}
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      <div
        className="checklist-item-header"
        onClick={() => onToggleExpand(item.id)}
      >
        <div className="checklist-item-number">{numero ?? index + 1}</div>
        <div className="checklist-item-desc">{template?.descricao}</div>
        <div className="checklist-item-status">
          <div className="resultado-btns">
            <button
              className={`resultado-btn ${item.resultado === "ok" ? "ok-active" : ""}`}
              disabled={readOnly}
              onClick={handleOkClick}
            >
              OK
            </button>
            <button
              className={`resultado-btn ${item.resultado === "na" ? "na-active" : ""}`}
              disabled={readOnly}
              onClick={(e) => {
                e.stopPropagation();
                if (readOnly) return;
                abrirModalResultado("na");
              }}
            >
              NA
            </button>
            <button
              className={`resultado-btn resultado-btn-erro ${
                item.resultado === "erro" ? "erro-active" : ""
              }`}
              disabled={readOnly}
              title="Marcar como erro"
              onClick={(e) => {
                e.stopPropagation();
                if (readOnly) return;
                abrirModalResultado("erro");
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
        {!hideExpand && (
          <span className={`expand-arrow ${isExpanded ? "open" : ""}`}>▼</span>
        )}
      </div>

      {item.observacao && (
        <div
          className="checklist-item-obs"
          style={{
            borderLeftColor:
              item.resultado === "ok"
                ? "var(--green)"
                : item.resultado === "erro"
                  ? "var(--red)"
                  : "var(--yellow, orange)",
          }}
        >
          <span className="checklist-item-obs-icon">
            <FileText size={16} />
          </span>
          <div className="checklist-item-obs-content">
            <span className="checklist-item-obs-label">Observação</span>
            <p className="checklist-item-obs-text">{item.observacao}</p>
          </div>
        </div>
      )}

      {isExpanded && !isPainel && (
        <ChecklistSessions
          item={item}
          index={index}
          onToggleMark={onToggleMark}
          readOnly={readOnly}
        />
      )}

      <ChecklistObservationModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmObservacao}
        itemLabel={template?.descricao}
        resultado={pendingResultado}
        initialValue={item.observacao}
      />
    </div>
  );
}
