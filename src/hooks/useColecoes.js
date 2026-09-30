import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useColecoes() {
  const { authFetch } = useAuth();
  const [colecoes, setColecoes] = useState([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const response = await fetch(`${API_URL}/colecoes`);
      console.log("Status:", response.status);
      console.log("URL chamada:", `${API_URL}/colecoes`);

      if (!response.ok) {
        const text = await response.text();
        console.error("Resposta bruta:", text);
        return;
      }

      const data = await response.json();
      setColecoes(data || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function criarColecao(payload) {
    try {
      const response = await authFetch(`${API_URL}/colecoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response) {
        throw new Error("Sessão expirada ou sem resposta do servidor");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar coleção");
      }

      setColecoes((prev) => [data, ...prev]);
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function deletarColecao(id) {
    try {
      const response = await authFetch(`${API_URL}/colecoes/${id}`, {
        method: "DELETE",
      });

      if (!response) {
        throw new Error("Sessão expirada ou sem resposta do servidor");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao excluir coleção");
      }

      setColecoes((prev) => prev.filter((c) => c.id !== id));
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  return {
    colecoes,
    criarColecao,
    deletarColecao,
    recarregarColecoes: carregar,
  };
}
