import React from "react";

const HEADER_BG = "#0d47a1";
const HEADER_FG = "#fff";
const BORDER_COLOR = "#333";
const ACCENT_BG = "#e3f2fd";

export default function PrintViewFotosTecnicas({ ficha, isBook = false }) {
  const fotos = ficha?.fotoData?.fotos || [];
  const responsavelTecnico = ficha?.fotoData?.responsavelTecnico || "";
  const dataHoraInicio = ficha?.fotoData?.dataHoraInicio || "";

  const FOTOS_POR_PAGINA = 6;
  const pages = [];
  for (let i = 0; i < fotos.length; i += FOTOS_POR_PAGINA) {
    pages.push({ items: fotos.slice(i, i + FOTOS_POR_PAGINA) });
  }

  return (
    <div
      className={
        isBook
          ? "print-view-root fotos-tecnicas-pdf"
          : "print-view-root print-only fotos-tecnicas-pdf"
      }
      style={{ fontFamily: "Inter, sans-serif", color: "#000" }}
    >
      <div style={{ marginBottom: "8mm" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: HEADER_BG,
            color: HEADER_FG,
            padding: "6mm 8mm",
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>IndusPower</div>
            <div style={{ fontSize: 8, opacity: 0.8 }}>Powering Solutions</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700 }}>
            RELATÓRIO TÉCNICO FOTOGRÁFICO
          </div>
          <div style={{ fontSize: 10, fontWeight: 600 }}>CONSIDERAÇÕES</div>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: `1px solid ${BORDER_COLOR}`,
            fontSize: 9,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  background: ACCENT_BG,
                  border: `1px solid ${BORDER_COLOR}`,
                  padding: "3mm",
                  width: "8%",
                }}
              >
                FOTO
              </th>
              <th
                style={{
                  background: ACCENT_BG,
                  border: `1px solid ${BORDER_COLOR}`,
                  padding: "3mm",
                  width: "22%",
                }}
              >
                DESCRIÇÃO
              </th>
              <th
                style={{
                  background: ACCENT_BG,
                  border: `1px solid ${BORDER_COLOR}`,
                  padding: "3mm",
                  width: "15%",
                }}
              >
                MARCA/MODELO
              </th>
              <th
                style={{
                  background: ACCENT_BG,
                  border: `1px solid ${BORDER_COLOR}`,
                  padding: "3mm",
                  width: "15%",
                }}
              >
                SERIAL
              </th>
              <th
                style={{
                  background: ACCENT_BG,
                  border: `1px solid ${BORDER_COLOR}`,
                  padding: "3mm",
                  width: "12%",
                }}
              >
                TENSÃO
              </th>
              <th
                style={{
                  background: ACCENT_BG,
                  border: `1px solid ${BORDER_COLOR}`,
                  padding: "3mm",
                  width: "12%",
                }}
              >
                CORRENTE
              </th>
              <th
                style={{
                  background: ACCENT_BG,
                  border: `1px solid ${BORDER_COLOR}`,
                  padding: "3mm",
                  width: "16%",
                }}
              >
                ESTADO
              </th>
            </tr>
          </thead>
          <tbody>
            {fotos.map((foto, i) => (
              <tr key={foto.id ?? i}>
                <td
                  style={{
                    border: `1px solid ${BORDER_COLOR}`,
                    padding: "2mm",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {i + 1}
                </td>
                <td style={{ border: `1px solid ${BORDER_COLOR}`, padding: "2mm" }}>
                  {foto.descricao || "—"}
                </td>
                <td style={{ border: `1px solid ${BORDER_COLOR}`, padding: "2mm" }}>
                  {foto.marcaModelo || "—"}
                </td>
                <td style={{ border: `1px solid ${BORDER_COLOR}`, padding: "2mm" }}>
                  {foto.serial || "—"}
                </td>
                <td style={{ border: `1px solid ${BORDER_COLOR}`, padding: "2mm" }}>
                  {foto.tensao || "—"}
                </td>
                <td style={{ border: `1px solid ${BORDER_COLOR}`, padding: "2mm" }}>
                  {foto.corrente || "—"}
                </td>
                <td style={{ border: `1px solid ${BORDER_COLOR}`, padding: "2mm" }}>
                  {foto.estado || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          style={{
            border: `1px solid ${BORDER_COLOR}`,
            borderTop: "none",
            padding: "4mm",
            minHeight: "25mm",
          }}
        >
          <strong style={{ fontSize: 10 }}>Observações Técnicas:</strong>
          <div
            style={{
              whiteSpace: "pre-wrap",
              marginTop: "2mm",
              fontSize: 9,
              lineHeight: 1.4,
            }}
          >
            {ficha.observacoesTecnicas || ficha.observacoes || "—"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            border: `1px solid ${BORDER_COLOR}`,
            borderTop: "none",
            fontSize: 9,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "3mm",
              borderRight: `1px solid ${BORDER_COLOR}`,
            }}
          >
            <strong>RESPONSÁVEL TÉCNICO:</strong> {responsavelTecnico || "—"}
          </div>
          <div style={{ width: "45mm", textAlign: "center", padding: "3mm" }}>
            <div style={{ fontWeight: 700, marginBottom: 1 }}>
              DATA / HORA DE INÍCIO
            </div>
            <div>{dataHoraInicio || "—"}</div>
          </div>
        </div>
      </div>

      {pages.map((page, pageIdx) => {
        return (
          <div
            key={pageIdx}
            style={{
              pageBreakBefore: "always",
              breakBefore: "page",
              paddingTop: "4mm",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: HEADER_BG,
                color: HEADER_FG,
                padding: "5mm 8mm",
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                marginBottom: "3mm",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 800 }}>IndusPower</div>
                <div style={{ fontSize: 7, opacity: 0.8 }}>
                  Powering Solutions
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>
                RELATÓRIO TÉCNICO FOTOGRÁFICO
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  maxWidth: "30%",
                  textAlign: "right",
                }}
              >
                {ficha.cliente || ""}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4mm",
              }}
            >
              {page.items.map((foto, idx) => {
                const fotoNumero = pageIdx * FOTOS_POR_PAGINA + idx + 1;

                return (
                  <div
                    key={foto.id ?? idx}
                    style={{
                      border: `1px solid ${BORDER_COLOR}`,
                      borderRadius: 3,
                      overflow: "hidden",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        padding: "2mm 3mm",
                        background: ACCENT_BG,
                        borderBottom: `1px solid ${BORDER_COLOR}`,
                        fontSize: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "2mm",
                          marginBottom: "1mm",
                        }}
                      >
                        <span
                          style={{
                            background: HEADER_BG,
                            color: HEADER_FG,
                            borderRadius: "50%",
                            width: "5mm",
                            height: "5mm",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 7,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {fotoNumero}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 9,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {foto.descricao || "Sem descrição"}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "1mm",
                          fontSize: 7,
                          marginLeft: "7mm",
                        }}
                      >
                        {foto.marcaModelo && (
                          <div>
                            <strong>Marca/Modelo:</strong> {foto.marcaModelo}
                          </div>
                        )}
                        {foto.serial && (
                          <div>
                            <strong>Serial:</strong> {foto.serial}
                          </div>
                        )}
                        {foto.tensao && (
                          <div>
                            <strong>Tensão:</strong> {foto.tensao}
                          </div>
                        )}
                        {foto.corrente && (
                          <div>
                            <strong>Corrente:</strong> {foto.corrente}
                          </div>
                        )}
                        {foto.estado && (
                          <div style={{ gridColumn: "1 / -1" }}>
                            <strong>Estado:</strong> {foto.estado}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "68mm",
                        background: foto?.imagem
                          ? `url(${foto.imagem}) center/cover no-repeat`
                          : "#f5f5f5",
                        backgroundColor: foto?.imagem ? "#fff" : "#f5f5f5",
                      }}
                    >
                      {!foto?.imagem && (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              color: "#999",
                              fontSize: 9,
                              fontWeight: 600,
                            }}
                          >
                            SEM FOTO
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                textAlign: "right",
                fontSize: 8,
                color: "#999",
                marginTop: "2mm",
                paddingRight: "2mm",
              }}
            >
              Página {pageIdx + 2} de {pages.length + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
