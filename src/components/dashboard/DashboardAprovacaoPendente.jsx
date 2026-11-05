import { ClipboardCheck, Check, X } from "lucide-react";

export default function DashboardAprovacaoPendente({ fichas, user, onApprove }) {
  if (!fichas?.length) return null;

  const podeAprovar = user?.permissoes?.includes("aprovar");
  const podeRejeitar = user?.permissoes?.includes("rejeitar");

  if (!podeAprovar && !podeRejeitar) return null;

  return (
    <div className="dash-section">
      <h3 className="dash-section-h3">
        <ClipboardCheck size={16} /> Aguardando sua aprovação
      </h3>

      {fichas.slice(0, 8).map((f) => (
        <div
          key={f.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: "block" }}>
              {f.numeroInd || f.codigo || "—"}
            </strong>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {f.cliente || "—"}
              {f.nomeEquipamento ? ` · ${f.nomeEquipamento}` : ""}
            </span>
          </div>

          {podeAprovar && (
            <button
              onClick={() => onApprove?.(f.id, "aprovado")}
              title="Aprovar"
              style={{
                background: "var(--green)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "6px 8px",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <Check size={16} />
            </button>
          )}
          {podeRejeitar && (
            <button
              onClick={() => onApprove?.(f.id, "reprovado")}
              title="Reprovar"
              style={{
                background: "var(--red)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "6px 8px",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
