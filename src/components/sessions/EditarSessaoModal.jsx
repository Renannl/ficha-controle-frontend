import { useState, useEffect } from "react";

function toLocalInput(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function EditarSessaoModal({ sessao, onClose, onSave }) {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (sessao) {
      setInicio(toLocalInput(sessao.inicio));
      setFim(toLocalInput(sessao.fim));
      setErro("");
    }
  }, [sessao]);

  if (!sessao) return null;

  async function handleSalvar() {
    setErro("");

    if (!inicio) {
      setErro("Informe o horário de início.");
      return;
    }
    if (fim && new Date(fim) <= new Date(inicio)) {
      setErro("O horário de fim deve ser depois do início.");
      return;
    }

    setSaving(true);
    try {
      await onSave(sessao.id, {
        inicio: new Date(inicio).toISOString(),
        fim: fim ? new Date(fim).toISOString() : null,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErro(err?.response?.data?.error || "Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Editar horário — {sessao.usuario}</h3>

        <label className="modal-label">
          Início
          <input
            type="datetime-local"
            step="1"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />
        </label>

        <label className="modal-label">
          Fim
          <input
            type="datetime-local"
            step="1"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
          />
        </label>

        {erro && <p className="modal-erro">{erro}</p>}

        <div className="modal-actions">
          <button onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleSalvar}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
