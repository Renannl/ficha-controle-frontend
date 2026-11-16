import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { OPERACOES, OPERACAO_KEYS } from "../../data/fichaTemplate";
import { PAINEL_LABELS, PAINEL_KEYS } from "../../data/painelTemplates";
import { formatarNomeUsuario } from "../../utils/tempoUtils";

export default function InfoPlanningSection({
  ficha,
  handle,
  operacaoAtual,
  onOperacaoChange,
  onTipoPainelChange,
  sessoes = [],
  disabled = false,
}) {
  const isEstrutura = String(ficha.operacao) === "10";
  const isCcm = String(ficha.tipoPainel || "").toLowerCase() === "ccm";

  const colaboradoresTexto = useMemo(() => {
    const unicos = [...new Set(sessoes.map((s) => s.usuario).filter(Boolean))];
    return unicos.map(formatarNomeUsuario).join(", ");
  }, [sessoes]);

  return (
    <div className="card mb-3">
      <div className="section-header">
        <div className="section-icon">
          <CalendarDays size={18} />
        </div>
        <div>
          <h2>Planejamento</h2>
          <p>Datas, recursos e equipe</p>
        </div>
      </div>

      <div className="form-grid gap-3">
        <div className="form-grid form-grid-2">
          <div className="field">
            <label>Data de Início</label>
            <input
              type="date"
              disabled={disabled}
              value={ficha.dataInicio}
              onChange={handle("dataInicio")}
            />
          </div>

          <div className="field">
            <label>Data de Término</label>
            <input
              type="date"
              disabled={disabled}
              value={ficha.dataTermino}
              onChange={handle("dataTermino")}
            />
          </div>
        </div>

        <div className="form-grid form-grid-2">
          <div className="field">
            <label>Tempo Previsto</label>
            <input
              disabled={disabled}
              value={ficha.tempoPrevisto}
              onChange={handle("tempoPrevisto")}
              placeholder="7 Dias"
            />
          </div>

          <div className="field">
            <label>Recurso</label>
            <input
              disabled={disabled}
              value={ficha.recurso}
              onChange={handle("recurso")}
              placeholder="2 Pessoas"
            />
          </div>
        </div>

        <div className="field">
          <label>Operação</label>
          <select
            disabled={disabled}
            value={ficha.operacao}
            onChange={(e) => onOperacaoChange(e.target.value)}
          >
            {OPERACAO_KEYS.map((key) => (
              <option key={key} value={key}>
                {OPERACOES[key].label}
              </option>
            ))}
          </select>
        </div>

        {isEstrutura && (
          <div className="field">
            <label>Tipo de Painel</label>
            <select
              disabled={disabled}
              value={ficha.tipoPainel || ""}
              onChange={(e) => onTipoPainelChange(e.target.value)}
            >
              <option value="" disabled>
                Selecione o tipo de painel
              </option>
              {PAINEL_KEYS.map((key) => (
                <option key={key} value={key}>
                  {PAINEL_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        )}
        {isEstrutura && isCcm && (
          <div className="field">
            <label>Total de Gavetas</label>
            <input
              type="number"
              min="1"
              step="1"
              disabled={disabled}
              value={ficha.totalGavetas ?? ""}
              onChange={handle("totalGavetas")}
              placeholder="Ex: 50"
            />
          </div>
        )}

        <div className="field">
          <label>Colaboradores</label>
          <input
            disabled
            value={colaboradoresTexto || "Nenhum colaborador registrado ainda"}
            placeholder="Automático"
          />
        </div>
      </div>
    </div>
  );
}
