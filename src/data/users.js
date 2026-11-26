export const ROLES = {
  admin: "Administrador (SuperAdmin)",
  montagem: "Montagem Mecânica",
  cabeamento: "Cabeamento",
  barramento: "Barramento",
  taf: "Técnico TAF",
};

// Lista dos cargos operacionais (admin fica de fora — é papel global).
export const CARGO_OPTIONS = [
  { value: "montagem", label: "Montagem Mecânica" },
  { value: "barramento", label: "Barramento" },
  { value: "cabeamento", label: "Cabeamento" },
  { value: "taf", label: "Técnico TAF" },
  { value: "admin", label: "Administrador" },
];

export const ROLE_PRESETS = {
  montagem: ["taf", "controle", "fotos"],

  cabeamento: [
    "taf",
    "controle",
    "fotos",
    "aprovar",
    "rejeitar",
    "ver_aprovacao",
  ],

  barramento: ["ver_enviadas", "rejeitar", "editar_ficha"],

  taf: ["taf"],

  admin: [
    "taf",
    "controle",
    "fotos",
    "aprovar",
    "rejeitar",
    "ver_aprovacao",
    "ver_enviadas",
    "ver_tudo",
    "editar_ficha",
  ],
};
