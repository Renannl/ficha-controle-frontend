import { useState } from "react";
import { LogOut, User } from "lucide-react";

import { useUsers } from "../../hooks/useUsers";

import UserForm from "./UserForm";
import UserTable from "./UserTable";
import LoadingState from "./LoadingState";

export default function AdminPanel({ onBack, onUserUpdated }) {
  const { users, loading, updateUser } = useUsers();

  const [editingUser, setEditingUser] = useState(null);

  const [nome, setNome] = useState("");
  const [role, setRole] = useState("montagem");
  const [permissoes, setPermissoes] = useState([]);
  const [active, setActive] = useState(true);

  function resetForm() {
    setEditingUser(null);
    setNome("");
    setRole("montagem");
    setPermissoes([]);
    setActive(true);
  }

  function editarUsuario(user) {
    setEditingUser(user);
    setNome(user.nome || "");
    setRole(user.role || "montagem");
    setPermissoes(user.permissoes || []);
    setActive(user.active);
  }

  async function salvarUsuario() {
    if (!editingUser) return;

    try {
      await updateUser(editingUser.id, {
        nome,
        role,
        permissoes,
        active,
      });

      onUserUpdated?.({
        ...editingUser,
        nome,
        role,
        permissoes,
        active,
      });

      alert("Usuário atualizado");
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Erro atualizar usuário");
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="admin-panel animate-fadeIn">
      <header className="admin-header">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="back-button-circular"
              onClick={onBack}
              title="Sair da Administração"
            >
              <LogOut size={18} />
            </button>

            <div className="admin-title-group">
              <h1 className="text-xl font-bold">Configurações do Sistema</h1>
              <p className="text-xs text-muted">Acessos e permissões</p>
            </div>
          </div>

          <div className="admin-status-badge">
            <span className="status-dot"></span>
            Interface Administrador
          </div>
        </div>
      </header>

      <div className="admin-content-grid container">
        <UserForm
          editingUser={editingUser}
          nome={nome}
          setNome={setNome}
          role={role}
          setRole={setRole}
          permissoes={permissoes}
          setPermissoes={setPermissoes}
          active={active}
          setActive={setActive}
          salvarUsuario={salvarUsuario}
          cancelarEdicao={resetForm}
        />

        <div className="admin-col-list">
          <section className="admin-card">
            <div className="admin-card-header">
              <div className="card-icon">
                <User size={18} />
              </div>
              <h3 className="text-md font-bold">Equipe Cadastrada</h3>
            </div>

            <UserTable users={users} onEdit={editarUsuario} />
          </section>
        </div>
      </div>
    </div>
  );
}
