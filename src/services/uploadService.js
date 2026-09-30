import { authFetch } from "./apiClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getToken() {
  return localStorage.getItem("token") || "";
}

function buildUrl(downloadUrl) {
  const url = downloadUrl.startsWith("http")
    ? downloadUrl
    : `${API_URL}${downloadUrl}`;
  return `${url}?token=${getToken()}`;
}

export async function uploadFoto(file, ficha) {
  if (!ficha?.dbId) {
    console.error("[Upload Foto] Tentativa de upload sem dbId válido:", ficha);
    alert("Erro: a ficha ainda não foi salva. Aguarde e tente novamente.");
    return null;
  }
  try {
    const formData = new FormData();
    formData.append("fichaId", ficha.dbId);
    formData.append("file", file);

    const response = await authFetch(`${API_URL}/upload-foto`, {
      method: "POST",
      body: formData,
    });

    if (!response)
      throw new Error("Sessão expirada ou sem resposta do servidor");
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Erro ${response.status}: ${errText}`);
    }

    const data = await response.json();

    if (!data.downloadUrl) {
      throw new Error("Resposta do servidor não contém downloadUrl.");
    }

    return buildUrl(data.downloadUrl);
  } catch (err) {
    console.error("[Upload Foto]", err);
    alert("Erro ao enviar foto: " + err.message);
    return null;
  }
}

export async function uploadBook(pdfBlob, fichaIds) {
  try {
    const formData = new FormData();
    formData.append("file", pdfBlob, "BOOK.pdf");
    formData.append("fichaIds", JSON.stringify(fichaIds));

    const response = await authFetch(`${API_URL}/upload-book`, {
      method: "POST",
      body: formData,
    });

    if (!response)
      throw new Error("Sessão expirada ou sem resposta do servidor");
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Erro ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return { ...data, url: buildUrl(data.downloadUrl) };
  } catch (err) {
    console.error("[uploadBook] Erro:", err);
    return null;
  }
}

export async function uploadPdf(pdfBlob, ficha) {
  if (!ficha?.dbId) {
    console.error("[Upload PDF] Tentativa de upload sem dbId válido:", ficha);
    alert("Erro: a ficha ainda não foi salva. Aguarde e tente novamente.");
    return null;
  }
  try {
    const formData = new FormData();
    formData.append("fichaId", ficha.dbId);
    formData.append("file", pdfBlob, `${ficha.codigo}.pdf`);

    const response = await authFetch(`${API_URL}/upload-pdf`, {
      method: "POST",
      body: formData,
    });

    if (!response)
      throw new Error("Sessão expirada ou sem resposta do servidor");
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Erro ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return { ...data, url: buildUrl(data.downloadUrl) };
  } catch (err) {
    console.error("[Upload PDF]", err);
    alert("Erro ao enviar PDF: " + err.message);
    return null;
  }
}
