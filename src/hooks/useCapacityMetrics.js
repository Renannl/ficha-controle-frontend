import { useMemo } from "react";
import { getProgressPct } from "../utils/fichaStatus";

const HORAS_DIA = 8;
const DIAS_SEMANA = 5;

function getFichaTipoKey(ficha) {
  const op = String(ficha.operacao ?? "");
  const tipoPainel = ficha.tipoPainel || ficha.dados?.tipoPainel;
  const tipoFotografico = ficha.tipoFotografico || ficha.dados?.tipoFotografico;

  if (op === "10" && tipoPainel) return `op-${op}-painel-${tipoPainel}`;
  if (op === "50" && tipoPainel) return `op-${op}-painel-${tipoPainel}`;
  if (op === "80" && tipoFotografico) return `op-${op}-foto-${tipoFotografico}`;
  return `op-${op}`;
}

const FALLBACK_HORAS = {
  "op-10": 40,
  "op-50": 16,
  "op-80": 8,
  "op-90": 12,
  default: 24,
};

function calcularMediaHistorica(fichas, fichaAtual) {
  const chave = getFichaTipoKey(fichaAtual);

  const finalizadas = fichas.filter((f) => {
    if (f.dbId === fichaAtual.dbId) return false;
    if (f.status !== "finalizada" && f.status !== "aprovada") return false;
    return getFichaTipoKey(f) === chave;
  });

  if (finalizadas.length === 0) return null;

  const totalHoras = finalizadas.reduce((acc, f) => {
    const segundos =
      f.totalSegundos ||
      f.tempo_acumulado_segundos ||
      calcularSegundosPorSessoes(f.sessions || []);
    return acc + segundos / 3600;
  }, 0);

  return totalHoras / finalizadas.length;
}

function calcularSegundosPorSessoes(sessions) {
  return sessions.reduce((acc, s) => {
    if (!s) return acc;
    if (s.duracao_segundos) return acc + Number(s.duracao_segundos);
    if (s.hIni && s.hFim) {
      const [hi, mi] = String(s.hIni).split(":").map(Number);
      const [hf, mf] = String(s.hFim).split(":").map(Number);
      if (!isNaN(hi) && !isNaN(hf)) {
        return acc + (hf * 60 + mf - (hi * 60 + mi)) * 60;
      }
    }
    return acc;
  }, 0);
}

function getCargoAtual(operador, usuarios) {
  if (!operador) return null;

  const listaUsuarios = Array.isArray(usuarios) ? usuarios : [];

  const usuario = listaUsuarios.find(
    (u) => u && (u.id === operador.id || u.username === operador.username),
  );

  return usuario?.role || operador.role || null;
}

function getHorasEstimadasFicha(ficha, fichas) {
  const previsto = Number(ficha.tempoPrevisto);
  if (!isNaN(previsto) && previsto > 0) return previsto;

  const media = calcularMediaHistorica(fichas, ficha);
  if (media !== null) return media;

  const chave = getFichaTipoKey(ficha);
  return FALLBACK_HORAS[chave] ?? FALLBACK_HORAS.default;
}

export function useCapacityMetrics(fichas, usuarios) {
  return useMemo(() => {
    const usuariosAtivos = (usuarios || []).filter(
      (u) => u.active !== false && u.role && u.role !== "admin",
    );

    const funcionariosPorCargo = {};
    usuariosAtivos.forEach((u) => {
      if (!funcionariosPorCargo[u.role]) funcionariosPorCargo[u.role] = [];
      funcionariosPorCargo[u.role].push(u);
    });

    const demandaPorCargo = {};
    Object.keys(funcionariosPorCargo).forEach((cargo) => {
      demandaPorCargo[cargo] = {
        cargo,
        funcionarios: funcionariosPorCargo[cargo],
        nFuncionarios: funcionariosPorCargo[cargo].length,
        horasDemanda: 0,
        fichas: [],
      };
    });

    const fichasAtivas = (fichas || []).filter(
      (f) => f.status !== "finalizada" || f.statusAprovacao !== "aprovado",
    );

    const etaPorFicha = [];

    fichasAtivas.forEach((ficha) => {
      const progresso = getProgressPct(ficha) / 100;
      const horasTotais = getHorasEstimadasFicha(ficha, fichas);
      const horasRestantes = horasTotais * (1 - progresso);

      const operadores = (ficha.operadores || []).filter(Boolean);
      const cargosNaFicha = new Set();

      operadores.forEach((op) => {
        const cargo = getCargoAtual(op, usuarios);
        if (cargo) cargosNaFicha.add(cargo);
      });

      if (operadores.length === 0 || cargosNaFicha.size === 0) {
        etaPorFicha.push({
          ficha,
          horasRestantes,
          etaDias: null,
          semAlocacao: true,
        });
        return;
      }

      const horasPorCargo = horasRestantes / cargosNaFicha.size;
      let etaDias = 0;

      cargosNaFicha.forEach((cargo) => {
        const nFunc = funcionariosPorCargo[cargo]?.length || 0;
        if (nFunc === 0) {
          etaDias = Infinity;
        } else {
          etaDias = Math.max(etaDias, horasPorCargo / (nFunc * HORAS_DIA));
        }

        if (demandaPorCargo[cargo]) {
          demandaPorCargo[cargo].horasDemanda += horasPorCargo;
          demandaPorCargo[cargo].fichas.push({
            ficha,
            horas: horasPorCargo,
          });
        }
      });

      etaPorFicha.push({
        ficha,
        horasRestantes,
        etaDias: etaDias === Infinity ? null : Math.ceil(etaDias),
        semAlocacao: false,
      });
    });

    const metricasCargo = Object.values(demandaPorCargo).map((d) => {
      const capacidadeSemanal = d.nFuncionarios * HORAS_DIA * DIAS_SEMANA;
      const folga = capacidadeSemanal - d.horasDemanda;
      const diasParaZerar =
        d.nFuncionarios > 0
          ? d.horasDemanda / (d.nFuncionarios * HORAS_DIA)
          : Infinity;

      return {
        cargo: d.cargo,
        nFuncionarios: d.nFuncionarios,
        horasDemanda: Math.round(d.horasDemanda),
        capacidadeSemanal,
        folgaHoras: Math.round(folga),
        diasParaZerar:
          diasParaZerar === Infinity ? null : Math.ceil(diasParaZerar),
        gargalo: folga < 0,
        fichas: d.fichas,
      };
    });

    metricasCargo.sort((a, b) => {
      if (a.gargalo && !b.gargalo) return -1;
      if (!a.gargalo && b.gargalo) return 1;
      return (b.diasParaZerar || 0) - (a.diasParaZerar || 0);
    });

    const maiorGargalo =
      metricasCargo.find((m) => m.gargalo) || metricasCargo[0] || null;

    return {
      metricasCargo,
      etaPorFicha,
      maiorGargalo,
      totalFichasAtivas: fichasAtivas.length,
      totalFuncionariosAtivos: usuariosAtivos.length,
    };
  }, [fichas, usuarios]);
}
