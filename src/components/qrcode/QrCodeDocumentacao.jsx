import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { entregarDataUrl } from "../../native/arquivos";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function montarUrlPublica(token) {
  return `${API_URL}/publico/ficha/${token}/pdf`;
}

export function useQrDataUrl(url) {
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    if (!url) return;
    let ativo = true;

    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "H",
    }).then((d) => {
      if (ativo) setDataUrl(d);
    });

    return () => {
      ativo = false;
    };
  }, [url]);

  return dataUrl;
}

export async function baixarQrCode(dataUrl, filename) {
  if (await entregarDataUrl(dataUrl, filename)) return;
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
