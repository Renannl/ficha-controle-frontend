export const ROLE_COLORS = {
  admin: "#5b8def",
  montagem: "#f8bc5a",
  barramento: "#5969f3",
  cabeamento: "#4e944e",
  taf: "#2fa6b5",
};

export const ROLE_LABELS = {
  admin: "Administradores",
  montagem: "Montagem",
  barramento: "Barramento",
  cabeamento: "Cabeamento",
  taf: "Técnico TAF",
};

const ROLE_ORDER = [
  "montagem",
  "barramento",
  "cabeamento",
  "taf",
  "admin",
];

export function getRoleColor(role) {
  return ROLE_COLORS[role] || "#8a8f98";
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || "Outros";
}

export function agruparUsuariosPorCargo(listaUsuarios = []) {
  const grupos = {};
  listaUsuarios.forEach((usuario) => {
    const role = usuario.role || "montagem";
    if (!grupos[role]) {
      grupos[role] = {
        role,
        label: getRoleLabel(role),
        color: getRoleColor(role),
        usuarios: [],
      };
    }
    grupos[role].usuarios.push(usuario);
  });

  return Object.values(grupos).sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
  );
}
