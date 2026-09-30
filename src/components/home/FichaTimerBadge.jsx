import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { formatarNomeUsuario } from "../../utils/tempoUtils";

function formatarTempo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FichaTimerBadge({ sessaoAtiva, tempoAcumulado = 0 }) {
  const [tempoTotal, setTempoTotal] = useState(tempoAcumulado);

  useEffect(() => {
    if (!sessaoAtiva?.inicio) {
      setTempoTotal(tempoAcumulado);
      return;
    }

    const inicioSessaoAtiva = new Date(sessaoAtiva.inicio).getTime();

    const atualizar = () => {
      const decorridoSessaoAtual = (Date.now() - inicioSessaoAtiva) / 1000;
      setTempoTotal(tempoAcumulado + decorridoSessaoAtual);
    };

    atualizar();
    const interval = setInterval(atualizar, 1000);
    return () => clearInterval(interval);
  }, [sessaoAtiva?.inicio, tempoAcumulado]);

  if (!sessaoAtiva && tempoAcumulado === 0) return null;

  const emAndamento = !!sessaoAtiva;

  return (
    <span
      className={`ficha-timer-badge ${emAndamento ? "ativo" : "parado"}`}
      title={
        emAndamento
          ? `${formatarNomeUsuario(sessaoAtiva.usuario)} está trabalhando agora`
          : "Sem ninguém trabalhando no momento"
      }
    >
      {emAndamento && <span className="ficha-timer-badge-dot" />}
      <Clock size={12} />
      {formatarTempo(tempoTotal)}
    </span>
  );
}
