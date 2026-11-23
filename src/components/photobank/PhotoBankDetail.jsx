import { useMemo } from "react";
import { useGavetas } from "../../hooks/useGavetas";
import { getFichaPhotos } from "../../utils/getFichasPhotos";
import PhotoCard from "./PhotoCard";
import { Boxes } from "lucide-react";

export default function PhotoBankDetail({ ficha, onBack }) {
  const isCcm =
    String(
      ficha?.tipoPainel || ficha?.dados?.tipoPainel || "",
    ).toLowerCase() === "ccm";
  const { gavetas } = useGavetas(isCcm ? (ficha?.dbId ?? ficha?.id) : null);

  // Mescla as gavetas carregadas no objeto ficha
  const fichaComGavetas = useMemo(() => {
    if (!gavetas || gavetas.length === 0) return ficha;
    return { ...ficha, gavetas };
  }, [ficha, gavetas]);

  const photos = getFichaPhotos(fichaComGavetas);

  const gerais = photos.filter((p) => !p.gavetaId);
  const gruposGavetas = photos
    .filter((p) => p.gavetaId)
    .reduce((acc, p) => {
      const chave = `${p.gavetaId}-${p.gavetaNumero}`;
      if (!acc[chave]) {
        acc[chave] = {
          id: p.gavetaId,
          numero: p.gavetaNumero,
          tag: p.gavetaTag || "",
          fotos: [],
        };
      }
      acc[chave].fotos.push(p);
      return acc;
    }, {});

  const gavetasList = Object.values(gruposGavetas);

  const renderFotos = (lista) =>
    lista.map((item, idx) => (
      <PhotoCard
        key={item.id ?? idx}
        foto={item.foto}
        descricao={item.descricao}
        itemId={idx + 1}
        downloadName={`FOTO_${ficha.codigo}_${idx + 1}.jpg`}
      />
    ));

  return (
    <div
      className="photo-bank-detail animate-fadeIn"
      style={{ padding: "20px 16px 100px" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <button className="btn-icon" onClick={onBack}>
          ←
        </button>
        <div>
          <h3 className="text-lg font-bold">
            {ficha.nomeEquipamento || "Sem Nome"}
          </h3>
          <p className="text-xs text-muted">
            Exibindo {photos.length} fotos · {ficha.cliente}
          </p>
        </div>
      </div>

      {gerais.length > 0 && (
        <div
          className="photo-bank-grid"
          style={{ marginLeft: "5px", marginRight: "5px" }}
        >
          {renderFotos(gerais)}
        </div>
      )}

      {gavetasList.map((g) => (
        <div className="gaveta-secao-card" key={g.id}>
          <div className="gaveta-secao-titulo">
            <Boxes size={16} />
            <span>Gaveta {g.numero}</span>
            {g.tag && <span className="gaveta-secao-tag">{g.tag}</span>}
            <span className="gaveta-secao-count">{g.fotos.length} fotos</span>
          </div>
          <div className="photo-bank-grid">{renderFotos(g.fotos)}</div>
        </div>
      ))}
    </div>
  );
}
