import { UserPlus } from "lucide-react";
import { agruparUsuariosPorCargo, getRoleColor } from "../../utils/roleColors";

export default function OperatorSelector({
  ficha,
  operadores = [],
  listaUsuarios = [],
  user,
  activeDropdownFichaId,
  setActiveDropdownFichaId,
  onToggleOperador,
}) {
  const usuariosFiltrados = listaUsuarios.filter(
    (u) => u.nome !== ficha.criadoPor && u.username !== "master",
  );

  const grupos = agruparUsuariosPorCargo(usuariosFiltrados);

  return (
    <div style={{ position: "relative" }}>
      <button
        className="op-add-btn"
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "50%",
          border: "1px dashed var(--text-secondary)",
          background: "transparent",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          outline: "none",
        }}
        onClick={(e) => {
          e.stopPropagation();
          setActiveDropdownFichaId(
            activeDropdownFichaId === ficha.dbId ? null : ficha.dbId,
          );
        }}
        title="Vincular Operadores"
      >
        <UserPlus size={13} />
      </button>

      {activeDropdownFichaId === ficha.dbId && (
        <div
          className="animate-scaleIn op-dropdown"
          style={{
            position: "absolute",
            right: 0,
            top: "30px",
            width: "200px",
            maxHeight: "260px",
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xs)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 99,
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          <div
            className="op-dropdown-titulo"
            style={{
              padding: "4px 10px",
              fontSize: "10px",
              color: "var(--text-secondary)",
              fontWeight: "bold",
              borderBottom: "1px solid var(--border)",
              textTransform: "uppercase",
            }}
          >
            Escalar Equipe
          </div>

          {grupos.map((grupo) => (
            <div key={grupo.role}>
              <div
                className="op-grupo-label"
                style={{
                  padding: "5px 10px 3px",
                  fontSize: "9px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  color: grupo.color,
                  letterSpacing: "0.03em",
                }}
              >
                {grupo.label}
              </div>

              {grupo.usuarios.map((u) => {
                const ativo = operadores.some(
                  (op) => op.id === u.id || op.username === u.username,
                );

                return (
                  <button
                    key={u.id}
                    className="op-item"
                    onClick={(e) => onToggleOperador(e, ficha, u)}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      fontSize: "12px",
                      textAlign: "left",
                      background: ativo ? `${grupo.color}22` : "transparent",
                      color: ativo ? grupo.color : "var(--text-secondary)",
                      border: "none",
                      borderLeft: `3px solid ${grupo.color}`,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flex: 1,
                        overflow: "hidden",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: grupo.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {u.nome || u.username}
                      </span>
                    </span>

                    {ativo && (
                      <span className="op-check" style={{ fontSize: "9px" }}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {usuariosFiltrados.length === 0 && (
            <div
              style={{
                padding: "6px 10px",
                fontSize: "11px",
                color: "var(--text-secondary)",
                fontStyle: "italic",
              }}
            >
              Sem usuários carregados
            </div>
          )}
        </div>
      )}
    </div>
  );
}
