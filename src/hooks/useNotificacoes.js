import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { avisarNovas } from "../native/notificacoes";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useNotificacoes() {
  const { authFetch, isAuthenticated } = useAuth();
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const intervalRef = useRef(null);

  const carregar = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await authFetch(`${API_URL}/notificacoes`);
      if (!res || !res.ok) return;
      const data = await res.json();
      setNotificacoes(data.notificacoes || []);
      setNaoLidas(data.naoLidas || 0);
      avisarNovas(data.notificacoes || []).catch(() => {});
    } catch (err) {
      console.error("[notificacoes]", err);
    }
  }, [authFetch, isAuthenticated]);

  const marcarLida = useCallback(
    async (id) => {
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n)),
      );
      setNaoLidas((prev) => Math.max(0, prev - 1));
      try {
        await authFetch(`${API_URL}/notificacoes/${id}/lida`, {
          method: "PUT",
        });
      } catch {}
    },
    [authFetch],
  );

  const marcarTodasLidas = useCallback(async () => {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    setNaoLidas(0);
    try {
      await authFetch(`${API_URL}/notificacoes/lidas-todas`, {
        method: "PUT",
      });
    } catch {}
  }, [authFetch]);

  useEffect(() => {
    carregar();
    intervalRef.current = setInterval(carregar, 20000);
    return () => clearInterval(intervalRef.current);
  }, [carregar]);

  return { notificacoes, naoLidas, carregando, carregar, marcarLida, marcarTodasLidas };
}
