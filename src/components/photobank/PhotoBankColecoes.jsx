import { useGavetas } from "../../hooks/useGavetas";
import {
  getFichaPhotos,
  getFichaGavetaFotos,
} from "../../utils/getFichasPhotos";
import { Boxes, Camera } from "lucide-react";

// ────────────────────────────────────────────────────────────
// Identifica se a ficha é CCM (fotos podem estar só nas gavetas)
// ────────────────────────────────────────────────────────────
function ehFichaCcm(ficha) {
  return (
    String(
      ficha?.tipoPainel || ficha?.dados?.tipoPainel || "",
    ).toLowerCase() === "ccm"
  );
}

// Função auxiliar para extrair a URL de uma foto independente do formato
function urlDeFoto(foto) {
  if (!foto) return "";
  return foto.dataUrl || foto.imagem || foto.foto || foto.url || foto.src || "";
}

// ────────────────────────────────────────────────────────────
// Card individual de coleção — usa o hook useGavetas (regra:
// hooks não podem ficar dentro de .map, por isso é componente)
// ────────────────────────────────────────────────────────────
function ColecaoCard({ colecao, fichas, onOpenColecao }) {
  const fichasDaColecao = fichas;

  // 1) Procura a primeira ficha que já tenha foto geral no objeto
  const fichaComFotoGeral = fichasDaColecao.find(
    (f) => getFichaPhotos(f).length > 0,
  );

  // 2) Se nenhuma ficha tiver foto no objeto, usa a primeira CCM
  //    e carrega as gavetas dela do backend (via hook)
  const fichaCcm = fichasDaColecao.find(ehFichaCcm);
  const fichaId = fichaCcm ? (fichaCcm.dbId ?? fichaCcm.id) : null;
  const { gavetas } = useGavetas(
    fichaComFotoGeral ? null : fichaId, // só carrega se ainda não tiver capa
  );

  // Capa: tenta foto geral primeiro
  let capa = "";
  if (fichaComFotoGeral) {
    capa = urlDeFoto(getFichaPhotos(fichaComFotoGeral)[0]);
  }

  // Se não achou foto geral, busca a primeira foto da primeira gaveta
  if (!capa && fichaCcm && gavetas) {
    const gavetasComFotos = gavetas
      .filter((g) => Array.isArray(g?.dados?.fotos) && g.dados.fotos.length > 0)
      .sort((a, b) => Number(a.numero) - Number(b.numero));

    const primeiraFotoGaveta = gavetasComFotos[0]?.dados?.fotos?.[0];
    capa = urlDeFoto(primeiraFotoGaveta);
  }

  const totalFotos = fichasDaColecao.reduce(
    (acc, f) => acc + getFichaPhotos(f).length,
    0,
  );

  const gavetasFotos = fichasDaColecao.reduce(
    (acc, f) => acc + getFichaGavetaFotos(f).length,
    0,
  );

  return (
    <div className="photo-album-card" onClick={() => onOpenColecao(colecao)}>
      <div className="album-cover">
        {capa ? (
          <img src={capa} alt="Cover" />
        ) : (
          <div className="album-placeholder">
            <Camera size={20} />
            <span className="album-placeholder-text">Sem foto</span>
          </div>
        )}
        <div className="album-badge">{totalFotos} fotos</div>
      </div>
      <div className="album-info">
        <div className="album-title">{colecao.nome}</div>
        <div className="album-sub">
          {fichasDaColecao.length} ficha(s) · {colecao.cliente}
          {gavetasFotos > 0 && (
            <span className="album-gavetas-badge">
              <Boxes size={12} /> {gavetasFotos} foto(s) de gaveta
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Grid de coleções
// ────────────────────────────────────────────────────────────
export default function PhotoBankColecoes({
  colecoes = [],
  fichas = [],
  onOpenColecao,
}) {
  return (
    <div className="photo-album-grid">
      {colecoes.map((colecao) => {
        const fichasDaColecao = fichas.filter(
          (f) => String(f.colecao_id) === String(colecao.id),
        );

        return (
          <ColecaoCard
            key={colecao.id}
            colecao={colecao}
            fichas={fichasDaColecao}
            onOpenColecao={onOpenColecao}
          />
        );
      })}
    </div>
  );
}
