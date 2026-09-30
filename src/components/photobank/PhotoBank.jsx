import { useState } from "react";
import PhotoBankColecoes from "./PhotoBankColecoes";
import PhotoBankList from "./PhotoBankList";
import PhotoBankDetail from "./PhotoBankDetail";
import EmptyPhotoBank from "./EmptyPhotoBank";
import { getFichaPhotos } from "../../utils/getFichasPhotos";

export default function PhotoBank({ fichas, colecoes }) {
  const [selectedColecao, setSelectedColecao] = useState(null);
  const [selectedFichaId, setSelectedFichaId] = useState(null);


  const fichasComFotos = fichas.filter((f) => getFichaPhotos(f).length > 0);

  if (selectedFichaId) {
    const ficha = fichasComFotos.find((f) => f.id === selectedFichaId);
    if (!ficha) {
      setSelectedFichaId(null);
      return null;
    }
    return (
      <PhotoBankDetail ficha={ficha} onBack={() => setSelectedFichaId(null)} />
    );
  }

  if (selectedColecao) {
    const fichasDaColecao = fichasComFotos.filter(
      (f) => String(f.colecao_id) === String(selectedColecao.id),
    );

    return (
      <div
        className="photo-bank-list animate-scaleIn"
        style={{ padding: "20px 24px 100px" }}
      >
        <div className="colecao-breadcrumb">
          <button
            className="colecao-back-btn"
            onClick={() => setSelectedColecao(null)}
          >
            ← Coleções
          </button>
          <span className="colecao-breadcrumb-separator">/</span>
          <span className="colecao-breadcrumb-name">
            {selectedColecao.nome}
          </span>
        </div>

        {fichasDaColecao.length > 0 ? (
          <PhotoBankList
            fichas={fichasDaColecao}
            onOpenAlbum={setSelectedFichaId}
          />
        ) : (
          <EmptyPhotoBank />
        )}
      </div>
    );
  }

  const colecoesComFotos = colecoes.filter((c) =>
    fichasComFotos.some((f) => String(f.colecao_id) === String(c.id)),
  );

  return (
    <div
      className="photo-bank-list animate-scaleIn"
      style={{ padding: "20px 24px 100px" }}
    >
      {colecoesComFotos.length > 0 ? (
        <PhotoBankColecoes
          colecoes={colecoesComFotos}
          fichas={fichasComFotos}
          onOpenColecao={setSelectedColecao}
        />
      ) : (
        <EmptyPhotoBank />
      )}
    </div>
  );
}
