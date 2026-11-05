// ============================================================
// utils/metricsHelpers.js — ARQUIVO COMPLETO
// Helpers compartilhados entre os hooks de métricas do Dashboard
// ============================================================

export function dadosDe(ficha) {
  if (!ficha) return {};
  if (typeof ficha.dados === "string") {
    try {
      return JSON.parse(ficha.dados) || {};
    } catch {
      return {};
    }
  }
  return ficha.dados || {};
}

export function campo(ficha, chave) {
  if (!ficha) return undefined;
  if (ficha[chave] !== undefined && ficha[chave] !== null) return ficha[chave];
  const d = dadosDe(ficha);
  if (d[chave] !== undefined && d[chave] !== null) return d[chave];
  return undefined;
}

export function estadoFicha(ficha) {
  const d = dadosDe(ficha);
  const aprov = String(campo(ficha, "statusAprovacao") || "").toLowerCase();
  const status = String(ficha?.status || d?.status || "").toLowerCase();

  if (aprov === "reprovado") return "reprovada";
  if (aprov === "aprovado") return "concluida";
  if (
    ["finalizada", "concluida", "concluída", "concluido", "concluído", "done", "fechada"].includes(
      status,
    )
  ) {
    return "concluida";
  }
  if (
    ["andamento", "em andamento", "em_andamento", "progress", "progresso"].includes(status)
  ) {
    return "andamento";
  }
  return "nova";
}

export function emAndamento(ficha) {
  return estadoFicha(ficha) === "andamento";
}

export function isConcluida(ficha) {
  return estadoFicha(ficha) === "concluida";
}

export function itemsDe(ficha) {
  const items = campo(ficha, "items");
  return Array.isArray(items) ? items : [];
}

export function dataISO(valor) {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function diffDias(a, b) {
  const da = dataISO(a);
  const db = dataISO(b);
  if (!da || !db) return null;
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

export function hoje() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function chaveMes(data) {
  const d = dataISO(data) || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatarHoras(segundos) {
  const s = Math.floor(Number(segundos) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

export function capitalizar(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
