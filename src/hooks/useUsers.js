import { useEffect, useState, useCallback, useRef } from "react";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const tentouRef = useRef(false);

  const loadUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.warn("[useUsers] ⚠️ Token ausente, aguardando...");
        setTimeout(() => loadUsers(), 500);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        console.warn("[useUsers] 🔐 401 — token inválido/expirado, tentando novamente em 1s...");
        setTimeout(() => loadUsers(), 1000);
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error("[useUsers] ❌ Erro:", response.status, text);
        setUsers([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log("[useUsers] ✅ Usuários carregados:", data.length);

      const roleOrder = {
        admin: 1,
        barramento: 2,
        cabeamento: 3,
        montagem: 4,
      };

      const sortedUsers = [...data].sort((a, b) => {
        if (a.username === "master") return -1;
        if (b.username === "master") return 1;

        const roleA = roleOrder[a.role] || 999;
        const roleB = roleOrder[b.role] || 999;

        if (roleA !== roleB) return roleA - roleB;

        const nomeA = (a.nome || a.username || "").toLowerCase();
        const nomeB = (b.nome || b.username || "").toLowerCase();

        return nomeA.localeCompare(nomeB, "pt-BR");
      });

      setUsers(sortedUsers);
    } catch (err) {
      console.error("[useUsers] Erro de rede:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!tentouRef.current) {
      tentouRef.current = true;
      loadUsers();
    }
  }, [loadUsers]);

  async function updateUser(userId, payload) {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/users/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("[useUsers] Erro ao atualizar usuário:", response.status, text);
      throw new Error("Erro ao atualizar usuário");
    }

    await loadUsers();
  }

  return {
    users,
    loading,
    loadUsers,
    updateUser,
  };
}
