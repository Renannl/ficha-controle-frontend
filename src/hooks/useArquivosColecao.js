import { useState, useCallback, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useArquivosColecao(colecaoId, ativo = true) {
  const [arquivos, setArquivos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!colecaoId) return;
    setCarregando(true);
    setErro(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/colecoes/${colecaoId}/arquivos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar arquivos");
      const data = await res.json();
      setArquivos(data.arquivos || []);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [colecaoId]);

  useEffect(() => {
    if (ativo) carregar();
  }, [ativo, carregar]);

  return { arquivos, carregando, erro, carregar };
}
