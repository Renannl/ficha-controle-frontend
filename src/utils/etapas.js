export const ETAPA_ORDER = ["montagem", "barramento", "cabeamento"];

export const ETAPA_LABELS = {
  montagem: "Montagem",
  barramento: "Barramento",
  cabeamento: "Cabeamento",
  taf: "TAF",
};

export const CARGO_LABELS = {
  montagem: "Montagem Mecânica",
  barramento: "Barramento",
  cabeamento: "Cabeamento",
  admin: "Administrador",
  taf: "Técnico TAF",
};

export function getEtapaDoCargo(role) {
  return ETAPA_ORDER.includes(role) ? role : null;
}

export function getEtapaLabel(etapa) {
  return ETAPA_LABELS[etapa] || etapa || "—";
}

export function getCargoLabel(cargo) {
  return CARGO_LABELS[cargo] || cargo || "—";
}

export function getEtapaAtual(items, checklistItems, verificacoes = {}) {
  for (const etapa of ETAPA_ORDER) {
    const itensDaEtapa = checklistItems.filter((ci) => ci.etapa === etapa);
    if (itensDaEtapa.length === 0) continue;

    const todosConcluidos = itensDaEtapa.every((ci) => {
      if (String(ci.id ?? "").includes("-ver-")) {
        const idx = parseInt(String(ci.id).split("-").pop(), 10);
        const v = verificacoes?.[etapa]?.[idx];
        return v === "ok" || v === "na";
      }

      const itemData = (items || []).find((i) => i.id === ci.id);
      return itemData?.resultado === "ok" || itemData?.resultado === "na";
    });

    if (!todosConcluidos) return etapa;
  }
  return null;
}

export function podeTrabalharNaEtapa(user, etapa) {
  if (!etapa) return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  const etapaDoCargo = getEtapaDoCargo(user.role);
  if (!etapaDoCargo) return true;
  return etapaDoCargo === etapa;
}
