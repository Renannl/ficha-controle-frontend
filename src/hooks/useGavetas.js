// ============================================================
// src/hooks/useGavetas.js
// Hook para as rotas do backend:
//   GET  /fichas/:fichaId/gavetas
//   PUT  /fichas/:fichaId/gavetas/:gavetaId
// ============================================================

import { useCallback, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// O driver do pg já devolve jsonb como objeto. Este helper cobre o
// caso de "dados" vir como string (json/text) para não quebrar a UI.
function parseDados(gaveta) {
  if (!gaveta) return gaveta;
  if (typeof gaveta.dados === "string") {
    try {
      return { ...gaveta, dados: JSON.parse(gaveta.dados) || {} };
    } catch {
      return { ...gaveta, dados: {} };
    }
  }
  return { ...gaveta, dados: gaveta.dados || {} };
}

export function useGavetas(fichaId) {
  const [gavetas, setGavetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!fichaId) return;
    setLoading(true);
    setErro("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/fichas/${fichaId}/gavetas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao carregar gavetas");
      }

      const data = await res.json();
      const lista = Array.isArray(data) ? data.map(parseDados) : [];
      setGavetas(lista.sort((a, b) => Number(a.numero) - Number(b.numero)));
    } catch (err) {
      setErro(err.message);
      setGavetas([]);
    } finally {
      setLoading(false);
    }
  }, [fichaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { gavetas, loading, erro, recarregar: carregar };
}

// Salva uma gaveta e devolve o registro atualizado (dados já parseados).
// O backend espera: { nomeEquipamento, status, dados }
export async function salvarGaveta(fichaId, gavetaId, payload) {
  const token = localStorage.getItem("token");
  const res = await fetch(
    `${API_URL}/fichas/${fichaId}/gavetas/${gavetaId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro ao salvar gaveta");
  return parseDados(data);
}
