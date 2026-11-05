// ============================================================
// hooks/useDashboardMetrics.js — ARQUIVO COMPLETO
// ⚠️ Admins (role === "admin") NÃO entram nas métricas de
// colaboradores/produção, pois não trabalham nas fichas.
// ============================================================
import { useMemo } from "react";
import {
  campo,
  dataISO,
  diffDias,
  estadoFicha,
  hoje,
  isConcluida,
  itemsDe,
  chaveMes,
} from "../utils/metricsHelpers";

const PRAZO_CRITICO_DIAS = 5; // vence em até 5 dias
const ESTAGNADA_DIAS = 3; // sem atualização há 3+ dias

export function useDashboardMetrics(fichas, usuarios = []) {
  return useMemo(() => {
    const lista = Array.isArray(fichas) ? fichas : [];
    const users = Array.isArray(usuarios) ? usuarios : [];

    // Set de usernames/ids que são admin → excluídos das métricas de colaboradores
    const adminIds = new Set();
    for (const u of users) {
      if (u?.role === "admin") {
        if (u.username) adminIds.add(String(u.username).toLowerCase());
        if (u.id) adminIds.add(String(u.id).toLowerCase());
        if (u.nome) adminIds.add(String(u.nome).trim().toLowerCase());
      }
    }

    const agora = hoje();

    const contadores = {
      total: 0,
      emAndamento: 0,
      concluidas: 0,
      novas: 0,
      reprovadas: 0,
      aprovadas: 0,
      atrasadas: 0,
      prazoCritico: 0,
      fichasParadas: 0,
      fichasEstagnadas: 0,
      sessoesAtivas: 0,
      totalSegundos: 0,
    };

    const contagemAprovacao = {
      qtdAprovadas: 0,
      qtdReprovadas: 0,
      qtdAguardando: 0,
      qtdRevisao: 0,
    };

    const itens = {
      totalItems: 0,
      itemsOk: 0,
      itemsNa: 0,
      itemsErro: 0,
      itemsPendentes: 0,
      itensErroAbertos: 0,
    };

    const producaoMap = new Map();
    const clienteMap = new Map();
    const colabMap = new Map();

    const fichasAtrasadas = [];
    const fichasPrazoCritico = [];
    const aguardandoAprovacao = [];
    const diasEmAndamento = [];

    for (const ficha of lista) {
      const estado = estadoFicha(ficha);
      contadores.total++;

      if (estado === "andamento") contadores.emAndamento++;
      else if (estado === "concluida") contadores.concluidas++;
      else if (estado === "reprovada") contadores.reprovadas++;
      else contadores.novas++;

      // ── Aprovação ───────────────────────────────────────────
      const aprov = String(campo(ficha, "statusAprovacao") || "").toLowerCase();
      if (aprov === "aprovado") {
        contadores.aprovadas++;
        contagemAprovacao.qtdAprovadas++;
      } else if (aprov === "reprovado") {
        contagemAprovacao.qtdReprovadas++;
      } else if (aprov === "aguardando") {
        contagemAprovacao.qtdAguardando++;
        aguardandoAprovacao.push({
          id: ficha?.dbId ?? ficha?.id,
          codigo: campo(ficha, "codigo"),
          numeroInd: campo(ficha, "numeroInd"),
          cliente: campo(ficha, "cliente"),
          nomeEquipamento: campo(ficha, "nomeEquipamento"),
          status: estado,
        });
      } else if (
        aprov === "revisao" ||
        aprov === "em revisao" ||
        aprov === "em_revisao"
      ) {
        contagemAprovacao.qtdRevisao++;
      }

      // ── Sessões / tempo ─────────────────────────────────────
      const sessaoAtiva = campo(ficha, "sessao_ativa");
      if (sessaoAtiva) contadores.sessoesAtivas++;

      const tempoAcumulado = Number(
        campo(ficha, "tempo_acumulado_segundos") || 0,
      );

      let tempoExtra = 0;
      if (sessaoAtiva?.inicio) {
        const inicio = dataISO(sessaoAtiva.inicio);
        if (inicio)
          tempoExtra = Math.max(0, (Date.now() - inicio.getTime()) / 1000);
      }

      const tempoFicha = tempoAcumulado + tempoExtra;
      contadores.totalSegundos += tempoFicha;

      // ── Prazos ──────────────────────────────────────────────
      const dataTermino = dataISO(campo(ficha, "dataTermino"));
      const concluida = isConcluida(ficha);

      if (!concluida && dataTermino) {
        const diasRestantes = diffDias(agora, dataTermino);
        const resumo = {
          id: ficha?.dbId ?? ficha?.id,
          codigo: campo(ficha, "codigo"),
          numeroInd: campo(ficha, "numeroInd"),
          cliente: campo(ficha, "cliente"),
          nomeEquipamento: campo(ficha, "nomeEquipamento"),
          diasRestantes,
        };

        if (diasRestantes < 0) {
          contadores.atrasadas++;
          fichasAtrasadas.push(resumo);
        } else if (diasRestantes <= PRAZO_CRITICO_DIAS) {
          contadores.prazoCritico++;
          fichasPrazoCritico.push(resumo);
        }
      }

      // ── Estagnação / dias em andamento ──────────────────────
      if (estado === "andamento") {
        if (!sessaoAtiva) contadores.fichasParadas++;

        const updatedAt = dataISO(ficha?.updated_at);
        if (updatedAt && diffDias(updatedAt, agora) >= ESTAGNADA_DIAS) {
          contadores.fichasEstagnadas++;
        }

        const criado = dataISO(ficha?.created_at || campo(ficha, "dataInicio"));
        if (criado) {
          const dias = diffDias(criado, agora);
          if (dias !== null && dias >= 0) diasEmAndamento.push(dias);
        }
      }

      // ── Checklist ───────────────────────────────────────────
      const itensFicha = itemsDe(ficha);
      const encerrada = estado === "concluida" || estado === "reprovada";

      for (const item of itensFicha) {
        itens.totalItems++;
        const r = String(item?.resultado || "").toLowerCase();

        if (r === "ok") itens.itemsOk++;
        else if (r === "na" || r === "n/a") itens.itemsNa++;
        else if (r === "erro") {
          itens.itemsErro++;
          if (!encerrada) itens.itensErroAbertos++;
        } else {
          itens.itemsPendentes++;
        }
      }

      // ── Produção mensal (mês de conclusão) ──────────────────
      const finalizadaEm = dataISO(
        campo(ficha, "finalizadaAt") || campo(ficha, "aprovadoEm"),
      );
      if (concluida && finalizadaEm) {
        const m = chaveMes(finalizadaEm);
        producaoMap.set(m, (producaoMap.get(m) || 0) + 1);
      }

      // ── Clientes ────────────────────────────────────────────
      const cliente = String(campo(ficha, "cliente") || "Sem cliente").trim();
      clienteMap.set(cliente, (clienteMap.get(cliente) || 0) + 1);

      // ── Colaboradores (operadores + criador) ────────────────
      // Admins são ignorados — não trabalham nas fichas.
      const operadores = Array.isArray(campo(ficha, "operadores"))
        ? campo(ficha, "operadores")
        : [];
      const envolvidos = new Map();

      for (const op of operadores) {
        const username = op?.username || op?.usuario;
        if (!username) continue;
        const role = op?.role || op?.cargo || "";
        if (role === "admin") continue; // 🆕 ignora admin
        const chave = String(username).toLowerCase();
        if (adminIds.has(chave)) continue; // 🆕 ignora admin pela lista de usuários
        envolvidos.set(username, {
          username,
          nome: op?.nome || username,
          role,
        });
      }

      const criador = ficha?.user_id || campo(ficha, "user_id");
      if (criador && !envolvidos.has(criador)) {
        const chaveCriador = String(criador).toLowerCase();
        if (!adminIds.has(chaveCriador)) {
          envolvidos.set(criador, {
            username: criador,
            nome: campo(ficha, "criado_por") || criador,
            role: "",
          });
        }
      }

      for (const [username, info] of envolvidos) {
        const atual = colabMap.get(username) || {
          username,
          nome: info.nome,
          role: info.role,
          fichas: 0,
          itens: 0,
          horas: 0, // segundos de envolvimento (soma por ficha)
        };
        atual.fichas += 1;
        atual.itens += itensFicha.length;
        atual.horas += tempoFicha;
        colabMap.set(username, atual);
      }
    }

    // ── Checklist ─────────────────────────────────────────────
    const verificados = itens.itemsOk + itens.itemsNa + itens.itemsErro;
    const pctGeral =
      itens.totalItems > 0
        ? Math.round((verificados / itens.totalItems) * 100)
        : 0;
    const taxaErro =
      verificados > 0 ? Math.round((itens.itemsErro / verificados) * 100) : 0;

    // ── Aprovação ─────────────────────────────────────────────
    const decididas =
      contagemAprovacao.qtdAprovadas + contagemAprovacao.qtdReprovadas;
    const taxaAprovacao =
      decididas > 0
        ? Math.round((contagemAprovacao.qtdAprovadas / decididas) * 100)
        : 0;

    // ── Tempo ─────────────────────────────────────────────────
    const mediaTempoPorFicha =
      contadores.total > 0 ? contadores.totalSegundos / contadores.total : 0;
    const mediaDiasAndamento =
      diasEmAndamento.length > 0
        ? Math.round(
            (diasEmAndamento.reduce((a, b) => a + b, 0) /
              diasEmAndamento.length) *
              10,
          ) / 10
        : 0;

    // ── Séries e rankings ─────────────────────────────────────
    const producaoMensal = [...producaoMap.entries()]
      .map(([mes, qtd]) => ({ mes, qtd }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    const colaboradores = [...colabMap.values()]
      .sort((a, b) => b.fichas - a.fichas || b.itens - a.itens)
      .map((c) => ({ ...c, horas: Math.round((c.horas / 3600) * 10) / 10 }));

    const clientesRanking = [...clienteMap.entries()]
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd);

    return {
      // volumes
      total: contadores.total,
      emAndamento: contadores.emAndamento,
      concluidas: contadores.concluidas,
      novas: contadores.novas,
      reprovadas: contadores.reprovadas,
      aprovadas: contadores.aprovadas,

      // prazos
      atrasadas: contadores.atrasadas,
      prazoCritico: contadores.prazoCritico,
      fichasAtrasadas,
      fichasPrazoCritico,

      // checklist
      totalItems: itens.totalItems,
      itemsOk: itens.itemsOk,
      itemsNa: itens.itemsNa,
      itemsErro: itens.itemsErro,
      itemsPendentes: itens.itemsPendentes,
      itensErroAbertos: itens.itensErroAbertos,
      pctGeral,
      taxaErro,

      // aprovação
      ...contagemAprovacao,
      taxaAprovacao,
      aguardandoAprovacao,

      // tempo / atividade
      sessoesAtivas: contadores.sessoesAtivas,
      totalSegundos: Math.round(contadores.totalSegundos),
      mediaTempoPorFicha: Math.round(mediaTempoPorFicha),
      mediaDiasAndamento,
      fichasParadas: contadores.fichasParadas,
      fichasEstagnadas: contadores.fichasEstagnadas,

      // rankings / série
      colaboradores,
      clientesRanking,
      producaoMensal,
    };
  }, [fichas, usuarios]);
}
