import { User } from "lucide-react";

import {
  EXECUTION_PERMISSIONS,
  MANAGEMENT_PERMISSIONS,
} from "../../utils/permissions";

import { ROLES, ROLE_PRESETS } from "../../data/users";
import PermissionGroup from "./PermissionGroup";

export default function UserForm({
  editingUser,
  nome,
  setNome,
  role,
  setRole,
  permissoes,
  setPermissoes,
  active,
  setActive,
  salvarUsuario,
  cancelarEdicao,
}) {
  function togglePermission(perm) {
    setPermissoes((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  }

  function handleRoleChange(newRole) {
    setRole(newRole);

    const preset = ROLE_PRESETS[newRole] || [];

    setPermissoes(preset);
  }

  return (
    <div className="admin-col-form">
      <section className="admin-card card-glow">
        <div className="admin-card-header">
          <div className="card-icon">
            <User size={18} />
          </div>

          <h3 className="text-md font-bold">
            {editingUser ? "Editar Usuário" : "Selecione um usuário"}
          </h3>
        </div>

        <div className="admin-form-body">
          <div className="form-row">
            <label className="field-label">Nome de Exibição</label>

            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              className="admin-input"
            />
          </div>

          <div className="form-row">
            <label className="field-label">Cargo / Função</label>

            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="admin-select"
            >
              {Object.entries(ROLES).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label className="field-label">Status do Usuário</label>

            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />

              <span className="switch-slider"></span>

              <span className="switch-label">
                {active ? "Ativo" : "Desativado"}
              </span>
            </label>
          </div>

          <div className="permissions-box">
            <PermissionGroup
              title="Módulos de Execução"
              permissions={EXECUTION_PERMISSIONS}
              selectedPermissions={permissoes}
              onToggle={togglePermission}
            />

            <PermissionGroup
              title="Permissões de Visibilidade e Gestão"
              permissions={MANAGEMENT_PERMISSIONS}
              selectedPermissions={permissoes}
              onToggle={togglePermission}
              gridStyle={{
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              }}
            />
          </div>
        </div>

        <div className="form-actions mt-6">
          <button className="btn-admin-submit" onClick={salvarUsuario}>
            Salvar Alterações
          </button>

          {editingUser && (
            <button className="btn-admin-cancel" onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
