import { memo, useCallback } from "react";
import PhotoPanelHeader from "./PhotoPanelHeader";
import PhotoGrid from "./PhotoGrid";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";

const PhotoPanel = memo(function PhotoPanel({ ficha, onUpdateFotoData }) {
  const { handlePhotoUpload } = usePhotoUpload(ficha);

  const fotos = ficha.fotoData?.fotos || [];

  const atualizarFotos = useCallback(
    (updaterOuArray) => {
      onUpdateFotoData((prevFotoData) => {
        const prevFotos = prevFotoData?.fotos || [];
        const novasFotos =
          typeof updaterOuArray === "function"
            ? updaterOuArray(prevFotos)
            : updaterOuArray;
        return { ...prevFotoData, fotos: novasFotos };
      });
    },
    [onUpdateFotoData],
  );

  const atualizarDescricao = useCallback(
    (id, descricao) =>
      atualizarFotos((prevFotos) =>
        prevFotos.map((f) => (f.id === id ? { ...f, descricao } : f)),
      ),
    [atualizarFotos],
  );

  const atualizarImagem = useCallback(
    async (id, file) => {
      const url = await handlePhotoUpload(file);
      if (!url) return;
      atualizarFotos((prevFotos) =>
        prevFotos.map((f) => (f.id === id ? { ...f, imagem: url } : f)),
      );
    },
    [handlePhotoUpload, atualizarFotos],
  );

  const handleMultiUpload = useCallback(
    async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      e.target.value = "";

      const resultados = await Promise.all(
        files.map((file) => handlePhotoUpload(file)),
      );

      const novasFotos = resultados
        .filter((url) => !!url)
        .map((url) => ({
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          descricao: "",
          imagem: url,
        }));

      if (novasFotos.length === 0) return;

      atualizarFotos((prevFotos) => [...prevFotos, ...novasFotos]);
    },
    [handlePhotoUpload, atualizarFotos],
  );

  const removerFoto = useCallback(
    (id) => atualizarFotos((prevFotos) => prevFotos.filter((f) => f.id !== id)),
    [atualizarFotos],
  );

  const handleAdicionarVazio = useCallback(() => {
    atualizarFotos((prevFotos) => [
      ...prevFotos,
      {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        descricao: "",
        imagem: "",
      },
    ]);
  }, [atualizarFotos]);

  return (
    <>
      <PhotoPanelHeader handleMultiUpload={handleMultiUpload} />

      <PhotoGrid
        fotos={fotos}
        onRemove={removerFoto}
        onDescricaoChange={atualizarDescricao}
        onUpload={atualizarImagem}
        onAdd={handleAdicionarVazio}
      />
    </>
  );
});

export default PhotoPanel;
