import React from "react";

/* =====================================================================
   PrintViewGavetaFotos — imprime o relatório fotográfico de UMA gaveta.
   ---------------------------------------------------------------------
   Usado dentro do PDF do painel CCM: cada gaveta renderiza este bloco.
   Recebe:
     gaveta   — objeto da gaveta (usa gaveta.dados.fotos)
     ficha    — ficha mestre (para cliente / IND compartilhado)
     numeroG  — número da gaveta (ex.: 3 → "Gaveta 03")
     isBook   — true dentro do Book (sem classe "print-only")
   ===================================================================== */

const HEADER_BG = "#1a4b50";
const HEADER_FG = "#fff";
const BORDER_COLOR = "#333";

export default function PrintViewGavetaFotos({
  gaveta,
  ficha,
  numeroG,
  isBook = false,
}) {
  const fotos = gaveta?.dados?.fotos || [];

  const FOTOS_POR_PAGINA = 6;
  const pages = [];
  for (let i = 0; i < fotos.length; i += FOTOS_POR_PAGINA) {
    pages.push({ items: fotos.slice(i, i + FOTOS_POR_PAGINA) });
  }

  const numeroFormatado = `G${String(numeroG).padStart(2, "0")}`;
  const indCompartilhado = ficha?.numeroInd || ficha?.dados?.numeroInd || "—";

  // Layout idêntico ao PrintViewFotos, mas com o cabeçalho "— Gaveta NN —"
  return (
    <div
      className={
        isBook
          ? "print-view-root fotos-pdf"
          : "print-view-root print-only fotos-pdf"
      }
      style={{ fontFamily: "Inter, sans-serif", color: "#000" }}
    >
      {pages.map((page, pageIdx) => (
        <div
          key={pageIdx}
          style={{
            pageBreakBefore: pageIdx > 0 ? "always" : undefined,
            breakBefore: pageIdx > 0 ? "page" : undefined,
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
              RELATÓRIO FOTOGRÁFICO — {numeroFormatado}
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                maxWidth: "26%",
                textAlign: "right",
              }}
            >
              {ficha?.cliente || ficha?.dados?.cliente || ""}
              <br />
              {indCompartilhado}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "3mm",
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
                      display: "flex",
                      alignItems: "center",
                      gap: "2mm",
                      padding: "2mm 3mm",
                      background: "#e8f5e9",
                      borderBottom: `1px solid ${BORDER_COLOR}`,
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        background: HEADER_BG,
                        color: HEADER_FG,
                        borderRadius: "50%",
                        width: "6mm",
                        height: "6mm",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 7,
                        flexShrink: 0,
                      }}
                    >
                      {fotoNumero}
                    </span>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {foto.nomeControle || foto.descricao || "Sem descrição"}
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "66mm",
                      background:
                        foto?.dataUrl || foto?.imagem
                          ? `url(${foto?.dataUrl || foto?.imagem}) center/cover no-repeat`
                          : "#f5f5f5",
                      backgroundColor:
                        foto?.dataUrl || foto?.imagem ? "#fff" : "#f5f5f5",
                    }}
                  >
                    {!foto?.dataUrl && !foto?.imagem && (
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
            {numeroFormatado} · Página {pageIdx + 1} de {pages.length}
          </div>
        </div>
      ))}
    </div>
  );
}

/* =====================================================================
   USO — no gerador do PDF do painel CCM
   ---------------------------------------------------------------------
   Quando o painel é CCM, o gerador itera as gavetas e renderiza:

     <PrintViewGavetaFotos
       key={g.id}
       gaveta={g}
       ficha={fichaMestre}
       numeroG={g.numero}
       isBook={true}
     />

   Para uma ficha CCM que NÃO tem gavetas (ou para uma ficha normal),
   o código continua usando o PrintViewFotos da ficha mestre.
   ===================================================================== */
