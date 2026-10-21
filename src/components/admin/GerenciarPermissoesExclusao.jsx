import { useEffect, useState } from "react";
import { authFetch } from "../../services/apiClient";
import { Shield, Loader2 } from "lucide-react";

export default function GerenciarPermissoesExclusao() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    try {
      setLoading(true);
      const res = await authFetch("/usuarios");
      if (!res) return;
      const data = await res.json();
      if (res.ok) setUsuarios(data);
      else alert(data.error || "Erro ao carregar usuários.");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function togglePermissao(id, valorAtual) {
    try {
      setSalvandoId(id);
      const novoValor = !valorAtual;
      const res = await authFetch(`/usuarios/${id}/permissoes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pode_excluir_ficha: novoValor }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao salvar permissão.");
        return;
      }
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, pode_excluir_ficha: novoValor } : u,
        ),
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvandoId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Loader2 className="spin" size={20} />
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <Shield size={18} />
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
          Permissões de Excluir Ficha
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {usuarios.map((u) => (
          <div
            key={u.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "var(--bg-base, #f8fafc)",
              borderRadius: "8px",
              border: "1px solid var(--border, #e2e8f0)",
            }}
          >
            <div>
              <strong style={{ fontSize: "14px" }}>
                {u.nome || u.username}
              </strong>
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                ({u.role})
              </span>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
              }}
            >
              <input
                type="checkbox"
                checked={u.pode_excluir_ficha !== false}
                disabled={u.username === "master" || salvandoId === u.id}
                onChange={() =>
                  togglePermissao(u.id, u.pode_excluir_ficha !== false)
                }
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              Pode excluir ficha
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
