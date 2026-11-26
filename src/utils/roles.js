export function cargosDe(user) {
  if (!user) return [];

  if (Array.isArray(user.cargos)) {
    const lista = user.cargos.filter(Boolean);
    if (lista.length > 0) return lista;
  }

  const role = String(user.role || "").trim();
  if (role && role !== "admin") return [role];

  return [];
}

// "tem cargo X?" — ex.: temCargo(user, "taf")
export function temCargo(user, cargo) {
  return cargosDe(user).includes(cargo);
}

// "tem pelo menos um destes cargos?"
export function temAlgumCargo(user, cargosLista) {
  const cargos = cargosDe(user);
  return cargosLista.some((c) => cargos.includes(c));
}

// "é admin?" (papel global, decisão à parte)
export function ehAdmin(user) {
  return user?.role === "admin";
}

// União dos presets de vários cargos (usado no UserForm).
export function presetsDeCargos(cargos, ROLE_PRESETS) {
  const set = new Set();
  (cargos || []).forEach((c) => {
    (ROLE_PRESETS[c] || []).forEach((p) => set.add(p));
  });
  return [...set];
}
