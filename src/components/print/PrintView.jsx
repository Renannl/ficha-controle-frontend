import { useState, useEffect, useRef } from "react";
import { OPERACOES } from "../../data/fichaTemplate";
import { authFetch } from "../../services/apiClient";
import { useSessoesTrabalho } from "../../hooks/useSessoesTrabalho";

import PrintViewOperacao from "./PrintViewOperacao";
import PrintViewTAF from "./PrintViewTAF";
import PrintViewFotos from "./PrintViewFotos";
import PrintViewFotosTecnicas from "./PrintViewFotosTecnicas";

function getOperacao(operacoes, id) {
  if (!operacoes) return undefined;
  if (Array.isArray(operacoes)) {
    return operacoes.find((o) => o.id === id);
  }
  if (operacoes instanceof Map) {
    return operacoes.get(id);
  }
  return operacoes[id];
}

export default function PrintView({ ficha, isBook, onDataReady }) {
  const sinalizado = useRef(false);
  const fichaId = ficha?.dbId ?? ficha?.id;

  const { sessoes, loading: sessoesLoading } = useSessoesTrabalho(fichaId);

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(!!fichaId);

  useEffect(() => {
    if (!fichaId) return;
    let cancelado = false;

    setLogsLoading(true);

    (async () => {
      try {
        const response = await authFetch(`/fichas/${fichaId}/checklist-log`);
        if (!response || !response.ok) return;
        const data = await response.json();
        if (!cancelado) setLogs(Array.isArray(data) ? data : data.logs || []);
      } catch (err) {
        console.error("[PrintView] Erro ao buscar logs:", err);
      } finally {
        if (!cancelado) setLogsLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [fichaId]);

  useEffect(() => {
    if (sessoesLoading || logsLoading) return;
    if (sinalizado.current) return;
    sinalizado.current = true;
    onDataReady?.();
  }, [sessoesLoading, logsLoading, onDataReady]);

  const op = getOperacao(OPERACOES, ficha.operacao);

  switch (ficha.operacao) {
    case "80":
      return ficha.tipoFotografico === "tecnica" ? (
        <PrintViewFotosTecnicas ficha={ficha} isBook={isBook} />
      ) : (
        <PrintViewFotos ficha={ficha} isBook={isBook} />
      );
    case "50":
      return <PrintViewTAF ficha={ficha} op={op} isBook={isBook} />;
    case "90":
    case "10":
    default:
      return (
        <PrintViewOperacao
          ficha={ficha}
          op={op}
          isBook={isBook}
          sessoes={sessoes}
          logs={logs}
        />
      );
  }
}
