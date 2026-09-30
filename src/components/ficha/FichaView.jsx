import Header from "../header/Header";
import InfoCard from "../info/InfoCard";
import ChecklistTable from "../checklist/ChecklistTable";
import SessoesTrabalhoList from "../sessions/SessoesTrabalhoList";
import NotesSection from "../notes/NotesSection";
import SignatureSection from "../signatures/SignatureSection";
import TafPanel from "../taf/TafPanel";
import PhotoPanel from "../photoupload/PhotoPanel";
import ConsideracoesPanel from "../consideracoes/ConsideracoesPanel";
import ConfirmModal from "../buttons/ConfirmModal";
import ApproveModal from "../buttons/ApproveModal";
import BotaoSessaoTrabalho from "../buttons/BotaoSessaoTrabalho";
import RejectModal from "../buttons/RejectModal";
import VerificacaoEtapaModal from "../buttons/VerificacaoEtapaModal";
import ChecklistLogList from "../sessions/CheckListLogList";
import { useSessoesTrabalho } from "../../hooks/useSessoesTrabalho";
import { useChecklistLog } from "../../hooks/useChecklistLog";
import {
  getChecklistItems,
  buildPainelItems,
  ensurePainelItemsComVerificacao,
} from "../../data/fichaTemplate";
import {
  getPainelChecklistItems,
  getPainelVerificacaoItems,
  getPainelVerificacaoPorEtapa,
} from "../../data/painelTemplates";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { getEtapaAtual, podeTrabalharNaEtapa } from "../../utils/etapas";
import QrCodeModal from "../qrcode/QrCodeModal";
import { montarUrlPublica } from "../qrcode/QrCodeDocumentacao";
import TimelineFicha from "../sessions/TimelineFicha";
import {
  Zap,
  ListChecks,
  Timer,
  PenLine,
  ClipboardList,
  Camera,
  StickyNote,
  QrCode,
  History,
} from "lucide-react";

const ETAPAS_PAINEL = ["montagem", "barramento", "cabeamento"];

export default function FichaView({
  user,
  fichas,
  atualizarFicha,
  getFicha,
  excluirFicha,
  origem,
}) {
  const { fichaId, colecaoId } = useParams();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const sessoesTrabalho = useSessoesTrabalho(ficha?.dbId);
  const { sessoes, loading: sessoesLoading, loadSessoes } = sessoesTrabalho;
  const [qrOpen, setQrOpen] = useState(false);
  const podeVerHistorico =
    user?.role === "admin" || user?.permissoes?.includes("ver_historico");

  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [rejectInfo, setRejectInfo] = useState(null);
  const [approveInfo, setApproveInfo] = useState(null);
  const [verificacaoEtapa, setVerificacaoEtapa] = useState(null);
  const { registrarMarcacao } = useChecklistLog(ficha?.dbId);
  const isAdmin = user?.role === "admin";
  const etapasLiberadas = ficha?.etapasLiberadas || [];
  const sessaoIniciada = sessoes.some(
    (s) => !s.fim && s.usuario === user?.username,
  );

  useEffect(() => {
    let cancelled = false;
    async function buscar() {
      setLoading(true);
      const resultado = await getFicha(fichaId);
      if (!cancelled) {
        setFicha(resultado);
        setLoading(false);
      }
    }
    buscar();
    return () => {
      cancelled = true;
    };
  }, [fichaId]);

  useEffect(() => {
    if (!fichaId || !fichas || !ficha) return;
    if (
      String(ficha.dbId) !== String(fichaId) &&
      String(ficha.id) !== String(fichaId)
    ) {
      return;
    }
    const atualizada = fichas.find(
      (f) =>
        String(f.dbId) === String(fichaId) || String(f.id) === String(fichaId),
    );
    if (atualizada) setFicha(atualizada);
  }, [fichas, fichaId, ficha]);

  useEffect(() => {
    if (!ficha || String(ficha.operacao) !== "10" || !ficha.tipoPainel) return;
    if (!Array.isArray(ficha.items)) return;

    const completos = ensurePainelItemsComVerificacao(
      ficha.tipoPainel,
      ficha.items,
    );

    if (completos !== ficha.items) {
      atualizarFicha(fichaId, (prev) => ({ ...prev, items: completos }));
    }
  }, [ficha, fichaId, atualizarFicha]);

  useEffect(() => {
    if (!ficha) return;
    const op = String(ficha.operacao ?? "");
    if (op === "50") setActiveTab("taf");
    else if (op === "80") setActiveTab("fotos");
    else setActiveTab("info");
  }, [ficha?.operacao]);

  const handleUpdateFotoData = useCallback(
    (updater) => {
      atualizarFicha(fichaId, (prev) => ({
        ...prev,
        fotoData:
          typeof updater === "function"
            ? updater(prev?.fotoData ?? {})
            : { ...prev?.fotoData, ...updater },
      }));
    },
    [fichaId, atualizarFicha],
  );

  function handleTipoPainelChange(novoTipo) {
    if (!ficha || !podeEditar()) return;
    marcarReedicaoSeAprovada();
    atualizarFicha(fichaId, (prev) => ({
      ...prev,
      tipoPainel: novoTipo,
      items: buildPainelItems(novoTipo),
    }));
  }

  function toggleEtapaLiberada(etapa) {
    if (!isAdmin || !isPainel) return;
    const novas = etapasLiberadas.includes(etapa)
      ? etapasLiberadas.filter((e) => e !== etapa)
      : [...etapasLiberadas, etapa];

    atualizarFicha(fichaId, (prev) => ({ ...prev, etapasLiberadas: novas }));
  }

  const handleUpdateConsideracoes = useCallback(
    (updater) => {
      atualizarFicha(fichaId, (prev) => ({
        ...prev,
        fotoData:
          typeof updater === "function"
            ? updater(prev?.fotoData ?? {})
            : { ...prev?.fotoData, ...updater },
      }));
    },
    [fichaId, atualizarFicha],
  );

  const handleUpdateTaf = useCallback(
    (newData) => {
      atualizarFicha(fichaId, (prev) => ({
        ...prev,
        tafData: { ...prev?.tafData, ...newData },
      }));
    },
    [fichaId, atualizarFicha],
  );

  const handleUpdateTafPanel = useCallback(
    (newData) => {
      atualizarFicha(fichaId, (prev) => ({ ...prev, ...newData }));
    },
    [fichaId, atualizarFicha],
  );

  function handleBack() {
    if (origem === "colecao") {
      navigate(`/colecao/${colecaoId}`);
    } else {
      navigate("/dashboard");
    }
  }

  function podeEditar() {
    if (!ficha) return false;
    return (
      user?.role === "admin" ||
      ficha?.userId === user?.username ||
      user?.permissoes?.includes("editar_ficha")
    );
  }

  function marcarReedicaoSeAprovada() {
    if (!ficha) return;
    if (ficha.statusAprovacao === "aprovado" && ficha.status === "finalizada") {
      const revisaoAtual = parseInt(ficha.revisao || "1", 10);
      const novaRevisao = String(revisaoAtual + 1).padStart(2, "0");

      atualizarFicha(fichaId, (prev) => ({
        ...prev,
        status: "andamento",
        statusAprovacao: "revisao",
        revisao: novaRevisao,
      }));
    }
  }

  function updateField(field, value) {
    if (!ficha || !podeEditar()) return;
    marcarReedicaoSeAprovada();
    atualizarFicha(fichaId, (prev) => ({ ...prev, [field]: value }));
  }

  function updateItem(itemIndex, key, value) {
    if (!ficha || !sessaoIniciada) return;
    marcarReedicaoSeAprovada();
    const item = ficha.items?.[itemIndex];
    if (!item) return;

    const template = activeChecklistItems.find((c) => c.id === item.id);
    if (isPainel && !podeTrabalharNaEtapa(user, template?.etapa)) return;

    const novosItems = [...(ficha.items ?? [])];
    novosItems[itemIndex] = { ...novosItems[itemIndex], [key]: value };

    atualizarFicha(fichaId, (prev) => {
      const items = [...(prev?.items ?? [])];
      items[itemIndex] = { ...items[itemIndex], [key]: value };
      return { ...prev, items };
    });

    if (key === "resultado" && value) {
      registrarMarcacao({
        itemId: item.id,
        descricao: template?.descricao || `Item ${item.id}`,
        campo: "resultado",
        valor: value,
        etapa: template?.etapa,
        usuario: user?.nome || user?.username,
      });
      if (template?.etapa) verificarFimEtapa(template.etapa, novosItems);
    }
  }

  function verificarFimEtapa(etapa, itemsAtuais) {
    if (etapasLiberadas.length > 0) return;

    const itensDaSequencia = activeChecklistItems.filter(
      (ci) => ci.etapa === etapa && !String(ci.id ?? "").includes("-ver-"),
    );
    if (itensDaSequencia.length === 0) return;

    const todosPreenchidos = itensDaSequencia.every((ci) => {
      const itemData = itemsAtuais.find((i) => i.id === ci.id);
      return itemData?.resultado === "ok" || itemData?.resultado === "na";
    });

    if (todosPreenchidos) {
      console.log(
        `[FichaView] ✅ Etapa "${etapa}" concluída! Parando todos os cronômetros...`,
      );
      sessoesTrabalho.pararTodasSessoes();
    }
  }

  function handleToggleVerificacao(idx, valor) {
    if (!verificacaoEtapa || !ficha?.tipoPainel) return;
    if (user?.role !== "admin") return;
    if (!sessaoIniciada) return;

    const etapa = verificacaoEtapa;
    const itens = getPainelVerificacaoPorEtapa(ficha.tipoPainel, etapa);

    const valorAtual = ficha?.verificacoes?.[etapa]?.[idx];
    const vaiMarcar = valorAtual !== valor;

    atualizarFicha(fichaId, (prev) => {
      const base = [...(prev?.verificacoes?.[etapa] || [])];
      while (base.length < itens.length) base.push("");
      base[idx] = vaiMarcar ? valor : "";
      return {
        ...prev,
        verificacoes: {
          ...(prev?.verificacoes || {}),
          [etapa]: base,
        },
      };
    });

    if (vaiMarcar) {
      const valorNormalizado =
        valor === "ok" ? "OK" : valor === "na" ? "N/A" : "ERRO";

      registrarMarcacao({
        itemId: `ver-${etapa}-${idx}`,
        descricao: itens[idx] || `Verificação ${idx + 1}`,
        campo: "verificacao",
        valor: valorNormalizado,
        etapa,
        usuario: user?.nome || user?.username,
      });
    }
  }

  function updateItemResultado(itemIndex, resultado, observacao = "") {
    if (!ficha || !sessaoIniciada) return;
    marcarReedicaoSeAprovada();
    const item = ficha.items?.[itemIndex];
    if (!item) return;

    const template = activeChecklistItems.find((c) => c.id === item.id);
    if (isPainel && !podeTrabalharNaEtapa(user, template?.etapa)) return;

    const novosItems = [...(ficha.items ?? [])];
    novosItems[itemIndex] = { ...novosItems[itemIndex], resultado, observacao };

    atualizarFicha(fichaId, (prev) => {
      const items = [...(prev?.items ?? [])];
      items[itemIndex] = { ...items[itemIndex], resultado, observacao };
      return { ...prev, items };
    });

    if (resultado) {
      registrarMarcacao({
        itemId: item.id,
        descricao: template?.descricao || `Item ${item.id}`,
        campo: "resultado",
        valor: resultado,
        observacao,
        etapa: template?.etapa,
        usuario: user?.nome || user?.username,
      });
      if (template?.etapa) verificarFimEtapa(template.etapa, novosItems);
    }
  }

  function updateItemSessionMark(itemIndex, sessionIndex, value) {
    if (!ficha || !sessaoIniciada || !podeEditar()) return;
    marcarReedicaoSeAprovada();
    const item = ficha.items?.[itemIndex];
    if (!item) return;

    const template = activeChecklistItems.find((c) => c.id === item.id);
    if (isPainel && !podeTrabalharNaEtapa(user, template?.etapa)) return;

    const novoValor = item.sessionMarks?.[sessionIndex] === value ? "" : value;

    atualizarFicha(fichaId, (prev) => {
      const items = [...(prev?.items ?? [])];
      const marks = [...(items[itemIndex]?.sessionMarks ?? [])];
      marks[sessionIndex] = novoValor;
      items[itemIndex] = { ...items[itemIndex], sessionMarks: marks };
      return { ...prev, items };
    });

    if (novoValor) {
      registrarMarcacao({
        itemId: item.id,
        descricao: template?.descricao || `Item ${item.id}`,
        campo: "sessionMark",
        valor: novoValor,
        sessaoIndex: sessionIndex,
        etapa: template?.etapa,
        usuario: user?.nome || user?.username,
      });
    }
  }

  function updateSession(sessionIndex, field, value) {
    if (!ficha || !podeEditar()) return;
    marcarReedicaoSeAprovada();
    atualizarFicha(fichaId, (prev) => {
      const sessions = [...(prev?.sessions ?? [])];
      sessions[sessionIndex] = { ...sessions[sessionIndex], [field]: value };
      return { ...prev, sessions };
    });
  }

  function updateSignature(role, dataUrl) {
    if (!ficha || !podeEditar()) return;
    marcarReedicaoSeAprovada();
    atualizarFicha(fichaId, (prev) => ({
      ...prev,
      assinaturas: {
        ...prev?.assinaturas,
        [role]: {
          ...prev?.assinaturas?.[role],
          dataUrl,
          data: dataUrl ? new Date().toLocaleDateString("pt-BR") : "",
        },
      },
    }));
  }

  function updateSignatureName(role, nome) {
    if (!ficha || !podeEditar()) return;
    marcarReedicaoSeAprovada();
    atualizarFicha(fichaId, (prev) => ({
      ...prev,
      assinaturas: {
        ...prev?.assinaturas,
        [role]: { ...prev?.assinaturas?.[role], nome },
      },
    }));
  }

  function handleOperacaoChange(novoCodigo) {
    if (!ficha || !podeEditar()) return;
    marcarReedicaoSeAprovada();
    atualizarFicha(fichaId, (prev) => ({ ...prev, operacao: novoCodigo }));
  }

  function montarTestadores() {
    const nomes = [];

    (sessoes || []).forEach((s) => {
      let tempoSegundos = 0;

      if (s.fim) {
        tempoSegundos = Number(s.duracao_segundos || 0);
      } else {
        const inicioMs = s.inicio ? new Date(s.inicio).getTime() : 0;
        if (inicioMs) {
          tempoSegundos = Math.max(0, (Date.now() - inicioMs) / 1000);
        }
      }

      if (tempoSegundos <= 0) return;

      const nome = s.nome || s.usuario;
      if (nome && String(nome).trim()) nomes.push(String(nome).trim());
    });

    return [...new Set(nomes.filter(Boolean))].join(", ");
  }

  function getCamposFaltantes(fichaArg = null) {
    const f = fichaArg || ficha;
    if (!f) return [];
    const faltando = [];

    const opStr = String(f.operacao ?? "");
    const taf = opStr === "50";
    const foto = opStr === "80";

    if (!foto) {
      const camposBasicos = {
        nomeEquipamento: "Nome do Equipamento",
        numeroInd: "Número IND",
        obra: "Obra",
        cliente: "Cliente",
        tag: "TAG",
      };

      if (!taf) {
        camposBasicos.dataInicio = "Data de Início";
        camposBasicos.dataTermino = "Data de Término";
      }

      Object.entries(camposBasicos).forEach(([campo, label]) => {
        if (!f[campo] || String(f[campo]).trim() === "") {
          faltando.push(label);
        }
      });
    }

    if (!foto && f.items?.length > 0) {
      const itensSemResultado = f.items.filter((item) => {
        if (String(item.id ?? "").includes("-ver-")) return false;
        return !item?.resultado || String(item.resultado).trim() === "";
      });

      if (itensSemResultado.length > 0) {
        faltando.push(
          `Checklist incompleto (${itensSemResultado.length} item(ns) sem resultado)`,
        );
      }

      if (isPainel && f.verificacoes) {
        const etapasComVerificacao = ["montagem", "barramento", "cabeamento"];
        for (const etapa of etapasComVerificacao) {
          const resultados = f.verificacoes[etapa] || [];
          if (resultados.length === 0) continue;
          const temPendente = resultados.some((v) => !v || v === "erro");
          if (temPendente) {
            faltando.push(
              `Verificação de ${etapa === "montagem" ? "Montagem" : etapa === "barramento" ? "Barramento" : "Cabeamento"} pendente ou com erro`,
            );
          }
        }
      }
    }

    if (foto) {
      const fotos = f.fotoData?.fotos || [];
      if (fotos.length === 0) {
        faltando.push("Nenhuma foto enviada");
      }
    }

    const rolesObrigatorios = foto ? [] : ["supervisor", "qualidade"];
    rolesObrigatorios.forEach((role) => {
      const assinatura = f.assinaturas?.[role];
      if (!assinatura?.dataUrl || !assinatura?.nome?.trim()) {
        const labels = {
          supervisor: "Assinatura do Supervisor",
          qualidade: "Assinatura da Qualidade",
        };
        faltando.push(labels[role] || `Assinatura (${role})`);
      }
    });

    if (
      (f.statusAprovacao === "revisao" || f.statusAprovacao === "reprovado") &&
      !f.alteracoesFeitas?.trim()
    ) {
      faltando.push("Campo 'Alterações Feitas' (obrigatório em revisão)");
    }

    return faltando;
  }

  function gerarTokenPublico() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  async function handleFinalizar() {
    if (!ficha) return;

    const isTafOp = String(ficha.operacao ?? "") === "50";

    const fichaEfetiva = { ...ficha };

    if (isTafOp) {
      if (!fichaEfetiva.dataInicio) {
        fichaEfetiva.dataInicio = fichaEfetiva.createdAt
          ? new Date(fichaEfetiva.createdAt).toLocaleDateString("pt-BR")
          : new Date().toLocaleDateString("pt-BR");
      }
      fichaEfetiva.dataTermino = new Date().toLocaleDateString("pt-BR");
      fichaEfetiva.tafData = {
        ...fichaEfetiva.tafData,
        dataTeste:
          fichaEfetiva.tafData?.dataTeste ||
          new Date().toLocaleDateString("pt-BR"),
        testadores: montarTestadores(),
      };
    }

    const faltando = getCamposFaltantes(fichaEfetiva);
    if (faltando.length > 0) {
      setSuccessModal({
        isOpen: true,
        title: "Ficha incompleta",
        message:
          "Preencha os seguintes campos antes de finalizar:\n\n• " +
          faltando.join("\n• "),
        type: "danger",
      });
      return;
    }

    atualizarFicha(fichaId, {
      ...(isTafOp
        ? {
            dataInicio: fichaEfetiva.dataInicio,
            dataTermino: fichaEfetiva.dataTermino,
            tafData: fichaEfetiva.tafData,
          }
        : {}),
      status: "finalizada",
      statusAprovacao: "aguardando",
      finalizadaAt: new Date().toISOString(),
      tokenPublico: fichaEfetiva.tokenPublico || gerarTokenPublico(),
    });

    setSuccessModal({
      isOpen: true,
      title: "Sucesso!",
      message: "Ficha finalizada com sucesso!",
      type: "success",
    });
  }

  function handleApprove(estado) {
    if (estado === "reprovado") {
      setRejectInfo({ id: fichaId });
      return;
    }
    if (estado === "aprovado") {
      setApproveInfo({ id: fichaId });
      return;
    }
  }

  function confirmApprove(reason) {
    if (!approveInfo) return;
    atualizarFicha(approveInfo.id, {
      statusAprovacao: "aprovado",
      motivoAprovacao: reason,
      aprovadoPor: user?.nome || user?.username,
      aprovadoEm: new Date().toISOString(),
      reprovadoPor: "",
      reprovadoEm: "",
      motivoReprovacao: "",
    });
    setApproveInfo(null);
  }

  function confirmReject(reason) {
    if (!rejectInfo) return;
    atualizarFicha(rejectInfo.id, {
      statusAprovacao: "reprovado",
      status: "andamento",
      motivoReprovacao: reason,
      reprovadoPor: user?.nome || user?.username,
      reprovadoEm: new Date().toISOString(),
      aprovadoPor: "",
      aprovadoEm: "",
      alteracoesFeitas: "",
    });
    setRejectInfo(null);
  }

  function getEtapaDeItemId(id) {
    const s = String(id || "");
    if (s.startsWith("mm-")) return "montagem";
    if (s.startsWith("bar-")) return "barramento";
    if (s.startsWith("cab-")) return "cabeamento";
    return null;
  }

  function getProgress() {
    if (!ficha) return 0;
    const total = ficha.items?.length || 0;
    if (total === 0) return 0;

    const done = ficha.items.reduce((acc, item) => {
      if (String(item.id ?? "").includes("-ver-")) {
        const etapa = getEtapaDeItemId(item.id);
        const idx = parseInt(String(item.id).split("-").pop(), 10);
        const v = ficha.verificacoes?.[etapa]?.[idx];
        return v === "ok" || v === "na" ? acc + 1 : acc;
      }
      return item.resultado === "ok" || item.resultado === "na" ? acc + 1 : acc;
    }, 0);

    return Math.round((done / total) * 100);
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 16,
          background: "var(--bg-base)",
          color: "var(--text-secondary)",
        }}
      >
        <div className="login-spinner" />
        <p style={{ fontSize: 14 }}>Carregando ficha...</p>
      </div>
    );
  }

  if (!ficha) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          color: "var(--text-secondary)",
        }}
      >
        Ficha não encontrada.
      </div>
    );
  }

  const operacaoStr = String(ficha?.operacao ?? "");
  const isTaf = operacaoStr === "50";
  const isFoto = operacaoStr === "80";
  const isPainel = operacaoStr === "10" && !!ficha?.tipoPainel;
  const checklistItems =
    isTaf && ficha?.tipoPainel
      ? getPainelVerificacaoItems(ficha?.tipoPainel)
      : getChecklistItems(ficha?.operacao);

  const activeChecklistItems = isPainel
    ? getPainelChecklistItems(ficha?.tipoPainel, { incluirVerificacao: true })
    : checklistItems;

  const etapaAtual = isPainel
    ? getEtapaAtual(ficha?.items, activeChecklistItems, ficha?.verificacoes)
    : null;

  const tabs = isTaf
    ? [
        { id: "taf", Icon: Zap, label: "Testes" },
        { id: "checklist", Icon: ListChecks, label: "Funcionais e Visuais" },
        { id: "sessions", Icon: Timer, label: "Sessões" },
        { id: "signatures", Icon: PenLine, label: "Assinaturas" },
        ...(podeVerHistorico
          ? [{ id: "historico", Icon: History, label: "Histórico" }]
          : []),
      ]
    : isFoto
      ? [
          { id: "info", Icon: ClipboardList, label: "Dados" },
          { id: "fotos", Icon: Camera, label: "Fotos" },
          { id: "notes", Icon: StickyNote, label: "Notas" },
          ...(podeVerHistorico
            ? [{ id: "historico", Icon: History, label: "Histórico" }]
            : []),
        ]
      : [
          { id: "info", Icon: ClipboardList, label: "Dados" },
          { id: "checklist", Icon: ListChecks, label: "Checklist" },
          { id: "sessions", Icon: Timer, label: "Sessões" },
          { id: "notes", Icon: StickyNote, label: "Notas" },
          { id: "signatures", Icon: PenLine, label: "Assinaturas" },
          ...(podeVerHistorico
            ? [{ id: "historico", Icon: History, label: "Histórico" }]
            : []),
        ];

  return (
    <>
      <div className="app">
        <Header
          ficha={ficha}
          user={user}
          progress={getProgress()}
          onBack={handleBack}
          onApprove={handleApprove}
        />

        <main className="main-content">
          {activeTab === "info" &&
            (!isFoto ? (
              <InfoCard
                ficha={ficha}
                onChange={updateField}
                onOperacaoChange={handleOperacaoChange}
                onTipoPainelChange={handleTipoPainelChange}
                sessoesTrabalho={sessoes}
                podeEditarFicha={podeEditar()}
              />
            ) : (
              <ConsideracoesPanel
                ficha={ficha}
                onUpdateHeader={updateField}
                onUpdateFotoData={handleUpdateConsideracoes}
              />
            ))}

          {activeTab === "checklist" && (
            <>
              {isPainel && isAdmin && (
                <div className="etapas-liberadas-card">
                  <div className="etapas-liberadas-title">
                    Liberar etapas para edição simultânea
                  </div>
                  <div className="etapas-liberadas-grid">
                    {ETAPAS_PAINEL.map((etapa) => {
                      const label =
                        etapa === "montagem"
                          ? "Montagem"
                          : etapa === "barramento"
                            ? "Barramento"
                            : "Cabeamento";
                      return (
                        <label key={etapa} className="etapa-liberada-toggle">
                          <input
                            type="checkbox"
                            checked={etapasLiberadas.includes(etapa)}
                            onChange={() => toggleEtapaLiberada(etapa)}
                          />
                          <span>{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <ChecklistTable
                ficha={ficha}
                checklistItems={activeChecklistItems}
                onToggleMark={updateItemSessionMark}
                onSetResultado={(idx, val, observacao) =>
                  updateItemResultado(idx, val, observacao)
                }
                isTaf={isTaf}
                isPainel={isPainel}
                tafData={ficha?.tafData}
                onUpdateTaf={handleUpdateTaf}
                readOnly={!sessaoIniciada}
                user={user}
                sessaoIniciada={sessaoIniciada}
                onAbrirVerificacao={setVerificacaoEtapa}
                etapasLiberadas={etapasLiberadas}
              />
            </>
          )}

          {activeTab === "taf" && isTaf && (
            <TafPanel ficha={ficha} onUpdate={handleUpdateTafPanel} />
          )}

          {activeTab === "fotos" && isFoto && (
            <PhotoPanel ficha={ficha} onUpdateFotoData={handleUpdateFotoData} />
          )}

          {activeTab === "sessions" && (
            <>
              <SessoesTrabalhoList
                fichaId={fichaId}
                user={user}
                sessoesTrabalho={sessoesTrabalho}
              />
              <ChecklistLogList
                fichaId={ficha?.dbId}
                tipoPainel={ficha?.tipoPainel}
              />
            </>
          )}

          {activeTab === "notes" && (
            <NotesSection
              ficha={ficha}
              observacoes={ficha?.observacoes}
              onChange={(val) => updateField("observacoes", val)}
              onChangeAlteracoes={(val) => updateField("alteracoesFeitas", val)}
              isFoto={isFoto}
              onFinalizar={handleFinalizar}
            />
          )}

          {activeTab === "signatures" && (
            <SignatureSection
              ficha={ficha}
              assinaturas={ficha?.assinaturas}
              onSign={updateSignature}
              onNameChange={updateSignatureName}
              onFinalizar={handleFinalizar}
            />
          )}

          {activeTab === "historico" && <TimelineFicha fichaId={ficha.dbId} />}
        </main>

        <nav className="tab-bar">
          {tabs.map(({ id, Icon, label }) => (
            <button
              key={id}
              className={`tab-item ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <span className="tab-icon">
                <Icon size={18} />
              </span>
              <span className="tab-label">{label}</span>
            </button>
          ))}
        </nav>

        <BotaoSessaoTrabalho
          fichaId={fichaId}
          user={user}
          sessoes={sessoes}
          loading={sessoesLoading}
          onChange={loadSessoes}
          etapa={etapaAtual}
          etapasLiberadas={etapasLiberadas}
          isAdmin={isAdmin}
        />
      </div>

      {ficha?.tokenPublico &&
        (user?.role === "admin" ||
          user?.permissoes?.includes("ver_qrcode")) && (
          <button
            className="qr-code-float"
            onClick={() => setQrOpen(true)}
            title="QR Code para o painel"
          >
            <QrCode size={22} />
          </button>
        )}

      <QrCodeModal
        open={qrOpen}
        url={montarUrlPublica(ficha?.tokenPublico)}
        filename={`qr-code-${ficha?.numeroInd || ficha?.dbId || "painel"}.png`}
        fichaId={ficha?.dbId}
        onClose={() => setQrOpen(false)}
      />

      <ConfirmModal
        isOpen={successModal.isOpen}
        title={successModal.title}
        message={successModal.message}
        type={successModal.type || "success"}
        confirmText="Entendido"
        showCancel={false}
        onConfirm={() => {
          setSuccessModal({ ...successModal, isOpen: false });
          if (successModal.title === "Sucesso!") handleBack();
        }}
      />

      <ApproveModal
        isOpen={!!approveInfo}
        onClose={() => setApproveInfo(null)}
        onConfirm={confirmApprove}
      />

      <RejectModal
        isOpen={!!rejectInfo}
        onClose={() => setRejectInfo(null)}
        onConfirm={confirmReject}
      />

      <VerificacaoEtapaModal
        isOpen={!!verificacaoEtapa}
        etapa={verificacaoEtapa}
        itens={
          verificacaoEtapa && ficha?.tipoPainel
            ? getPainelVerificacaoPorEtapa(ficha.tipoPainel, verificacaoEtapa)
            : []
        }
        resultados={
          verificacaoEtapa ? ficha?.verificacoes?.[verificacaoEtapa] || [] : []
        }
        onToggle={handleToggleVerificacao}
        onClose={() => setVerificacaoEtapa(null)}
        isAdmin={user?.role === "admin"}
        sessaoIniciada={sessaoIniciada}
        fichaId={ficha.dbId}
        onSessoesParadas={loadSessoes}
      />
    </>
  );
}
