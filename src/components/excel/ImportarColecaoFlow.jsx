import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Upload,
  FileText,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Check,
  AlertCircle,
  FolderOpen,
  FolderPlus,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { PAINEL_LABELS } from "../../data/painelTemplates";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const DOCUMENTOS = [
  { id: "proposta", label: "Proposta Técnica", obrigatorio: true },
  { id: "listaMaterial", label: "Lista de Material", obrigatorio: true },
  {
    id: "docCliente",
    label: "Projetos e Documentos do Cliente",
    obrigatorio: true,
  },
  { id: "orcamentos", label: "Orçamentos de Fornecedores", obrigatorio: true },
];

const PASSOS = [
  { n: 1, titulo: "Documentos" },
  { n: 2, titulo: "Dados dos Painéis" },
  { n: 3, titulo: "Revisão" },
];

function linhaVazia() {
  return {
    nomeEquipamento: "",
    obra: "",
    tag: "",
    dataInicio: "",
    dataTermino: "",
    tempoPrevisto: "",
    recurso: "",
    tipoPainel: "",
    revisao: "01",
    sufixo: "",
  };
}

function parseNomePasta(nome) {
  if (!nome) return { ind: "", cliente: "", observacao: "" };

  const indMatch = String(nome).match(/IND\s*(\d+)/i);
  const ind = indMatch ? indMatch[1] : "";

  let restante = String(nome)
    .replace(/IND\s*\d+/i, "")
    .replace(/^[\s\-–—]+/, "")
    .trim();

  const partes = restante.split(/\s*[-–—]\s*/);
  const cliente = (partes[0] || "").trim();
  const observacao = partes.slice(1).join(" - ").trim();

  return { ind, cliente, observacao };
}

export default function ImportarColecaoFlow({ show, onClose, onImportado }) {
  const { authFetch } = useAuth();
  const [passo, setPasso] = useState(1);
  const [arquivos, setArquivos] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const [cliente, setCliente] = useState("");
  const [descricao, setDescricao] = useState("");
  const [linhas, setLinhas] = useState([linhaVazia()]);

  const [usarPastaExistente, setUsarPastaExistente] = useState(false);
  const [pastas, setPastas] = useState([]);
  const [pastaSelecionada, setPastaSelecionada] = useState(null);
  const [carregandoPastas, setCarregandoPastas] = useState(false);

  const fileInputs = useRef({});

  useEffect(() => {
    if (!show) {
      setPasso(1);
      setArquivos({});
      setCliente("");
      setDescricao("");
      setLinhas([linhaVazia()]);
      setErro(null);
      setUsarPastaExistente(false);
      setPastas([]);
      setPastaSelecionada(null);
      setCarregandoPastas(false);
    }
  }, [show]);
  const mostrarSufixo = usarPastaExistente && !!pastaSelecionada;

  if (!show) return null;

  function handleArquivo(id, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivos((prev) => ({ ...prev, [id]: file }));
    setErro(null);
  }

  function removerArquivo(id) {
    setArquivos((prev) => {
      const novo = { ...prev };
      delete novo[id];
      return novo;
    });
    if (fileInputs.current[id]) fileInputs.current[id].value = "";
  }

  async function carregarPastas() {
    setCarregandoPastas(true);
    setErro(null);
    try {
      const res = await authFetch(`${API_URL}/sharepoint/pastas`);
      if (!res || !res.ok) throw new Error("Erro ao carregar pastas");
      const data = await res.json();
      setPastas(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err.message || "Erro ao carregar pastas");
    } finally {
      setCarregandoPastas(false);
    }
  }

  function escolherPasta(pasta) {
    const nome = pasta.nome || pasta;
    const { ind, cliente: cli, observacao } = parseNomePasta(nome);
    setPastaSelecionada({ nome, ind });
    setCliente(cli);
    setDescricao(observacao);
    setErro(null);
  }

  function avancar() {
    if (!usarPastaExistente) {
      const faltando = DOCUMENTOS.filter(
        (d) => d.obrigatorio && !arquivos[d.id],
      );
      if (faltando.length > 0) {
        setErro(
          `Arquivos obrigatórios faltando:\n• ${faltando
            .map((f) => f.label)
            .join("\n• ")}`,
        );
        return;
      }
    }

    if (usarPastaExistente && !pastaSelecionada) {
      setErro("Selecione uma pasta existente para continuar.");
      return;
    }

    setErro(null);
    setPasso(2);
  }

  function atualizarLinha(index, campo, valor) {
    setLinhas((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [campo]: valor } : l)),
    );
  }

  function adicionarLinha() {
    setLinhas((prev) => [...prev, linhaVazia()]);
  }

  function removerLinha(index) {
    setLinhas((prev) => prev.filter((_, i) => i !== index));
  }

  function linhasPreenchidas() {
    return linhas.filter(
      (l) =>
        l.nomeEquipamento.trim() ||
        l.obra.trim() ||
        l.tag.trim() ||
        l.tipoPainel,
    );
  }

  function avancarRevisao() {
    if (!cliente.trim()) {
      setErro("O campo Cliente é obrigatório.");
      return;
    }
    const preenchidas = linhasPreenchidas();
    if (preenchidas.length === 0) {
      setErro("Adicione pelo menos uma linha de equipamento.");
      return;
    }
    for (let i = 0; i < preenchidas.length; i++) {
      const l = preenchidas[i];
      if (!l.nomeEquipamento.trim()) {
        setErro(`Linha ${i + 1}: Nome do Equipamento é obrigatório.`);
        return;
      }
      if (!l.tipoPainel) {
        setErro(`Linha ${i + 1}: Tipo de Painel é obrigatório.`);
        return;
      }
    }

    if (mostrarSufixo) {
      const sufixos = preenchidas.map((l) => l.sufixo).filter((s) => s !== "");
      const temDuplicado = sufixos.some((s, i) => sufixos.indexOf(s) !== i);
      if (temDuplicado) {
        setErro("Existem fichas com o mesmo número. Ajuste os números.");
        return;
      }
    }

    setErro(null);
    setPasso(3);
  }

  async function handleEnviar() {
    setCarregando(true);
    setErro(null);
    try {
      let rascunho;

      if (usarPastaExistente && pastaSelecionada) {
        const res = await authFetch(`${API_URL}/colecoes/importar-documentos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pastaExistente: pastaSelecionada.nome,
          }),
        });
        if (!res?.ok) throw new Error("Falha ao salvar rascunho");
        rascunho = await res.json();
      } else {
        const form = new FormData();
        Object.entries(arquivos).forEach(([k, v]) => form.append(k, v));
        const res = await authFetch(`${API_URL}/colecoes/importar-documentos`, {
          method: "POST",
          body: form,
        });
        if (!res?.ok) throw new Error("Falha ao salvar documentos");
        rascunho = await res.json();
      }

      const preenchidas = linhasPreenchidas();
      const resFinal = await authFetch(
        `${API_URL}/colecoes/${rascunho.colecao.id}/completar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cliente: cliente.trim(),
            descricao: descricao.trim(),
            linhas: preenchidas.map((l) => ({
              nomeEquipamento: l.nomeEquipamento,
              obra: l.obra,
              tag: l.tag,
              dataInicio: l.dataInicio,
              dataTermino: l.dataTermino,
              tempoPrevisto: l.tempoPrevisto,
              recurso: l.recurso,
              tipoPainel: l.tipoPainel,
              revisao: l.revisao || "01",
              sufixoFicha:
                mostrarSufixo && l.sufixo ? Number(l.sufixo) : undefined,
            })),
          }),
        },
      );
      if (!resFinal?.ok) throw new Error("Falha ao completar coleção");
      const resultado = await resFinal.json();

      onImportado?.(resultado);
      onClose?.();
    } catch (err) {
      setErro(err.message || "Erro ao enviar");
    } finally {
      setCarregando(false);
    }
  }

  return createPortal(
    <div className="importar-colecao-overlay" onClick={onClose}>
      <div
        className="importar-colecao-modal completar-manual-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="importar-colecao-header">
          <div>
            <h3>Importar Coleção</h3>
            <p>Envie os documentos e preencha os painéis</p>
          </div>
          <button className="new-ficha-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="iflow-progress">
          {PASSOS.map((p) => (
            <div
              key={p.n}
              className={`iflow-progress-step ${
                p.n === passo ? "active" : ""
              } ${p.n < passo ? "done" : ""}`}
            >
              <div className="iflow-progress-dot">
                {p.n < passo ? <Check size={14} /> : p.n}
              </div>
              <span>{p.titulo}</span>
            </div>
          ))}
        </div>

        <div className="importar-colecao-body completar-manual-body">
          {erro && (
            <div className="iflow-erro">
              <AlertCircle size={16} />
              <span style={{ whiteSpace: "pre-line" }}>{erro}</span>
            </div>
          )}

          {passo === 1 && (
            <>
              {!usarPastaExistente && (
                <>
                  <div className="iflow-docs">
                    {DOCUMENTOS.map((d) => (
                      <div key={d.id} className="iflow-doc-row">
                        <div className="iflow-doc-info">
                          <FileText size={16} />
                          <span>
                            {d.label}
                            {d.obrigatorio && (
                              <span className="importar-obrigatorio"> *</span>
                            )}
                          </span>
                        </div>
                        {arquivos[d.id] ? (
                          <div className="importar-campo-arquivo">
                            <FileText size={16} />
                            <span className="importar-campo-nome">
                              {arquivos[d.id].name}
                            </span>
                            <button
                              type="button"
                              className="importar-campo-remover"
                              onClick={() => removerArquivo(d.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="importar-campo-selecionar"
                            onClick={() => fileInputs.current[d.id]?.click()}
                          >
                            <Upload size={16} />
                            Selecionar arquivo
                          </button>
                        )}
                        <input
                          ref={(el) => (fileInputs.current[d.id] = el)}
                          type="file"
                          accept=".pdf,.xls,.xlsx"
                          style={{ display: "none" }}
                          onChange={(e) => handleArquivo(d.id, e)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="importar-divider" />
                </>
              )}

              <div className="importar-destino">
                <div className="importar-destino-label">
                  Para onde vão os arquivos?
                </div>

                <div className="importar-destino-botoes">
                  <button
                    type="button"
                    className={!usarPastaExistente ? "ativo" : ""}
                    onClick={() => {
                      setUsarPastaExistente(false);
                      setPastaSelecionada(null);
                      setCliente("");
                      setDescricao("");
                    }}
                  >
                    <FolderPlus size={15} />
                    Criar pasta nova
                  </button>

                  <button
                    type="button"
                    className={usarPastaExistente ? "ativo" : ""}
                    onClick={() => {
                      setUsarPastaExistente(true);
                      carregarPastas();
                    }}
                  >
                    <FolderOpen size={15} />
                    Escolher pasta existente
                  </button>
                </div>

                {usarPastaExistente && (
                  <div className="importar-destino-pasta">
                    {pastaSelecionada ? (
                      <div className="importar-pasta-escolhida">
                        <span
                          className="importar-pasta-nome"
                          title={pastaSelecionada.nome}
                        >
                          📁 {pastaSelecionada.nome}
                        </span>
                        <span className="importar-pasta-ind">
                          IND {pastaSelecionada.ind}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            setPastaSelecionada(null);
                            setCliente("");
                            setDescricao("");
                          }}
                        >
                          Trocar
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="importar-campo-selecionar"
                          onClick={carregarPastas}
                          disabled={carregandoPastas}
                        >
                          {carregandoPastas ? (
                            <Loader2 size={16} className="spin" />
                          ) : (
                            <FolderOpen size={16} />
                          )}
                          {carregandoPastas
                            ? "Carregando..."
                            : "Atualizar lista"}
                        </button>

                        {pastas.length > 0 ? (
                          <div className="seletor-pasta-lista">
                            {pastas.map((p) => {
                              const nome = p.nome || p;
                              return (
                                <button
                                  key={p.id || nome}
                                  type="button"
                                  className="seletor-pasta-item"
                                  onClick={() => escolherPasta(p)}
                                >
                                  <span>📁 {nome}</span>
                                  <span className="seletor-pasta-ind">
                                    IND {parseNomePasta(nome).ind}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          !carregandoPastas && (
                            <p className="importar-pasta-vazio">
                              Nenhuma pasta encontrada na PPC.
                            </p>
                          )
                        )}
                      </>
                    )}

                    {pastaSelecionada && (
                      <p className="importar-campo-hint">
                        Os documentos já estão na pasta existente — não é
                        preciso enviar novamente.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {passo === 2 && (
            <>
              <div className="completar-manual-campos">
                <div className="completar-manual-row">
                  <div className="completar-manual-campo">
                    <label>
                      Cliente <span className="importar-obrigatorio">*</span>
                    </label>
                    <input
                      type="text"
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      placeholder="Nome do cliente"
                    />
                    {usarPastaExistente && (
                      <small className="importar-campo-hint">
                        Preenchido a partir da pasta selecionada
                      </small>
                    )}
                  </div>
                  <div className="completar-manual-campo">
                    <label>Descrição / Observação</label>
                    <input
                      type="text"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descrição da proposta"
                    />
                  </div>
                </div>
              </div>

              <div className="importar-divider" />

              <div className="completar-manual-tabela-section">
                <div className="completar-manual-tabela-header">
                  <h4>Equipamentos / Painéis</h4>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={adicionarLinha}
                  >
                    <Plus size={14} /> Adicionar linha
                  </button>
                </div>

                <div className="completar-manual-tabela-wrap">
                  <table className="completar-manual-tabela">
                    <thead>
                      <tr>
                        {mostrarSufixo && (
                          <th style={{ width: "7%" }}>Nº Ficha</th>
                        )}
                        <th style={{ width: mostrarSufixo ? "17%" : "22%" }}>
                          Nome Equipamento *
                        </th>
                        <th style={{ width: "12%" }}>Obra</th>
                        <th style={{ width: "8%" }}>Tag</th>
                        <th style={{ width: "12%" }}>Tipo Painel *</th>
                        <th style={{ width: "11%" }}>Data Início</th>
                        <th style={{ width: "11%" }}>Data Término</th>
                        <th style={{ width: "9%" }}>Tempo Prev.</th>
                        <th style={{ width: mostrarSufixo ? "9%" : "10%" }}>
                          Recurso
                        </th>
                        <th style={{ width: mostrarSufixo ? "4%" : "5%" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((linha, i) => (
                        <tr key={i}>
                          {mostrarSufixo && (
                            <td>
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={3}
                                placeholder="Auto"
                                value={linha.sufixo}
                                onChange={(e) =>
                                  atualizarLinha(
                                    i,
                                    "sufixo",
                                    e.target.value.replace(/\D/g, ""),
                                  )
                                }
                                title="Deixe vazio para gerar automaticamente"
                              />
                            </td>
                          )}
                          <td>
                            <input
                              type="text"
                              value={linha.nomeEquipamento}
                              onChange={(e) =>
                                atualizarLinha(
                                  i,
                                  "nomeEquipamento",
                                  e.target.value,
                                )
                              }
                              placeholder="Equipamento"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={linha.obra}
                              onChange={(e) =>
                                atualizarLinha(i, "obra", e.target.value)
                              }
                              placeholder="Obra"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={linha.tag}
                              onChange={(e) =>
                                atualizarLinha(i, "tag", e.target.value)
                              }
                              placeholder="Tag"
                            />
                          </td>
                          <td>
                            <select
                              value={linha.tipoPainel}
                              onChange={(e) =>
                                atualizarLinha(i, "tipoPainel", e.target.value)
                              }
                            >
                              <option value="">Selecione...</option>
                              {Object.entries(PAINEL_LABELS).map(
                                ([valor, label]) => (
                                  <option key={valor} value={valor}>
                                    {label}
                                  </option>
                                ),
                              )}
                            </select>
                          </td>
                          <td>
                            <input
                              type="date"
                              value={linha.dataInicio}
                              onChange={(e) =>
                                atualizarLinha(i, "dataInicio", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              value={linha.dataTermino}
                              onChange={(e) =>
                                atualizarLinha(i, "dataTermino", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={linha.tempoPrevisto}
                              onChange={(e) =>
                                atualizarLinha(
                                  i,
                                  "tempoPrevisto",
                                  e.target.value,
                                )
                              }
                              placeholder="Ex: 8h"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={linha.recurso}
                              onChange={(e) =>
                                atualizarLinha(i, "recurso", e.target.value)
                              }
                              placeholder="Recurso"
                            />
                          </td>
                          <td>
                            {linhas.length > 1 && (
                              <button
                                type="button"
                                className="completar-manual-remover"
                                onClick={() => removerLinha(i)}
                                title="Remover linha"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {mostrarSufixo && (
                  <p className="importar-campo-hint">
                    Deixe "Nº Ficha" vazio para o sistema gerar automaticamente.
                  </p>
                )}

                {linhasPreenchidas().length > 0 && (
                  <p className="completar-manual-contagem">
                    {linhasPreenchidas().length}{" "}
                    {linhasPreenchidas().length === 1
                      ? "equipamento preenchido"
                      : "equipamentos preenchidos"}
                  </p>
                )}
              </div>
            </>
          )}

          {passo === 3 && (
            <div className="iflow-revisao">
              <div className="iflow-revisao-dados">
                <div>
                  <strong>Cliente:</strong> {cliente}
                </div>
                {descricao && (
                  <div>
                    <strong>Descrição:</strong> {descricao}
                  </div>
                )}
                {usarPastaExistente && pastaSelecionada && (
                  <>
                    <div>
                      <strong>Pasta existente:</strong> {pastaSelecionada.nome}
                    </div>
                    <div>
                      <strong>IND:</strong> {pastaSelecionada.ind}
                    </div>
                  </>
                )}
                {!usarPastaExistente && (
                  <div>
                    <strong>Documentos:</strong> {Object.keys(arquivos).length}{" "}
                    enviado(s)
                  </div>
                )}
                <div>
                  <strong>Equipamentos:</strong> {linhasPreenchidas().length}
                </div>
              </div>

              <div className="completar-manual-tabela-wrap">
                <table className="completar-manual-tabela">
                  <thead>
                    <tr>
                      {mostrarSufixo && <th>Nº Ficha</th>}
                      <th>Equipamento</th>
                      <th>Obra</th>
                      <th>Tag</th>
                      <th>Tipo</th>
                      <th>Início</th>
                      <th>Término</th>
                    </tr>
                  </thead>

                  <tbody>
                    {linhasPreenchidas().map((l, i) => (
                      <tr key={i}>
                        {mostrarSufixo && <td>{l.sufixo || "Auto"}</td>}
                        <td>{l.nomeEquipamento}</td>
                        <td>{l.obra}</td>
                        <td>{l.tag}</td>
                        <td>{PAINEL_LABELS[l.tipoPainel] || l.tipoPainel}</td>
                        <td>{l.dataInicio}</td>
                        <td>{l.dataTermino}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="importar-colecao-footer">
          {passo === 1 ? (
            <button
              className="btn btn-ghost"
              onClick={onClose}
              disabled={carregando}
            >
              Cancelar
            </button>
          ) : (
            <button
              className="btn btn-ghost"
              onClick={() => setPasso(passo - 1)}
              disabled={carregando}
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          )}

          {passo < 3 ? (
            <button
              className="btn btn-primary"
              onClick={passo === 1 ? avancar : avancarRevisao}
            >
              Próximo <ArrowRight size={16} />
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleEnviar}
              disabled={carregando}
            >
              {carregando ? "Enviando..." : "Concluir Importação"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
