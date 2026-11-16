import { FileText } from "lucide-react";

export default function InfoDocumentSection({ ficha, handle }) {
  return (
    <div className="card mb-3">
      <div className="section-header">
        <div className="section-icon">
          <FileText size={18} />
        </div>
        <div>
          <h2>Identificação do Documento</h2>
          <p>Código, folha e revisão</p>
        </div>
      </div>

      <div className={`form-grid form-grid-3`}>
        <div className="field">
          <label>Código</label>
          <input
            readOnly
            value={ficha.codigo}
            onChange={handle("codigo")}
            placeholder="PRO-001"
          />
        </div>

        <div className="field">
          <label>Nº do Ind.</label>
          <input
            readOnly
            value={ficha.numeroInd}
            onChange={handle("numeroInd")}
            placeholder="10110-01"
          />
        </div>

        <div className="field">
          <label>Revisão</label>
          <input
            readOnly
            value={ficha.revisao}
            onChange={handle("revisao")}
            placeholder="01"
          />
        </div>
      </div>
    </div>
  );
}
