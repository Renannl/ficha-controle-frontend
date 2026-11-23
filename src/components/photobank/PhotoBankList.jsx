import { useMemo } from "react";
import { useGavetas } from "../../hooks/useGavetas";
import { Camera, ChevronRight, Boxes } from "lucide-react";

function ehFichaCcm(ficha) {
  return (
    String(
      ficha?.tipoPainel || ficha?.dados?.tipoPainel || "",
    ).toLowerCase() === "ccm"
  );
}

function contarFotosGerais(ficha) {
  return Array.isArray(ficha?.fotoData?.fotos)
    ? ficha.fotoData.fotos.length
    : 0;
}

function primeiraFotoGaveta(gavetasComFotos) {
  const g = gavetasComFotos[0];
  const foto = g?.dados?.fotos?.[0];
  if (!foto) return "";
  return foto.dataUrl || foto.imagem || foto.foto || "";
}

function FichaPhotoCard({ ficha, capa, onOpenAlbum, onOpenGaveta }) {
  const fichaId = ficha?.dbId ?? ficha?.id;
  const isCcm = ehFichaCcm(ficha);

  const { gavetas, loading } = useGavetas(isCcm ? fichaId : null);

  const fotosGerais = contarFotosGerais(ficha);

  const gavetasComFotos = useMemo(
    () =>
      (gavetas || [])
        .filter(
          (g) => Array.isArray(g?.dados?.fotos) && g.dados.fotos.length > 0,
        )
        .sort((a, b) => Number(a.numero) - Number(b.numero)),
    [gavetas],
  );

  // Capa: prioriza a foto geral; senão usa a 1ª foto da 1ª gaveta
  const capaFinal = useMemo(
    () => capa || primeiraFotoGaveta(gavetasComFotos),
    [capa, gavetasComFotos],
  );

  if (fotosGerais === 0 && gavetasComFotos.length === 0) return null;

  const nomeFicha = ficha?.nomeEquipamento || ficha?.nome || `Ficha ${fichaId}`;

  return (
    <div className="photo-card">
      <button
        type="button"
        className="photo-card-capa"
        onClick={() => onOpenAlbum?.(ficha)}
      >
        {capaFinal ? (
          <img src={capaFinal} alt={nomeFicha} />
        ) : (
          <div className="photo-card-sem-foto">
            <Camera size={24} /> Sem foto
          </div>
        )}
        <span className="photo-card-overlay">
          {nomeFicha}
          <ChevronRight size={16} />
        </span>
      </button>

      <div className="photo-card-info">
        {fotosGerais > 0 && (
          <button
            type="button"
            className="photo-tag"
            onClick={() => onOpenAlbum?.(ficha)}
            title="Ver fotos gerais da ficha"
          >
            <Camera size={13} /> Geral · {fotosGerais}
          </button>
        )}

        {isCcm && loading && (
          <span className="photo-tag photo-tag-cinza">
            Carregando gavetas...
          </span>
        )}

        {gavetasComFotos.map((g) => (
          <button
            key={g.id}
            type="button"
            className="photo-tag photo-tag-gaveta"
            onClick={() => onOpenGaveta?.(ficha, g)}
            title={`Abra galeria da ${g.tag || `Gaveta ${g.numero}`}`}
          >
            <Boxes size={13} />
            {g.tag || `G${String(g.numero).padStart(2, "0")}`} ·{" "}
            {g.dados.fotos.length}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PhotoBankList({
  fichas = [],
  onOpenAlbum,
  onOpenGaveta,
}) {
  const visiveis = fichas.filter(
    (f) => contarFotosGerais(f) > 0 || ehFichaCcm(f),
  );

  if (visiveis.length === 0) {
    return (
      <p className="photo-empty">
        Nenhuma ficha com fotos ou gavetas registradas.
      </p>
    );
  }

  return (
    <div className="photo-bank-grid">
      {visiveis.map((ficha) => (
        <FichaPhotoCard
          key={ficha.dbId ?? ficha.id}
          ficha={ficha}
          capa={ficha?.fotoData?.fotos?.[0]?.imagem}
          onOpenAlbum={onOpenAlbum}
          onOpenGaveta={onOpenGaveta}
        />
      ))}
    </div>
  );
}
