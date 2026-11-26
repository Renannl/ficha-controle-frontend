import { Settings } from "lucide-react";
import { cargosDe } from "../../utils/roles";

export default function UserTable({ users, onEdit }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Colaborador</th>
            <th>Usuário</th>
            <th>Cargo(s)</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const cargos = cargosDe(user);

            return (
              <tr key={user.id}>
                <td>
                  {user.nome ||
                    user.username
                      ?.split(".")
                      .map(
                        (parte) =>
                          parte.charAt(0).toUpperCase() +
                          parte.slice(1).toLowerCase(),
                      )
                      .join(" ")}
                </td>

                <td className="user-column">{user.username}</td>

                <td>
                  {cargos.length === 0 ? (
                    <span className="role-badge" style={{ opacity: 0.5 }}>
                      sem cargo
                    </span>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {cargos.map((c) => (
                        <span key={c} className={`role-badge role-${c}`}>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </td>

                <td>
                  <span
                    className={`status-badge ${
                      user.active ? "status-active" : "status-disabled"
                    }`}
                  >
                    {user.active ? "ATIVO" : "DESATIVADO"}
                  </span>
                </td>

                <td>
                  {user.username !== "master" && (
                    <button
                      className="btn-edit-user"
                      onClick={() => onEdit(user)}
                    >
                      <Settings color="currentColor" size={16} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
