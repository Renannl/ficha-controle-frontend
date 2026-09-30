import { entregarArquivo } from "../native/arquivos";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function extractAllCssText() {
  let cssText = "";

  document.querySelectorAll("style").forEach((styleTag) => {
    cssText += styleTag.innerHTML + "\n";
  });

  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    try {
      const sheet = [...document.styleSheets].find((s) => s.href === link.href);
      if (sheet) {
        [...sheet.cssRules].forEach((rule) => {
          cssText += rule.cssText + "\n";
        });
      }
    } catch (e) {
      console.warn("[extractAllCssText] Não foi possível ler:", link.href, e);
    }
  });

  return cssText;
}

function buildFullHtml(bodyHtml, cssText) {
  const printCss = `
    @page { size: A4; margin: 10mm; }

    html, body {
      height: auto !important;
      overflow: visible !important;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      overflow: visible !important;
      max-height: none !important;
    }

    #book-print-root, #print-view-root {
      height: auto !important;
      width: 100% !important;
      position: static !important;
      display: block !important;
    }

    /* ⚠️ NÃO aplicar break-inside/avoid em blocos grandes (table, section, div wrapper) */
    table { width: 100%; border-collapse: collapse; }

    /* ✅ Aplicar SOMENTE nas linhas */
    tr, td, th {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    thead { display: table-header-group; } /* repete o cabeçalho em cada página */
    tbody { display: table-row-group; }

    /* Evita que títulos de seção fiquem "órfãos" no fim da página */
    h1, h2, h3, .section-title, .titulo-secao {
      break-after: avoid;
      page-break-after: avoid;
    }

    /* Assinatura só quebra página se for realmente um bloco separado por ficha */
    .assinaturas-wrapper {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>${printCss}</style>
        <style>${cssText}</style>
      </head>
      <body>
        ${bodyHtml}
      </body>
    </html>
  `;
}

function withOverlay(fn) {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(10,15,30,0.98); backdrop-filter: blur(5px);
    z-index: 2147483647; display: flex; flex-direction: column;
    align-items: center; justify-content: center; color: #fff;
    font-family: Inter, sans-serif;
  `;
  overlay.innerHTML = `
    <div style="width:50px;height:50px;border:4px solid rgba(255,255,255,0.1);
      border-top-color:#1565C0;border-radius:50%;animation:finalSpin 1s linear infinite;"></div>
    <p style="margin-top:20px;font-weight:700;font-size:16px;">Gerando PDF...</p>
    <style>@keyframes finalSpin { 100% { transform:rotate(360deg); } }</style>
  `;
  document.body.appendChild(overlay);
  return fn().finally(() => {
    if (document.body.contains(overlay)) document.body.removeChild(overlay);
  });
}

export async function generateBookPdf(
  fichaIds,
  elementId = "book-print-root",
  filename = "BOOK.pdf",
) {
  const el = document.getElementById(elementId);
  if (!el) return false;
  if (!fichaIds || fichaIds.length === 0) {
    alert("Selecione ao menos uma ficha para vincular ao book.");
    return false;
  }

  return withOverlay(async () => {
    try {
      const cssText = extractAllCssText();
      const html = buildFullHtml(el.outerHTML, cssText);

      const res = await fetch(`${API_URL}/books/pdf-gerar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ html, fichaIds }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Resposta inválida do servidor (status ${res.status})`);
      }
      if (!res.ok) throw new Error(data.error || "Erro ao gerar Book");

      const downloadRes = await fetch(`${API_URL}${data.downloadUrl}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!downloadRes.ok) throw new Error("Falha ao baixar o PDF gerado.");

      const blob = await downloadRes.blob();
      if (await entregarArquivo(blob, filename)) return true;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 1000);

      return true;
    } catch (err) {
      console.error("[generateBookPdf] Erro:", err);
      alert("Erro ao gerar Book: " + err.message);
      return false;
    }
  });
}

export async function generateFichaPdf(ficha, elementId = "print-view-root") {
  const el = document.getElementById(elementId);
  if (!el) {
    console.error("[generateFichaPdf] Elemento não encontrado:", elementId);
    return false;
  }
  if (!ficha?.dbId) {
    alert("Atenção: a ficha ainda não foi salva no servidor.");
    return false;
  }

  return withOverlay(async () => {
    try {
      const cssText = extractAllCssText();
      const html = buildFullHtml(el.outerHTML, cssText);
      const safeFilename = `FICHA_${(ficha.codigo || "DOC").replace(/[^a-z0-9]/gi, "_")}.pdf`;

      const res = await fetch(`${API_URL}/fichas/${ficha.dbId}/pdf-gerar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ html }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Resposta inválida do servidor (status ${res.status})`);
      }
      if (!res.ok) throw new Error(data.error || "Erro ao gerar PDF");

      const downloadRes = await fetch(`${API_URL}${data.downloadUrl}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!downloadRes.ok) throw new Error("Falha ao baixar o PDF gerado.");

      const blob = await downloadRes.blob();
      if (await entregarArquivo(blob, safeFilename)) return true;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = safeFilename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 1000);

      return true;
    } catch (err) {
      console.error("[generateFichaPdf] Erro:", err);
      alert("Erro ao gerar PDF: " + err.message);
      return false;
    }
  });
}
