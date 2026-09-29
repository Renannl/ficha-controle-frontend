import { useState } from "react";
import { ETAPA_LABELS } from "../../utils/etapas";

export default function PularEtapaModal({
  isOpen,
  onClose,
  etapaAtual,
  onConfirm,
}) {
  const [justificativa, setJustificativa] = useState("");

  if (!isOpen || !etapaAtual) return null;

  const proximaEtapa =
    etapaAtual === "montagem"
      ? "barramento"
      : etapaAtual === "barramento"
        ? "cabeamento"
        : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
            Pular etapa: {ETAPA_LABELS[etapaAtual]}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "22px",
              cursor: "pointer",
              lineHeight: 1,
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          <p style={{ fontSize: "14px", marginBottom: "12px" }}>
            Você está prestes a{" "}
            <strong>pular a etapa de {ETAPA_LABELS[etapaAtual]}</strong> e
            avançar para{" "}
            <strong>
              {proximaEtapa ? ETAPA_LABELS[proximaEtapa] : "finalização"}
            </strong>
            .
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              marginBottom: "16px",
            }}
          >
            Esta ação só pode ser feita por administradores. Todos os itens
            pendentes desta etapa serão marcados como OK e registrados no log.
          </p>

          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "6px",
            }}
          >
            Justificativa (obrigatória)
          </label>
          <textarea
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Informe o motivo do pulo de etapa..."
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "10px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-base)",
              color: "var(--text-primary)",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
        </div>

        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: "8px 16px" }}
          >
            Cancelar
          </button>
          <button
            className="btn btn-warning"
            disabled={!justificativa.trim()}
            onClick={() => {
              onConfirm(justificativa.trim());
              setJustificativa("");
            }}
            style={{ padding: "8px 16px" }}
          >
            Confirmar Pulo
          </button>
        </div>
      </div>
    </div>
  );
}
