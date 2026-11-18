import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

const ETAPAS_ORDER = ["montagem", "barramento", "cabeamento"];

const ETAPA_LABELS = {
  montagem: "Montagem",
  barramento: "Barramento",
  cabeamento: "Cabeamento",
};

function formatarDataHora(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return (
      d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  } catch {
    return "";
  }
}

function etapaDeItemId(id) {
  const s = String(id || "");
  if (s.startsWith("mm-")) return "montagem";
  if (s.startsWith("bar-")) return "barramento";
  if (s.startsWith("cab-")) return "cabeamento";
  return null;
}

function valorLegivel(valor) {
  const v = String(valor || "").toLowerCase();
  if (v === "ok") return { texto: "OK", cor: "#16a34a", bg: "#dcfce7" };
  if (v === "na") return { texto: "N/A", cor: "#9333ea", bg: "#f3e8ff" };
  if (v === "erro" || v === "erro_critico")
    return { texto: "ERRO", cor: "#dc2626", bg: "#fee2e2" };
  if (v === "feito")
    return { texto: "Concluído", cor: "#2563eb", bg: "#dbeafe" };
  return { texto: valor || "—", cor: "#475569", bg: "#f1f5f9" };
}

function descricaoDoItem(checklistItems, id) {
  const item = (checklistItems || []).find((c) => c.id === id);
  if (item?.descricao) return item.descricao;
  const s = String(id || "");
  if (s.startsWith("ver-")) {
    const etapaKey = s.replace("ver-", "").split("-")[0];
    const idx = parseInt(s.split("-").pop(), 10) + 1;
    return `Verificação ${idx} — ${ETAPA_LABELS[etapaKey] || "Etapa"}`;
  }
  return id || "Item";
}

export default function GavetaHistoricoList({
  items = [],
  verificacoes = {},
  verificacoesMeta = {},
  checklistItems = [],
}) {
  const [gruposAbertos, setGruposAbertos] = useState({});
  const [ordenacao, setOrdenacao] = useState("recente"); // "recente" | "categoria"

  // ── Monta todos os registros ──────────────────────────────────────
  const registros = useMemo(() => {
    const todos = [];

    // 1) Resultados (ok/na/erro) dos itens do checklist
    (Array.isArray(items) ? items : []).forEach((item) => {
      const etapa = etapaDeItemId(item.id);
      if (!item.resultado) return;

      // Prioridade: metadata embutida > meta array > sem data
      const marcadoEm = item.marcadoEm || "";
      const marcadoPor = item.marcadoPor || "";

      todos.push({
        id: `res-${item.id}`,
        tipo: "resultado",
        etapa: etapa || "_sem_etapa",
        categoria: ETAPA_LABELS[etapa] || "Sem categoria",
        quando: marcadoEm,
        usuario: marcadoPor,
        descricao: descricaoDoItem(checklistItems, item.id),
        valor: item.resultado,
        observacao: item.observacao || "",
      });
    });

    // 2) Verificações (modal de etapas)
    Object.keys(verificacoes || {}).forEach((etapa) => {
      const valores = verificacoes[etapa] || [];
      const metas = verificacoesMeta?.[etapa] || [];
      valores.forEach((valor, idx) => {
        if (!valor) return;
        const meta = metas[idx];
        todos.push({
          id: `ver-${etapa}-${idx}`,
          tipo: "verificacao",
          etapa,
          categoria: ETAPA_LABELS[etapa] || "Sem categoria",
          quando: meta?.quando || "",
          usuario: meta?.usuario || "",
          descricao: `Verificação ${idx + 1}`,
          valor,
        });
      });
    });

    // 3) Sessão marks (quadradinhos de cada sessão)
    (Array.isArray(items) ? items : []).forEach((item) => {
      const etapa = etapaDeItemId(item.id);
      if (!etapa) return;
      const marks = Array.isArray(item.sessionMarks) ? item.sessionMarks : [];
      const metas = Array.isArray(item.sessionMarksMeta)
        ? item.sessionMarksMeta
        : [];
      marks.forEach((valor, sIdx) => {
        if (!valor) return;
        const meta = metas[sIdx];
        if (!meta?.quando) return; // só mostra se tiver data/hora
        todos.push({
          id: `mark-${item.id}-${sIdx}`,
          tipo: "sessao",
          etapa,
          categoria: ETAPA_LABELS[etapa] || "Sem categoria",
          quando: meta.quando,
          usuario: meta.usuario || "",
          descricao: `${descricaoDoItem(checklistItems, item.id)} (sessão ${
            sIdx + 1
          })`,
          valor: "feito",
        });
      });
    });

    // Remove registros sem data/hora (marcações antigas)
    const comData = todos.filter((r) => r.quando);
    return comData.sort((a, b) => new Date(b.quando) - new Date(a.quando));
  }, [items, verificacoes, verificacoesMeta, checklistItems]);

  // ── Agrupamento ───────────────────────────────────────────────────
  const grupos = useMemo(() => {
    if (ordenacao === "categoria") {
      const map = {};
      registros.forEach((r) => {
        if (!map[r.etapa]) map[r.etapa] = { etapa: r.etapa, registros: [] };
        map[r.etapa].registros.push(r);
      });
      return ETAPAS_ORDER.filter((e) => map[e]).map((e) => map[e]);
    }
    // "recente" — agrupado por data (dia)
    const map = {};
    registros.forEach((r) => {
      const dia = r.quando ? new Date(r.quando).toDateString() : "Sem data";
      if (!map[dia]) map[dia] = { etapa: dia, registros: [] };
      map[dia].registros.push(r);
    });
    return Object.values(map).sort(
      (a, b) =>
        new Date(b.registros[0].quando) - new Date(a.registros[0].quando),
    );
  }, [registros, ordenacao]);

  function toggleGrupo(chave) {
    setGruposAbertos((prev) => ({ ...prev, [chave]: !prev[chave] }));
  }

  if (registros.length === 0) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "20px",
          color: "#64748b",
          fontSize: 13,
          textAlign: "center",
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}
        >
          <ClipboardList size={24} color="#94a3b8" />
        </div>
        Nenhuma marcação registrada ainda com data/hora.
        <div style={{ fontSize: 11, marginTop: 6, color: "#94a3b8" }}>
          As marcações feitas antes desta atualização não possuem horário.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ClipboardList size={18} color="#1e40af" />
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: "#1e293b",
            }}
          >
            Histórico de Marcações
          </h3>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setOrdenacao("recente")}
            style={{
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: ordenacao === "recente" ? "#1e40af" : "#fff",
              color: ordenacao === "recente" ? "#fff" : "#475569",
              cursor: "pointer",
            }}
          >
            Recentes
          </button>
          <button
            onClick={() => setOrdenacao("categoria")}
            style={{
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: ordenacao === "categoria" ? "#1e40af" : "#fff",
              color: ordenacao === "categoria" ? "#fff" : "#475569",
              cursor: "pointer",
            }}
          >
            Por categoria
          </button>
        </div>
      </div>

      {grupos.map((grupo) => {
        const chave = grupo.etapa;
        const aberto = !!gruposAbertos[chave];

        const label =
          ordenacao === "categoria"
            ? ETAPA_LABELS[grupo.etapa] || grupo.etapa
            : formatarDataHora(grupo.registros[0]?.quando).split(" ")[0] ||
              "Sem data";

        const temData = ordenacao === "categoria";

        return (
          <div key={chave} style={{ marginBottom: 8 }}>
            <button
              onClick={() => toggleGrupo(chave)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                background: temData ? "#f8fafc" : "#eff6ff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#1e293b",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {aberto ? (
                  <ChevronDown size={16} color="#64748b" />
                ) : (
                  <ChevronRight size={16} color="#64748b" />
                )}
                <span>{label}</span>
                {temData && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      fontWeight: 500,
                    }}
                  >
                    · {grupo.registros.length} marcações
                  </span>
                )}
              </div>
              {temData && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#1e40af",
                    fontWeight: 700,
                    background: "#dbeafe",
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  {grupo.registros.length}
                </span>
              )}
            </button>

            {aberto && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginTop: 6,
                  paddingLeft: 8,
                }}
              >
                {grupo.registros.map((r) => {
                  const valor = valorLegivel(r.valor);
                  return (
                    <div
                      key={r.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #eef2f7",
                        background: "#fff",
                        fontSize: 12,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#1e293b",
                            wordBreak: "break-word",
                          }}
                        >
                          {r.descricao}
                        </div>
                        <div style={{ color: "#64748b", marginTop: 3 }}>
                          {r.usuario ? `Por ${r.usuario} · ` : ""}
                          {formatarDataHora(r.quando)}
                        </div>
                        {r.observacao && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 11,
                              color: "#92400e",
                              background: "#fffbeb",
                              border: "1px solid #fde68a",
                              borderRadius: 6,
                              padding: "5px 8px",
                            }}
                          >
                            Obs.: {r.observacao}
                          </div>
                        )}
                      </div>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          color: valor.cor,
                          background: valor.bg,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.valor === "erro" || r.valor === "erro_critico" ? (
                          <XCircle size={12} />
                        ) : r.valor === "ok" ? (
                          <CheckCircle2 size={12} />
                        ) : r.valor === "na" ? (
                          <AlertTriangle size={12} />
                        ) : null}
                        {valor.texto}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
