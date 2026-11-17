import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../services/apiClient";

export function useGavetaSessoes(fichaId, gavetaId) {
  const [sessoes, setSessoes] = useState([]);
  const [totalSegundos, setTotalSegundos] = useState(0);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    if (!fichaId || !gavetaId) return;
    setLoading(true);
    try {
      const res = await authFetch(
        `/fichas/${fichaId}/gavetas/${gavetaId}/sessoes`,
      );
      if (!res) return;
      const data = await res.json();
      if (res.ok) {
        setSessoes(Array.isArray(data.sessoes) ? data.sessoes : []);
        setTotalSegundos(Number(data.totalSegundos) || 0);
      }
    } catch (err) {
      console.error("Erro ao carregar sessões da gaveta:", err);
    } finally {
      setLoading(false);
    }
  }, [fichaId, gavetaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { sessoes, totalSegundos, loading, recarregar: carregar };
}
