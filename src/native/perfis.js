import { isApp } from "./nativeApp";

const CHAVE = "perfis-salvos";
// Sem limite prático: guarda quantas pessoas forem entrando no aparelho.
const MAX_PERFIS = 500;
const FOTO_MAX_BYTES = 150 * 1024;
const API_URL = import.meta.env.VITE_API_URL;

let plugin = null;
async function cofre() {
  if (!plugin) {
    const { SecureStorage } =
      await import("@aparajita/capacitor-secure-storage");
    await SecureStorage.setKeyPrefix("fichas_");
    plugin = SecureStorage;
  }
  return { c: plugin };
}

function anotarErro(etapa, err) {
  console.error("[perfis]", `${etapa}: ${err?.message || err}`, err);
}

try {
  localStorage.removeItem("perfis-diagnostico");
} catch {}

async function ler() {
  try {
    const { c } = await cofre();
    const dados = await c.get(CHAVE);
    if (dados !== null && !Array.isArray(dados)) {
      anotarErro("ler (formato inesperado)", typeof dados);
    }
    return Array.isArray(dados) ? dados : [];
  } catch (err) {
    anotarErro("ler", err);
    return [];
  }
}

async function gravar(lista) {
  try {
    const { c } = await cofre();
    if (lista.length) await c.set(CHAVE, lista);
    else await c.remove(CHAVE);
  } catch (err) {
    anotarErro("gravar", err);
    throw err;
  }
}

export async function listarPerfis() {
  if (!isApp) return [];
  const todos = await ler();
  // Sem corte por tempo: nenhum perfil é removido do nada.
  const ordenados = todos
    .filter((p) => p?.username)
    .sort((a, b) => b.ultimoAcesso - a.ultimoAcesso)
    .slice(0, MAX_PERFIS);
  if (ordenados.length !== todos.length) await gravar(ordenados);
  return ordenados;
}

export async function removerPerfil(username) {
  if (!isApp) return [];
  await gravar((await ler()).filter((p) => p.username !== username));
  return listarPerfis();
}

async function buscarFoto(token) {
  try {
    const r = await fetch(`${API_URL}/me/foto`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const blob = await r.blob();
    if (!blob.type.startsWith("image/") || blob.size > FOTO_MAX_BYTES) {
      return null;
    }
    return await new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = () => reject(leitor.error);
      leitor.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function registrarPerfilDoLogin() {
  if (!isApp) return;
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }
  const token = localStorage.getItem("token");
  if (!user?.username || user.username === "master" || !token) {
    anotarErro(
      "registrar",
      `sem usuário/token (user=${!!user?.username}, token=${!!token})`,
    );
    return;
  }

  const lista = await ler();
  const anterior = lista.find((p) => p.username === user.username);
  const foto = (await buscarFoto(token)) || anterior?.foto || null;

  const perfil = {
    username: user.username,
    nome: user.nome || user.username,
    role: user.role || "",
    foto,
    ultimoAcesso: Date.now(),
  };
  await gravar(
    [perfil, ...lista.filter((p) => p.username !== user.username)].slice(
      0,
      MAX_PERFIS,
    ),
  );
}
