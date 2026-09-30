import PrintHeader from "./PrintHeader";
import QrCodePrint from "../qrcode/QrCodePrint";
import { OPERACOES, NOTA_DOCUMENTOS } from "../../data/fichaTemplate";
import { getPainelChecklistItems } from "../../data/painelTemplates";
import { getEtapaLabel, getCargoLabel } from "../../utils/etapas";
import { formatarNomeUsuario } from "../../utils/tempoUtils";

function getHistorico(ficha) {
  if (Array.isArray(ficha?.historicoEtapas)) return ficha.historicoEtapas;
  const dados = ficha?.dados;
  if (
    dados &&
    typeof dados === "object" &&
    Array.isArray(dados.historicoEtapas)
  ) {
    return dados.historicoEtapas;
  }
  return [];
}

function inferirEtapaDaSessao(sessao, logs) {
  if (sessao.etapa) return sessao.etapa;
  const inicioMs = new Date(sessao.inicio).getTime();
  let ultimaEtapa = null;
  (logs || []).forEach((log) => {
    if (!log.etapa) return;
    const t = new Date(log.timestamp).getTime();
    if (t <= inicioMs) {
      if (!ultimaEtapa || t > new Date(ultimaEtapa.timestamp).getTime()) {
        ultimaEtapa = log;
      }
    }
  });
  return ultimaEtapa?.etapa || null;
}

function agruparSessoesPorEtapaComFallback(sessoes, logs) {
  const map = {};
  (sessoes || []).forEach((s) => {
    const etapa = inferirEtapaDaSessao(s, logs);
    if (!etapa) return;
    if (!map[etapa]) map[etapa] = { etapa, usuarios: [] };
    const nome = formatarNomeUsuario(s.usuario || "").trim();
    if (nome && !map[etapa].usuarios.includes(nome)) {
      map[etapa].usuarios.push(nome);
    }
  });
  return Object.values(map);
}

function agruparVerificadoresPorEtapa(logs) {
  const map = {};
  (logs || []).forEach((log) => {
    if (log.campo !== "verificacao") return;
    const etapa = log.etapa;
    if (!etapa) return;
    if (!map[etapa]) map[etapa] = { etapa, usuarios: [] };
    const bruto = log.usuario || log.nome || log.username || "";
    const nome = formatarNomeUsuario(bruto).trim();
    if (nome && !map[etapa].usuarios.includes(nome)) {
      map[etapa].usuarios.push(nome);
    }
  });
  return Object.values(map);
}

function chaveUsuario(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase();
}

function addChavesDoUsuario(set, raw) {
  const bruto = String(raw || "").trim();
  if (!bruto) return;
  set.add(chaveUsuario(bruto));
  const formatado = formatarNomeUsuario(bruto).trim();
  if (formatado) set.add(chaveUsuario(formatado));
}

function getSomenteVerificadoresPorEtapa(logs) {
  const verificadoresPorEtapa = {};
  const trabalhadoresPorEtapa = {};

  (logs || []).forEach((log) => {
    const etapa = log.etapa;
    if (!etapa) return;
    const u = log.usuario || log.nome || log.username;
    if (!u) return;

    if (log.campo === "verificacao") {
      if (!verificadoresPorEtapa[etapa])
        verificadoresPorEtapa[etapa] = new Set();
      addChavesDoUsuario(verificadoresPorEtapa[etapa], u);
    }
    if (log.campo === "resultado") {
      if (!trabalhadoresPorEtapa[etapa])
        trabalhadoresPorEtapa[etapa] = new Set();
      addChavesDoUsuario(trabalhadoresPorEtapa[etapa], u);
    }
  });

  const resultado = {};
  Object.keys(verificadoresPorEtapa).forEach((etapa) => {
    const trabalhadores = trabalhadoresPorEtapa[etapa] || new Set();
    const somente = new Set(
      [...verificadoresPorEtapa[etapa]].filter((u) => !trabalhadores.has(u)),
    );
    if (somente.size > 0) resultado[etapa] = somente;
  });

  return resultado;
}

export default function PrintViewOperacao({
  ficha,
  isBook = false,
  sessoes = [],
  logs = [],
}) {
  const op = OPERACOES[ficha.operacao];
  const isPainel = String(ficha.operacao) === "10" && !!ficha.tipoPainel;

  const templateItems = isPainel
    ? getPainelChecklistItems(ficha.tipoPainel, { incluirVerificacao: false })
    : op?.items || [];

  const totalDataCols = isPainel ? 2 : 17;

  const gruposSessoes = agruparSessoesPorEtapaComFallback(sessoes, logs);

  const operadores = Array.isArray(ficha.operadores) ? ficha.operadores : [];

  const gruposOperadores = (() => {
    const map = {};
    operadores.forEach((op) => {
      const cargo = op.role || "equipe";
      if (!map[cargo]) map[cargo] = { cargo, usuarios: [] };
      const nome = (op.nome || op.username || "").trim();
      if (nome && !map[cargo].usuarios.includes(nome)) {
        map[cargo].usuarios.push(nome);
      }
    });
    return Object.values(map);
  })();

  const gruposVerificadores = agruparVerificadoresPorEtapa(logs);
  const somenteVerificadoresPorEtapa = getSomenteVerificadoresPorEtapa(logs);

  const grupos = (gruposSessoes.length > 0 ? gruposSessoes : gruposOperadores)
    .map((g) => {
      const somenteDaEtapa = g.etapa
        ? somenteVerificadoresPorEtapa[g.etapa]
        : null;

      return {
        ...g,
        usuarios: g.usuarios.filter((u) => {
          if (!somenteDaEtapa) return true;
          const crua = chaveUsuario(u);
          const formatada = chaveUsuario(formatarNomeUsuario(u));
          return !somenteDaEtapa.has(crua) && !somenteDaEtapa.has(formatada);
        }),
      };
    })
    .filter((g) => g.usuarios.length > 0);

  console.log(
    "[PrintView] somenteVerificadoresPorEtapa:",
    somenteVerificadoresPorEtapa,
  );
  console.log("[PrintView] grupos finais:", grupos);

  return (
    <div className={`print-view-root ${isBook ? "book-mode" : "print-only"}`}>
      <PrintHeader ficha={ficha} />

      <div className="print-section-title">DADOS DO EQUIPAMENTO</div>
      <table className="print-info-table">
        <tbody>
          <tr>
            <td colSpan="2">
              <strong>Nome do Equipamento:</strong> {ficha.nomeEquipamento}
            </td>
            <td colSpan="2">
              <strong>Nº do Ind.:</strong> {ficha.numeroInd}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Obra:</strong> {ficha.obra}
            </td>
            <td>
              <strong>TAG:</strong> {ficha.tag}
            </td>
            <td colSpan="2">
              <strong>Cliente:</strong> {ficha.cliente}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="print-section-title">PLANEJAMENTO</div>
      <table className="print-info-table">
        <tbody>
          <tr>
            <td colSpan="2">
              <strong>Operação:</strong> {op?.label || "Operação não definida"}
            </td>
            <td colSpan="2">
              <strong>Equipe:</strong> {op?.equipe || "—"}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Data Início:</strong> {ficha.dataInicio}
            </td>
            <td>
              <strong>Data Término:</strong> {ficha.dataTermino}
            </td>
            <td>
              <strong>Tempo Previsto:</strong> {ficha.tempoPrevisto}
            </td>
            <td>
              <strong>Recurso:</strong> {ficha.recurso}
            </td>
          </tr>
        </tbody>
      </table>

      {grupos.length > 0 && (
        <div className="print-final-block">
          <div className="print-section-title">COLABORADORES:</div>
          <table className="print-info-table">
            <tbody>
              {grupos.map((g, i) => (
                <tr key={i}>
                  <td>
                    <strong>
                      {g.etapa
                        ? getEtapaLabel(g.etapa)
                        : getCargoLabel(g.cargo) || g.cargo || "Equipe"}
                    </strong>
                  </td>
                  <td>{g.usuarios.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isPainel && gruposVerificadores.length > 0 && (
        <div className="print-final-block">
          <div className="print-section-title">VERIFICAÇÃO:</div>
          <table className="print-info-table">
            <tbody>
              {gruposVerificadores.map((g, i) => (
                <tr key={i}>
                  <td>
                    <strong>{getEtapaLabel(g.etapa)}</strong>
                  </td>
                  <td>{g.usuarios.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isPainel && (
        <div className="print-checklist-group-label">
          SESSÕES DE TRABALHO (1ª a 15ª)
        </div>
      )}
      <div className="print-checklist-container">
        <table
          className={`print-checklist-table ${isPainel ? "no-sessions" : ""}`}
        >
          <colgroup>
            <col className="col-it" />
            <col className="col-desc" />
            {!isPainel &&
              [...Array(15)].map((_, i) => (
                <col key={i} className="col-sessions" />
              ))}
            <col className="col-result" />
            <col className="col-result" />
          </colgroup>

          <thead>
            <tr className="main-header">
              <th className="col-it">IT</th>
              <th className="col-desc">DESCRIÇÃO</th>

              {!isPainel &&
                [...Array(15)].map((_, i) => (
                  <th key={i} className="mark-cell">
                    {i + 1}º
                  </th>
                ))}

              <th className="res-cell">OK</th>
              <th className="res-cell">NA</th>
            </tr>
          </thead>

          <tbody>
            {(() => {
              let categoriaAtual = null;
              const rows = [];

              templateItems.forEach((item) => {
                const isFirstOfSection = item.categoria !== categoriaAtual;

                if (isFirstOfSection) {
                  categoriaAtual = item.categoria;
                  const isBarramento = /barramento/i.test(categoriaAtual);

                  rows.push(
                    <tr
                      key={`title-${categoriaAtual}`}
                      className="section-title-row"
                      data-section={isBarramento ? "barramento" : undefined}
                    >
                      <td colSpan={totalDataCols + 2}>{item.categoria}</td>
                    </tr>,
                  );
                }

                const fichaItem = (ficha.items || []).find(
                  (fi) => fi.id === item.id,
                ) || {
                  sessionMarks: [],
                  resultado: "",
                };

                const marks = isPainel
                  ? []
                  : Array(15)
                      .fill("")
                      .map((_, i) => (fichaItem.sessionMarks || [])[i] || "");

                rows.push(
                  <tr
                    key={item.id}
                    className={isFirstOfSection ? "section-first-item-row" : ""}
                  >
                    <td className="text-center">{item.numero}</td>

                    <td className="item-desc">{item.descricao}</td>

                    {!isPainel &&
                      marks.map((mark, i) => (
                        <td key={i} className="text-center mark-cell">
                          {mark === "feito" ? "✓" : mark === "na" ? "—" : ""}
                        </td>
                      ))}

                    <td className="text-center res-mark">
                      {fichaItem.resultado === "ok" ? "X" : ""}
                    </td>
                    <td className="text-center res-mark">
                      {fichaItem.resultado === "na" ? "X" : ""}
                    </td>
                  </tr>,
                );
              });

              return rows;
            })()}

            <tr className="goal-row">
              <td colSpan="2">
                <strong>Objetivo:</strong> {op?.objetivo}
              </td>
              <td colSpan={totalDataCols}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="print-final-block">
        <div className="print-section-title">OBSERVAÇÕES</div>
        <div className="print-notes">
          {ficha.observacoes || "Nenhuma observação registrada."}
        </div>

        <div className="print-docs-note">
          <strong>Nota:</strong> {NOTA_DOCUMENTOS}
        </div>

        {ficha.alteracoesFeitas && (
          <div style={{ marginTop: "10px" }}>
            <div className="print-section-title">
              ALTERAÇÕES FEITAS APÓS FINALIZAÇÃO
            </div>
            <div className="print-notes">{ficha.alteracoesFeitas}</div>
          </div>
        )}

        <table
          className="print-signatures-table"
          style={{
            width: "100%",
            marginTop: "10px",
            tableLayout: "fixed",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              <td
                className="sig-box"
                style={{ width: "50%", padding: "5px", overflow: "hidden" }}
              >
                <div className="sig-line">
                  {ficha.assinaturas.supervisor.dataUrl ? (
                    <img
                      src={ficha.assinaturas.supervisor.dataUrl}
                      alt="Assinatura"
                    />
                  ) : (
                    <div style={{ height: "35px" }}></div>
                  )}
                </div>
                <div className="sig-label">Supervisor de Produção</div>
                <div className="sig-name">
                  {ficha.assinaturas.supervisor.nome || "____________________"}
                </div>
                <div className="sig-date">
                  Data: {ficha.assinaturas.supervisor.data || "__/__/____"}
                </div>
              </td>

              <td
                className="sig-box"
                style={{ width: "50%", padding: "5px", overflow: "hidden" }}
              >
                <div className="sig-line">
                  {ficha.assinaturas.qualidade.dataUrl ? (
                    <img
                      src={ficha.assinaturas.qualidade.dataUrl}
                      alt="Assinatura"
                    />
                  ) : (
                    <div style={{ height: "35px" }}></div>
                  )}
                </div>
                <div className="sig-label">Responsável pela Qualidade</div>
                <div className="sig-name">
                  {ficha.assinaturas.qualidade.nome || "____________________"}
                </div>
                <div className="sig-date">
                  Data: {ficha.assinaturas.qualidade.data || "__/__/____"}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "20px",
        }}
      >
        <QrCodePrint ficha={ficha} size={150} />
      </div>
    </div>
  );
}
