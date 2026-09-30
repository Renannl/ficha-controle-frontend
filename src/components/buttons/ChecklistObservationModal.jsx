import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ChecklistObservationModal({
  isOpen,
  onClose,
  onConfirm,
  itemLabel,
  resultado,
  initialValue = "",
}) {
  const [reason, setReason] = useState(initialValue);

  useEffect(() => {
    setReason(initialValue);
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert("É obrigatório informar uma observação.");
      return;
    }
    onConfirm(reason.trim());
  };

  const isOk = resultado === "ok";
  const isErro = resultado === "erro";

  const icon = isOk ? "✅" : isErro ? "❌" : "➖";
  const bgColor = isOk
    ? "var(--green-glow)"
    : isErro
    ? "var(--red-glow)"
    : "var(--yellow-glow)";
  const textColor = isOk
    ? "var(--green)"
    : isErro
    ? "var(--red)"
    : "var(--yellow)";
  const title = isOk
    ? "Item Aprovado"
    : isErro
    ? "Item com Erro"
    : "Item Não Aplicável";

  const modalContent = (
    <div className="obs-modal-overlay animate-fadeIn">
      <div className="obs-modal-content card-glow animate-popIn">
        <div className="obs-modal-header">
          <div
            className="confirm-modal-icon"
            style={{
              background: bgColor,
              color: textColor,
              marginBottom: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <h3 className="confirm-modal-title" style={{ margin: 0 }}>
              {title}
            </h3>
          </div>
          <button className="obs-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {itemLabel && (
          <div className="obs-modal-item-card">
            <span className="obs-modal-item-tag">Item avaliado</span>
            <p className="obs-modal-item-text">{itemLabel}</p>
          </div>
        )}

        <p className="obs-modal-subtitle">
          {isErro
            ? "Descreva o problema encontrado neste item:"
            : "Descreva a observação referente a este item:"}
        </p>

        <textarea
          className="obs-modal-textarea"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Digite a observação obrigatória..."
          autoFocus
        />

        <div className="confirm-modal-actions">
          <button className="btn-modal-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-modal-confirm btn-success"
            onClick={handleConfirm}
            style={{ opacity: reason.trim() ? 1 : 0.5 }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
