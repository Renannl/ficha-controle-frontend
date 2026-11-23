// src/utils/getFichasPhotos.js

function resolverFoto(foto) {
  if (!foto) return "";
  return foto.foto ?? foto.imagem ?? foto.dataUrl ?? foto.url ?? foto.src ?? "";
}

export function getFichaPhotos(ficha) {
  const gerais = (
    Array.isArray(ficha?.fotoData?.fotos) ? ficha.fotoData.fotos : []
  )
    .map((f) => ({
      ...f,
      foto: resolverFoto(f),
      origem: "geral",
    }))
    .filter((f) => f.foto);

  const gavetas = Array.isArray(ficha?.gavetas)
    ? ficha.gavetas
    : Array.isArray(ficha?.dados?.gavetas)
      ? ficha.dados.gavetas
      : [];

  const deGaveta = gavetas
    .flatMap((g) => {
      const fotos = Array.isArray(g?.dados?.fotos) ? g.dados.fotos : [];
      return fotos.map((foto) => ({
        ...foto,
        foto: resolverFoto(foto),
        gavetaId: g.id,
        gavetaNumero: g.numero,
        gavetaTag: g.tag || "",
        descricao: foto.descricao || `Foto da gaveta ${g.numero}`,
        origem: "gaveta",
      }));
    })
    .filter((f) => f.foto);

  return [...gerais, ...deGaveta];
}

export function getFichaGavetaFotos(ficha) {
  return getFichaPhotos(ficha).filter((f) => f.origem === "gaveta");
}
