import { OPERACOES, INSTRUMENTOS_TAF } from "../../data/fichaTemplate";

export default function PrintViewTAF({ ficha, op, isBook = false }) {
  const { tafData } = ficha;

  return (
    <div
      className={
        isBook
          ? "print-view-root taf-pdf"
          : "print-view-root print-only taf-pdf"
      }
    >
      <div className="taf-pdf-header">
        <div className="taf-pdf-logo">
          <div className="brand">
            IndusPower <br />
            <span>Powering Solutions</span>
          </div>
        </div>
        <div className="taf-pdf-title">
          <h1>FORMULÁRIO</h1>
        </div>
        <div className="taf-pdf-id">
          ( ID: <span>{String(ficha.id ?? "").slice(0, 8).toUpperCase()}</span> )
        </div>
      </div>

      <table className="taf-pdf-table compact no-border">
        <tbody>
          <tr>
            <td className="w-50 border">
              <div className="flex items-center gap-2">
                <div
                  className={`check-box ${tafData.testExecutedWithClient ? "checked" : ""}`}
                ></div>
                TESTE EXECUTADO COM O CLIENTE
              </div>
            </td>
            <td className="w-50 border">
              <div className="flex items-center gap-2">
                <div
                  className={`check-box ${tafData.testExecutedWithoutClient ? "checked" : ""}`}
                ></div>
                TESTE EXECUTADO SEM O CLIENTE
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table
        className="taf-pdf-table"
        style={{ tableLayout: "fixed", width: "100%" }}
      >
        <tbody>
          <tr>
            <td colSpan="2" className="w-66">
              <strong>Nome do quadro/painel:</strong>{" "}
              {ficha.nomeEquipamento || "____________________"}
            </td>
            <td colSpan="1" className="w-33">
              <strong>Identificador:</strong>{" "}
              {tafData.identificador || "____________________"}
            </td>
          </tr>
          <tr>
            <td className="w-33">
              <strong>IND:</strong> {ficha.numeroInd || "____________________"}
            </td>
            <td className="w-33">
              <strong>TAG:</strong> {ficha.tag || "____________________"}
            </td>
            <td className="w-33">
              <strong>Tensão:</strong>{" "}
              {tafData.tensao || "____________________"}
            </td>
          </tr>
          <tr>
            <td className="w-33">
              <strong>Obra:</strong> {ficha.obra || "____________________"}
            </td>
            <td className="w-33">
              <strong>Cubículo:</strong>{" "}
              {tafData.cubiculo || "____________________"}
            </td>
            <td className="w-33">
              <strong>Cliente:</strong>{" "}
              {ficha.cliente || "____________________"}
            </td>
          </tr>
          <tr>
            <td colSpan="2" className="w-66">
              <strong>Testadores:</strong>{" "}
              {tafData.testadores || "____________________"}
            </td>
            <td colSpan="1" className="w-33">
              <strong>Data do teste:</strong>{" "}
              {tafData.dataTeste || "__/__/____"}
            </td>
          </tr>
          <tr>
            <td className="w-33">
              <strong>Prazo de entrega:</strong>{" "}
              {tafData.dataTeste || "__/__/____"}
            </td>
            <td className="w-33">
              <strong>Quem fez a proposta:</strong>{" "}
              {tafData.quemFezProposta || "____________________"}
            </td>
            <td className="w-33">
              <strong>Data de fechamento:</strong>{" "}
              {tafData.dataTermino || "__/__/____"}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="taf-pdf-section-header">
        EQUIPAMENTOS UTILIZADOS NOS ENSAIOS
      </div>
      <table className="taf-pdf-table">
        <tbody>
          {(() => {
            const selecionados = (tafData.instrumentosSelecionados || [])
              .map((id) => INSTRUMENTOS_TAF.find((i) => i.id === id))
              .filter(Boolean);

            const rows = [];
            for (let i = 0; i < selecionados.length; i += 2) {
              rows.push(selecionados.slice(i, i + 2));
            }

            if (rows.length === 0) {
              return (
                <tr>
                  <td
                    colSpan="2"
                    className="opacity-50"
                    style={{ textAlign: "center" }}
                  >
                    Nenhum equipamento selecionado.
                  </td>
                </tr>
              );
            }

            return rows.map((row, idx) => (
              <tr key={idx}>
                <td className="w-50">
                  {row[0] ? `${row[0].nome} (Série: ${row[0].serie})` : ""}
                </td>
                <td className="w-50">
                  {row[1] ? `${row[1].nome} (Série: ${row[1].serie})` : ""}
                </td>
              </tr>
            ));
          })()}
        </tbody>
      </table>

      <div className="taf-pdf-section-header flex justify-between items-center">
        <span>TESTE DE ISOLAÇÃO MEGGER - CIRCUITO PRINCIPAL</span>
        <div className="flex gap-4 font-normal text-[10px] items-center">
          <div className="flex items-center gap-1">
            <div
              className={`check-box ${!tafData.isNotApplicable ? "checked" : ""}`}
            ></div>{" "}
            APLICÁVEL
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`check-box ${tafData.isNotApplicable ? "checked" : ""}`}
            ></div>{" "}
            NÃO APLICÁVEL
          </div>
        </div>
      </div>
      <div className="taf-pdf-megger-grid">
        <div className="megger-rows">
          <div className="megger-cell">
            FASE R x S: <span>{tafData.megger?.rs}</span>
          </div>
          <div className="megger-cell">
            FASE S x T: <span>{tafData.megger?.st}</span>
          </div>
          <div className="megger-cell">
            FASE R x T: <span>{tafData.megger?.rt}</span>
          </div>
          <div className="megger-cell">
            FASE R x N: <span>{tafData.megger?.rn}</span>
          </div>
          <div className="megger-cell">
            FASE S x N: <span>{tafData.megger?.sn}</span>
          </div>
          <div className="megger-cell">
            FASE T x N: <span>{tafData.megger?.tn}</span>
          </div>
          <div className="megger-cell">
            FASE R x GND: <span>{tafData.megger?.rgnd}</span>
          </div>
          <div className="megger-cell">
            FASE S x GND: <span>{tafData.megger?.sgnd}</span>
          </div>
          <div className="megger-cell">
            FASE T x GND: <span>{tafData.megger?.tgnd}</span>
          </div>
          <div className="megger-cell">
            N x GND: <span>{tafData.megger?.ngnd}</span>
          </div>
          <div className="megger-cell full">
            TENSÃO APLICADA: <span>{tafData.megger?.tensaoAplicada}</span>
          </div>
        </div>
      </div>

      <div className="taf-pdf-section-header flex justify-between items-center">
        <span>TESTE DE HI-POT - CIRCUITO PRINCIPAL</span>
        <div className="flex gap-4 font-normal text-[10px] items-center">
          <div className="flex items-center gap-1">
            <div
              className={`check-box ${!tafData.hiPotNotApplicable ? "checked" : ""}`}
            ></div>{" "}
            APLICÁVEL
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`check-box ${tafData.hiPotNotApplicable ? "checked" : ""}`}
            ></div>{" "}
            NÃO APLICÁVEL
          </div>
        </div>
      </div>
      <table className="taf-pdf-table">
        <tbody>
          <tr>
            <td>
              TENSÃO APLICADA: <strong>{tafData.hiPot?.tensaoAplicada}</strong>
            </td>
            <td>
              CORRENTE DE FUGA R: <strong>{tafData.hiPot?.leakageR}</strong>
            </td>
          </tr>
          <tr>
            <td>
              CORRENTE DE FUGA S: <strong>{tafData.hiPot?.leakageS}</strong>
            </td>
            <td>
              CORRENTE DE FUGA T: <strong>{tafData.hiPot?.leakageT}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="taf-pdf-section-header flex justify-between items-center">
        <span>TESTES FUNCIONAIS E VISUAIS</span>
        <div className="flex gap-4 font-normal text-[10px] items-center">
          <div className="flex items-center gap-1">
            <div
              className={`check-box ${!tafData.functionalNotApplicable ? "checked" : ""}`}
            ></div>{" "}
            APLICÁVEL
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`check-box ${tafData.functionalNotApplicable ? "checked" : ""}`}
            ></div>{" "}
            NÃO APLICÁVEL
          </div>
        </div>
      </div>
      <table className="taf-pdf-checklist">
        <thead>
          <tr>
            <th className="text-left p-left">ÍTEM DE INSPEÇÃO</th>
            <th className="w-10">NC</th>
            <th className="w-10">C</th>
          </tr>
        </thead>
        <tbody>
          {(op?.items || []).map((item, idx) => {
            const res = ficha.items?.[idx]?.resultado;
            return (
              <tr key={item.id}>
                <td className="p-left">&gt;&gt; {item.descricao}</td>
                <td className="text-center">{res === "na" ? "X" : ""}</td>
                <td className="text-center">{res === "ok" ? "X" : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="taf-pdf-section-header">OBSERVAÇÕES FINAIS</div>
      <div className="taf-pdf-notes">
        {ficha.observacoes || "Sem observações."}
      </div>

      {ficha.alteracoesFeitas && (
        <div style={{ marginTop: "10px" }}>
          <div className="taf-pdf-section-header">
            ALTERAÇÕES FEITAS APÓS FINALIZAÇÃO
          </div>
          <div className="taf-pdf-notes">{ficha.alteracoesFeitas}</div>
        </div>
      )}

      <table
        className="taf-pdf-signatures-table"
        style={{
          width: "100%",
          tableLayout: "fixed",
          borderCollapse: "collapse",
        }}
      >
        <tbody>
          <tr>
            <td
              className="taf-sig-box"
              style={{ width: "33.33%", padding: "1px", overflow: "hidden" }}
            >
              <div className="sig-line">
                {ficha.assinaturas.tecnico.dataUrl ? (
                  <img
                    src={ficha.assinaturas.tecnico.dataUrl}
                    alt="Assinatura"
                  />
                ) : (
                  <div style={{ height: "70px" }}></div>
                )}
              </div>
              <p>TÉCNICO</p>
            </td>
            <td
              className="taf-sig-box"
              style={{ width: "33.33%", padding: "1px", overflow: "hidden" }}
            >
              <div className="sig-line">
                {ficha.assinaturas.supervisor.dataUrl ? (
                  <img
                    src={ficha.assinaturas.supervisor.dataUrl}
                    alt="Assinatura"
                  />
                ) : (
                  <div style={{ height: "70px" }}></div>
                )}
              </div>
              <p>SUPERVISOR</p>
            </td>
            <td
              className="taf-sig-box"
              style={{ width: "33.33%", padding: "1px", overflow: "hidden" }}
            >
              <div className="sig-line">
                {ficha.assinaturas.qualidade.dataUrl ? (
                  <img
                    src={ficha.assinaturas.qualidade.dataUrl}
                    alt="Assinatura"
                  />
                ) : (
                  <div style={{ height: "70px" }}></div>
                )}
              </div>
              <p>RESP. QUALIDADE</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
