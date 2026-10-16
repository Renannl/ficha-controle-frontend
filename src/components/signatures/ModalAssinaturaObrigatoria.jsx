import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.101.60:3001";

const LIDER_USERNAME = "heveraldo.bispo";
const SETORES_TODOS = ["barramento", "montagem", "cabeamento"];

const INTERVALO_RECHECK = 15000;

const NOME_SETOR = {
  barramento: "Barramento",
  montagem: "Montagem (Estrutura)",
  cabeamento: "Cabeamento",
};

function getRoleFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch {
    return null;
  }
}

function getUsernameFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username;
  } catch {
    return null;
  }
}

export default function ModalAssinaturaObrigatoria() {
  const canvasRef = useRef(null);
  const [carregando, setCarregando] = useState(true);
  const [assinando, setAssinando] = useState(false);
  const [erro, setErro] = useState("");
  const [documentoHtml, setDocumentoHtml] = useState("");
  const [concordou, setConcordou] = useState(false);
  const [assinouAlgo, setAssinouAlgo] = useState(false);

  const usuario = getUsernameFromToken();
  const ehLider = usuario === LIDER_USERNAME;

  const [role, setRole] = useState(null);
  const setoresParaAssinar = ehLider ? SETORES_TODOS : role ? [role] : [];

  const [setorAtivo, setSetorAtivo] = useState(null);
  const [status, setStatus] = useState({});
  const [assinados, setAssinados] = useState([]);

  const assinandoRef = useRef(false);
  const assinouAlgoRef = useRef(false);
  useEffect(() => {
    assinandoRef.current = assinando;
  }, [assinando]);
  useEffect(() => {
    assinouAlgoRef.current = assinouAlgo;
  }, [assinouAlgo]);

  const carregarStatus = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let roleAtual = getRoleFromToken();
    try {
      const perfilRes = await fetch(`${API_URL}/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (perfilRes.ok) {
        const perfilData = await perfilRes.json();
        roleAtual = perfilData.user?.role || roleAtual;
      }
    } catch {
    }
    setRole(roleAtual);

    const setores = ehLider ? SETORES_TODOS : [roleAtual];

    const resultados = await Promise.all(
      setores.map((setor) =>
        fetch(`${API_URL}/assinaturas/atual?setor=${setor}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((data) => ({ setor, ...data }))
          .catch(() => ({ setor, erro: true })),
      ),
    );

    const novo = {};
    resultados.forEach((r) => {
      novo[r.setor] = r;
    });
    setStatus(novo);

    if (!assinandoRef.current && !assinouAlgoRef.current) {
      const pendente = resultados.find((r) => !r.jaAssinou && r.evento);
      setSetorAtivo(pendente ? pendente.setor : null);
    }

    setCarregando(false);
  }, [ehLider]);

  useEffect(() => {
    carregarStatus();
    const interval = setInterval(carregarStatus, INTERVALO_RECHECK);
    const aoFocar = () => carregarStatus();
    window.addEventListener("focus", aoFocar);
    document.addEventListener("visibilitychange", aoFocar);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", aoFocar);
      document.removeEventListener("visibilitychange", aoFocar);
    };
  }, [carregarStatus]);

  function recortarAssinatura(canvas) {
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    const pixels = ctx.getImageData(0, 0, width, height).data;

    let minX = width,
      minY = height,
      maxX = -1,
      maxY = -1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const red = pixels[(y * width + x) * 4];
        if (red < 200) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < 0) return null;

    const margem = 10;
    minX = Math.max(0, minX - margem);
    minY = Math.max(0, minY - margem);
    maxX = Math.min(width, maxX + margem);
    maxY = Math.min(height, maxY + margem);

    const largura = maxX - minX;
    const altura = maxY - minY;

    const recortado = document.createElement("canvas");
    recortado.width = largura;
    recortado.height = altura;
    recortado
      .getContext("2d")
      .drawImage(canvas, minX, minY, largura, altura, 0, 0, largura, altura);

    return recortado;
  }

  const evento = setorAtivo ? status[setorAtivo]?.evento : null;

  useEffect(() => {
    if (!evento || !setorAtivo) return;
    const token = localStorage.getItem("token");

    setDocumentoHtml("");
    fetch(`${API_URL}/assinaturas/documento?setor=${setorAtivo}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setDocumentoHtml(data.html || ""))
      .catch(() => setDocumentoHtml(""));
  }, [setorAtivo]);

  useEffect(() => {
    if (!evento) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = 600;
    canvas.height = 200;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    const estado = { ultimo: null, desenhando: false };

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height),
      };
    };

    const iniciar = (e) => {
      e.preventDefault();
      estado.desenhando = true;
      estado.ultimo = getPos(e);
    };

    const mover = (e) => {
      if (!estado.desenhando) return;
      e.preventDefault();
      const p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(estado.ultimo.x, estado.ultimo.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      estado.ultimo = p;
      setAssinouAlgo(true);
    };

    const parar = () => {
      estado.desenhando = false;
    };

    canvas.addEventListener("mousedown", iniciar);
    canvas.addEventListener("mousemove", mover);
    canvas.addEventListener("mouseup", parar);
    canvas.addEventListener("mouseleave", parar);
    canvas.addEventListener("touchstart", iniciar, { passive: false });
    canvas.addEventListener("touchmove", mover, { passive: false });
    canvas.addEventListener("touchend", parar);

    return () => {
      canvas.removeEventListener("mousedown", iniciar);
      canvas.removeEventListener("mousemove", mover);
      canvas.removeEventListener("mouseup", parar);
      canvas.removeEventListener("mouseleave", parar);
      canvas.removeEventListener("touchstart", iniciar);
      canvas.removeEventListener("touchmove", mover);
      canvas.removeEventListener("touchend", parar);
    };
  }, [evento?.id, setorAtivo]);

  const limpar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setAssinouAlgo(false);
  };

  const confirmar = async () => {
    if (!concordou) {
      setErro("Você precisa ler e marcar que está ciente da APR.");
      return;
    }

    const canvas = canvasRef.current;
    const recortado = recortarAssinatura(canvas);
    if (!recortado) {
      setErro("Desenhe sua assinatura antes de confirmar.");
      return;
    }

    const dataUrl = recortado.toDataURL("image/png");

    setAssinando(true);
    setErro("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/assinaturas/${evento.id}/assinar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assinaturaDataUrl: dataUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao assinar");
      }

      const novosAssinados = [...assinados, setorAtivo];
      setAssinados(novosAssinados);

      const proximo = setoresParaAssinar.find(
        (s) => !novosAssinados.includes(s) && !status[s]?.jaAssinou,
      );

      setConcordou(false);
      limpar();
      setAssinando(false);

      if (proximo) {
        setSetorAtivo(proximo);
      } else {
        window.location.reload();
      }
    } catch (err) {
      setErro(err.message);
      setAssinando(false);
    }
  };

  if (carregando) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div className="login-spinner" />
        <p>Verificando assinatura da APR...</p>
      </div>
    );
  }

  if (!evento) return null;

  const setorJaAssinado = (s) => status[s]?.jaAssinou || assinados.includes(s);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "var(--bg-card, #fff)",
          borderRadius: "12px",
          maxWidth: "820px",
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            background: "#1976d2",
            color: "#fff",
            padding: "18px 24px",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px" }}>
            APR Semanal Obrigatória
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: "13px", opacity: 0.95 }}>
            {evento.titulo}
          </p>
        </div>

        {ehLider && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "center",
              padding: "12px",
              borderBottom: "1px solid var(--border, #eee)",
              flexShrink: 0,
            }}
          >
            {SETORES_TODOS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSetorAtivo(s);
                  setConcordou(false);
                  limpar();
                  setErro("");
                }}
                disabled={setorJaAssinado(s)}
                style={{
                  padding: "8px 16px",
                  border: setorAtivo === s ? "none" : "1px solid #1976d2",
                  background: setorAtivo === s ? "#1976d2" : "#fff",
                  color: setorAtivo === s ? "#fff" : "#1976d2",
                  borderRadius: "6px",
                  cursor: setorJaAssinado(s) ? "not-allowed" : "pointer",
                  opacity: setorJaAssinado(s) ? 0.5 : 1,
                  fontWeight: setorAtivo === s ? "bold" : "normal",
                }}
              >
                {setorJaAssinado(s) ? `${NOME_SETOR[s]}` : NOME_SETOR[s]}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: "24px", overflowY: "auto" }}>
          <h3
            style={{ margin: "0 0 10px", fontSize: "15px", color: "#1976d2" }}
          >
            Leia o documento antes de assinar:
          </h3>

          <div
            style={{
              border: "1px solid var(--border, #ccc)",
              borderRadius: "8px",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {documentoHtml ? (
              <iframe
                srcDoc={documentoHtml}
                title="Documento APR"
                style={{
                  width: "100%",
                  height: "min(380px, 55vh)",
                  border: "none",
                }}
              />
            ) : (
              <p
                style={{
                  padding: "20px",
                  color: "#999",
                  textAlign: "center",
                  fontSize: "13px",
                }}
              >
                Carregando documento...
              </p>
            )}
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              marginTop: "16px",
              fontSize: "13px",
              color: "var(--text-primary, #333)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={concordou}
              onChange={(e) => setConcordou(e.target.checked)}
              style={{ marginTop: "2px", cursor: "pointer" }}
            />
            <span>
              Declaro que <strong>li e estou ciente</strong> dos riscos, das
              medidas de controle e dos procedimentos descritos nesta APR
              Semanal.
            </span>
          </label>

          {ehLider && (
            <p
              style={{
                color: "#1976d2",
                fontSize: "13px",
                fontWeight: "bold",
                margin: "12px 0 0",
              }}
            >
              Você é o <strong>Responsável pela atividade (Líder)</strong>. Sua
              assinatura será registrada no campo do responsável.
            </p>
          )}

          <div style={{ marginTop: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary, #333)",
                marginBottom: "8px",
              }}
            >
              Sua assinatura:
            </label>
            <div className="signature-canvas-wrap">
              <canvas ref={canvasRef} className="signature-canvas" />
              {!assinouAlgo && (
                <div className="signature-placeholder">
                  <span>Assine aqui com o mouse ou dedo</span>
                </div>
              )}
            </div>
          </div>

          {erro && (
            <p
              style={{ color: "#d32f2f", marginTop: "10px", fontSize: "13px" }}
            >
              {erro}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "16px",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={limpar}
              disabled={assinando}
              className="btn-ghost"
              style={{ padding: "10px 20px", fontSize: "14px" }}
            >
              Limpar
            </button>
            <button
              onClick={confirmar}
              disabled={assinando || !concordou}
              style={{
                padding: "10px 24px",
                border: "none",
                background: assinando || !concordou ? "#999" : "#2e7d32",
                color: "#fff",
                borderRadius: "8px",
                cursor: assinando || !concordou ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                transition: "all 0.15s ease",
              }}
            >
              {assinando ? "Enviando..." : "Confirmar Assinatura"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
