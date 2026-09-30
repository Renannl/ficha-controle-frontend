const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function enderecoLimpo(url) {
  if (typeof url !== "string") return url;
  const i = url.indexOf("/arquivos/");
  if (i < 0) return url;
  return `${API_URL}${url.slice(i).split("?")[0]}`;
}

export function enderecoComToken(url) {
  const limpo = enderecoLimpo(url);
  if (typeof limpo !== "string" || !limpo.includes("/arquivos/")) return limpo;
  const token = localStorage.getItem("token") || "";
  return token ? `${limpo}?token=${encodeURIComponent(token)}` : limpo;
}

function percorrer(valor, tratar) {
  if (typeof valor === "string") return tratar(valor);
  if (Array.isArray(valor)) return valor.map((v) => percorrer(v, tratar));
  if (valor && typeof valor === "object" && valor.constructor === Object) {
    const saida = {};
    for (const chave of Object.keys(valor)) {
      saida[chave] = percorrer(valor[chave], tratar);
    }
    return saida;
  }
  return valor;
}

export function assinarArquivos(ficha) {
  return percorrer(ficha, enderecoComToken);
}

export function limparArquivos(ficha) {
  return percorrer(ficha, enderecoLimpo);
}
