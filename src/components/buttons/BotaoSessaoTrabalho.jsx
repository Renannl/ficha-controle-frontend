import { useState, useEffect, useMemo } from "react";
import { Play, Pause } from "lucide-react";
import { authFetch } from "../../services/apiClient";
import { getEtapaLabel, podeTrabalharNaEtapa } from "../../utils/etapas";

function formatarTempo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function BotaoSessaoTrabalho({
  fichaId,
  user,
  sessoes,
  onChange,
  etapa,
  etapasLiberadas = [],
  isAdmin = false,
  isTaf = false,
}) {
  const [tempoAtual, setTempoAtual] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [motivoPausa, setMotivoPausa] = useState("");

  const sessaoAtiva =
    sessoes?.find((s) => !s.fim && s.usuario === user?.username) || null;

  const podeExecutarTaf = useMemo(() => {
    if (!isTaf) return false;
    return user?.role === "taf" || user?.role === "admin";
  }, [isTaf, user]);

  const etapaPermitida = useMemo(() => {
    if (isTaf) return "taf";
    if (isAdmin) return etapa;
    if (podeTrabalharNaEtapa(user, etapa)) return etapa;

    for (const etapaLiberada of etapasLiberadas) {
      if (podeTrabalharNaEtapa(user, etapaLiberada)) {
        return etapaLiberada;
      }
    }

    return etapa;
  }, [isTaf, isAdmin, user, etapa, etapasLiberadas]);

  const etapasDisponiveis = useMemo(() => {
    if (isTaf) return podeExecutarTaf ? ["taf"] : [];
    if (isAdmin && etapasLiberadas?.length > 0) return etapasLiberadas;
    return etapaPermitida ? [etapaPermitida] : [];
  }, [isTaf, podeExecutarTaf, isAdmin, etapasLiberadas, etapaPermitida]);

  const [selectedEtapa, setSelectedEtapa] = useState(() => {
    if (etapasDisponiveis.includes(etapaPermitida)) return etapaPermitida;
    return etapasDisponiveis[0] || etapaPermitida;
  });

  useEffect(() => {
    if (!sessaoAtiva) {
      setTempoAtual(0);
      return;
    }
    const inicio = new Date(sessaoAtiva.inicio).getTime();
    const atualizar = () => setTempoAtual((Date.now() - inicio) / 1000);
    atualizar();
    const interval = setInterval(atualizar, 1000);
    return () => clearInterval(interval);
  }, [sessaoAtiva]);

  useEffect(() => {
    if (etapasDisponiveis.includes(selectedEtapa)) return;
    setSelectedEtapa(etapasDisponiveis[0] || etapaPermitida);
  }, [etapasDisponiveis, selectedEtapa, etapaPermitida]);

  function podeIniciarEtapa(etapaName) {
    if (!etapaName) return false;
    if (isTaf) return podeExecutarTaf;
    if (isAdmin) return true;
    if (podeTrabalharNaEtapa(user, etapaName)) return true;
    if (etapasLiberadas.includes(etapaName)) return true;
    return false;
  }

  const etapaParaIniciar = isTaf
    ? "taf"
    : sessaoAtiva?.etapa || selectedEtapa || etapaPermitida;
  const podeIniciar = podeIniciarEtapa(etapaParaIniciar);
  const bloqueado = !podeIniciar && !sessaoAtiva;

  const handlePlay = async () => {
    if (bloqueado) return;
    try {
      setLoading(true);
      const etapaIniciar = isTaf
        ? "taf"
        : sessaoAtiva?.etapa || selectedEtapa || etapaPermitida;

      const res = await authFetch(`/fichas/${fichaId}/sessao/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa: etapaIniciar }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao iniciar sessão.");
        return;
      }
      await onChange?.();
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (motivo = "") => {
    try {
      setLoading(true);
      const res = await authFetch(`/fichas/${fichaId}/sessao/pausar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessaoId: sessaoAtiva?.id,
          motivoPausa: motivo,
        }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao pausar sessão.");
        return;
      }
      await onChange?.();
    } finally {
      setLoading(false);
    }
  };

  const confirmPause = async () => {
    const motivo = motivoPausa.trim();
    setShowPauseModal(false);
    setMotivoPausa("");
    await handlePause(motivo);
  };

  const rodando = !!sessaoAtiva;

  return (
    <>
      <div className="sessao-trabalho-float">
        {rodando ? (
          <>
            <button
              onClick={() => setShowPauseModal(true)}
              disabled={loading}
              className="sessao-trabalho-btn pausar"
              title="Pausar sessão"
            >
              <Pause size={20} />
            </button>
            <div className="sessao-trabalho-info-float">
              <span className="sessao-trabalho-etapa-float">
                {getEtapaLabel(sessaoAtiva.etapa)}
              </span>
              <span className="sessao-trabalho-tempo-float">
                {formatarTempo(tempoAtual)}
              </span>
            </div>
          </>
        ) : isAdmin && !isTaf && etapasLiberadas.length > 0 ? (
          <div className="sessao-trabalho-multi">
            <select
              className="sessao-trabalho-select"
              value={selectedEtapa}
              onChange={(e) => setSelectedEtapa(e.target.value)}
            >
              {etapasDisponiveis.map((e) => (
                <option key={e} value={e}>
                  {getEtapaLabel(e)}
                </option>
              ))}
            </select>
            <button
              onClick={handlePlay}
              disabled={loading || bloqueado}
              className="sessao-trabalho-btn iniciar"
              title={
                bloqueado
                  ? "Seu cargo não permite iniciar nesta etapa"
                  : "Iniciar sessão"
              }
            >
              <Play size={20} />
            </button>
          </div>
        ) : (
          <div className="sessao-trabalho-multi">
            <span className="sessao-trabalho-etapa-float">
              {getEtapaLabel(etapaParaIniciar)}
            </span>
            <button
              onClick={handlePlay}
              disabled={loading || bloqueado}
              className="sessao-trabalho-btn iniciar"
              title={
                bloqueado
                  ? "Seu cargo não permite iniciar nesta etapa"
                  : `Iniciar ${getEtapaLabel(etapaParaIniciar)}`
              }
            >
              <Play size={20} />
            </button>
          </div>
        )}
      </div>

      {showPauseModal && (
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
          onClick={() => setShowPauseModal(false)}
        >
          <div
            style={{
              background: "var(--bg-elevated, #fff)",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "420px",
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
                Pausar sessão
              </h3>
              <button
                onClick={() => setShowPauseModal(false)}
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
                Deseja registrar o motivo da pausa? <strong>(opcional)</strong>
              </p>
              <textarea
                value={motivoPausa}
                onChange={(e) => setMotivoPausa(e.target.value)}
                placeholder="Descreva o motivo da pausa..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-base, #f8fafc)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  resize: "vertical",
                  fontFamily: "inherit",
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
                onClick={() => setShowPauseModal(false)}
                style={{
                  padding: "8px 16px",
                  background: "var(--bg-base, #f1f5f9)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmPause}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  background: "var(--red, #ef4444)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  color: "#fff",
                  fontWeight: "bold",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Pausando..." : "Pausar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
