import { getFichaStatus } from "./fichaStatus";

export function getColecaoStatus(fichasDaCol) {
  if (!fichasDaCol || fichasDaCol.length === 0) return "vazia";

  const statusFichas = fichasDaCol.map((f) => getFichaStatus(f));

  const temReprovada = statusFichas.some((s) => s === "rejected");
  if (temReprovada) return "erro";

  const todasCompletas = statusFichas.every(
    (s) => s === "done" || s === "approved",
  );
  if (todasCompletas) return "completa";

  const todasVazias = statusFichas.every((s) => s === "empty");
  if (todasVazias) return "vazia";

  return "andamento";
}
