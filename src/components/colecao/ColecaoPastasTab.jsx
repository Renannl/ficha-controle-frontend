import { useState, useMemo } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  ExternalLink,
  ChevronRight,
  Home,
  Loader2,
  Upload,
} from "lucide-react";
import { useArquivosColecao } from "../../hooks/useArquivosColecao";
import UploadArquivoModal from "./UploadArquivoModal";

import { entregarArquivo } from "../../native/arquivos";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function corrigirAcentos(str) {
  if (!str) return str;
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str;
  }
}

function IconeArquivo({ mimeType, size = 20 }) {
  if (mimeType?.includes("pdf"))
    return <FileText size={size} className="icone--pdf" />;
  if (mimeType?.includes("image"))
    return <ImageIcon size={size} className="icone--img" />;
  if (mimeType?.includes("sheet") || mimeType?.includes("excel"))
    return <FileSpreadsheet size={size} className="icone--xls" />;
  if (mimeType?.includes("word"))
    return <FileText size={size} className="icone--doc" />;
  return <FileText size={size} />;
}

function formatarTamanho(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ColecaoPastasTab({ colecaoId }) {
  const { arquivos, carregando, erro, carregar } =
    useArquivosColecao(colecaoId);
  const [caminhoAtual, setCaminhoAtual] = useState([]);
  const [processandoId, setProcessandoId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { pastas, arquivosNaPasta } = useMemo(() => {
    const pastaMap = new Map();

    arquivos.forEach((a) => {
      const partes = a.caminho
        ? a.caminho.split("/").map((p) => corrigirAcentos(p.trim()))
        : [];
      const nomeArquivo = partes.pop();
      const caminhoPasta = partes;

      let caminhoAcumulado = [];
      caminhoPasta.forEach((parte, i) => {
        const chave = caminhoAcumulado.concat(parte).join(" / ");
        if (!pastaMap.has(chave)) {
          pastaMap.set(chave, {
            nome: parte,
            caminho: [...caminhoAcumulado, parte],
            profundidade: i,
            arquivoCount: 0,
          });
        }
        pastaMap.get(chave).arquivoCount++;
        caminhoAcumulado.push(parte);
      });

      const chavePasta = caminhoPasta.join(" / ");
      if (!pastaMap.has(chavePasta)) {
        pastaMap.set(chavePasta, {
          nome: caminhoPasta[caminhoPasta.length - 1] || "Raiz",
          caminho: caminhoPasta,
          profundidade: 0,
          arquivoCount: 0,
        });
      }
    });

    const prefixo = caminhoAtual.join(" / ");
    const pastasFilhas = Array.from(pastaMap.values()).filter((p) => {
      if (prefixo === "") return p.profundidade === 0;
      const pChave = p.caminho.join(" / ");
      return (
        pChave.startsWith(prefixo) && p.profundidade === caminhoAtual.length
      );
    });

    const arquivosAqui = arquivos.filter((a) => {
      const partes = a.caminho
        ? a.caminho.split("/").map((p) => corrigirAcentos(p.trim()))
        : [];
      partes.pop();
      return partes.join(" / ") === prefixo;
    });

    return { pastas: pastasFilhas, arquivosNaPasta: arquivosAqui };
  }, [arquivos, caminhoAtual]);

  async function obterBlob(arquivo) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/sharepoint/arquivo/${arquivo.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Falha ao carregar o arquivo");
    return await res.blob();
  }

  async function verArquivo(arquivo) {
    setProcessandoId(arquivo.id);
    try {
      const blob = await obterBlob(arquivo);
      if (await entregarArquivo(blob, corrigirAcentos(arquivo.nome))) return;
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessandoId(null);
    }
  }

  async function baixarArquivo(arquivo) {
    setProcessandoId(arquivo.id);
    try {
      const blob = await obterBlob(arquivo);
      if (await entregarArquivo(blob, corrigirAcentos(arquivo.nome))) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = corrigirAcentos(arquivo.nome);
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessandoId(null);
    }
  }

  function entrarNaPasta(pasta) {
    setCaminhoAtual(pasta.caminho);
  }

  function irParaPasta(index) {
    setCaminhoAtual(caminhoAtual.slice(0, index));
  }

  function irParaRaiz() {
    setCaminhoAtual([]);
  }

  if (carregando && arquivos.length === 0) {
    return (
      <div className="arq-vazio">
        <Loader2 className="spin" size={20} /> Carregando pastas…
      </div>
    );
  }

  return (
    <div className="colecao-arquivos">
      <div className="pastas-breadcrumb">
        <button className="pastas-breadcrumb-home" onClick={irParaRaiz}>
          <Home size={14} />
        </button>
        {caminhoAtual.map((parte, i) => (
          <span key={i} className="pastas-breadcrumb-item">
            <ChevronRight size={12} />
            <button onClick={() => irParaPasta(i)}>{parte}</button>
          </span>
        ))}

        <button
          className="pastas-upload-btn"
          onClick={() => setShowUploadModal(true)}
          title="Adicionar arquivos nesta pasta"
        >
          <Upload size={14} />
          Adicionar
        </button>
      </div>

      {erro && <div className="arq-erro">⚠️ {erro}</div>}

      {pastas.length > 0 && (
        <section className="pastas-secao">
          <h3 className="pastas-secao-titulo">Pastas</h3>
          <div className="pastas-grid">
            {pastas.map((p) => (
              <button
                key={p.caminho.join(" / ")}
                className="pasta-card"
                onClick={() => entrarNaPasta(p)}
              >
                <Folder className="pasta-card-icone" size={32} />
                <span className="pasta-card-nome" title={p.nome}>
                  {p.nome}
                </span>
                <span className="pasta-card-count">
                  {p.arquivoCount} {p.arquivoCount === 1 ? "item" : "itens"}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {arquivosNaPasta.length > 0 && (
        <section className="pastas-secao">
          <h3 className="pastas-secao-titulo">
            Arquivos ({arquivosNaPasta.length})
          </h3>
          <div className="pastas-arquivos-lista">
            {arquivosNaPasta.map((a) => (
              <div key={a.id} className="arquivo-linha">
                <div className="arquivo-linha-info">
                  <IconeArquivo mimeType={a.mimeType} size={20} />
                  <span className="arquivo-linha-nome" title={a.nome}>
                    {corrigirAcentos(a.nome)}
                  </span>
                  <span className="arquivo-linha-tamanho">
                    {formatarTamanho(a.tamanho)}
                  </span>
                </div>
                <div className="arquivo-linha-acoes">
                  <button
                    className="btn-ghost btn-ghost-sm"
                    onClick={() => verArquivo(a)}
                    disabled={processandoId === a.id}
                    title="Visualizar"
                  >
                    {processandoId === a.id ? (
                      <Loader2 className="spin" size={14} />
                    ) : (
                      <ExternalLink size={14} />
                    )}
                  </button>
                  <button
                    className="btn-ghost btn-ghost-sm"
                    onClick={() => baixarArquivo(a)}
                    disabled={processandoId === a.id}
                    title="Baixar"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pastas.length === 0 && arquivosNaPasta.length === 0 && (
        <div className="arq-vazio">Pasta vazia.</div>
      )}

      <UploadArquivoModal
        show={showUploadModal}
        colecaoId={colecaoId}
        caminhoAtual={caminhoAtual}
        pastasExistentes={pastas}
        onClose={() => setShowUploadModal(false)}
        onEnviado={() => {
          carregar();
        }}
      />
    </div>
  );
}
