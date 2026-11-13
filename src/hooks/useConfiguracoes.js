// src/hooks/useConfiguracoes.js
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useConfiguracoes() {
  const { authFetch } = useAuth();
  const [configuracoes, setConfiguracoes] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const res = await authFetch(`${API_URL}/configuracoes`);
        if (!res || !res.ok) return;
        const data = await res.json();
        if (ativo) setConfiguracoes(data);
      } catch (err) {
        console.error("[Config] Erro ao carregar configurações:", err);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [authFetch]);

  const excluirFichaHabilitado = configuracoes?.excluir_ficha !== false;

  return {
    configuracoes,
    carregando,
    excluirFichaHabilitado,
  };
}
