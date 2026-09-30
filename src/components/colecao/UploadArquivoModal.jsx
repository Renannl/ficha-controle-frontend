import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Folder, FileText, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const PASTAS_PADRAO = [
  { valor: "", label: "📁 Raiz da coleção" },
  { valor: "1. Comercial", label: "📂 1. Comercial" },
  { valor: "1. Comercial/Proposta Técnica", label: "   ↳ Proposta Técnica" },
  { valor: "1. Comercial/Lista de Material", label: "   ↳ Lista de Material" },
  {
    valor: "1. Comercial/Projetos e Documentos do Cliente",
    label: "   ↳ Projetos do Cliente",
  },
  { valor: "1. Comercial/Orçamentos", label: "   ↳ Orçamentos" },
  { valor: "2. Projetos", label: "📂 2. Projetos" },
  {
    valor: "2. Projetos/2.1 - Projetos em Desenvolvimento",
    label: "   ↳ 2.1 - Projetos em Desenvolvimento",
  },
  {
    valor: "2. Projetos/2.2 - Projetos para Produção",
    label: "   ↳ 2.2 - Projetos para Produção",
  },
  {
    valor: "2. Projetos/2.3 - Projetos para Plotagem",
    label: "   ↳ 2.3 - Projetos para Plotagem",
  },
  { valor: "3. Produção", label: "📂 3. Produção" },
  { valor: "3. Produção/3.1 - ART", label: "   ↳ 3.1 - ART" },
  { valor: "3. Produção/3.2 - Relatórios", label: "   ↳ 3.2 - Relatórios" },
  { valor: "4. Segurança", label: "📂 4. Segurança" },
  { valor: "5. Qualidade", label: "📂 5. Qualidade" },
];

export default function UploadArquivoModal({
  show,
  colecaoId,
  caminhoAtual = [],
  pastasExistentes = [],
  onClose,
  onEnviado,
}) {
  const { authFetch } = useAuth();
  const [arquivos, setArquivos] = useState([]);
  const [pastaDestino, setPastaDestino] = useState("");
  const [carregando, setCarregando] = useState(false);
  const fileInputRef = useRef(null);

  if (!show) return null;

  const pastaAtualStr = caminhoAtual.join("/");

  function handleSelecionarArquivos(e) {
    const files = Array.from(e.target.files || []);
    setArquivos((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  function removerArquivo(index) {
    setArquivos((prev) => prev.filter((_, i) => i !== index));
  }

  function formatarTamanho(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleEnviar() {
    if (arquivos.length === 0) {
      alert("Selecione ao menos um arquivo.");
      return;
    }

    setCarregando(true);
    try {
      const form = new FormData();
      arquivos.forEach((f) => form.append("arquivos", f));
      form.append("pasta", pastaDestino);

      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/colecoes/${colecaoId}/arquivos/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao enviar arquivos");
      }

      const msg =
        data.erros > 0
          ? `${data.enviados} enviado(s), ${data.erros} com erro.`
          : `${data.enviados} arquivo(s) enviado(s) com sucesso!`;

      alert(msg);
      onEnviado?.();
      handleClose();
    } catch (err) {
      alert(err.message || "Erro ao enviar arquivos.");
    } finally {
      setCarregando(false);
    }
  }

  function handleClose() {
    setArquivos([]);
    setPastaDestino("");
    onClose?.();
  }

  const pastasDisponiveis = [...PASTAS_PADRAO];
  pastasExistentes.forEach((p) => {
    const caminhoStr = p.caminho.join("/");
    if (!pastasDisponiveis.some((pd) => pd.valor === caminhoStr)) {
      pastasDisponiveis.push({
        valor: caminhoStr,
        label: `📁 ${caminhoStr}`,
      });
    }
  });

  return createPortal(
    <div className="importar-colecao-overlay" onClick={handleClose}>
      <div
        className="importar-colecao-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="importar-colecao-header">
          <div>
            <h3>Adicionar Arquivos</h3>
            <p>Escolha a pasta de destino e os arquivos:</p>
          </div>
          <button className="new-ficha-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div className="importar-colecao-body">
          <div className="importar-campo">
            <div className="importar-campo-label">
              <Folder size={14} style={{ marginRight: 4 }} />
              Pasta de destino
            </div>
            <select
              className="upload-pasta-select"
              value={pastaDestino}
              onChange={(e) => setPastaDestino(e.target.value)}
            >
              {pastasDisponiveis.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.label}
                </option>
              ))}
            </select>
            {pastaAtualStr && (
              <div className="upload-pasta-hint">
                💡 Pasta atual: <strong>{pastaAtualStr || "Raiz"}</strong>
              </div>
            )}
          </div>

          <div className="importar-campo">
            <div className="importar-campo-label">
              Arquivos
              <span className="importar-obrigatorio">*</span>
            </div>

            {arquivos.length === 0 ? (
              <button
                type="button"
                className="importar-campo-selecionar"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} />
                Escolher arquivos
              </button>
            ) : (
              <div className="upload-arquivos-lista">
                {arquivos.map((file, i) => (
                  <div key={i} className="upload-arquivo-item">
                    <FileText size={14} />
                    <span className="upload-arquivo-nome" title={file.name}>
                      {file.name}
                    </span>
                    <span className="upload-arquivo-tamanho">
                      {formatarTamanho(file.size)}
                    </span>
                    <button
                      type="button"
                      className="importar-campo-remover"
                      onClick={() => removerArquivo(i)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="upload-adicionar-mais"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={12} /> Adicionar mais
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip,.dwg,.txt"
              onChange={handleSelecionarArquivos}
              style={{ display: "none" }}
            />
          </div>
        </div>

        <div className="importar-colecao-footer">
          <button
            className="btn btn-ghost"
            onClick={handleClose}
            disabled={carregando}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleEnviar}
            disabled={carregando || arquivos.length === 0}
          >
            {carregando ? (
              <>
                <Loader2 size={14} className="spin" /> Enviando...
              </>
            ) : (
              <>
                <Upload size={14} /> Enviar{" "}
                {arquivos.length > 0 && `(${arquivos.length})`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
