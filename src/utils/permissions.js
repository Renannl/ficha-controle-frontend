import {
  Zap,
  ClipboardList,
  Camera,
  Eye,
  Mail,
  Clock3,
  Pencil,
  ShieldCheck,
  ShieldX,
  UserPlus,
  Trash,
  QrCode,
} from "lucide-react";

import { FaFilePdf } from "react-icons/fa";

export const EXECUTION_PERMISSIONS = [
  {
    key: "taf",
    label: "TAF",
    icon: Zap,
  },
  {
    key: "controle",
    label: "Controle",
    icon: ClipboardList,
  },
  {
    key: "fotos",
    label: "Fotos",
    icon: Camera,
  },
];

export const MANAGEMENT_PERMISSIONS = [
  { key: "ver_tudo", label: "Ver todas as fichas", icon: Eye },
  { key: "ver_enviadas", label: "Ver fichas enviadas", icon: ClipboardList },
  { key: "ver_aprovacao", label: "Ver fichas em aprovação", icon: Clock3 },
  { key: "aprovar", label: "Aprovar fichas", icon: ShieldCheck },
  { key: "rejeitar", label: "Rejeitar fichas", icon: ShieldX },
  { key: "editar_ficha", label: "Editar fichas", icon: Pencil },
  { key: "excluir_ficha", label: "Excluir fichas", icon: Trash },
  { key: "gerar_pdf", label: "Gerar PDF", icon: FaFilePdf },
  { key: "ver_qrcode", label: "Ver QR Code", icon: QrCode },
  { key: "ver_historico", label: "Ver histórico/timeline", icon: Clock3 },
];
