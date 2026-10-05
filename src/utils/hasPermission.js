import {
  EXECUTION_PERMISSIONS,
  MANAGEMENT_PERMISSIONS,
} from "../utils/permissions";

const ALL_PERMISSIONS = [
  ...EXECUTION_PERMISSIONS,
  ...MANAGEMENT_PERMISSIONS,
].map((p) => p.key);

export function hasPermission(user, key) {
  if (user?.role === "admin") return true;
  return user?.permissoes?.includes(key);
}

export const canLiberarEtapas = (user) =>
  user?.permissoes?.includes("liberar_etapas");

export const canManageUsers = (user) => hasPermission(user, "alocar_usuario");
export const canApprove = (user) => hasPermission(user, "aprovar");
export const canEditFicha = (user) => hasPermission(user, "editar_ficha");
export const canDeleteFicha = (user) => hasPermission(user, "excluir_ficha");
export const canGeneratePdf = (user) => hasPermission(user, "gerar_pdf");
export const canViewQrCode = (user) => hasPermission(user, "ver_qrcode");
