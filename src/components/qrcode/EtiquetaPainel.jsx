import { useEffect, useState } from "react";
import { Printer } from "lucide-react";

const LOGO_PADRAO = "/logo-induspower.jpeg";
const LOGO_FRAGIL_PADRAO = "/logo_fragil.png";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function blobParaDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function EtiquetaPainel({
  cliente = "—",
  numeroInd = "—",
  nomePainel = "—",
  logoUrl = LOGO_PADRAO,
  logoFragilUrl = LOGO_FRAGIL_PADRAO,
}) {
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [logoErro, setLogoErro] = useState(false);
  const [logoFragilDataUrl, setLogoFragilDataUrl] = useState("");
  const [logoFragilErro, setLogoFragilErro] = useState(false);
  const [imprimindo, setImprimindo] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarImagens() {
      try {
        const [resLogo, resFragil] = await Promise.all([
          fetch(logoUrl),
          fetch(logoFragilUrl),
        ]);
        if (!resLogo.ok) throw new Error("logo não encontrada");
        if (!resFragil.ok) throw new Error("logo frágil não encontrada");

        const [blobLogo, blobFragil] = await Promise.all([
          resLogo.blob(),
          resFragil.blob(),
        ]);
        const [dataLogo, dataFragil] = await Promise.all([
          blobParaDataUrl(blobLogo),
          blobParaDataUrl(blobFragil),
        ]);

        if (!ativo) return;
        setLogoDataUrl(dataLogo);
        setLogoFragilDataUrl(dataFragil);
      } catch {
        if (!ativo) return;
        setLogoErro(true);
        setLogoFragilErro(true);
      }
    }

    carregarImagens();
    return () => {
      ativo = false;
    };
  }, [logoUrl, logoFragilUrl]);

  function montarHtmlImpressao() {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Etiqueta ${esc(numeroInd)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    background: #fff;
    font-family: 'Segoe UI', Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    text-align: center;
  }
  .etiqueta {
    width: 310mm;
    min-height: 397mm;
    background: #ffffff;
    color: #0f172a;
    display: flex;
    flex-direction: column;
    padding: 1mm 1mm;
    text-align: center;
  }
  .cabecalho {
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: 5px solid #0f172a;
    padding-bottom: 1px;
    margin-bottom: 20px;
  }
  .cabecalho img {
    height: 500px;
    max-width: 100%;
    object-fit: contain;
  }
  .rotulo {
    font-size: 22px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #64748b;
    font-weight: 700;
  }
  .valor-cliente {
    font-size: 80px;
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 24px;
  }
  .valor-ind {
    font-size: 55px;
    font-weight: 900;
    color: #1e40af;
    line-height: 1;
    margin-bottom: 24px;
  }
  .valor-painel {
    font-size: 80px;
    font-weight: 700;
    margin-bottom: 28px;
  }
  .fragil {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    border-top: 4px dashed #cbd5e1;
    padding-top: 26px;
  }
  .fragil img {
    height: 485px;
    object-fit: contain;
  }
  .fragil-texto {
    text-align: center;
  }
  .fragil-nome {
    font-size: 80px;
    font-weight: 900;
    color: #dc2626;
  }
  .fragil-sub {
    font-size: 50px;
    color: #64748b;
    font-weight: 700;
  }
  @page { size: A4; margin: 0; }
</style>
</head>
<body>
  <div class="etiqueta">
    <div class="cabecalho">
      <img src="${logoDataUrl}" alt="Logo Induspower" />
    </div>

    <div class="rotulo">Cliente / Coleção</div>
    <div class="valor-cliente">${esc(cliente)}</div>

    <div class="rotulo">Nº IND</div>
    <div class="valor-ind">${esc(numeroInd)}</div>

    <div class="rotulo">Painel</div>
    <div class="valor-painel">${esc(nomePainel)}</div>

    <div class="fragil">
      <img src="${logoFragilDataUrl}" alt="Frágil" />
      <div class="fragil-texto">
        <div class="fragil-nome">FRÁGIL</div>
        <div class="fragil-sub">Manusear com cuidado</div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 350);
    });
  </script>
</body>
</html>`;
  }

  function imprimir() {
    if (!logoDataUrl || !logoFragilDataUrl || imprimindo) return;
    setImprimindo(true);
    try {
      const janela = window.open("", "_blank", "width=900,height=1200");
      if (!janela) {
        alert("Permita pop-ups para imprimir a etiqueta.");
        return;
      }
      janela.document.open();
      janela.document.write(montarHtmlImpressao());
      janela.document.close();
      janela.focus();
    } finally {
      setImprimindo(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "center", padding: 8 }}>
        <div
          style={{
            width: "100%",
            maxWidth: 794,
            aspectRatio: "1 / 1.414",
            border: "2px solid #0f172a",
            borderRadius: 12,
            padding: 48,
            background: "#ffffff",
            color: "#0f172a",
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderBottom: "5px solid #0f172a",
              paddingBottom: 1,
              marginBottom: 28,
            }}
          >
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt="Logo Induspower"
                style={{ height: 460, maxWidth: "100%", objectFit: "contain" }}
              />
            ) : (
              <div
                style={{
                  height: 460,
                  width: "90%",
                  borderRadius: 12,
                  background: "#f1f5f9",
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  color: "#94a3b8",
                }}
              >
                {logoErro ? "logo não encontrada" : "carregando logo..."}
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: 17,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            Cliente / Coleção
          </div>
          <div
            style={{
              fontSize: 50,
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: 24,
            }}
          >
            {cliente || "—"}
          </div>

          {/* IND */}
          <div
            style={{
              fontSize: 17,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            Nº IND
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: "#1e40af",
              lineHeight: 1,
              marginBottom: 24,
            }}
          >
            {numeroInd || "—"}
          </div>

          <div
            style={{
              fontSize: 17,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            Painel
          </div>
          <div style={{ fontSize: 50, fontWeight: 700, marginBottom: 28 }}>
            {nomePainel || "—"}
          </div>

          {/* Frágil */}
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              borderTop: "4px dashed #cbd5e1",
              paddingTop: 26,
            }}
          >
            {logoFragilDataUrl ? (
              <img
                src={logoFragilDataUrl}
                alt="Frágil"
                style={{ height: 160, objectFit: "contain" }}
              />
            ) : (
              <div
                style={{
                  height: 160,
                  width: 200,
                  borderRadius: 12,
                  background: "#fef2f2",
                  color: "#b91c1c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {logoFragilErro ? "logo frágil não encontrada" : "carregando..."}
              </div>
            )}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#dc2626" }}>
                FRÁGIL
              </div>
              <div style={{ fontSize: 20, color: "#64748b", fontWeight: 700 }}>
                Manusear com cuidado
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={imprimir}
          disabled={!logoDataUrl || !logoFragilDataUrl || imprimindo}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 26px",
            border: "none",
            borderRadius: 8,
            background:
              !logoDataUrl || !logoFragilDataUrl || imprimindo
                ? "#94a3b8"
                : "#1976d2",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor:
              !logoDataUrl || !logoFragilDataUrl || imprimindo
                ? "not-allowed"
                : "pointer",
          }}
        >
          <Printer size={17} />
          {imprimindo ? "Abrindo impressão..." : "Imprimir Etiqueta"}
        </button>
      </div>
    </div>
  );
}
