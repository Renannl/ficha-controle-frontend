import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./hooks/useAuth";
import { useFichas } from "./hooks/useFichas";
import LoginScreen from "./components/LoginScreen";
import HomeScreen from "./components/home/HomeScreen";
import AdminPanel from "./components/admin/AdminPanel";
import FichaView from "./components/ficha/FichaView";
import PainelPublicoView from "./components/publico/PainelPublicoView";
import { useColecoes } from "./hooks/useColecoes";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ModalAssinaturaObrigatoria from "./components/signatures/ModalAssinaturaObrigatoria";
import PermissaoNotificacoes from "./native/PermissaoNotificacoes";
import Despedida, { DURACAO_TELA_MS } from "./components/Despedida";
import "./App-v2.css";
import "./responsivo.css";
import "./marca.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const SECTOR_ROLES = ["barramento", "montagem", "cabeamento"];
const LIDER_USERNAME = "heveraldo";

export default function App() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const {
    fichas,
    isLoading,
    criarFicha,
    atualizarFicha,
    excluirFicha,
    getFicha,
    atualizarOperadores,
    recarregarFichas,
  } = useFichas(user);
  const { colecoes } = useColecoes();
  const navigate = useNavigate();

  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const carregouUsuarios = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      carregouUsuarios.current = false;
      return;
    }

    async function carregarUsuarios() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_URL}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("[App] Erro ao carregar usuários:", response.status);
          if (response.status === 401) {
            setTimeout(() => carregarUsuarios(), 1000);
          }
          return;
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          console.log("[App] ✅ Usuários carregados:", data.length);
          setUsuarios(data);
        } else {
          console.warn("[App] ⚠️ Resposta não é array:", data);
          setUsuarios([]);
        }
      } catch (error) {
        console.error("[App] Erro ao carregar usuários:", error);
      }
    }

    carregarUsuarios();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!showWelcome) return;
    const t = setTimeout(() => {
      setShowWelcome(false);
      navigate("/dashboard");
    }, DURACAO_TELA_MS);
    return () => clearTimeout(t);
  }, [showWelcome]);

  const [despedida, setDespedida] = useState(null);
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const finalizarSaida = useCallback(() => logoutRef.current(), []);
  const handleLogout = useCallback(
    () => setDespedida({ motivo: "saida", nome: user?.nome || "" }),
    [user],
  );

  function formatNome(username) {
    if (!username) return "";
    return username
      .split(".")
      .map(
        (p) =>
          p.charAt(0).toLocaleUpperCase("pt-BR") +
          p.slice(1).toLocaleLowerCase("pt-BR"),
      )
      .join(" ");
  }

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const handleUserUpdated = useCallback((usuarioAtualizado) => {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === usuarioAtualizado.id ? { ...u, ...usuarioAtualizado } : u,
      ),
    );
  }, []);

  const deveAssinarApr =
    SECTOR_ROLES.includes(user?.role) || user?.username === LIDER_USERNAME;
  if (isLoading && !showWelcome && !despedida) {
    return (
      <div
        className="loading-screen"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg-base)",
          color: "var(--text-primary)",
          gap: "16px",
        }}
      >
        <div className="login-spinner" />
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Carregando fichas...
        </p>
      </div>
    );
  }

  if (despedida) {
    return <Despedida dados={despedida} onFim={finalizarSaida} />;
  }

  if (showWelcome) {
    return (
      <div className="welcome-screen">
        <img src="/brand/gestor-de-fichas-vertical.svg" alt="Gestor de Fichas" className="welcome-logo marca-clara" />
        <img src="/brand/gestor-de-fichas-vertical-negativo.svg" alt="" aria-hidden="true" className="welcome-logo marca-escura" />
        <h1 className="welcome-text">Bem-vindo, {welcomeUser}</h1>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginScreen
              onLogin={async (u, s) => {
                const success = await login(u, s);
                if (success) {
                  setWelcomeUser(formatNome(u));
                  setShowWelcome(true);
                }
                return success;
              }}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  const TIPO_PARA_OPERACAO = {
    taf: "50",
    producao: "10",
    fotos: "80",
    controle: "80",
    qualidade: "90",
  };

  function handleOpen(id, colecaoId = null) {
    if (colecaoId) {
      navigate(`/colecao/${colecaoId}/ficha/${id}`);
    } else {
      navigate(`/dashboard/ficha/${id}`);
    }
  }

  async function handleNova(
    tipo,
    colecaoId = null,
    fichaProducao = null,
    tipoFotografico = null,
  ) {
    const operacaoCodigo = TIPO_PARA_OPERACAO[tipo] ?? tipo;

    const dadosIniciais = {};
    if (fichaProducao) {
      dadosIniciais.numeroInd = fichaProducao.numeroInd;
      dadosIniciais.nomeEquipamento = fichaProducao.nomeEquipamento;
      dadosIniciais.obra = fichaProducao.obra;
      dadosIniciais.tag = fichaProducao.tag;
      dadosIniciais.cliente = fichaProducao.cliente;
      dadosIniciais.tipoPainel = fichaProducao.tipoPainel;
    }
    if (tipoFotografico) {
      dadosIniciais.tipoFotografico = tipoFotografico;
    }

    const id = await criarFicha(
      operacaoCodigo,
      colecaoId,
      dadosIniciais,
      fichaProducao?.dbId ?? null,
    );
    if (!id) return;

    navigate(
      colecaoId
        ? `/colecao/${colecaoId}/ficha/${id}`
        : `/dashboard/ficha/${id}`,
    );
  }

  function handleDelete(e, id) {
    e?.stopPropagation?.();
    excluirFicha(id);
  }

  return (
    <>
      {deveAssinarApr && <ModalAssinaturaObrigatoria />}
      <PermissaoNotificacoes />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />

        <Route path="/login" element={<Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={
            <div className="app">
              <HomeScreen
                fichas={fichas}
                onFichasAtualizadas={recarregarFichas}
                onNova={handleNova}
                listaUsuarios={usuarios}
                onOpen={handleOpen}
                onDelete={handleDelete}
                onAtualizarFicha={atualizarFicha}
                onAtualizarOperadores={atualizarOperadores}
                user={user}
                onLogout={handleLogout}
                theme={theme}
                onToggleTheme={toggleTheme}
                onOpenAdmin={() => navigate("/admin")}
              />
            </div>
          }
        />

        <Route
          path="/colecao/:colecaoId"
          element={
            <div className="app">
              <HomeScreen
                fichas={fichas}
                onFichasAtualizadas={recarregarFichas}
                onNova={handleNova}
                listaUsuarios={usuarios}
                onOpen={handleOpen}
                onDelete={handleDelete}
                onAtualizarOperadores={atualizarOperadores}
                user={user}
                onLogout={handleLogout}
                theme={theme}
                onToggleTheme={toggleTheme}
                onOpenAdmin={() => navigate("/admin")}
              />
            </div>
          }
        />
        <Route
          path="/dashboard/ficha/:fichaId"
          element={
            <FichaView
              user={user}
              fichas={fichas}
              atualizarFicha={atualizarFicha}
              getFicha={getFicha}
              excluirFicha={excluirFicha}
              origem="dashboard"
            />
          }
        />

        <Route
          path="/colecao/:colecaoId/ficha/:fichaId"
          element={
            <FichaView
              user={user}
              fichas={fichas}
              atualizarFicha={atualizarFicha}
              getFicha={getFicha}
              excluirFicha={excluirFicha}
              origem="colecao"
            />
          }
        />

        <Route
          path="/admin"
          element={
            user?.role === "admin" ? (
              <AdminPanel
                onBack={() => navigate("/dashboard")}
                onUserUpdated={handleUserUpdated}
              />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />

        <Route path="/publico/painel/:token" element={<PainelPublicoView />} />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  );
}
