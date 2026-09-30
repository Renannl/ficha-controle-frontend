import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const UsersContext = createContext(null);

export function UsersProvider({ children }) {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);

  const carregarUsuarios = useCallback(async () => {
    try {
      const res = await authFetch(`${API_URL}/users`);
      if (res?.ok) setUsers(await res.json());
    } catch (err) {
      console.error("[UsersContext] Erro ao carregar usuários", err);
    }
  }, [authFetch]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const atualizarUsuarioLocal = useCallback((id, usuarioAtualizado) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...usuarioAtualizado } : u)),
    );
  }, []);

  return (
    <UsersContext.Provider
      value={{ users, carregarUsuarios, atualizarUsuarioLocal }}
    >
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers deve ser usado dentro de UsersProvider");
  return ctx;
}
