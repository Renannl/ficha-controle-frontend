import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  X,
  Trash2,
  PenLine,
  SkipForward,
  Settings2,
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
import PularEtapaModal from "../buttons/PularEtapaModal";
import GavetaFotos from "./GavetaFotos";

const ETAPAS = [
  { id: "montagem", label: "Montagem" },
  { id: "barramento", label: "Barramento" },
  { id: "cabeamento", label: "Cabeamento" },
];

const CARGOS = {
  montagem: "Montagem Mecânica",
  barramento: "Barramento",
  cabeamento: "Cabeamento",
  geral: "Supervisão",
};

const ASSINATURAS_FIXAS = [
  { id: "qualidade", label: "Supervisor da Qualidade" },
  { id: "supervisor_producao", label: "Supervisor da Produção" },
];

const STATUS_SAVE = {
  salvo: { label: "Salvo", cor: "#16a34a" },
  pendente: { label: "Salvando...", cor: "#64748b" },
  salvando: { label: "Salvando...", cor: "#2563eb" },
  erro: { label: "Erro ao salvar", cor: "#dc2626" },
};

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

function nomeDoItem(item) {
  return (
    item?.label ||
    item?.nome ||
    item?.titulo ||
    item?.descricao ||
    item?.texto ||
    item?.name ||
    item?.id ||
    "Item do checklist"
  );
}

function ensureGavetaItems(tipoPainel, itensSalvos) {
  const template =
    getPainelChecklistItems(tipoPainel, { incluirVerificacao: true }) || [];
  const mapa = new Map(
    (Array.isArray(itensSalvos) ? itensSalvos : []).map((i) => [i.id, i]),
  );

  return template.map((t) => {
    const salvo = mapa.get(t.id) || {};
    const marks = Array.isArray(salvo.sessionMarks)
      ? salvo.sessionMarks
      : Array(15).fill("");
    const marksMeta = Array.isArray(salvo.sessionMarksMeta)
      ? salvo.sessionMarksMeta
      : Array(15).fill(null);
    return {
      id: t.id,
      resultado: salvo.resultado || "",
      observacao: salvo.observacao || "",
      marcadoEm: salvo.marcadoEm || "",
      marcadoPor: salvo.marcadoPor || "",
      sessionMarks: marks,
      sessionMarksMeta: marksMeta,
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
    verificacoesMeta:
      origem.verificacoesMeta && typeof origem.verificacoesMeta === "object"
        ? origem.verificacoesMeta
        : {},
    sessoes: Array.isArray(origem.sessoes) ? origem.sessoes : [],
    sessaoAtiva: origem.sessaoAtiva || null,
    assinaturas:
      origem.assinaturas && typeof origem.assinaturas === "object"
        ? origem.assinaturas
        : {},
    notas: typeof origem.notas === "string" ? origem.notas : "",
    dataInicio: origem.dataInicio || "",
    etapasLiberadas: Array.isArray(origem.etapasLiberadas)
      ? origem.etapasLiberadas
      : [],
    fotos: Array.isArray(origem.fotos) ? origem.fotos : [],
  };
}

function etapaDoCargo(user) {
  if (!user) return null;
  if (user.role === "admin" || user.isAdmin === true) return null;
  if (podeTrabalharNaEtapa(user, "montagem")) return "montagem";
  if (podeTrabalharNaEtapa(user, "barramento")) return "barramento";
  if (podeTrabalharNaEtapa(user, "cabeamento")) return "cabeamento";
  return null;
}

function etapaConcluida(dados, etapa) {
  const itens = (dados.items || []).filter(
    (i) => etapaDeItemId(i.id) === etapa && !String(i.id).includes("-ver-"),
  );
  if (itens.length === 0) return false;
  return itens.every((i) => i.resultado === "ok" || i.resultado === "na");
}

function etapaLiberada(dados, etapa, user) {
  if (!etapa) return false;
  if (user?.role === "admin" || user?.isAdmin === true) return true;
  if ((dados.etapasLiberadas || []).includes(etapa)) return true;
  if (etapa === "montagem") return true;
  if (etapa === "barramento") return etapaConcluida(dados, "montagem");
  if (etapa === "cabeamento") return etapaConcluida(dados, "barramento");
  return false;
}

function labelCargo(cargo) {
  return CARGOS[cargo] || cargo || "Supervisão";
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
  const [etapaPular, setEtapaPular] = useState(null);
  const [agora, setAgora] = useState(Date.now());
  const [assinaturaInput, setAssinaturaInput] = useState({});
  const [nomeGaveta, setNomeGaveta] = useState(gaveta?.nome_equipamento || "");

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [motivoPausa, setMotivoPausa] = useState("");
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [ajusteMinutos, setAjusteMinutos] = useState("");
  const [manualCargo, setManualCargo] = useState("geral");
  const [manualInicio, setManualInicio] = useState("");
  const [manualFim, setManualFim] = useState("");

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

  const ehAdmin = user?.role === "admin" || user?.isAdmin === true;

  const etapasPermitidas = useMemo(() => {
    if (ehAdmin) return ETAPAS.map((e) => e.id);
    return ETAPAS.filter((e) => podeTrabalharNaEtapa(user, e.id)).map(
      (e) => e.id,
    );
  }, [ehAdmin, user]);

  const etapasTrabalhaveis = useMemo(() => {
    return ETAPAS.filter(
      (e) =>
        etapasPermitidas.includes(e.id) && etapaLiberada(dados, e.id, user),
    ).map((e) => e.id);
  }, [etapasPermitidas, dados, user]);

  const etapaCargo = useMemo(
    () => (ehAdmin ? null : etapaDoCargo(user)),
    [ehAdmin, user],
  );

  const cronometroLiberado = useMemo(() => {
    if (ehAdmin || !etapaCargo) return true;
    return etapaLiberada(dados, etapaCargo, user);
  }, [ehAdmin, etapaCargo, dados, user]);

  const sessaoIniciada = !!dados.sessaoAtiva;

  // Marcações do checklist (itens + sessões + verificações) com data/hora/quem
  const marcacoesChecklist = useMemo(() => {
    const marcacoes = [];

    const categoriaDaEtapa = {
      montagem: "Montagem",
      barramento: "Barramento",
      cabeamento: "Cabeamento",
    };

    const rotuloResultado = (resultado) => {
      const valor = String(resultado || "").toLowerCase();
      if (valor === "ok") return "OK";
      if (valor === "na") return "N/A";
      if (valor === "erro") return "ERRO";
      return String(resultado || "").toUpperCase();
    };

    // Resultado dos itens principais
    (dados.items || []).forEach((item) => {
      if (String(item.id || "").includes("-ver-")) return;
      if (!item.resultado || !item.marcadoEm) return;

      marcacoes.push({
        id: `resultado-${item.id}`,
        item: nomeDoItem(checklistItems.find((ci) => ci.id === item.id)),
        categoria: categoriaDaEtapa[etapaDeItemId(item.id)] || "Checklist",
        resultado: rotuloResultado(item.resultado),
        quando: item.marcadoEm,
        usuario: item.marcadoPor || "Usuário não identificado",
      });
    });

    // Quadradinhos de sessão
    (dados.items || []).forEach((item) => {
      const etapa = etapaDeItemId(item.id);
      const marks = item.sessionMarks || [];
      const marksMeta = item.sessionMarksMeta || [];

      marks.forEach((mark, index) => {
        const meta = marksMeta[index];
        if (!mark || !meta?.quando) return;

        marcacoes.push({
          id: `sessao-${item.id}-${index}`,
          item: `${nomeDoItem(
            checklistItems.find((ci) => ci.id === item.id),
          )} — sessão ${index + 1}`,
          categoria: categoriaDaEtapa[etapa] || "Checklist",
          resultado: "Marcado",
          quando: meta.quando,
          usuario: meta.usuario || "Usuário não identificado",
        });
      });
    });

    // Verificações por etapa
    ETAPAS.forEach((etapa) => {
      const itensVerificacao = getPainelVerificacaoPorEtapa(
        TIPOS_PAINEL.AUTOPORTANTE,
        etapa.id,
      );
      const resultados = dados.verificacoes?.[etapa.id] || [];
      const metadados = dados.verificacoesMeta?.[etapa.id] || [];

      resultados.forEach((resultado, index) => {
        const meta = metadados[index];
        if (!resultado || !meta?.quando) return;

        marcacoes.push({
          id: `verificacao-${etapa.id}-${index}`,
          item: nomeDoItem(itensVerificacao[index]),
          categoria: categoriaDaEtapa[etapa.id],
          resultado: rotuloResultado(resultado),
          quando: meta.quando,
          usuario: meta.usuario || "Usuário não identificado",
        });
      });
    });

    return marcacoes.sort(
      (a, b) => new Date(b.quando).getTime() - new Date(a.quando).getTime(),
    );
  }, [dados.items, dados.verificacoes, dados.verificacoesMeta, checklistItems]);

  useEffect(() => {
    dadosRef.current = dados;
  }, [dados]);

  const mudar = useCallback((updater) => {
    sujoRef.current = true;
    setDados(updater);
  }, []);

  const montarPayload = useCallback(
    (d) => ({
      nomeEquipamento: nomeGaveta || "",
      status: gaveta?.status || "aberta",
      dados: {
        items: d.items,
        verificacoes: d.verificacoes,
        verificacoesMeta: d.verificacoesMeta,
        sessoes: d.sessoes,
        sessaoAtiva: d.sessaoAtiva,
        assinaturas: d.assinaturas,
        notas: d.notas,
        fotos: d.fotos,
        dataInicio: d.dataInicio,
        etapasLiberadas: d.etapasLiberadas,
      },
    }),
    [nomeGaveta, gaveta?.nome_equipamento, gaveta?.status],
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

  useEffect(() => {
    sujoRef.current = false;
    clearTimeout(debounceRef.current);
    setDados(normalizarDados(gaveta?.dados));
    setVerificacaoEtapa(null);
    setEtapaPular(null);
    setErro("");
    setAssinaturaInput({});
    setStatusSave("salvo");
    setShowPauseModal(false);
    setShowAjusteModal(false);
    setMotivoPausa("");
    setAjusteMinutos("");
    setManualCargo("geral");
    setManualInicio("");
    setManualFim("");
    setNomeGaveta(gaveta?.nome_equipamento || "");
  }, [chaveGaveta]);

  useEffect(() => {
    if (!sujoRef.current) return;
    setStatusSave("pendente");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      sujoRef.current = false;
      persistir(montarPayload(dados));
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [dados, persistir, montarPayload, nomeGaveta]);

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

  useEffect(() => {
    if (!dados.sessaoAtiva) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(timerRef.current);
  }, [dados.sessaoAtiva]);

  const setResultado = useCallback(
    (index, valor, observacao) => {
      const item = dadosRef.current.items[index];
      const etapa = item?.id ? etapaDeItemId(item.id) : null;
      if (etapa && !etapasTrabalhaveis.includes(etapa)) return;

      mudar((prev) => {
        const items = [...prev.items];
        if (!items[index]) return prev;
        items[index] = {
          ...items[index],
          resultado: valor,
          observacao: valor ? observacao : "",
          marcadoEm: valor ? new Date().toISOString() : "",
          marcadoPor: valor ? user?.nome || user?.username : "",
        };
        return { ...prev, items };
      });
    },
    [mudar, etapasTrabalhaveis, user],
  );

  const toggleMark = useCallback(
    (index, sessionIndex, value) => {
      const item = dadosRef.current.items[index];
      const etapa = item?.id ? etapaDeItemId(item.id) : null;
      if (etapa && !etapasTrabalhaveis.includes(etapa)) return;

      mudar((prev) => {
        const items = [...prev.items];
        if (!items[index]) return prev;
        const marks = [...(items[index].sessionMarks || [])];
        const meta = [...(items[index].sessionMarksMeta || [])];
        marks[sessionIndex] = value;
        meta[sessionIndex] = value
          ? {
              quando: new Date().toISOString(),
              usuario: user?.nome || user?.username,
            }
          : null;
        items[index] = {
          ...items[index],
          sessionMarks: marks,
          sessionMarksMeta: meta,
        };
        return { ...prev, items };
      });
    },
    [mudar, etapasTrabalhaveis, user],
  );

  const handleToggleVerificacao = useCallback(
    (idx, valor) => {
      const etapa = verificacaoEtapa;
      if (!etapa) return;
      if (!etapasTrabalhaveis.includes(etapa)) return;

      const itens = getPainelVerificacaoPorEtapa(
        TIPOS_PAINEL.AUTOPORTANTE,
        etapa,
      );

      mudar((prev) => {
        const base = [...(prev.verificacoes?.[etapa] || [])];
        const baseMeta = [...(prev.verificacoesMeta?.[etapa] || [])];
        while (base.length < itens.length) base.push("");
        while (baseMeta.length < itens.length) baseMeta.push(null);
        const vaiMarcar = base[idx] !== valor;
        base[idx] = vaiMarcar ? valor : "";
        baseMeta[idx] = vaiMarcar
          ? {
              quando: new Date().toISOString(),
              usuario: user?.nome || user?.username,
            }
          : null;
        return {
          ...prev,
          verificacoes: { ...(prev.verificacoes || {}), [etapa]: base },
          verificacoesMeta: {
            ...(prev.verificacoesMeta || {}),
            [etapa]: baseMeta,
          },
        };
      });
    },
    [verificacaoEtapa, mudar, etapasTrabalhaveis, user],
  );

  const confirmarPularEtapa = useCallback(
    (justificativa) => {
      if (!etapaPular) return;
      const etapaAlvo = etapaPular;

      mudar((prev) => {
        const liberadas = [...(prev.etapasLiberadas || [])];
        if (!liberadas.includes(etapaAlvo)) {
          liberadas.push(etapaAlvo);
        }
        return { ...prev, etapasLiberadas: liberadas };
      });

      setErro(
        `Etapa ${CARGOS[etapaAlvo] || etapaAlvo} liberada por ${
          user?.username || "admin"
        }.${justificativa ? " Justificativa: " + justificativa : ""}`,
      );
      setEtapaPular(null);
    },
    [etapaPular, mudar, user],
  );

  const tempoSessaoAtiva = useCallback(() => {
    const s = dados.sessaoAtiva;
    if (!s) return 0;
    const inicio = Number(s.inicio || s.inicioSessaoAtual || 0);
    if (!inicio) return 0;
    const decorrido = Math.floor((agora - inicio) / 1000);
    const acumulado = Number(s.acumuladoSeg) || 0;
    return Math.max(0, decorrido + acumulado);
  }, [dados.sessaoAtiva, agora]);

  const tempoTotalGaveta = useCallback(() => {
    const gravado = (dados.sessoes || []).reduce(
      (soma, s) => soma + (Number(s.duracaoSeg) || 0),
      0,
    );
    return gravado + (dados.sessaoAtiva ? tempoSessaoAtiva() : 0);
  }, [dados.sessoes, dados.sessaoAtiva, tempoSessaoAtiva]);

  function iniciarSessao() {
    if (dados.sessaoAtiva) return;

    if (!ehAdmin && etapaCargo && !etapaLiberada(dados, etapaCargo, user)) {
      setErro(
        `A etapa ${CARGOS[etapaCargo] || etapaCargo} ainda não está liberada. ` +
          `Conclua a etapa anterior para liberar o cronômetro.`,
      );
      return;
    }

    const cargo = ehAdmin ? "geral" : etapaCargo || "geral";

    mudar((prev) => ({
      ...prev,
      sessaoAtiva: { cargo, inicio: Date.now() },
    }));
    setAgora(Date.now());
    setErro("");
  }

  function confirmarPausa() {
    const motivo = motivoPausa.trim();
    setShowPauseModal(false);
    setMotivoPausa("");

    const s = dados.sessaoAtiva || dadosRef.current?.sessaoAtiva;
    if (!s) return;

    const duracaoSeg = tempoSessaoAtiva();
    const inicio = Number(s.inicio || s.inicioSessaoAtual || Date.now());
    const nova = {
      id: `sessao_${Date.now().toString(36)}`,
      cargo: s.cargo || "geral",
      inicio: new Date(inicio).toISOString(),
      fim: new Date(Date.now()).toISOString(),
      duracaoSeg,
      motivoPausa: motivo || "",
    };

    mudar((prev) => ({
      ...prev,
      sessoes: [...(prev.sessoes || []), nova],
      sessaoAtiva: null,
    }));
    setErro("");
  }

  function aplicarAjusteTempo() {
    const mins = Number(String(ajusteMinutos).replace(",", "."));
    if (!Number.isFinite(mins) || mins < 0) {
      setErro("Informe os minutos corretamente.");
      return;
    }
    const segs = Math.round(mins * 60);
    mudar((prev) => {
      if (!prev.sessaoAtiva) return prev;
      return {
        ...prev,
        sessaoAtiva: {
          ...prev.sessaoAtiva,
          inicio: Date.now() - segs * 1000,
        },
      };
    });
    setAjusteMinutos("");
    setErro("");
    setShowAjusteModal(false);
  }

  function adicionarSessaoManual() {
    if (!manualInicio || !manualFim) {
      setErro("Informe o início e o fim da sessão manual.");
      return;
    }
    const ini = new Date(manualInicio).getTime();
    const fim = new Date(manualFim).getTime();
    if (!Number.isFinite(ini) || !Number.isFinite(fim) || fim <= ini) {
      setErro("O horário final deve ser posterior ao inicial.");
      return;
    }
    const duracaoSeg = Math.round((fim - ini) / 1000);
    const nova = {
      id: `manual_${Date.now().toString(36)}`,
      cargo: manualCargo || "geral",
      inicio: new Date(ini).toISOString(),
      fim: new Date(fim).toISOString(),
      duracaoSeg,
      manual: true,
    };
    mudar((prev) => ({
      ...prev,
      sessoes: [...(prev.sessoes || []), nova],
    }));
    setManualInicio("");
    setManualFim("");
    setErro("");
    setShowAjusteModal(false);
  }

  function excluirSessao(idSessao) {
    if (!ehAdmin) return;
    mudar((prev) => ({
      ...prev,
      sessoes: (prev.sessoes || []).filter((s) => s.id !== idSessao),
    }));
  }

  function assinarChave(chave) {
    const nome = (assinaturaInput[chave] || "").trim();
    if (!nome) {
      setErro("Informe o nome do responsável para assinar.");
      return;
    }
    mudar((prev) => ({
      ...prev,
      assinaturas: {
        ...(prev.assinaturas || {}),
        [chave]: {
          nome,
          dataHora: new Date().toISOString(),
        },
      },
    }));
    setAssinaturaInput((prev) => ({ ...prev, [chave]: "" }));
    setErro("");
  }

  function removerAssinatura(chave) {
    if (!ehAdmin) return;

    mudar((prev) => {
      const novas = { ...(prev.assinaturas || {}) };
      delete novas[chave];
      return { ...prev, assinaturas: novas };
    });
  }

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
  const saveInfo = STATUS_SAVE[statusSave] || STATUS_SAVE.salvo;
  const tempoAgora = tempoSessaoAtiva();
  const totalAssinaturas = Object.keys(dados.assinaturas || {}).length;
  const totalPossiveis = ASSINATURAS_FIXAS.length;

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
      outline: "none",
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
        paddingBottom: 90,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <button onClick={onVoltar} style={s.btn} title="Voltar">
            <ArrowLeft size={16} /> Voltar
          </button>
          <div>
            {/* 🆕 o título agora reflete o nome digitado */}
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary, #1e293b)",
              }}
            >
              {nomeGaveta?.trim() || gaveta.tag || `Gaveta ${gaveta.numero}`}
            </h2>
            <div style={{ ...s.sub, marginTop: 2 }}>
              {indCompartilhado} · Unidade de produção independente ·{" "}
              {gaveta.tag || `Gaveta ${gaveta.numero}`}
            </div>
          </div>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            background: `${saveInfo.cor}1A`,
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
            lineHeight: 1.5,
          }}
        >
          {erro}
        </div>
      )}

      <div style={s.card}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-secondary, #64748b)",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Nome da gaveta
        </label>
        <input
          type="text"
          value={nomeGaveta}
          onChange={(e) => {
            sujoRef.current = true; // dispara o autosave
            setNomeGaveta(e.target.value);
          }}
          placeholder={`Gaveta ${gaveta.numero}`}
          style={{ ...s.input, fontSize: 15, fontWeight: 600 }}
        />
        <p style={{ ...s.sub, marginTop: 8, marginBottom: 0 }}>
          Esse é o nome exibido no cartão da gaveta na lista. A tag (G01, G02…)
          permanece a mesma.
        </p>
      </div>

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
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-primary, #1e293b)",
              }}
            >
              Progresso da gaveta
            </strong>
            <div style={{ ...s.sub, marginTop: 4 }}>
              {geral.concluidos} de {geral.total} itens · Tempo total:{" "}
              {formatarTempo(tempoTotalGaveta())} · Assinaturas:{" "}
              {totalAssinaturas}/{totalPossiveis}
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
            marginTop: 12,
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

        {ehAdmin && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 16,
              paddingTop: 14,
              borderTop: "1px dashed #e2e8f0",
            }}
          >
            <span style={{ ...s.sub, fontWeight: 600 }}>Liberar etapa:</span>
            {ETAPAS.map((e) => (
              <button
                key={e.id}
                onClick={() => setEtapaPular(e.id)}
                style={s.btnCinza}
                title={`Liberar etapa ${e.label} para o cargo correspondente`}
              >
                <SkipForward size={13} /> {e.label}
              </button>
            ))}
            {dados.etapasLiberadas?.length > 0 && (
              <span style={{ ...s.sub, marginLeft: 4 }}>
                Liberadas: {dados.etapasLiberadas.join(", ")}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="gaveta-colunas">
        <div style={s.card}>
          <ChecklistTable
            ficha={{ items: dados.items, verificacoes: dados.verificacoes }}
            checklistItems={checklistItems}
            onToggleMark={toggleMark}
            onSetResultado={setResultado}
            isTaf={false}
            isPainel={true}
            user={user}
            sessaoIniciada={sessaoIniciada}
            onAbrirVerificacao={(etapa) => {
              if (etapasTrabalhaveis.includes(etapa)) {
                setVerificacaoEtapa(etapa);
              }
            }}
            etapasLiberadas={etapasTrabalhaveis}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Sessões registradas */}
          <div style={s.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={s.titulo}>Sessões registradas</h3>
              {ehAdmin && (
                <button
                  onClick={() => setShowAjusteModal(true)}
                  style={s.btnCinza}
                  title="Ajustar horário (administrador)"
                >
                  <Settings2 size={13} /> Ajustar
                </button>
              )}
            </div>

            {(dados.sessoes || []).length === 0 &&
            sessaoAtiva == null &&
            marcacoesChecklist.length === 0 ? (
              <div style={s.sub}>Nenhuma sessão registrada nesta gaveta.</div>
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
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                        background: "#ffffff",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <strong
                            style={{
                              fontSize: 12,
                              color: "var(--text-primary, #1e293b)",
                            }}
                          >
                            {labelCargo(sessao.cargo)}
                          </strong>
                          {sessao.manual && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                color: "#6d28d9",
                                background: "#ede9fe",
                                padding: "2px 8px",
                                borderRadius: 6,
                              }}
                            >
                              Manual
                            </span>
                          )}
                        </div>
                        <div style={{ ...s.sub, marginTop: 2 }}>
                          {formatarDataHora(sessao.inicio)} a{" "}
                          {formatarDataHora(sessao.fim)}
                        </div>
                        {sessao.motivoPausa && (
                          <div
                            style={{
                              marginTop: 6,
                              padding: "7px 9px",
                              fontSize: 11,
                              color: "#92400e",
                              background: "#fffbeb",
                              border: "1px solid #fde68a",
                              borderRadius: 6,
                            }}
                          >
                            <strong>Motivo da pausa:</strong>{" "}
                            {sessao.motivoPausa}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <strong
                          style={{
                            color: "#16a34a",
                            whiteSpace: "nowrap",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatarTempo(sessao.duracaoSeg)}
                        </strong>
                        {ehAdmin && (
                          <button
                            onClick={() => excluirSessao(sessao.id)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#dc2626",
                              cursor: "pointer",
                              padding: 2,
                              display: "flex",
                            }}
                            title="Excluir sessão"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
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
                    {formatarTempo(tempoTotalGaveta())}
                  </strong>
                </div>
              </div>
            )}

            {/* Marcações do checklist (com data/hora e usuário) */}
            {marcacoesChecklist.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: "1px dashed #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#475569",
                    }}
                  >
                    Marcações do checklist
                  </h4>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    {marcacoesChecklist.length} evento
                    {marcacoesChecklist.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    maxHeight: 320,
                    overflowY: "auto",
                  }}
                >
                  {marcacoesChecklist.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: "9px 11px",
                        borderRadius: 8,
                        border: "1px solid #eef2f7",
                        background: "#fff",
                        fontSize: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <strong
                          style={{
                            fontSize: 12,
                            color: "#1e293b",
                            wordBreak: "break-word",
                          }}
                        >
                          {m.item}
                        </strong>
                        <span
                          style={{
                            flexShrink: 0,
                            padding: "2px 7px",
                            borderRadius: 6,
                            background: "#f1f5f9",
                            color: "#475569",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {m.resultado}
                        </span>
                      </div>
                      <div style={{ color: "#64748b", marginTop: 4 }}>
                        {m.categoria} · {formatarDataHora(m.quando)} ·{" "}
                        {m.usuario}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Assinaturas */}
          <div style={s.card}>
            <h3
              style={{
                ...s.titulo,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <PenLine size={15} />
              Assinaturas
            </h3>
            <p style={{ ...s.sub, marginTop: 0, marginBottom: 8 }}>
              As assinaturas ficam disponíveis para todos os usuários.
            </p>

            {ASSINATURAS_FIXAS.map((a) => {
              const assinatura = dados.assinaturas?.[a.id];
              return (
                <div
                  key={a.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#475569", fontWeight: 600 }}>
                      {a.label}
                    </span>
                    {assinatura ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#166534",
                          fontWeight: 700,
                        }}
                      >
                        ✓ {assinatura.nome}
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Pendente</span>
                    )}
                  </div>

                  {assinatura ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 6,
                      }}
                    >
                      <span style={s.sub}>
                        Assinado em {formatarDataHora(assinatura.dataHora)}
                      </span>
                      {ehAdmin && (
                        <button
                          onClick={() => removerAssinatura(a.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#dc2626",
                            cursor: "pointer",
                            padding: 4,
                            display: "flex",
                          }}
                          title="Remover assinatura"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <input
                        type="text"
                        placeholder="Nome do responsável"
                        value={assinaturaInput[a.id] || ""}
                        onChange={(ev) =>
                          setAssinaturaInput((prev) => ({
                            ...prev,
                            [a.id]: ev.target.value,
                          }))
                        }
                        style={s.input}
                      />
                      <button
                        onClick={() => assinarChave(a.id)}
                        style={{
                          ...s.btnVerde,
                          whiteSpace: "nowrap",
                          padding: "7px 14px",
                        }}
                      >
                        Assinar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <GavetaFotos
            fotos={dados.fotos}
            onFotosChange={(novas) =>
              mudar((prev) => ({ ...prev, fotos: novas }))
            }
            usuario={user?.nome || user?.username || ""}
          />

          {/* Notas */}
          <div style={s.card}>
            <h3 style={{ ...s.titulo, marginBottom: 10 }}>Notas da gaveta</h3>
            <textarea
              value={dados.notas || ""}
              onChange={(e) =>
                mudar((prev) => ({ ...prev, notas: e.target.value }))
              }
              rows={5}
              placeholder="Observações, pendências e ajustes realizados..."
              style={{ ...s.input, resize: "vertical", minHeight: 90 }}
            />
          </div>
        </div>
      </div>

      {/* Verificações — UMA MODAL PARA CADA ETAPA (montagem, barramento, cabeamento) */}
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
        isAdmin={ehAdmin}
        sessaoIniciada={sessaoIniciada}
        fichaId={null}
        onSessoesParadas={() => {}}
      />

      <PularEtapaModal
        isOpen={!!etapaPular}
        etapaAtual={etapaPular}
        onClose={() => setEtapaPular(null)}
        onConfirm={confirmarPularEtapa}
      />

      {/* Botão flutuante — iniciar/pausar (sem descartar) */}
      <div className="sessao-trabalho-float">
        {sessaoAtiva ? (
          <>
            <button
              onClick={() => setShowPauseModal(true)}
              className="sessao-trabalho-btn pausar"
              title="Pausar sessão"
            >
              <Pause size={20} />
            </button>
            <div className="sessao-trabalho-info-float">
              <span className="sessao-trabalho-etapa-float">
                {labelCargo(sessaoAtiva.cargo)}
              </span>
              <span className="sessao-trabalho-tempo-float">
                {formatarTempo(tempoAgora)}
              </span>
            </div>
          </>
        ) : (
          <div className="sessao-trabalho-multi">
            <span className="sessao-trabalho-etapa-float">
              {ehAdmin
                ? labelCargo("geral")
                : labelCargo(etapaCargo || "geral")}
            </span>
            <button
              onClick={iniciarSessao}
              disabled={!cronometroLiberado}
              className="sessao-trabalho-btn iniciar"
              title={
                !cronometroLiberado
                  ? "Conclua a etapa anterior para iniciar o cronômetro"
                  : "Iniciar sessão"
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
            background: "rgba(15, 23, 42, 0.55)",
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
              background: "#ffffff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 440,
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.3)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid #eef2f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Pausar sessão
              </h3>
              <button
                onClick={() => setShowPauseModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  borderRadius: 6,
                }}
                title="Cancelar e continuar"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "22px" }}>
              <p
                style={{
                  fontSize: 14,
                  margin: "0 0 12px",
                  lineHeight: 1.5,
                  color: "#1e293b",
                }}
              >
                Registre o motivo da pausa{" "}
                <span style={{ color: "#64748b" }}>(opcional)</span>
              </p>
              <textarea
                value={motivoPausa}
                onChange={(e) => setMotivoPausa(e.target.value)}
                placeholder="Descreva o motivo da pausa..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#1e293b",
                  fontSize: 14,
                  resize: "vertical",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>

            <div
              style={{
                padding: "16px 22px",
                borderTop: "1px solid #eef2f7",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={() => setShowPauseModal(false)}
                style={{
                  padding: "9px 16px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1e293b",
                }}
              >
                Continuar
              </button>
              <button
                onClick={confirmarPausa}
                style={{
                  padding: "9px 16px",
                  background: "#dc2626",
                  border: "1px solid #dc2626",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                Pausar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAjusteModal && ehAdmin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={() => setShowAjusteModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 500,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid #eef2f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Settings2 size={16} />
                Ajustar horário da gaveta
              </h3>
              <button
                onClick={() => setShowAjusteModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  borderRadius: 6,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              {sessaoAtiva && (
                <div>
                  <h4 style={{ margin: "0 0 10px", fontSize: 14 }}>
                    Sessão em andamento — {labelCargo(sessaoAtiva.cargo)} ·{" "}
                    {formatarTempo(tempoAgora)}
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-end",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <span
                        style={{
                          display: "block",
                          fontSize: 12,
                          color: "#64748b",
                          marginBottom: 6,
                          fontWeight: 600,
                        }}
                      >
                        Tempo em minutos
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={ajusteMinutos}
                        onChange={(e) => setAjusteMinutos(e.target.value)}
                        placeholder="Ex.: 45"
                        style={s.input}
                      />
                    </div>
                    <button onClick={aplicarAjusteTempo} style={s.btnPrimario}>
                      Aplicar
                    </button>
                  </div>
                  <p style={{ ...s.sub, marginTop: 8 }}>
                    Define o tempo decorrido da sessão atual.
                  </p>
                </div>
              )}

              <div style={{ height: 1, background: "#eef2f7" }} />

              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: 14 }}>
                  Adicionar sessão manual
                </h4>
                <p style={{ ...s.sub, marginBottom: 12 }}>
                  Utilize quando o colaborador esqueceu de iniciar ou pausar o
                  cronômetro.
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: 12,
                        color: "#64748b",
                        marginBottom: 6,
                        fontWeight: 600,
                      }}
                    >
                      Cargo / etapa
                    </span>
                    <select
                      value={manualCargo}
                      onChange={(e) => setManualCargo(e.target.value)}
                      style={s.input}
                    >
                      <option value="geral">Supervisão</option>
                      <option value="montagem">Montagem Mecânica</option>
                      <option value="barramento">Barramento</option>
                      <option value="cabeamento">Cabeamento</option>
                    </select>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 12,
                          color: "#64748b",
                          marginBottom: 6,
                          fontWeight: 600,
                        }}
                      >
                        Início
                      </span>
                      <input
                        type="datetime-local"
                        value={manualInicio}
                        onChange={(e) => setManualInicio(e.target.value)}
                        style={s.input}
                      />
                    </div>
                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 12,
                          color: "#64748b",
                          marginBottom: 6,
                          fontWeight: 600,
                        }}
                      >
                        Fim
                      </span>
                      <input
                        type="datetime-local"
                        value={manualFim}
                        onChange={(e) => setManualFim(e.target.value)}
                        style={s.input}
                      />
                    </div>
                  </div>
                  <button
                    onClick={adicionarSessaoManual}
                    style={{ ...s.btnVerde, justifyContent: "center" }}
                  >
                    Adicionar sessão
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
