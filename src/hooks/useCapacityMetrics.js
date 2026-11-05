// ============================================================
// hooks/useCapacityMetrics.js — ARQUIVO COMPLETO
// ⚠️ Admins (role === "admin") NÃO contam como funcionários,
// pois não trabalham nas fichas.
// ============================================================
import { useMemo } from "react";
import { campo, emAndamento, capitalizar } from "../utils/metricsHelpers";

const HORAS_SEMANA_POR_PESSOA = 44;

const CARGO_LABEL = {
  montagem: "Montador",
  barramento: "Barramento",
  cabeamento: "Cabeamento",
  taf: "Técnico TAF",
  producao: "Produção",
  admin: "Supervisor",
};

function parseHoras(val) {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  const n = parseFloat(
    String(val)
      .replace(",", ".")
      .replace(/[^\d.]/g, ""),
  );
  return Number.isFinite(n) ? n : 0;
}

function cargoDaFicha(ficha) {
  // 1) operadores alocados
  const operadores = campo(ficha, "operadores");
  if (Array.isArray(operadores) && operadores.length > 0) {
    const cargo =
      operadores[0]?.cargo || operadores[0]?.role || operadores[0]?.etapa;
    if (cargo) return cargo;
  }

  // 2) etapa atual do histórico
  const historico = campo(ficha, "historicoEtapas");
  if (Array.isArray(historico) && historico.length > 0) {
    const ultima = historico[historico.length - 1];
    if (ultima?.etapa) return ultima.etapa;
  }

  // 3) pela operação
  if (String(ficha?.operacao || "") === "50") return "taf";
  return "montagem";
}

function horasRestantes(ficha) {
  const previsto = parseHoras(campo(ficha, "tempoPrevisto"));
  if (previsto > 0) {
    const investido =
      Number(campo(ficha, "tempo_acumulado_segundos") || 0) / 3600;
    return Math.max(0, previsto - investido);
  }

  // Sem previsão: estimativa padrão por tipo de ficha
  return String(ficha?.operacao || "") === "50" ? 8 : 40;
}

export function useCapacityMetrics(fichas, usuarios) {
  return useMemo(() => {
    const lista = Array.isArray(fichas) ? fichas : [];
    const users = Array.isArray(usuarios) ? usuarios : [];
    const ativas = lista.filter((f) => emAndamento(f));

    // Funcionários ativos por cargo — exclui admins (não trabalham nas fichas)
    const funcionariosPorCargo = new Map();
    for (const u of users) {
      if (u?.active === false) continue;
      if (u?.role === "admin") continue; // 🆕 admin não conta como mão de obra
      const cargo = u?.role || "montagem";
      funcionariosPorCargo.set(
        cargo,
        (funcionariosPorCargo.get(cargo) || 0) + 1,
      );
    }

    // Demanda por cargo + ETA por ficha
    const demandaPorCargo = new Map();
    const etaFichas = [];
    let fichasSemAlocacao = 0;

    for (const ficha of ativas) {
      const cargo = cargoDaFicha(ficha);
      const horas = horasRestantes(ficha);
      const temOperador =
        Array.isArray(campo(ficha, "operadores")) &&
        campo(ficha, "operadores").length > 0;

      if (!temOperador) fichasSemAlocacao++;

      demandaPorCargo.set(cargo, (demandaPorCargo.get(cargo) || 0) + horas);

      etaFichas.push({
        ficha,
        cargo,
        horasRestantes: horas,
        etaDias: null, // calculado após a taxa do cargo
        semAlocacao: !temOperador,
      });
    }

    // Métricas por cargo
    const cargos = [
      ...new Set([...demandaPorCargo.keys(), ...funcionariosPorCargo.keys()]),
    ];
    const metricasCargo = cargos
      .map((cargo) => {
        const nFuncionarios = funcionariosPorCargo.get(cargo) || 0;
        const horasDemanda = Math.round(demandaPorCargo.get(cargo) || 0);
        const capacidadeSemanal = nFuncionarios * HORAS_SEMANA_POR_PESSOA;
        const folgaHoras = capacidadeSemanal - horasDemanda;
        const horasPorDia = capacidadeSemanal / 5;
        const diasParaZerar =
          horasDemanda > 0
            ? nFuncionarios > 0
              ? Math.ceil(horasDemanda / horasPorDia)
              : null
            : 0;

        return {
          cargo,
          cargoLabel: CARGO_LABEL[cargo] || capitalizar(cargo),
          nFuncionarios,
          horasDemanda,
          capacidadeSemanal,
          folgaHoras,
          diasParaZerar,
          gargalo: folgaHoras < 0,
        };
      })
      .filter((m) => m.nFuncionarios > 0 || m.horasDemanda > 0)
      .sort((a, b) => a.folgaHoras - b.folgaHoras);

    // Maior gargalo = pior folga (mais negativa)
    const gargalos = metricasCargo.filter((m) => m.gargalo);
    const maiorGargalo = gargalos.length
      ? gargalos.reduce((a, b) => (a.folgaHoras < b.folgaHoras ? a : b))
      : null;

    // ETA por ficha usando a taxa do cargo
    const taxaPorCargo = new Map(metricasCargo.map((m) => [m.cargo, m]));
    for (const e of etaFichas) {
      const m = taxaPorCargo.get(e.cargo);
      if (!e.semAlocacao && m && m.nFuncionarios > 0) {
        const horasPorDia = m.capacidadeSemanal / 5;
        e.etaDias = Math.ceil(e.horasRestantes / horasPorDia);
      }
    }

    const totalHorasDemanda = metricasCargo.reduce(
      (a, m) => a + m.horasDemanda,
      0,
    );

    return {
      metricasCargo,
      etaPorFicha: etaFichas,
      maiorGargalo: maiorGargalo ? { cargo: maiorGargalo.cargoLabel } : null,
      totalFichasAtivas: ativas.length,
      totalFuncionariosAtivos: [...funcionariosPorCargo.values()].reduce(
        (a, b) => a + b,
        0,
      ),
      fichasSemAlocacao,
      totalHorasDemanda,
    };
  }, [fichas, usuarios]);
}
