import { useState, useEffect, useMemo } from "react";
import { Pencil, ChevronDown, ChevronRight, Timer } from "lucide-react";
import EditarSessaoModal from "./EditarSessaoModal";
import { formatarNomeUsuario } from "../../utils/tempoUtils";
import { getEtapaLabel } from "../../utils/etapas";

function formatarData(iso) {
  if (!iso) return "em andamento";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatarDuracao(segundos) {
  const num = Number(segundos);
  const s = Math.floor(isNaN(num) ? 0 : Math.max(num, 0));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}h${m}min${sec}s`;
}

function calcularDuracao(sessao) {
  if (sessao.fim) {
    const val = Number(sessao.duracao_segundos);
    if (!isNaN(val)) return val;
    const inicio = new Date(sessao.inicio).getTime();
    const fim = new Date(sessao.fim).getTime();
    return Math.floor((fim - inicio) / 1000);
  }
  const inicio = new Date(sessao.inicio).getTime();
  const agora = Date.now();
  return Math.floor((agora - inicio) / 1000);
}

export default function SessoesTrabalhoList({
  fichaId,
  user,
  sessoesTrabalho,
}) {
  const {
    sessoes,
    totalSegundos,
    tempoDecorridoSegundos,
    loading,
    updateSessao,
  } = sessoesTrabalho;
  const [sessaoEditando, setSessaoEditando] = useState(null);
  const [, setTick] = useState(0);
  const [gruposAbertos, setGruposAbertos] = useState({});

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const temSessaoAtiva = sessoes.some((s) => !s.fim);
    if (!temSessaoAtiva) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [sessoes]);

  const grupos = useMemo(() => {
    const map = {};
    sessoes.forEach((s) => {
      const chave = s.usuario || "desconhecido";
      if (!map[chave]) {
        map[chave] = {
          usuario: chave,
          sessoes: [],
          totalSegundos: 0,
          temAtiva: false,
        };
      }
      map[chave].sessoes.push(s);
      map[chave].totalSegundos += calcularDuracao(s);
      if (!s.fim) map[chave].temAtiva = true;
    });

    return Object.values(map)
      .map((g) => ({
        ...g,
        sessoes: g.sessoes.sort(
          (a, b) => new Date(b.inicio) - new Date(a.inicio),
        ),
      }))
      .sort((a, b) => {
        if (a.temAtiva && !b.temAtiva) return -1;
        if (!a.temAtiva && b.temAtiva) return 1;
        return b.totalSegundos - a.totalSegundos;
      });
  }, [sessoes]);

  useEffect(() => {
    setGruposAbertos((prev) => {
      const next = { ...prev };
      grupos.forEach((g) => {
        if (g.temAtiva && next[g.usuario] === undefined) {
          next[g.usuario] = true;
        }
      });
      return next;
    });
  }, [grupos]);

  function toggleGrupo(usuario) {
    setGruposAbertos((prev) => ({ ...prev, [usuario]: !prev[usuario] }));
  }

  return (
    <div className="sessions-panel">
      <div className="card mb-3">
        <div className="section-header">
          <div className="section-icon">
            <Timer size={18} />
          </div>
          <div>
            <h2>Sessões de Trabalho</h2>
            <p>Histórico automático de início e fim de cada sessão</p>
          </div>
        </div>

        <div className="checklist-summary mb-3">
          <div>
            <span className="summary-text">Tempo real da ficha:</span>{" "}
            <span
              className="summary-text"
              style={{ color: "var(--blue-accent)", fontSize: 14 }}
              title="Tempo total decorrido, sem duplicar quando há trabalho simultâneo"
            >
              {formatarDuracao(tempoDecorridoSegundos)}
            </span>
          </div>

          <div>
            <span className="summary-text">Homem-hora (esforço total):</span>{" "}
            <span
              className="summary-text"
              style={{ color: "var(--green-accent, #2e9e5b)", fontSize: 14 }}
              title="Soma do tempo de todos os colaboradores (duplica quando há trabalho simultâneo)"
            >
              {formatarDuracao(totalSegundos)}
            </span>
          </div>
        </div>

        {loading && <p className="sessoes-empty">Carregando sessões...</p>}
        {!loading && !sessoes.length && (
          <p className="sessoes-empty">Nenhuma sessão registrada ainda.</p>
        )}

        <div className="sessoes-grupos-list">
          {grupos.map((grupo) => {
            const aberto = !!gruposAbertos[grupo.usuario];
            return (
              <div key={grupo.usuario} className="sessao-grupo">
                <button
                  className="sessao-grupo-header"
                  onClick={() => toggleGrupo(grupo.usuario)}
                >
                  <div className="sessao-grupo-header-left">
                    {aberto ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    <strong>{formatarNomeUsuario(grupo.usuario)}</strong>
                    {grupo.temAtiva && (
                      <span className="sessao-tag-ativa">● em andamento</span>
                    )}
                  </div>

                  <div className="sessao-grupo-header-right">
                    <span className="sessao-grupo-count">
                      {grupo.sessoes.length}{" "}
                      {grupo.sessoes.length === 1 ? "sessão" : "sessões"}
                    </span>
                    <span className="sessao-grupo-total">
                      {formatarDuracao(grupo.totalSegundos)}
                    </span>
                  </div>
                </button>

                {aberto && (
                  <div className="sessoes-trabalho-list sessoes-trabalho-list--scroll">
                    {grupo.sessoes.map((s) => (
                      <div key={s.id} className="sessao-trabalho-item">
                        <div className="sessao-trabalho-info">
                          <span>
                            {formatarData(s.inicio)} → {formatarData(s.fim)}
                          </span>
                          <span className="sessao-duracao">
                            {formatarDuracao(calcularDuracao(s))}
                          </span>

                          {s.etapa && (
                            <span
                              style={{
                                fontSize: 11,
                                padding: "2px 8px",
                                borderRadius: 10,
                                background: "var(--blue-accent, #3b82f6)",
                                color: "#fff",
                              }}
                            >
                              {getEtapaLabel(s.etapa)}
                            </span>
                          )}
                          {s.origem === "manual" && (
                            <span
                              className="sessao-tag-manual"
                              title={`Editado por ${s.editado_manualmente_por}`}
                            >
                              editado manualmente
                            </span>
                          )}
                        </div>

                        {isAdmin && (
                          <button
                            className="btn-icon-edit"
                            title="Editar horário"
                            onClick={() => setSessaoEditando(s)}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <EditarSessaoModal
        sessao={sessaoEditando}
        onClose={() => setSessaoEditando(null)}
        onSave={updateSessao}
      />
    </div>
  );
}
