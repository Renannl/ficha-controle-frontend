import { useState } from "react";
import {
  FolderPlus,
  Camera,
  ClipboardList,
  Image,
  X,
  Zap,
  Upload,
  ArrowLeft,
} from "lucide-react";
import ImportarColecaoFlow from "../excel/ImportarColecaoFlow";

const CODIGO_OPERACAO_FOTOS = "80";

export default function NewFichaMenu({
  show,
  onClose,
  onCreate,
  onCreateFicha,
  mode = "colecoes",
  user,
  onColecaoImportada,
  fichasDaColecao = [],
}) {
  const [etapa, setEtapa] = useState("menu");
  const [tipoFotosSelecionado, setTipoFotosSelecionado] = useState(null);

  const [mostrarImportar, setMostrarImportar] = useState(false);

  if (!show) return null;

  const handleCriarColecao = () => {
    const cliente = prompt("Cliente");
    if (!cliente) return;
    const descricao = prompt("Descrição da proposta");
    onCreate({
      cliente,
      descricao,
      criado_por: user?.email || user?.nome || "desconhecido",
    });
  };

  const fichasProducao = fichasDaColecao.filter((f) => {
    if (String(f.operacao) !== "10") return false;
    if (f.statusAprovacao !== "aprovado") return false;

    const jaTemTaf = fichasDaColecao.some(
      (t) =>
        String(t.operacao) === "50" &&
        String(t.ficha_producao_id) === String(f.dbId),
    );

    return !jaTemTaf;
  });

  const fichasProducaoFotos = fichasDaColecao.filter((f) => {
    if (String(f.operacao) !== "10") return false;
    if (f.statusAprovacao !== "aprovado") return false;

    const jaTemEsseTipo = fichasDaColecao.some(
      (t) =>
        String(t.operacao) === String(CODIGO_OPERACAO_FOTOS) &&
        String(t.ficha_producao_id) === String(f.dbId) &&
        String(t.tipoFotografico) === String(tipoFotosSelecionado),
    );

    return !jaTemEsseTipo;
  });

  const handleClickTaf = () => {
    if (fichasProducao.length === 0) {
      alert(
        "Nenhuma ficha de produção disponível para vincular.\n\n" +
          "Verifique se:\n" +
          "• A ficha de produção já foi aprovada\n" +
          "• Ela ainda não possui uma TAF vinculada",
      );
      return;
    }
    setEtapa("selecionar-producao");
  };

  const handleClickFotos = () => {
    setEtapa("tipo-fotos");
  };

  const handleSelecionarTipoFotos = (tipo) => {
    setTipoFotosSelecionado(tipo);
    setEtapa("selecionar-producao-fotos");
  };

  const handleSelecionarProducao = (ficha, tipo) => {
    if (tipo === "fotos") {
      onCreateFicha(tipo, ficha, tipoFotosSelecionado);
    } else {
      onCreateFicha(tipo, ficha);
    }
    setEtapa("menu");
    setTipoFotosSelecionado(null);
  };

  const handleClose = () => {
    setEtapa("menu");
    setTipoFotosSelecionado(null);
    onClose();
  };

  const getTitulo = () => {
    if (etapa === "tipo-fotos") return "Tipo de Relatório Fotográfico";
    if (etapa === "selecionar-producao") return "Vincular Ficha TAF";
    if (etapa === "selecionar-producao-fotos") {
      return tipoFotosSelecionado === "tecnica"
        ? "Vincular Ficha Técnica"
        : "Vincular Relatório Fotográfico";
    }
    return mode === "fichas" ? "Nova Ficha" : "Nova Proposta";
  };

  const getSubtitulo = () => {
    if (etapa === "tipo-fotos") return "Escolha o tipo de registro fotográfico";
    if (
      etapa === "selecionar-producao" ||
      etapa === "selecionar-producao-fotos"
    )
      return "Escolha a ficha de produção";
    if (mode === "fichas") return "Escolha o tipo de ficha";
    return "Criar coleção de fichas";
  };

  return (
    <>
      <div className="new-ficha-overlay" onClick={handleClose}>
        <div className="new-ficha-menu" onClick={(e) => e.stopPropagation()}>
          <div className="new-ficha-menu-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {(etapa === "selecionar-producao" ||
                etapa === "selecionar-producao-fotos" ||
                etapa === "tipo-fotos") && (
                <button
                  className="new-ficha-close-btn"
                  onClick={() => {
                    if (etapa === "tipo-fotos") setEtapa("menu");
                    else setEtapa("menu");
                    setTipoFotosSelecionado(null);
                  }}
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div>
                <h3>{getTitulo()}</h3>
                <p>{getSubtitulo()}</p>
              </div>
            </div>
            <button className="new-ficha-close-btn" onClick={handleClose}>
              <X size={18} />
            </button>
          </div>

          {etapa === "tipo-fotos" && (
            <div className="new-ficha-options">
              <button
                className="new-ficha-opt-btn"
                onClick={() => handleSelecionarTipoFotos("geral")}
              >
                <div className="new-ficha-opt-icon new-ficha-opt-icon--fotos">
                  <Camera size={22} />
                </div>
                <div className="new-ficha-opt-info">
                  <span className="new-ficha-opt-title">
                    Relatório Fotográfico Geral
                  </span>
                  <span className="new-ficha-opt-desc">
                    Fotos amplas e cinematográficas para o cliente
                  </span>
                </div>
              </button>

              <button
                className="new-ficha-opt-btn"
                onClick={() => handleSelecionarTipoFotos("tecnica")}
              >
                <div className="new-ficha-opt-icon new-ficha-opt-icon--taf">
                  <ClipboardList size={22} />
                </div>
                <div className="new-ficha-opt-info">
                  <span className="new-ficha-opt-title">
                    Relatório Fotográfico Técnico
                  </span>
                  <span className="new-ficha-opt-desc">
                    Fotos detalhadas técnicas para arquivo interno
                  </span>
                </div>
              </button>
            </div>
          )}

          {etapa === "selecionar-producao" && (
            <div className="new-ficha-options">
              {fichasProducao.map((f) => (
                <button
                  key={f.dbId}
                  className="new-ficha-opt-btn"
                  onClick={() => handleSelecionarProducao(f, "taf")}
                >
                  <div className="new-ficha-opt-icon new-ficha-opt-icon--prod">
                    <ClipboardList size={22} />
                  </div>
                  <div className="new-ficha-opt-info">
                    <span className="new-ficha-opt-title">
                      {f.codigo} — IND {f.numeroInd}
                    </span>
                    <span className="new-ficha-opt-desc">
                      {f.nomeEquipamento || f.obra || "Sem descrição"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {etapa === "selecionar-producao-fotos" && (
            <div className="new-ficha-options">
              {fichasProducaoFotos.length === 0 ? (
                <div
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    color: "#888",
                  }}
                >
                  Nenhuma ficha de produção disponível.
                  <br />
                  <br />
                  Verifique se a ficha de produção já foi <b>aprovada</b> e se
                  ainda não possui este tipo de relatório.
                </div>
              ) : (
                fichasProducaoFotos.map((f) => (
                  <button
                    key={f.dbId}
                    className="new-ficha-opt-btn"
                    onClick={() => handleSelecionarProducao(f, "fotos")}
                  >
                    <div className="new-ficha-opt-icon new-ficha-opt-icon--fotos">
                      <Image size={22} />
                    </div>
                    <div className="new-ficha-opt-info">
                      <span className="new-ficha-opt-title">
                        {f.codigo} — IND {f.numeroInd}
                      </span>
                      <span className="new-ficha-opt-desc">
                        {f.nomeEquipamento || f.obra || "Sem descrição"}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {etapa === "menu" && mode === "fichas" && (
            <div className="new-ficha-options">
              <button className="new-ficha-opt-btn" onClick={handleClickTaf}>
                <div className="new-ficha-opt-icon new-ficha-opt-icon--taf">
                  <Zap size={22} />
                </div>
                <div className="new-ficha-opt-info">
                  <span className="new-ficha-opt-title">Ficha TAF</span>
                  <span className="new-ficha-opt-desc">
                    Energização e testes elétricos
                  </span>
                </div>
              </button>

              <button
                className="new-ficha-opt-btn"
                onClick={() => onCreateFicha("producao")}
              >
                <div className="new-ficha-opt-icon new-ficha-opt-icon--prod">
                  <ClipboardList size={22} />
                </div>
                <div className="new-ficha-opt-info">
                  <span className="new-ficha-opt-title">Ficha de Produção</span>
                  <span className="new-ficha-opt-desc">
                    Planejamento e execução
                  </span>
                </div>
              </button>

              <button className="new-ficha-opt-btn" onClick={handleClickFotos}>
                <div className="new-ficha-opt-icon new-ficha-opt-icon--fotos">
                  <Image size={22} />
                </div>
                <div className="new-ficha-opt-info">
                  <span className="new-ficha-opt-title">
                    Relatório Fotográfico
                  </span>
                  <span className="new-ficha-opt-desc">
                    Registro de evidências em fotos
                  </span>
                </div>
              </button>
            </div>
          )}

          {etapa === "menu" && mode !== "fichas" && (
            <div className="new-ficha-options">
              <button
                className="new-ficha-opt-btn"
                onClick={handleCriarColecao}
              >
                <div className="new-ficha-opt-icon new-ficha-opt-icon--colecao">
                  <Camera size={22} />
                </div>
                <div className="new-ficha-opt-info">
                  <span className="new-ficha-opt-title">Criar Proposta</span>
                  <span className="new-ficha-opt-desc">
                    Nova coleção de fichas
                  </span>
                </div>
              </button>

              <button
                className="new-ficha-opt-btn"
                onClick={() => setMostrarImportar(true)}
              >
                <div className="new-ficha-opt-icon new-ficha-opt-icon--importar">
                  <Upload size={22} />
                </div>
                <div className="new-ficha-opt-info">
                  <span className="new-ficha-opt-title">Importar Coleção</span>
                  <span className="new-ficha-opt-desc">
                    Preencher dados manualmente + documentos
                  </span>
                </div>
              </button>
            </div>
          )}

          <button className="btn btn-ghost w-full mt-3" onClick={handleClose}>
            Cancelar
          </button>
        </div>
      </div>
      <ImportarColecaoFlow
        show={mostrarImportar}
        onClose={() => setMostrarImportar(false)}
        onImportado={(resultado) => {
          setMostrarImportar(false);
          onColecaoImportada?.(resultado);
          handleClose();
        }}
      />
    </>
  );
}
