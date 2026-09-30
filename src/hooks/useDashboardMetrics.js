import { useMemo } from "react";
import { getFichaStatus } from "../utils/fichaStatus";

export function useDashboardMetrics(fichas) {
  return useMemo(() => {
    const total = fichas.length;

    let concluidas = 0;
    let emAndamento = 0;
    let novas = 0;
    let reprovadas = 0;

    let totalItems = 0;
    let itemsOk = 0;
    let itemsNa = 0;
    let itemsErro = 0;

    let totalFotos = 0;

    let producao = 0;
    let taf = 0;
    let fotos = 0;
    let qualidade = 0;

    let totalSegundos = 0;
    let sessoesAtivas = 0;
    let fichasParadas = 0;

    let qtdAprovadas = 0;
    let qtdReprovadas = 0;
    let qtdAguardando = 0;
    let qtdRevisao = 0;

    const operadoresMap = {};
    const clientesMap = {};
    const producaoMensalMap = {};
    const aguardandoAprovacao = [];

    fichas.forEach((f) => {
      const itemCount = f.items?.length || 0;
      totalItems += itemCount;

      const op = String(f.operacao ?? "");
      if (op === "50") taf++;
      else if (op === "80") fotos++;
      else if (op === "90") qualidade++;
      else producao++;

      f.items?.forEach((item) => {
        if (item.foto) totalFotos++;
        if (item.resultado === "ok") itemsOk++;
        else if (item.resultado === "na") itemsNa++;
        else if (item.resultado === "erro") itemsErro++;
      });

      const status = getFichaStatus(f);

      if (status === "empty") novas++;
      else if (["progress", "waiting"].includes(status)) emAndamento++;
      else if (status === "rejected") reprovadas++;
      else if (["done", "approved"].includes(status)) concluidas++;

      totalSegundos += Number(f.tempo_acumulado_segundos) || 0;
      if (f.sessao_ativa) sessoesAtivas++;

      if (status === "progress" && !f.sessao_ativa) fichasParadas++;

      const sa = f.statusAprovacao;
      if (sa === "aprovado") qtdAprovadas++;
      else if (sa === "reprovado") qtdReprovadas++;
      else if (sa === "aguardando") {
        qtdAguardando++;
        aguardandoAprovacao.push({
          id: f.dbId ?? f.id,
          numeroInd: f.numeroInd || "—",
          nome: f.nomeEquipamento || "Sem nome",
          codigo: f.codigo || "—",
        });
      } else if (sa === "revisao") qtdRevisao++;

      (f.operadores || []).forEach((opItem) => {
        const key = opItem.username || opItem.id;
        if (!key) return;
        if (!operadoresMap[key]) {
          operadoresMap[key] = {
            nome: opItem.nome || key,
            username: key,
            role: opItem.role || null,
            fichas: 0,
          };
        }
        operadoresMap[key].fichas += 1;
      });

      const cliente = String(f.cliente || "").trim();
      if (cliente) clientesMap[cliente] = (clientesMap[cliente] || 0) + 1;

      if (f.created_at) {
        const d = new Date(f.created_at);
        if (!isNaN(d.getTime())) {
          const mesKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          producaoMensalMap[mesKey] = (producaoMensalMap[mesKey] || 0) + 1;
        }
      }
    });

    const itemsPendentes = totalItems - itemsOk - itemsNa - itemsErro;
    const pctGeral =
      totalItems > 0
        ? Math.round(((itemsOk + itemsNa + itemsErro) / totalItems) * 100)
        : 0;

    const colaboradores = Object.values(operadoresMap).sort(
      (a, b) => b.fichas - a.fichas,
    );
    const clientesRanking = Object.entries(clientesMap)
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd);
    const producaoMensal = Object.entries(producaoMensalMap)
      .map(([mes, qtd]) => ({ mes, qtd }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    const decididas = qtdAprovadas + qtdReprovadas;
    const taxaAprovacao =
      decididas > 0 ? Math.round((qtdAprovadas / decididas) * 100) : 0;
    const mediaTempoPorFicha =
      total > 0 ? Math.round(totalSegundos / total) : 0;

    return {
      total,
      concluidas,
      emAndamento,
      novas,
      reprovadas,
      totalItems,
      itemsOk,
      itemsNa,
      itemsErro,
      itemsPendentes,
      totalFotos,
      producao,
      taf,
      fotos,
      qualidade,
      pctGeral,
      totalSegundos,
      mediaTempoPorFicha,
      sessoesAtivas,
      fichasParadas,
      qtdAprovadas,
      qtdReprovadas,
      qtdAguardando,
      qtdRevisao,
      taxaAprovacao,
      colaboradores,
      totalColaboradores: colaboradores.length,
      clientesRanking,
      producaoMensal,
      aguardandoAprovacao,
    };
  }, [fichas]);
}
