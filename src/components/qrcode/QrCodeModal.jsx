import { QrCode } from "lucide-react";
import { useQrDataUrl, baixarQrCode } from "./QrCodeDocumentacao";
import FichaPdfCliente from "./FichaPdfCliente";

export default function QrCodeModal({ open, url, filename, fichaId, onClose }) {
  const dataUrl = useQrDataUrl(url);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="qr-modal-title">
            <QrCode size={18} />
            <h3>QR Code do Painel</h3>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="modal-body qr-modal-body">
          {dataUrl ? (
            <>
              <div className="qr-code-preview">
                <img src={dataUrl} alt="QR Code da documentação" />
              </div>
              <p className="qr-code-hint">
                Escaneie para acessar a documentação deste painel
              </p>
              <code className="qr-code-url">{url}</code>
            </>
          ) : (
            <div className="qr-loading">
              <div className="login-spinner" />
              <span>Gerando QR Code...</span>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Fechar
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={!dataUrl}
            onClick={() => baixarQrCode(dataUrl, filename)}
          >
            Baixar PNG
          </button>
        </div>

        {fichaId && (
          <div className="qr-pdf-section">
            <div className="qr-pdf-section-titulo">PDF do QR Code</div>
            <p className="qr-pdf-section-hint">
              Escolha qual PDF o cliente verá ao escanear o QR desta ficha.
            </p>
            <FichaPdfCliente fichaId={fichaId} />
          </div>
        )}
      </div>
    </div>
  );
}
