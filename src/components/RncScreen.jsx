import { useCallback, useEffect, useState } from "react";
import {
  FileWarning,
  Plus,
  Save,
  Trash2,
  X,
  Table2,
  ClipboardList,
  Pencil,
  History,
  Lock,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002";

const ORIGENS = [
  "Auditoria Interna",
  "Auditoria Externa",
  "Reclamação de Cliente",
  "Produto Não Conforme",
  "Detectado durante a montagem do Painel",
  "Detectado no TAF",
];

const TIPOS = ["Não Conformidade Real", "Não Conformidade Potencial"];
const ACOES = ["Ação Corretiva", "Ação Preventiva", "Outro"];
const STATUS_OPTIONS = [
  { value: "aberto", label: "Aberto", color: "#ef4444" },
  { value: "em_andamento", label: "Em Andamento", color: "#f59e0b" },
  { value: "fechado", label: "Fechado", color: "#22c55e" },
  { value: "ineficaz", label: "Ineficaz", color: "#dc2626" },
];

const RNC_VAZIO = {
  numeroRnc: "",
  setorProcesso: "",
  origens: [],
  tipo: "",
  acao: "",
  acaoOutro: "",
  descricao: "",
  preenchidoPor: "",
  dataAbertura: "",
  acaoCorretivaImediata: "",
  executadoPor: "",
  dataExecucao: "",
  investigacaoCausas: "",
  planoAcao: "",
  verificacaoEficacia: "",
  responsavel: "",
  dataEncerramento: "",
  prazo: "",
  observacao: "",
  status: "aberto",
};

// Usuário logado (para saber se é admin)
function usuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function decodeRnc(rnc) {
  return {
    id: rnc.id,
    numeroRnc: rnc.numero_rnc || "",
    setorProcesso: rnc.setor_processo || "",
    origens: rnc.origens ? rnc.origens.split(", ").filter(Boolean) : [],
    tipo: rnc.tipo || "",
    acao: rnc.acao || "",
    acaoOutro: rnc.acao_outro || "",
    descricao: rnc.descricao || "",
    preenchidoPor: rnc.preenchido_por || "",
    dataAbertura: rnc.data_abertura ? rnc.data_abertura.slice(0, 10) : "",
    acaoCorretivaImediata: rnc.acao_corretiva_imediata || "",
    executadoPor: rnc.executado_por || "",
    dataExecucao: rnc.data_execucao ? rnc.data_execucao.slice(0, 10) : "",
    investigacaoCausas: rnc.investigacao_causas || "",
    planoAcao: rnc.plano_acao || "",
    verificacaoEficacia: rnc.verificacao_eficacia || "",
    responsavel: rnc.responsavel || "",
    dataEncerramento: rnc.data_encerramento
      ? rnc.data_encerramento.slice(0, 10)
      : "",
    prazo: rnc.prazo ? rnc.prazo.slice(0, 10) : "",
    observacao: rnc.observacao || "",
    status: rnc.status || "aberto",
    // metadados de dono / auditoria
    criadoPorUser: rnc.criado_por_user_id,
    criadoPorNome: rnc.criado_por_nome || rnc.criado_por || "",
    atualizadoPorNome: rnc.atualizado_por_nome || "",
    atualizadoEm: rnc.atualizado_em || "",
  };
}

function formatarData(data) {
  if (!data) return "—";
  try {
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) {
      return String(data).slice(0, 10).split("-").reverse().join("/");
    }
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function formatarDataHora(data) {
  if (!data) return "—";
  try {
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function getStatusInfo(status) {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}

const LABEL_CAMPO = {
  numero_rnc: "Nº RNC",
  setor_processo: "Setor/Processo",
  origens: "Origem",
  tipo: "Tipo",
  acao: "Ação",
  acao_outro: "Ação (outro)",
  descricao: "Descrição",
  preenchido_por: "Preenchido por",
  data_abertura: "Data de abertura",
  acao_corretiva_imediata: "Ação corretiva imediata",
  executado_por: "Executado por",
  data_execucao: "Data da execução",
  investigacao_causas: "Investigação das causas",
  plano_acao: "Plano de ação",
  verificacao_eficacia: "Verificação da eficácia",
  responsavel: "Responsável",
  data_encerramento: "Data de encerramento",
  prazo: "Prazo",
  observacao: "Observação",
  status: "Status",
};

export default function RncScreen({ colecaoId }) {
  const user = usuarioLogado();
  const ehAdmin = user?.role === "admin" || user?.isAdmin === true;

  const [rncs, setRncs] = useState([]);
  const [form, setForm] = useState(RNC_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [aba, setAba] = useState("lista"); // lista | form | historico
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [historicoRnc, setHistoricoRnc] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = colecaoId
        ? `${API_URL}/rnc?colecaoId=${colecaoId}`
        : `${API_URL}/rnc`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRncs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar RNCs:", err);
    } finally {
      setLoading(false);
    }
  }, [colecaoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function setCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function toggleOrigem(origem) {
    setForm((prev) =>
      prev.origens.includes(origem)
        ? { ...prev, origens: prev.origens.filter((o) => o !== origem) }
        : { ...prev, origens: [...prev.origens, origem] },
    );
  }

  async function salvar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...form,
        origens: form.origens.join(", "),
        colecaoId,
      };
      const url = editandoId
        ? `${API_URL}/rnc/${editandoId}`
        : `${API_URL}/rnc`;
      const method = editandoId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao salvar o registro.");
      }
      setEditandoId(null);
      setForm(RNC_VAZIO);
      setAba("lista");
      await carregar();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function excluir(id) {
    if (!window.confirm("Excluir este RNC?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/rnc/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao excluir.");
      }
      await carregar();
    } catch (err) {
      alert(err.message);
    }
  }

  async function novo() {
    setEditandoId(null);
    setForm(RNC_VAZIO);
    setAba("form");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/rnc/proximo-numero`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, numeroRnc: data.numeroRnc }));
      }
    } catch (err) {
      console.error("Erro ao buscar próximo número RNC:", err);
    }
  }

  function editar(rnc) {
    setEditandoId(rnc.id);
    setForm(decodeRnc(rnc));
    setAba("form");
  }

  async function verHistorico(rnc) {
    setHistoricoRnc(decodeRnc(rnc));
    setHistorico([]);
    setAba("historico");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/rnc/${rnc.id}/historico`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistorico(Array.isArray(data) ? data : []);
      } else {
        setHistorico([]);
      }
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    }
  }

  function cancelar() {
    setEditandoId(null);
    setForm(RNC_VAZIO);
    setAba("lista");
  }

  const rotuloAba = (k) =>
    k === "lista" ? "Acompanhamento" : k === "form" ? "Registro" : "Histórico";

  return (
    <div className="rnc-screen">
      <div className="rnc-header">
        <div>
          <h2 className="rnc-titulo">
            <FileWarning size={20} /> Não Conformidades
          </h2>
          <p className="rnc-subtitulo">
            RNC FM-SGQ-006-2026 · Acompanhamento FM-SGQ-007-2026
            {!ehAdmin && (
              <span className="rnc-lock-hint">
                <Lock size={11} /> Você vê apenas os seus RNCs
              </span>
            )}
          </p>
        </div>

        {aba === "lista" ? (
          <button className="rnc-btn rnc-btn-primary" onClick={novo}>
            <Plus size={16} /> Novo RNC
          </button>
        ) : (
          <button className="rnc-btn rnc-btn-ghost" onClick={cancelar}>
            <X size={16} /> Voltar
          </button>
        )}
      </div>

      <div className="rnc-tabs">
        {["lista", "form"].map((k) => (
          <button
            key={k}
            className={`rnc-tab ${aba === k ? "ativa" : ""}`}
            onClick={() => {
              if (k === "form") {
                if (editandoId || form.numeroRnc) setAba("form");
                else novo();
              } else {
                setAba("lista");
              }
            }}
          >
            {k === "lista" && <Table2 size={15} />}
            {k === "form" && <ClipboardList size={15} />}
            {rotuloAba(k)}
          </button>
        ))}
      </div>

      {aba === "lista" && (
        <div className="rnc-lista-wrap">
          {loading && rncs.length === 0 ? (
            <p className="rnc-vazio">Carregando...</p>
          ) : rncs.length === 0 ? (
            <p className="rnc-vazio">
              Nenhum RNC registrado por você nesta coleção. Clique em "Novo
              RNC".
            </p>
          ) : (
            <table className="rnc-tabela">
              <thead>
                <tr>
                  <th>Nº RNC</th>
                  <th>DESCRIÇÃO DA NC</th>
                  <th>ORIGEM</th>
                  <th colSpan={2}>TIPO</th>
                  <th>PRAZO</th>
                  <th>STATUS</th>
                  <th>Ações</th>
                </tr>
                <tr>
                  <th colSpan={3}></th>
                  <th className="rnc-th-casula">AC</th>
                  <th className="rnc-th-casula">AP</th>
                  <th colSpan={3}></th>
                </tr>
              </thead>
              <tbody>
                {rncs.map((r) => {
                  const statusInfo = getStatusInfo(r.status);
                  return (
                    <tr key={r.id}>
                      <td className="rnc-td-forte">{r.numero_rnc || "—"}</td>
                      <td className="rnc-td-desc">{r.descricao || "—"}</td>
                      <td>{r.origens || "—"}</td>
                      <td className="rnc-td-check">
                        {r.acao === "Ação Corretiva" ? "X" : ""}
                      </td>
                      <td className="rnc-td-check">
                        {r.acao === "Ação Preventiva" ? "X" : ""}
                      </td>
                      <td>{formatarData(r.prazo)}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: `${statusInfo.color}20`,
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="rnc-td-acoes">
                        <button
                          className="rnc-icon-btn"
                          title="Editar"
                          onClick={() => editar(r)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="rnc-icon-btn"
                          title="Ver histórico de alterações"
                          onClick={() => verHistorico(r)}
                        >
                          <History size={15} />
                        </button>
                        <button
                          className="rnc-icon-btn rnc-icon-danger"
                          title="Excluir"
                          onClick={() => excluir(r.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {aba === "historico" && (
        <div className="rnc-historico-wrap">
          <div className="rnc-historico-titulo">
            <History size={18} />
            <strong>{historicoRnc?.numeroRnc || "RNC"}</strong>
            <span>— histórico de alterações</span>
          </div>
          <p className="rnc-obs">
            Registro de auditoria: quem alterou, o que mudou e quando.
            <br />
            Criado por <strong>{historicoRnc?.criadoPorNome || "—"}</strong>
            {historicoRnc?.atualizadoPorNome && (
              <>
                {" "}
                · Última alteração por{" "}
                <strong>{historicoRnc.atualizadoPorNome}</strong> em{" "}
                {formatarDataHora(historicoRnc.atualizadoEm)}
              </>
            )}
          </p>

          {historico.length === 0 ? (
            <p className="rnc-vazio">Sem registros de alteração.</p>
          ) : (
            <table className="rnc-tabela rnc-historico-tabela">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Usuário</th>
                  <th>Ação</th>
                  <th>Campo</th>
                  <th>De</th>
                  <th>Para</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((h) => (
                  <tr key={h.id}>
                    <td
                      className="rnc-td-forte"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {formatarDataHora(h.criado_em)}
                    </td>
                    <td>{h.usuario_nome || `#${h.usuario_id}`}</td>
                    <td>
                      {h.acao === "criado" && (
                        <span className="rnc-badge rnc-badge-criado">
                          Criado
                        </span>
                      )}
                      {h.acao === "atualizado" && (
                        <span className="rnc-badge rnc-badge-alt">
                          Alterado
                        </span>
                      )}
                      {h.acao === "excluido" && (
                        <span className="rnc-badge rnc-badge-del">
                          Excluído
                        </span>
                      )}
                    </td>
                    <td>
                      {LABEL_CAMPO[h.campo_alterado] || h.campo_alterado || "—"}
                    </td>
                    <td>{h.valor_anterior || "—"}</td>
                    <td>{h.valor_novo || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {aba === "form" && (
        <form className="rnc-form" onSubmit={salvar}>
          <section className="rnc-section">
            <h3 className="rnc-section-h3">
              IDENTIFICAÇÃO DA NÃO CONFORMIDADE OU DA SAÍDA NÃO CONFORME
            </h3>

            <div className="rnc-grid-2">
              <label className="rnc-field">
                <span>Setor Responsável / Processo</span>
                <input
                  type="text"
                  value={form.setorProcesso}
                  onChange={(e) => setCampo("setorProcesso", e.target.value)}
                />
              </label>
              <label className="rnc-field">
                <span>Nº RNC</span>
                <input
                  type="text"
                  value={form.numeroRnc}
                  disabled
                  placeholder="Gerado automaticamente"
                />
                <small className="rnc-hint">
                  A numeração RNC-AAAA-XXXX é gerada automaticamente ao salvar.
                </small>
              </label>
            </div>

            <div className="rnc-field">
              <span>Origem</span>
              <div className="rnc-opcoes rnc-opcoes-3">
                {ORIGENS.map((o) => (
                  <label key={o} className="rnc-checkbox">
                    <input
                      type="checkbox"
                      checked={form.origens.includes(o)}
                      onChange={() => toggleOrigem(o)}
                    />
                    {o}
                  </label>
                ))}
              </div>
            </div>

            <div className="rnc-field">
              <span>Tipo</span>
              <div className="rnc-opcoes">
                {TIPOS.map((t) => (
                  <label key={t} className="rnc-radio">
                    <input
                      type="radio"
                      name="tipo"
                      checked={form.tipo === t}
                      onChange={() => setCampo("tipo", t)}
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <div className="rnc-field">
              <span>Ação</span>
              <div className="rnc-opcoes">
                {ACOES.map((a) => (
                  <label key={a} className="rnc-radio">
                    <input
                      type="radio"
                      name="acao"
                      checked={form.acao === a}
                      onChange={() => setCampo("acao", a)}
                    />
                    {a}
                  </label>
                ))}
              </div>
              {form.acao === "Outro" && (
                <label className="rnc-field" style={{ marginTop: 8 }}>
                  <span>(*) Especificar</span>
                  <input
                    type="text"
                    value={form.acaoOutro}
                    onChange={(e) => setCampo("acaoOutro", e.target.value)}
                  />
                </label>
              )}
            </div>
          </section>

          <section className="rnc-section">
            <h3 className="rnc-section-h3">
              DESCRIÇÃO DA NÃO CONFORMIDADE OU DA SAÍDA NÃO CONFORME
            </h3>
            <label className="rnc-field">
              <textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setCampo("descricao", e.target.value)}
                placeholder="Descreva a não conformidade ou saída não conforme..."
              />
            </label>

            <div className="rnc-grid-2">
              <label className="rnc-field">
                <span>Preenchido por</span>
                <input
                  type="text"
                  value={form.preenchidoPor}
                  onChange={(e) => setCampo("preenchidoPor", e.target.value)}
                />
              </label>
              <label className="rnc-field">
                <span>Data de abertura</span>
                <input
                  type="date"
                  value={form.dataAbertura}
                  onChange={(e) => setCampo("dataAbertura", e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rnc-section">
            <h3 className="rnc-section-h3">
              AÇÃO CORRETIVA - IMEDIATA (Eliminação do Problema)
            </h3>
            <label className="rnc-field">
              <textarea
                rows={3}
                value={form.acaoCorretivaImediata}
                onChange={(e) =>
                  setCampo("acaoCorretivaImediata", e.target.value)
                }
              />
            </label>
            <div className="rnc-grid-2">
              <label className="rnc-field">
                <span>Executado por</span>
                <input
                  type="text"
                  value={form.executadoPor}
                  onChange={(e) => setCampo("executadoPor", e.target.value)}
                />
              </label>
              <label className="rnc-field">
                <span>Data da execução</span>
                <input
                  type="date"
                  value={form.dataExecucao}
                  onChange={(e) => setCampo("dataExecucao", e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rnc-section">
            <h3 className="rnc-section-h3">
              INVESTIGAÇÃO DAS CAUSAS (Por que)
            </h3>
            <p className="rnc-obs">
              Obs. Para a Investigação da Causa, utilizar o Formulário de
              Análise da Causa Raiz - GSTD: FM-SGQ-005-2026 e registrar neste
              espaço o resultado obtido.
            </p>
            <label className="rnc-field">
              <textarea
                rows={3}
                value={form.investigacaoCausas}
                onChange={(e) => setCampo("investigacaoCausas", e.target.value)}
              />
            </label>
          </section>

          <section className="rnc-section">
            <h3 className="rnc-section-h3">
              TRATAMENTO DA NÃO CONFORMIDADE OU DA SAÍDA NÃO CONFORME - PLANO DE
              AÇÃO
            </h3>
            <p className="rnc-obs">
              Obs. Para o Tratamento da Não Conformidade, utilizar o Formulário
              de Acompanhamento de Registros de Não Conformidade:
              FM-SGQ-007-2026.
            </p>
            <label className="rnc-field">
              <textarea
                rows={3}
                value={form.planoAcao}
                onChange={(e) => setCampo("planoAcao", e.target.value)}
              />
            </label>
          </section>

          <section className="rnc-section">
            <h3 className="rnc-section-h3">
              VERIFICAÇÃO DA EFETIVIDADE - EFICÁCIA DA AÇÃO
            </h3>
            <label className="rnc-field">
              <textarea
                rows={3}
                value={form.verificacaoEficacia}
                onChange={(e) =>
                  setCampo("verificacaoEficacia", e.target.value)
                }
              />
            </label>
            <div className="rnc-grid-2">
              <label className="rnc-field">
                <span>Responsável</span>
                <input
                  type="text"
                  value={form.responsavel}
                  onChange={(e) => setCampo("responsavel", e.target.value)}
                />
              </label>
              <label className="rnc-field">
                <span>Data de encerramento</span>
                <input
                  type="date"
                  value={form.dataEncerramento}
                  onChange={(e) => setCampo("dataEncerramento", e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rnc-section">
            <h3 className="rnc-section-h3">
              DADOS PARA O ACOMPANHAMENTO (FM-SGQ-007-2026)
            </h3>
            <div className="rnc-grid-2">
              <label className="rnc-field">
                <span>Prazo</span>
                <input
                  type="date"
                  value={form.prazo}
                  onChange={(e) => setCampo("prazo", e.target.value)}
                />
              </label>
              <label className="rnc-field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setCampo("status", e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="rnc-field">
              <span>Observação</span>
              <input
                type="text"
                value={form.observacao}
                onChange={(e) => setCampo("observacao", e.target.value)}
              />
            </label>
          </section>

          <div className="rnc-form-actions">
            <button
              type="submit"
              className="rnc-btn rnc-btn-primary"
              disabled={loading}
            >
              <Save size={16} /> {editandoId ? "Atualizar" : "Salvar RNC"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
