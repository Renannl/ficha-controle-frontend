export const INITIAL_USERS = [
  {
    username: "zuerlan",
    password: "23",
    displayName: "Zuerlan Lirio",
    role: "admin",
    permissions: ["all"],
  },
  {
    username: "1",
    password: "23",
    displayName: "Usuário Montagem",
    role: "montagem",
    permissions: ["taf", "controle", "fotos"],
  },
];

export const ROLES = {
  admin: "Administrador (SuperAdmin)",
  montagem: "Montagem Mecânica",
  cabeamento: "Cabeamento",
  barramento: "Barramento",
  taf: "Técnico TAF",
};

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
