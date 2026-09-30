import { useMemo } from "react";
import { getFichaStatus } from "../utils/fichaStatus";

export function useFichasFilter({
  fichas,
  filterStatus,
  filterType,
  searchTerm,
}) {
  const normalizedSearch = searchTerm.toLowerCase();

  const filteredFichas = useMemo(() => {
    return fichas.filter((f) => {
      const statusMatch =
        filterStatus === "all" ? true : getFichaStatus(f) === filterStatus;

      const isTaf = f.operacao === "50";
      const isFoto = f.operacao === "80";

      let typeMatch = true;

      if (filterType === "taf") typeMatch = isTaf;
      else if (filterType === "controle") typeMatch = !isTaf && !isFoto;
      else if (filterType === "foto") typeMatch = isFoto;

      const searchMatch =
        !searchTerm ||
        (f.nomeEquipamento || "").toLowerCase().includes(normalizedSearch) ||
        (f.id || "").toLowerCase().includes(normalizedSearch) ||
        (f.codigo || "").toLowerCase().includes(normalizedSearch) ||
        (f.cliente || "").toLowerCase().includes(normalizedSearch);

      return statusMatch && typeMatch && searchMatch;
    });
  }, [fichas, filterStatus, filterType, searchTerm]);

  const stats = useMemo(() => {
    const total = fichas.length;

    const emAndamento = fichas.filter((f) =>
      ["progress", "waiting"].includes(getFichaStatus(f)),
    ).length;

    const concluidas = fichas.filter((f) =>
      ["done", "approved"].includes(getFichaStatus(f)),
    ).length;

    return {
      total,
      emAndamento,
      concluidas,
    };
  }, [fichas]);

  return {
    filteredFichas,
    stats,
  };
}
