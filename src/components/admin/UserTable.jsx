import { Settings } from "lucide-react";

export default function UserTable({ users, onEdit }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Colaborador</th>
            <th>Usuário</th>
            <th>Cargo</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
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
                <span className={`role-badge role-${user.role}`}>
                  {user.role}
                </span>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
