import { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useArquivosColecao } from "../../hooks/useArquivosColecao";

import { entregarArquivo } from "../../native/arquivos";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function formatarTamanho(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function IconeArquivo({ mimeType }) {
  if (mimeType?.includes("pdf"))
    return <FileText className="icone-arquivo icone--pdf" />;
  if (mimeType?.includes("image"))
    return <ImageIcon className="icone-arquivo icone--img" />;
  if (mimeType?.includes("sheet") || mimeType?.includes("excel"))
    return <FileSpreadsheet className="icone-arquivo icone--xls" />;
  if (mimeType?.includes("word"))
    return <FileText className="icone-arquivo icone--doc" />;
  return <FileText className="icone-arquivo" />;
}

export default function ColecaoArquivosTab({ colecaoId }) {
  const { arquivos, carregando, erro, carregar } =
    useArquivosColecao(colecaoId);
  const [processandoId, setProcessandoId] = useState(null);

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
      if (await entregarArquivo(blob, arquivo.nome)) return;
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessandoId(null);
    }
  }

  function corrigirAcentos(str) {
    if (!str) return str;
    try {
      return decodeURIComponent(escape(str));
    } catch (e) {
      return str;
    }
  }

  async function baixarArquivo(arquivo) {
    setProcessandoId(arquivo.id);
    try {
      const blob = await obterBlob(arquivo);
      if (await entregarArquivo(blob, arquivo.nome)) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = arquivo.nome;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessandoId(null);
    }
  }

  if (carregando && arquivos.length === 0) {
    return (
      <div className="arq-vazio">
        <Loader2 className="spin" size={20} /> Carregando arquivos…
      </div>
    );
  }

  return (
    <div className="colecao-arquivos">
      <div className="arq-topo">
        <span className="arq-contagem">{arquivos.length} arquivo(s)</span>
        <button className="btn-ghost" onClick={carregar} title="Atualizar">
          <RefreshCw size={16} />
        </button>
      </div>

      {erro && <div className="arq-erro">⚠️ {erro}</div>}

      {arquivos.length === 0 && !erro ? (
        <div className="arq-vazio">Nenhum arquivo nesta coleção ainda.</div>
      ) : (
        <table className="arq-tabela">
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Pasta</th>
              <th>Tamanho</th>
              <th>Modificado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {arquivos.map((a) => (
              <tr key={a.id}>
                <td className="arq-nome" data-label="Arquivo">
                  <div className="arq-nome-grid">
                    <div className="arq-icone-wrap">
                      <IconeArquivo mimeType={a.mimeType} />
                    </div>
                    <span
                      className="arq-nome-text"
                      title={corrigirAcentos(a.nome)}
                    >
                      {corrigirAcentos(a.nome)}
                    </span>
                  </div>
                </td>
                <td
                  className="arq-pasta"
                  data-label="Pasta"
                  title={corrigirAcentos(
                    a.caminho.split("/").slice(0, -1).join(" / "),
                  )}
                >
                  {corrigirAcentos(
                    a.caminho.split("/").slice(0, -1).join(" / "),
                  )}
                </td>
                <td data-label="Tamanho">{formatarTamanho(a.tamanho)}</td>
                <td data-label="Modificado">
                  {a.modificadoEm
                    ? new Date(a.modificadoEm).toLocaleDateString("pt-BR")
                    : "—"}
                </td>
                <td className="arq-acoes" data-label="">
                  <button
                    className="btn-ghost"
                    onClick={() => verArquivo(a)}
                    disabled={processandoId === a.id}
                    title="Visualizar"
                  >
                    {processandoId === a.id ? (
                      <Loader2 className="spin" size={16} />
                    ) : (
                      <ExternalLink size={16} />
                    )}
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => baixarArquivo(a)}
                    disabled={processandoId === a.id}
                    title="Baixar"
                  >
                    <Download size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
