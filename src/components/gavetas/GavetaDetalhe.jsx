import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  X,
  Trash2,
  Clock,
  PenLine,
} from "lucide-react";
import { salvarGaveta } from "../../hooks/useGavetas";
import {
  TIPOS_PAINEL,
  getPainelChecklistItems,
  getPainelVerificacaoPorEtapa,
} from "../../data/painelTemplates";
import { podeTrabalharNaEtapa } from "../../utils/etapas";
import ChecklistTable from "../checklist/ChecklistTable";
import VerificacaoEtapaModal from "../buttons/VerificacaoEtapaModal";

/* =====================================================================
   GavetaDetalhe — unidade de produção CCM usando OS MESMOS componentes
   da ficha (ChecklistTable, VerificacaoEtapaModal).

   AUTOSAVE: toda alteração (checklist, verificação, sessão, assinatura,
   nota) dispara um PUT automático com debounce de 800ms. Não existe mais
   botão "Salvar" — o estado aparece no topo (Salvando... / Salvo / Erro).

   CARGOS: o play de sessão só funciona para o cargo correspondente à
   etapa (montagem → "montagem", barramento → "barramento", cabeamento →
   "cabeamento"). Admin pode tudo. A validação usa podeTrabalharNaEtapa.
   ===================================================================== */

const ETAPAS = [
  { id: "montagem", label: "Montagem" },
  { id: "barramento", label: "Barramento" },
  { id: "cabeamento", label: "Cabeamento" },
];

const CARGOS = {
  montagem: "Montagem Mecânica",
  barramento: "Barramento",
  cabeamento: "Cabeamento",
};

const STATUS_SAVE = {
  salvo: { label: "Salvo", cor: "#16a34a" },
  pendente: { label: "Salvando...", cor: "#64748b" },
  salvando: { label: "Salvando...", cor: "#1976d2" },
  erro: { label: "Erro ao salvar", cor: "#dc2626" },
};

// ─── helpers de formatação ───────────────────────────────────────────
function formatarTempo(totalSeg) {
  const seg = Math.max(0, Math.floor(Number(totalSeg) || 0));
  const h = String(Math.floor(seg / 3600)).padStart(2, "0");
  const m = String(Math.floor((seg % 3600) / 60)).padStart(2, "0");
  const s = String(seg % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatarDataHora(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("pt-BR") +
      " " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "";
  }
}

function etapaDeItemId(id) {
  const s = String(id || "");
  if (s.startsWith("mm-")) return "montagem";
  if (s.startsWith("bar-")) return "barramento";
  if (s.startsWith("cab-")) return "cabeamento";
  return null;
}

// Garante que os itens da gaveta tenham TODOS os ids do template
// (sequência + verificação), preservando o que já foi salvo.
function ensureGavetaItems(tipoPainel, itensSalvos) {
  const template =
    getPainelChecklistItems(tipoPainel, { incluirVerificacao: true }) || [];
  const mapa = new Map(
    (Array.isArray(itensSalvos) ? itensSalvos : []).map((i) => [i.id, i]),
  );

  return template.map((t) => {
    const salvo = mapa.get(t.id) || {};
    return {
      id: t.id,
      resultado: salvo.resultado || "",
      observacao: salvo.observacao || "",
      sessionMarks: Array.isArray(salvo.sessionMarks)
        ? salvo.sessionMarks
        : Array(15).fill(""),
    };
  });
}

function normalizarDados(raw) {
  const origem = raw && typeof raw === "object" ? raw : {};
  return {
    items: ensureGavetaItems(TIPOS_PAINEL.AUTOPORTANTE, origem.items),
    verificacoes:
      origem.verificacoes && typeof origem.verificacoes === "object"
        ? origem.verificacoes
        : {},
    sessoes: Array.isArray(origem.sessoes) ? origem.sessoes : [],
    sessaoAtiva: origem.sessaoAtiva || null,
    assinaturas:
      origem.assinaturas && typeof origem.assinaturas === "object"
        ? origem.assinaturas
        : {},
    notas: typeof origem.notas === "string" ? origem.notas : "",
    dataInicio: origem.dataInicio || "",
  };
}

// ─── permissão por cargo ─────────────────────────────────────────────
function podeIniciarCargo(user, cargo) {
  if (!user) return true; // sem user no contexto, libera (dev/teste)
  if (user.role === "admin" || user.isAdmin === true) return true;
  return podeTrabalharNaEtapa(user, cargo);
}

export default function GavetaDetalhe({
  ficha,
  fichaId,
  gaveta,
  onVoltar,
  user,
}) {
  const [dados, setDados] = useState(() => normalizarDados(gaveta?.dados));
  const [statusSave, setStatusSave] = useState("salvo");
  const [erro, setErro] = useState("");
  const [verificacaoEtapa, setVerificacaoEtapa] = useState(null);
  const [agora, setAgora] = useState(Date.now());
  const [assinaturaInput, setAssinaturaInput] = useState({});

  const timerRef = useRef(null);
  const debounceRef = useRef(null);
  const sujoRef = useRef(false);
  const dadosRef = useRef(dados);

  const chaveGaveta = gaveta?.id ?? gaveta?.numero ?? "gaveta";

  const checklistItems = useMemo(
    () =>
      getPainelChecklistItems(TIPOS_PAINEL.AUTOPORTANTE, {
        incluirVerificacao: true,
      }),
    [],
  );

  // A gaveta pertence a quem está trabalhando nela. Sem `user`, libera tudo.
  const usuario = user || { role: "admin" };
  const sessaoIniciada = !!dados.sessaoAtiva;

  // Mantém a ref de dados sempre atualizada (usada no flush do unmount)
  useEffect(() => {
    dadosRef.current = dados;
  }, [dados]);

  // Marca "sujo" e atualiza o estado (qualquer edição passa por aqui)
  const mudar = useCallback((updater) => {
    sujoRef.current = true;
    setDados(updater);
  }, []);

  const montarPayload = useCallback(
    (d) => ({
      nomeEquipamento: gaveta?.nome_equipamento || "",
      status: gaveta?.status || "aberta",
      dados: {
        items: d.items,
        verificacoes: d.verificacoes,
        sessoes: d.sessoes,
        sessaoAtiva: d.sessaoAtiva,
        assinaturas: d.assinaturas,
        notas: d.notas,
        dataInicio: d.dataInicio,
      },
    }),
    [gaveta?.nome_equipamento, gaveta?.status],
  );

  const persistir = useCallback(
    async (payload) => {
      setStatusSave("salvando");
      try {
        await salvarGaveta(fichaId, gaveta.id, payload);
        setStatusSave("salvo");
        setErro("");
      } catch (err) {
        setStatusSave("erro");
        setErro(err.message || "Erro ao salvar automaticamente.");
      }
    },
    [fichaId, gaveta?.id],
  );

  // Reset quando troca de gaveta (sem disparar autosave)
  useEffect(() => {
    sujoRef.current = false;
    clearTimeout(debounceRef.current);
    setDados(normalizarDados(gaveta?.dados));
    setVerificacaoEtapa(null);
    setErro("");
    setAssinaturaInput({});
    setStatusSave("salvo");
  }, [chaveGaveta]);

  // AUTOSAVE com debounce de 800ms
  useEffect(() => {
    if (!sujoRef.current) return;
    setStatusSave("pendente");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      sujoRef.current = false;
      persistir(montarPayload(dados));
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [dados, persistir, montarPayload]);

  // Flush no unmount: se ainda houver mudança pendente, tenta salvar
  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      if (sujoRef.current && gaveta?.id && fichaId) {
        salvarGaveta(fichaId, gaveta.id, montarPayload(dadosRef.current)).catch(
          () => {},
        );
      }
    };
  }, [fichaId, gaveta?.id, montarPayload]);

  // Tick do cronômetro
  useEffect(() => {
    if (!dados.sessaoAtiva || dados.sessaoAtiva.pausadaEm) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(timerRef.current);
  }, [dados.sessaoAtiva]);

  // ─── CHECKLIST (mesmo fluxo da ficha) ─────────────────────────────
  const setResultado = useCallback(
    (index, valor, observacao) => {
      mudar((prev) => {
        const items = [...prev.items];
        if (!items[index]) return prev;
        items[index] = {
          ...items[index],
          resultado: valor,
          observacao: valor ? observacao : "",
        };
        return { ...prev, items };
      });
    },
    [mudar],
  );

  const toggleMark = useCallback(
    (index, sessionIndex, value) => {
      mudar((prev) => {
        const items = [...prev.items];
        if (!items[index]) return prev;
        const marks = [...(items[index].sessionMarks || [])];
        marks[sessionIndex] = value;
        items[index] = { ...items[index], sessionMarks: marks };
        return { ...prev, items };
      });
    },
    [mudar],
  );

  const handleToggleVerificacao = useCallback(
    (idx, valor) => {
      const etapa = verificacaoEtapa;
      if (!etapa) return;

      const itens = getPainelVerificacaoPorEtapa(
        TIPOS_PAINEL.AUTOPORTANTE,
        etapa,
      );

      mudar((prev) => {
        const base = [...(prev.verificacoes?.[etapa] || [])];
        while (base.length < itens.length) base.push("");
        const vaiMarcar = base[idx] !== valor;
        base[idx] = vaiMarcar ? valor : "";
        return {
          ...prev,
          verificacoes: { ...(prev.verificacoes || {}), [etapa]: base },
        };
      });
    },
    [verificacaoEtapa, mudar],
  );

  // ─── SESSÃO DE TEMPO (local da gaveta, com pausa/retomada) ────────
  const tempoSessaoAtiva = useCallback(() => {
    const s = dados.sessaoAtiva;
    if (!s) return 0;
    if (s.pausadaEm) return s.acumuladoSeg || 0;
    const decorrido = Math.floor((agora - s.inicioSessaoAtual) / 1000);
    return (s.acumuladoSeg || 0) + Math.max(0, decorrido);
  }, [dados.sessaoAtiva, agora]);

  const tempoPorCargo = useCallback(
    (cargo) => {
      const gravado = (dados.sessoes || [])
        .filter((s) => s.cargo === cargo)
        .reduce((soma, s) => soma + (Number(s.duracaoSeg) || 0), 0);
      const ativo = dados.sessaoAtiva?.cargo === cargo ? tempoSessaoAtiva() : 0;
      return gravado + ativo;
    },
    [dados.sessoes, dados.sessaoAtiva, tempoSessaoAtiva],
  );

  const tempoTotal = ETAPAS.reduce((soma, e) => soma + tempoPorCargo(e.id), 0);

  function iniciarSessao(cargo) {
    if (!podeIniciarCargo(usuario, cargo)) {
      setErro(`Seu cargo não permite iniciar a sessão de ${CARGOS[cargo]}.`);
      return;
    }

    if (dados.sessaoAtiva) {
      if (dados.sessaoAtiva.cargo === cargo && dados.sessaoAtiva.pausadaEm) {
        retomarSessao();
        return;
      }
      setErro("Finalize ou descarte a sessão ativa antes de iniciar outra.");
      return;
    }

    mudar((prev) => ({
      ...prev,
      sessaoAtiva: {
        cargo,
        inicioSessaoAtual: Date.now(),
        pausadaEm: null,
        acumuladoSeg: 0,
      },
    }));
    setAgora(Date.now());
    setErro("");
  }

  function pausarSessao() {
    const s = dados.sessaoAtiva;
    if (!s || s.pausadaEm) return;
    const decorrido = Math.floor((Date.now() - s.inicioSessaoAtual) / 1000);
    mudar((prev) => ({
      ...prev,
      sessaoAtiva: {
        ...prev.sessaoAtiva,
        acumuladoSeg:
          (prev.sessaoAtiva.acumuladoSeg || 0) + Math.max(0, decorrido),
        pausadaEm: Date.now(),
      },
    }));
  }

  function retomarSessao() {
    const s = dados.sessaoAtiva;
    if (!s || !s.pausadaEm) return;
    mudar((prev) => ({
      ...prev,
      sessaoAtiva: {
        ...prev.sessaoAtiva,
        inicioSessaoAtual: Date.now(),
        pausadaEm: null,
      },
    }));
    setAgora(Date.now());
  }

  function finalizarSessao() {
    const s = dados.sessaoAtiva;
    if (!s) return;
    const duracaoSeg = tempoSessaoAtiva();
    const inicioEstimado = Date.now() - duracaoSeg * 1000;
    const nova = {
      id: `sessao_${Date.now().toString(36)}`,
      cargo: s.cargo,
      inicio: new Date(inicioEstimado).toISOString(),
      fim: new Date().toISOString(),
      duracaoSeg,
    };
    mudar((prev) => ({
      ...prev,
      sessoes: [...(prev.sessoes || []), nova],
      sessaoAtiva: null,
    }));
    setErro("");
  }

  function descartarSessao() {
    mudar((prev) => ({ ...prev, sessaoAtiva: null }));
    setErro("");
  }

  // ─── ASSINATURAS POR CARGO ────────────────────────────────────────
  function assinarCargo(cargo) {
    const nome = (assinaturaInput[cargo] || "").trim();
    if (!nome) {
      setErro("Informe o nome do responsável para assinar.");
      return;
    }
    mudar((prev) => ({
      ...prev,
      assinaturas: {
        ...(prev.assinaturas || {}),
        [cargo]: {
          nome,
          cargo: CARGOS[cargo],
          dataHora: new Date().toISOString(),
        },
      },
    }));
    setAssinaturaInput((prev) => ({ ...prev, [cargo]: "" }));
    setErro("");
  }

  function removerAssinatura(cargo) {
    mudar((prev) => {
      const novas = { ...(prev.assinaturas || {}) };
      delete novas[cargo];
      return { ...prev, assinaturas: novas };
    });
  }

  // ─── PROGRESSO ────────────────────────────────────────────────────
  function progresso() {
    const total = dados.items.length;
    if (!total) return { concluidos: 0, total: 0, pct: 0 };

    const concluidos = dados.items.filter((item) => {
      if (String(item.id).includes("-ver-")) {
        const etapa = etapaDeItemId(item.id);
        const idx = parseInt(String(item.id).split("-").pop(), 10);
        const v = dados.verificacoes?.[etapa]?.[idx];
        return v === "ok" || v === "na";
      }
      return item.resultado === "ok" || item.resultado === "na";
    }).length;

    return { concluidos, total, pct: Math.round((concluidos / total) * 100) };
  }

  const geral = progresso();
  const indCompartilhado = ficha?.numeroInd || ficha?.dados?.numeroInd || "—";
  const sessaoAtiva = dados.sessaoAtiva;
  const pausada = !!sessaoAtiva?.pausadaEm;
  const saveInfo = STATUS_SAVE[statusSave] || STATUS_SAVE.salvo;

  // estilos rápidos
  const s = {
    card: {
      background: "var(--bg-elevated, #fff)",
      border: "1px solid var(--border-color, #e2e8f0)",
      borderRadius: 12,
      padding: 16,
    },
    titulo: {
      margin: 0,
      fontSize: 15,
      fontWeight: 700,
      color: "var(--text-primary, #1e293b)",
    },
    sub: { fontSize: 12, color: "var(--text-secondary, #64748b)" },
    btn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 14px",
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      border: "1px solid #cbd5e1",
      background: "#fff",
      color: "#1e293b",
    },
    btnPrimario: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 16px",
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      border: "1px solid #1976d2",
      background: "#1976d2",
      color: "#fff",
    },
    btnVerde: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "6px 12px",
      borderRadius: 7,
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      border: "1px solid #86efac",
      background: "#f0fdf4",
      color: "#166534",
    },
    btnVermelho: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "6px 12px",
      borderRadius: 7,
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      border: "1px solid #fecaca",
      background: "#fef2f2",
      color: "#991b1b",
    },
    btnCinza: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "6px 12px",
      borderRadius: 7,
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      border: "1px solid #e2e8f0",
      background: "#f8fafc",
      color: "#475569",
    },
    input: {
      width: "100%",
      padding: "9px 11px",
      border: "1px solid var(--border-color, #cbd5e1)",
      borderRadius: 8,
      fontSize: 13,
      fontFamily: "inherit",
      background: "var(--bg-base, #f8fafc)",
      color: "var(--text-primary, #1e293b)",
    },
  };

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onVoltar} style={s.btn} title="Voltar">
            <ArrowLeft size={16} /> Voltar
          </button>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                color: "var(--text-primary, #1e293b)",
              }}
            >
              {gaveta.tag || `Gaveta ${gaveta.numero}`}
            </h2>
            <div style={{ ...s.sub, marginTop: 2 }}>
              {indCompartilhado} · Unidade de produção independente
            </div>
          </div>
        </div>

        {/* Status de autosave (substitui o botão Salvar) */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            background: `${saveInfo.cor}18`,
            color: saveInfo.cor,
          }}
        >
          {saveInfo.label}
        </span>
      </div>

      {erro && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
          }}
        >
          {erro}
        </div>
      )}

      {/* Progresso geral + sessão */}
      <div style={s.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <strong
              style={{ fontSize: 13, color: "var(--text-primary, #1e293b)" }}
            >
              Progresso da gaveta
            </strong>
            <div style={{ ...s.sub, marginTop: 2 }}>
              {geral.concluidos} de {geral.total} itens · ⏱{" "}
              {formatarTempo(tempoTotal)} · ✍️{" "}
              {Object.keys(dados.assinaturas || {}).length}/{ETAPAS.length}
            </div>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>
            {geral.pct}%
          </span>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "#e2e8f0",
            overflow: "hidden",
            marginTop: 10,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${geral.pct}%`,
              background: "#16a34a",
              borderRadius: 999,
              transition: "width .2s ease",
            }}
          />
        </div>

        {/* Sessão de trabalho */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px dashed var(--border-color, #e2e8f0)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={16} color="#1976d2" />
              <strong
                style={{ fontSize: 13, color: "var(--text-primary, #1e293b)" }}
              >
                Sessão de trabalho
              </strong>
              {sessaoAtiva && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 9px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: pausada ? "#fef3c7" : "#dcfce7",
                    color: pausada ? "#92400e" : "#166534",
                  }}
                >
                  {pausada ? "⏸ Pausada" : "● Em execução"} ·{" "}
                  {formatarTempo(tempoSessaoAtiva())}
                </span>
              )}
            </div>

            {sessaoAtiva ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ ...s.sub, alignSelf: "center" }}>
                  {CARGOS[sessaoAtiva.cargo]}
                </span>
                {pausada ? (
                  <button onClick={retomarSessao} style={s.btnVerde}>
                    <Play size={14} /> Retomar
                  </button>
                ) : (
                  <button onClick={pausarSessao} style={s.btn}>
                    <Pause size={14} /> Pausar
                  </button>
                )}
                <button onClick={descartarSessao} style={s.btnVermelho}>
                  <X size={14} /> Descartar
                </button>
                <button onClick={finalizarSessao} style={s.btnPrimario}>
                  ✓ Finalizar
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ETAPAS.map((e) => {
                  const permitido = podeIniciarCargo(usuario, e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => iniciarSessao(e.id)}
                      disabled={!permitido}
                      style={{
                        ...s.btn,
                        opacity: permitido ? 1 : 0.45,
                        cursor: permitido ? "pointer" : "not-allowed",
                      }}
                      title={
                        permitido
                          ? `Iniciar ${e.label}`
                          : "Seu cargo não permite iniciar nesta etapa"
                      }
                    >
                      <Play size={14} /> {e.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              marginTop: 10,
              fontSize: 12,
              color: "var(--text-secondary, #64748b)",
            }}
          >
            {ETAPAS.map((e) => (
              <span key={e.id}>
                <strong>{e.label}:</strong> {formatarTempo(tempoPorCargo(e.id))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: checklist + lateral */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.7fr) minmax(300px, 1fr)",
          gap: 14,
          alignItems: "start",
        }}
      >
        {/* Checklist (componente REAL da ficha) */}
        <div style={s.card}>
          <ChecklistTable
            ficha={{ items: dados.items, verificacoes: dados.verificacoes }}
            checklistItems={checklistItems}
            onToggleMark={toggleMark}
            onSetResultado={setResultado}
            isTaf={false}
            isPainel={true}
            user={usuario}
            sessaoIniciada={sessaoIniciada}
            onAbrirVerificacao={setVerificacaoEtapa}
            etapasLiberadas={[]}
          />
        </div>

        {/* Lateral */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Sessões registradas */}
          <div style={s.card}>
            <h3 style={{ ...s.titulo, marginBottom: 10 }}>
              Sessões registradas
            </h3>
            {(dados.sessoes || []).length === 0 && !sessaoAtiva ? (
              <div style={s.sub}>Nenhuma sessão registrada.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(dados.sessoes || [])
                  .slice()
                  .reverse()
                  .map((sessao) => (
                    <div
                      key={sessao.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        padding: "9px 11px",
                        borderRadius: 8,
                        border: "1px solid var(--border-color, #e2e8f0)",
                        fontSize: 12,
                      }}
                    >
                      <div>
                        <strong
                          style={{ color: "var(--text-primary, #1e293b)" }}
                        >
                          {CARGOS[sessao.cargo] || sessao.cargo}
                        </strong>
                        <div style={s.sub}>
                          {formatarDataHora(sessao.inicio)} →{" "}
                          {formatarDataHora(sessao.fim)}
                        </div>
                      </div>
                      <strong
                        style={{
                          color: "#16a34a",
                          whiteSpace: "nowrap",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatarTempo(sessao.duracaoSeg)}
                      </strong>
                    </div>
                  ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "9px 11px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 8,
                  }}
                >
                  <strong style={{ fontSize: 13 }}>Total geral</strong>
                  <strong
                    style={{
                      color: "#166534",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatarTempo(tempoTotal)}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Assinaturas */}
          <div style={s.card}>
            <h3 style={{ ...s.titulo, marginBottom: 10 }}>
              <PenLine
                size={15}
                style={{ verticalAlign: -3, marginRight: 6 }}
              />
              Assinaturas por cargo
            </h3>
            {ETAPAS.map((e) => {
              const a = dados.assinaturas?.[e.id];
              return (
                <div
                  key={e.id}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border-color, #f1f5f9)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#475569", fontWeight: 600 }}>
                      {CARGOS[e.id]}
                    </span>
                    {a ? (
                      <span style={{ color: "#166534", fontWeight: 700 }}>
                        ✓ {a.nome}
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Pendente</span>
                    )}
                  </div>

                  {a ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 6,
                      }}
                    >
                      <span style={s.sub}>
                        {a.cargo || CARGOS[e.id]} ·{" "}
                        {formatarDataHora(a.dataHora)}
                      </span>
                      <button
                        onClick={() => removerAssinatura(e.id)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#dc2626",
                          cursor: "pointer",
                          display: "flex",
                          padding: 4,
                        }}
                        title="Remover assinatura"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <input
                        type="text"
                        placeholder="Nome do responsável"
                        value={assinaturaInput[e.id] || ""}
                        onChange={(ev) =>
                          setAssinaturaInput((prev) => ({
                            ...prev,
                            [e.id]: ev.target.value,
                          }))
                        }
                        style={s.input}
                      />
                      <button
                        onClick={() => assinarCargo(e.id)}
                        style={s.btnVerde}
                      >
                        ✓ Assinar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Notas */}
          <div style={s.card}>
            <h3 style={{ ...s.titulo, marginBottom: 10 }}>Notas da gaveta</h3>
            <textarea
              value={dados.notas || ""}
              onChange={(e) =>
                mudar((prev) => ({ ...prev, notas: e.target.value }))
              }
              rows={5}
              placeholder="Observações, pendências, ajustes realizados..."
              style={{ ...s.input, resize: "vertical", minHeight: 90 }}
            />
          </div>
        </div>
      </div>

      {/* Verificação (componente REAL da ficha) */}
      <VerificacaoEtapaModal
        isOpen={!!verificacaoEtapa}
        etapa={verificacaoEtapa}
        itens={
          verificacaoEtapa
            ? getPainelVerificacaoPorEtapa(
                TIPOS_PAINEL.AUTOPORTANTE,
                verificacaoEtapa,
              )
            : []
        }
        resultados={
          verificacaoEtapa ? dados.verificacoes?.[verificacaoEtapa] || [] : []
        }
        onToggle={handleToggleVerificacao}
        onClose={() => setVerificacaoEtapa(null)}
        isAdmin={true}
        sessaoIniciada={sessaoIniciada}
        fichaId={null}
        onSessoesParadas={finalizarSessao}
      />
    </div>
  );
}
