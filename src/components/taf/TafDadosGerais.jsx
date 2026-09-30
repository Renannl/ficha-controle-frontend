export default function TafDadosGerais({ ficha, tafData, handleChange }) {
  const dataTesteAuto = (() => {
    const raw = ficha?.created_at || ficha?.createdAt || "";
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  })();

  return (
    <>
      <div className="card-header-simple">
        <h2>Relatório de Ensaios TAF</h2>
        <p>Versão 1.3</p>
      </div>

      <div className="taf-grid">
        <div className="taf-check-options">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={tafData.testExecutedWithClient}
              onChange={(e) =>
                handleChange("testExecutedWithClient", e.target.checked)
              }
            />
            <span>Executado COM o cliente</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={tafData.testExecutedWithoutClient}
              onChange={(e) =>
                handleChange("testExecutedWithoutClient", e.target.checked)
              }
            />
            <span>Executado SEM o cliente</span>
          </label>
        </div>

        <div className="taf-input-group">
          <label>Nome do Quadro/Painel</label>
          <input type="text" value={ficha.nomeEquipamento || ""} readOnly />
        </div>

        <div className="taf-form-row">
          <div className="taf-input-group">
            <label>IND</label>
            <input type="text" value={ficha.numeroInd || ""} readOnly />
          </div>

          <div className="taf-input-group">
            <label>Tag do Produto</label>
            <input type="text" value={ficha.tag || ""} readOnly />
          </div>
        </div>

        <div className="taf-form-row">
          <div className="taf-input-group">
            <label>Tensão</label>
            <input
              type="text"
              value={tafData.tensao || ""}
              onChange={(e) => handleChange("tensao", e.target.value)}
            />
          </div>

          <div className="taf-input-group">
            <label>Cubículo</label>
            <input
              type="text"
              value={tafData.cubiculo || ""}
              onChange={(e) => handleChange("cubiculo", e.target.value)}
            />
          </div>
        </div>

        <div className="taf-form-row">
          <div className="taf-input-group">
            <label>Cliente</label>
            <input type="text" value={ficha.cliente || ""} readOnly />
          </div>

          <div className="taf-input-group">
            <label>Testadores</label>
            <input
              type="text"
              value={tafData.testadores || ""}
              onChange={(e) => handleChange("testadores", e.target.value)}
            />
          </div>
        </div>

        <div className="taf-form-row">
          <div className="taf-input-group">
            <label>Data do Teste</label>
            <input type="date" value={dataTesteAuto} readOnly />
          </div>

          <div className="taf-input-group">
            <label>Data de Término</label>
            <input
              type="date"
              value={tafData.dataTermino || ""}
              readOnly
              placeholder="Preenchida ao concluir o checklist"
            />
          </div>
        </div>
      </div>
    </>
  );
}
