import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ColecoesList({ colecoes, fichas }) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="colecoes-grid">
      {colecoes.map((colecao) => {
        const fichasDaColecao = fichas.filter(
          (f) => f.colecao_id === colecao.id,
        );

        const isExpanded = expandedId === colecao.id;
        const LIMITE = 3;

        const preview = isExpanded
          ? fichasDaColecao
          : fichasDaColecao.slice(0, LIMITE);

        const restantes = fichasDaColecao.length - LIMITE;

        return (
          <div
            key={colecao.id}
            className="colecao-card"
            onClick={() => navigate(`/colecao/${colecao.id}`)}
          >
            <h3>{colecao.cliente}</h3>
            <p>{colecao.codigo_proposta}</p>

            <div className="colecao-preview">
              {preview.map((ficha) => (
                <div key={ficha.id} className="preview-ficha">
                  {ficha.codigo || ficha.nomeEquipamento || "Sem nome"}
                </div>
              ))}
            </div>

            {restantes > 0 && (
              <button
                className="colecao-preview-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedId(isExpanded ? null : colecao.id);
                }}
              >
                {isExpanded ? "ver menos" : `+${restantes} fichas`}
              </button>
            )}

            <small>{fichasDaColecao.length} fichas</small>
          </div>
        );
      })}
    </div>
  );
}
