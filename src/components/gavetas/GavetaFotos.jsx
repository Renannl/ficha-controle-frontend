import { useMemo, useRef, useState } from "react";
import {
  Camera,
  ImagePlus,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* =====================================================================
   GavetaFotos — captura e armazenamento de fotos DESTA gaveta.
   ---------------------------------------------------------------------
   As fotos ficam em:  gaveta.dados.fotos = [{ dataUrl, nomeControle, dataHora, usuario }]
   Usa o MESMO formato de imagem (string base64/dataUrl) do relatório
   fotográfico, para reutilizar o layout de impressão.

   Como integrar no GavetaDetalhe:
     - ao montar o payload que é enviado por salvarGaveta(fichaId, gaveta.id, payload),
       inclua  fotos: fotos  (ver ponto "Integração" no final).
   ===================================================================== */

export default function GavetaFotos({
  fotos = [],
  onFotosChange,
  usuario = "",
  maxFotos = 60,
}) {
  const fileInputRef = useRef(null);
  const camInputRef = useRef(null);
  const [visando, setVisando] = useState(null); // índice em preview grande

  async function arquivoParaDataUrl(arquivo) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(arquivo);
    });
  }

  async function adicionarArquivos(listaArquivos) {
    const arquivos = Array.from(listaArquivos || []);
    if (!arquivos.length) return;

    const novas = await Promise.all(
      arquivos
        .slice(0, Math.max(0, maxFotos - fotos.length))
        .map(async (arquivo) => ({
          dataUrl: await arquivoParaDataUrl(arquivo),
          nomeControle: arquivo.name || "",
          dataHora: new Date().toISOString(),
          usuario: usuario || "",
        })),
    );

    if (!novas.length) {
      alert(`Limite de ${maxFotos} fotos atingido para esta gaveta.`);
      return;
    }

    onFotosChange?.([...fotos, ...novas]);
  }

  function removerFoto(index) {
    onFotosChange?.(fotos.filter((_, i) => i !== index));
  }

  return (
    <div className="gaveta-secao-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <Camera size={16} />
          Fotos da Gaveta
        </h3>
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {fotos.length}/{maxFotos}
        </span>
      </div>

      {/* Botões de captura */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <input
          ref={camInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => {
            adicionarArquivos(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            adicionarArquivos(e.target.files);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          className="gaveta-btn"
          onClick={() => camInputRef.current?.click()}
          title="Tirar foto pela câmera"
        >
          <Camera size={14} /> Tirar Foto
        </button>
        <button
          type="button"
          className="gaveta-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Enviar fotos do dispositivo"
        >
          <ImagePlus size={14} /> Enviar Fotos
        </button>
      </div>

      {/* Grid de fotos */}
      {fotos.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "26px 16px",
            color: "#94a3b8",
            fontSize: 13,
            border: "1px dashed #cbd5e1",
            borderRadius: 10,
          }}
        >
          <Camera size={26} style={{ marginBottom: 6, opacity: 0.6 }} />
          <br />
          Nenhuma foto para esta gaveta.
          <br />
          <span style={{ fontSize: 12 }}>
            Use "Tirar Foto" (câmera) ou "Enviar Fotos".
          </span>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: 10,
          }}
        >
          {fotos.map((foto, idx) => (
            <div
              key={idx}
              style={{
                position: "relative",
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                aspectRatio: "1 / 1",
                background: "#f1f5f9",
                cursor: "pointer",
              }}
              onClick={() => setVisando(idx)}
            >
              <img
                src={foto.dataUrl}
                alt={`Foto ${idx + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  left: 4,
                  background: "rgba(15,23,42,0.75)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 6,
                  padding: "2px 7px",
                }}
              >
                {idx + 1}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removerFoto(idx);
                }}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  border: "none",
                  background: "rgba(220,38,38,0.9)",
                  color: "#fff",
                  borderRadius: 6,
                  padding: 4,
                  cursor: "pointer",
                  display: "flex",
                  lineHeight: 0,
                }}
                title="Remover foto"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview grande */}
      {visando !== null && fotos[visando] && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 14,
            padding: 16,
          }}
          onClick={() => setVisando(null)}
        >
          <img
            src={fotos[visando].dataUrl}
            alt={`Foto ${visando + 1}`}
            style={{
              maxWidth: "92%",
              maxHeight: "78vh",
              borderRadius: 10,
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#fff",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="gaveta-btn"
              style={{ color: "#fff", borderColor: "#fff" }}
              onClick={() =>
                setVisando((v) => (v > 0 ? v - 1 : fotos.length - 1))
              }
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {visando + 1} / {fotos.length}
            </span>
            <button
              type="button"
              className="gaveta-btn"
              style={{ color: "#fff", borderColor: "#fff" }}
              onClick={() =>
                setVisando((v) => (v < fotos.length - 1 ? v + 1 : 0))
              }
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className="gaveta-btn"
              style={{ color: "#ef4444", borderColor: "#ef4444" }}
              onClick={() => {
                removerFoto(visando);
                setVisando(null);
              }}
            >
              <Trash2 size={14} /> Remover
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   INTEGRAÇÃO NO GavetaDetalhe.jsx
   ---------------------------------------------------------------------
   1) Import:
      import GavetaFotos from "./GavetaFotos";

   2) No montarPayload, inclua "fotos" (e carregue no normalizarDados):
      // normalizarDados:  adicione  fotos: Array.isArray(origem.fotos) ? origem.fotos : [],
      // montarPayload:    dentro de dados: {  ...  fotos: d.fotos,  }

   3) Na lateral da gaveta (ex.: logo acima de "Notas da gaveta"), adicione:
      <GavetaFotos
        fotos={dados.fotos}
        onFotosChange={(novas) => mudar((prev) => ({ ...prev, fotos: novas }))}
        usuario={user?.nome || user?.username || ""}
      />
   ===================================================================== */
