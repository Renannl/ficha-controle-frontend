import { ROLES } from "../../data/users";
import { getRoleColor } from "../../utils/roleColors";
import NotificationBell from "./NotificationBell";
import {
  Moon,
  Sun,
  Settings,
  LogOut,
  ClipboardList,
  Clock3,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

function obterSaudacao() {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function HomeHeader({
  user,
  theme,
  onToggleTheme,
  onOpenAdmin,
  onLogout,
  stats,
}) {
  const saudacao = obterSaudacao();
  const primeiroNome = (user?.nome || "Usuário").split(" ")[0];
  const roleColor = getRoleColor(user?.role) || "#64748b";

  const dataHoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const statCards = [
    {
      label: "Total",
      value: stats?.total ?? 0,
      Icon: ClipboardList,
      className: "stat-total",
    },
    {
      label: "Em andamento",
      value: stats?.emAndamento ?? 0,
      Icon: Clock3,
      className: "stat-andamento",
    },
    {
      label: "Concluídas",
      value: stats?.concluidas ?? 0,
      Icon: CheckCircle2,
      className: "stat-concluida",
    },
  ];

  return (
    <>
      <div className="user-bar">
        <div className="user-info">
          <div className="user-avatar" style={{ background: roleColor }}>
            {(user?.nome || "?")[0].toUpperCase()}
          </div>

          <div className="user-identity">
            <div className="user-name">{user?.nome || "Usuário"}</div>

            {user?.role && (
              <span
                className="user-role-badge"
                style={{
                  background: `${roleColor}1f`,
                  color: roleColor,
                }}
              >
                {ROLES[user.role] || user.role}
              </span>
            )}
          </div>
        </div>

        <div className="user-actions">
          <NotificationBell />{" "}

          <button
            className="icon-btn"
            onClick={onToggleTheme}
            title={theme === "light" ? "Modo escuro" : "Modo claro"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {user?.role === "admin" && (
            <button
              className="icon-btn"
              onClick={onOpenAdmin}
              title="Administração"
            >
              <Settings size={18} />
            </button>
          )}

          <button className="icon-btn icon-btn--logout" onClick={onLogout} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="home-header">
        <div className="home-header-left">
          <div className="home-brand">
            <img src="/brand/gestor-de-fichas-simbolo.svg" alt="Gestor de Fichas" className="home-logo-img marca-clara" />
            <img src="/brand/gestor-de-fichas-simbolo-negativo.svg" alt="" aria-hidden="true" className="home-logo-img marca-escura" />
            <h1>Ficha de Controle</h1>
          </div>

          <div className="home-greeting">
            <span className="home-greeting-title">
              {saudacao}, {primeiroNome}
            </span>
            <span className="home-greeting-date">
              <CalendarDays size={14} />
              {dataHoje}
            </span>
          </div>
        </div>

        <div className="home-stats">
          {statCards.map(({ label, value, Icon, className }) => (
            <div key={label} className={`stat-card ${className}`}>
              <span className="stat-icon">
                <Icon size={18} />
              </span>
              <div className="stat-body">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
