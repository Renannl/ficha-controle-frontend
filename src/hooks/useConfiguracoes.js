// src/hooks/useConfiguracoes.js
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useConfiguracoes() {
  const [configuracoes, setConfiguracoes] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_URL}/configuracoes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
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
  }, []);

  const excluirFichaHabilitado = configuracoes?.excluir_ficha !== false;

  return {
    configuracoes,
    carregando,
    excluirFichaHabilitado,
  };
}
