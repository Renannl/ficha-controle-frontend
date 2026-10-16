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

  const handlePause = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/fichas/${fichaId}/sessao/pausar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessaoId: sessaoAtiva?.id }),
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

  const rodando = !!sessaoAtiva;

  return (
    <div className="sessao-trabalho-float">
      {rodando ? (
        <>
          <button
            onClick={handlePause}
            disabled={loading}
            className="sessao-trabalho-btn pausar"
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
  );
}
