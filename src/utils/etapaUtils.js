import { getPainelChecklistItems } from "../data/painelTemplates";

export function getMapaEtapasPorItem(tipoPainel) {
  const items = getPainelChecklistItems(tipoPainel, {
    incluirVerificacao: false,
  });
  const mapa = {};
  items.forEach((item) => {
    mapa[item.id] = item.etapa;
  });
  return mapa;
}

export const ETAPA_LABELS = {
  montagem: "Montagem Mecânica",
  barramento: "Barramento",
  cabeamento: "Cabeamento",
};
