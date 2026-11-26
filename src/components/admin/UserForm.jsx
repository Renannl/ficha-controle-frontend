import { User } from "lucide-react";
import {
  EXECUTION_PERMISSIONS,
  MANAGEMENT_PERMISSIONS,
} from "../../utils/permissions";
import { CARGO_OPTIONS, ROLE_PRESETS } from "../../data/users";
import { presetsDeCargos } from "../../utils/roles";
import PermissionGroup from "./PermissionGroup";

export default function UserForm({
  editingUser,
  nome,
  setNome,
  cargos,
  setCargos,
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

  function handleCargoChange(cargo) {
    const novosCargos = cargos.includes(cargo)
      ? cargos.filter((c) => c !== cargo)
      : [...cargos, cargo];

    setCargos(novosCargos);
    setPermissoes(presetsDeCargos(novosCargos, ROLE_PRESETS));
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

          {/* ── CARGO(S) MÚLTIPLOS ─────────────────────────────── */}
          <div className="form-row">
            <label className="field-label">
              Cargo(s) / Função(ões)
            </label>

            <div className="multi-cargos-box">
              {CARGO_OPTIONS.map((c) => {
                const checked = cargos.includes(c.value);
                return (
                  <label
                    key={c.value}
                    className={`cargo-chip ${checked ? "cargo-chip--checked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleCargoChange(c.value)}
                    />
                    <span className={`role-badge role-${c.value}`}>
                      {c.label}
                    </span>
                  </label>
                );
              })}
            </div>

            {cargos.length === 0 && (
              <p className="field-warning">
                Nenhum cargo marcado — a pessoa não conseguirá trabalhar em
                etapas de produção até escolher ao menos um.
              </p>
            )}
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
