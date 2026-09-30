import { useState, useEffect, useCallback } from "react";
import { authFetch } from "../services/apiClient";

export function useChecklistLog(fichaId) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    if (!fichaId) return;
    setLoading(true);
    try {
      const res = await authFetch(`/fichas/${fichaId}/checklist-log`);
      if (!res || !res.ok) {
        setLogs([]);
        return;
      }
      const data = await res.json();
      setLogs(data.logs || []);
    } finally {
      setLoading(false);
    }
  }, [fichaId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const registrarMarcacao = useCallback(
    async ({
      itemId,
      descricao,
      campo,
      valor,
      sessaoIndex,
      etapa,
      usuario,
    }) => {
      try {
        const res = await authFetch(`/fichas/${fichaId}/checklist-log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId,
            descricao,
            campo,
            valor,
            sessaoIndex,
            etapa,
            usuario,
          }),
        });
        if (res && res.ok) await loadLogs();
      } catch (err) {
        console.error("[useChecklistLog] erro ao registrar:", err);
      }
    },
    [fichaId, loadLogs],
  );

  return { logs, loading, registrarMarcacao };
}
