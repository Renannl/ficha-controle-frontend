import { useState, useEffect, useRef } from "react";
import { OPERACOES } from "../../data/fichaTemplate";
import { authFetch } from "../../services/apiClient";
import { useSessoesTrabalho } from "../../hooks/useSessoesTrabalho";
import { useGavetas } from "../../hooks/useGavetas";

import PrintViewOperacao from "./PrintViewOperacao";
import PrintViewTAF from "./PrintViewTAF";
import PrintViewFotos from "./PrintViewFotos";
import PrintViewFotosTecnicas from "./PrintViewFotosTecnicas";
import PrintViewGavetaFotos from "./PrintViewGavetaFotos";

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

// 🆕 Detecta painel CCM: operação 10 + tipoPainel "ccm".
// O tipo pode vir de ficha.tipoPainel OU ficha.dados.tipoPainel (JSONB).
function ehCcm(ficha) {
  const tipo = String(ficha?.tipoPainel || ficha?.dados?.tipoPainel || "")
    .toLowerCase()
    .trim();
  return tipo === "ccm";
}

// 🆕 Pega o id da ficha de produção vinculada (relatório fotográfico/TAF).
// Usado para carregar as gavetas do CCM ao imprimir a ficha vinculada.
function fichaProducaoIdDe(ficha) {
  return (
    ficha?.ficha_producao_id ||
    ficha?.dados?.ficha_producao_id ||
    ficha?.producaoId ||
    null
  );
}

export default function PrintView({ ficha, isBook, onDataReady }) {
  const sinalizado = useRef(false);
  const fichaId = ficha?.dbId ?? ficha?.id;

  const operacao = String(ficha?.operacao);
  const isCcm = operacao === "10" && ehCcm(ficha);
  const producaoId = isCcm ? null : fichaProducaoIdDe(ficha);

  const { sessoes, loading: sessoesLoading } = useSessoesTrabalho(fichaId);

  const gavetaTargetId = isCcm
    ? fichaId
    : operacao === "80" && producaoId
      ? producaoId
      : null;

  const { gavetas, loading: gavetasLoading } = useGavetas(gavetaTargetId);

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

  // 🆕 O "pronto" agora espera também o carregamento das gavetas,
  // para o PDF não sair antes das fotos das gavetas chegarem.
  useEffect(() => {
    if (sessoesLoading || logsLoading || gavetasLoading) return;
    if (sinalizado.current) return;
    sinalizado.current = true;
    onDataReady?.();
  }, [sessoesLoading, logsLoading, gavetasLoading, onDataReady]);

  const op = getOperacao(OPERACOES, ficha.operacao);

  switch (ficha.operacao) {
    case "80": {
      // 🆕 Relatório fotográfico (geral/técnico) + fotos das gavetas do
      // CCM vinculado. As gavetas vêm da ficha de produção.
      const gavetasComFotos = (gavetas || [])
        .filter((g) => (g?.dados?.fotos || []).length > 0)
        .sort((a, b) => Number(a.numero) - Number(b.numero));

      return (
        <>
          {ficha.tipoFotografico === "tecnica" ? (
            <PrintViewFotosTecnicas ficha={ficha} isBook={isBook} />
          ) : (
            <PrintViewFotos ficha={ficha} isBook={isBook} />
          )}

          {gavetasComFotos.map((g) => (
            <PrintViewGavetaFotos
              key={g.id}
              gaveta={g}
              ficha={ficha}
              numeroG={g.numero}
              isBook={isBook}
            />
          ))}
        </>
      );
    }

    case "50":
      return <PrintViewTAF ficha={ficha} op={op} isBook={isBook} />;

    case "90":
      return (
        <PrintViewOperacao
          ficha={ficha}
          op={op}
          isBook={isBook}
          sessoes={sessoes}
          logs={logs}
        />
      );

    case "10":
    default: {
      // 🆕 Só as gavetas que realmente têm fotos entram no relatório.
      const gavetasComFotos = (gavetas || [])
        .filter((g) => (g?.dados?.fotos || []).length > 0)
        .sort((a, b) => Number(a.numero) - Number(b.numero));

      // Fotos gerais da ficha mestre (fluxo normal, ex.: fotoData.fotos).
      const fotosMestre = ficha?.fotoData?.fotos || [];

      return (
        <>
          {/* Checklist / planejamento / verificações da ficha mestre */}
          <PrintViewOperacao
            ficha={ficha}
            op={op}
            isBook={isBook}
            sessoes={sessoes}
            logs={logs}
          />

          {/* 🆕 Fotos gerais do painel CCM (se houver na ficha mestre) */}
          {isCcm && fotosMestre.length > 0 && (
            <PrintViewFotos ficha={ficha} isBook={isBook} />
          )}

          {/* 🆕 Relatório fotográfico separado por gaveta */}
          {gavetasComFotos.map((g) => (
            <PrintViewGavetaFotos
              key={g.id}
              gaveta={g}
              ficha={ficha}
              numeroG={g.numero}
              isBook={isBook}
            />
          ))}
        </>
      );
    }
  }
}
