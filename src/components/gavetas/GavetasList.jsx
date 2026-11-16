import { useState } from "react";
import { useGavetas } from "../../hooks/useGavetas";
import GavetaDetalhe from "./GavetaDetalhe";
import {
  Boxes,
  ChevronRight,
  CheckCircle2,
  Clock,
  Circle,
  StickyNote,
} from "lucide-react";

function progressoGaveta(gaveta) {
  const items = gaveta?.dados?.items || [];
  if (!Array.isArray(items) || items.length === 0) return 0;
  const done = items.filter(
    (i) => i?.resultado === "ok" || i?.resultado === "na",
  ).length;
  return Math.round((done / items.length) * 100);
}

function statusInfo(status) {
  switch (status) {
    case "finalizada":
      return {
        label: "Finalizada",
        color: "var(--green, #22c55e)",
        Icon: CheckCircle2,
      };
    case "em_andamento":
      return {
        label: "Em andamento",
        color: "var(--amber, #f59e0b)",
        Icon: Clock,
      };
    default:
      return {
        label: "Aberta",
        color: "var(--text-secondary, #64748b)",
        Icon: Circle,
      };
  }
}

// A assinatura da gaveta agora é { nome, cargo, dataHora }
function temAssinatura(gaveta) {
  const ass = gaveta?.dados?.assinaturas || {};
  return Object.values(ass).some((a) => a?.nome || a?.dataUrl);
}

export default function GavetasList({ ficha, fichaId, user }) {
  const { gavetas, loading, erro, recarregar } = useGavetas(fichaId);
  const [gavetaAberta, setGavetaAberta] = useState(null);

  // Ao voltar, recarrega a lista para refletir o autosave feito no detalhe
  function voltar() {
    setGavetaAberta(null);
    recarregar();
  }

  if (gavetaAberta) {
    return (
      <GavetaDetalhe
        ficha={ficha}
        fichaId={fichaId}
        gaveta={gavetaAberta}
        user={user}
        onVoltar={voltar}
      />
    );
  }

  if (loading && gavetas.length === 0) {
    return <p className="gaveta-vazio">Carregando gavetas...</p>;
  }

  if (erro && gavetas.length === 0) {
    return (
      <div className="gaveta-vazio">
        <p>{erro}</p>
        <button type="button" className="gaveta-btn" onClick={recarregar}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (gavetas.length === 0) {
    return (
      <p className="gaveta-vazio">
        Nenhuma gaveta encontrada para esta ficha. As gavetas são criadas
        automaticamente ao salvar a ficha CCM.
      </p>
    );
  }

  const total = gavetas.length;
  const concluidas = gavetas.filter((g) => g.status === "finalizada").length;
  const indCompartilhado = ficha?.numeroInd || ficha?.dados?.numeroInd || "—";

  return (
    <div className="gavetas-wrap">
      <div className="gavetas-header">
        <div>
          <h3 className="gavetas-titulo">
            <Boxes size={18} /> Gavetas do Painel
          </h3>
          <p className="gavetas-sub">
            {indCompartilhado} · {concluidas} de {total} concluídas
          </p>
        </div>
      </div>

      <div className="gavetas-grid">
        {gavetas.map((g) => {
          const pct = progressoGaveta(g);
          const st = statusInfo(g.status);
          const assinada = temAssinatura(g);
          const nome = g.nome_equipamento || `Gaveta ${g.numero}`;

          return (
            <button
              key={g.id}
              type="button"
              className="gaveta-card"
              onClick={() => setGavetaAberta(g)}
            >
              <div className="gaveta-card-topo">
                <span className="gaveta-card-numero">
                  G{String(g.numero).padStart(2, "0")}
                </span>
                <span className="gaveta-card-tag">{g.tag || "—"}</span>
              </div>

              <div className="gaveta-card-nome">{nome}</div>

              <div className="gaveta-card-progresso">
                <div className="gaveta-progresso-bar">
                  <div
                    className="gaveta-progresso-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="gaveta-progresso-pct">{pct}%</span>
              </div>

              <div className="gaveta-card-rodape">
                <span className="gaveta-status" style={{ color: st.color }}>
                  <st.Icon size={14} /> {st.label}
                </span>
                {assinada && (
                  <span className="gaveta-assinada">
                    <StickyNote size={13} /> Assinada
                  </span>
                )}
                <ChevronRight size={16} className="gaveta-chevron" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
