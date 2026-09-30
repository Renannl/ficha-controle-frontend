import {
  getPainelChecklistItems,
  getPainelVerificacaoItems,
} from "../data/painelTemplates";

function isItemRespondido(item) {
  const r = String(item?.resultado ?? "").toLowerCase();
  return ["ok", "na", "erro"].includes(r);
}

function getTemplateItems(ficha) {
  const op = String(ficha.operacao ?? "");
  const tipoPainel = ficha.tipoPainel || ficha.dados?.tipoPainel;

  if (!tipoPainel) return null;

  if (op === "50") {
    return getPainelVerificacaoItems(tipoPainel);
  }

  if (op === "10") {
    return getPainelChecklistItems(tipoPainel, { incluirVerificacao: false });
  }

  return null;
}

function getChecklistProgress(ficha) {
  const templateItems = getTemplateItems(ficha);
  const itensSalvos = ficha.items || [];

  if (templateItems) {
    const resultados = new Map(
      itensSalvos.map((item) => [item.id, item.resultado]),
    );

    const total = templateItems.length;
    const done = templateItems.filter((t) =>
      isItemRespondido({ resultado: resultados.get(t.id) }),
    ).length;

    return { total, done };
  }

  const total = itensSalvos.length;
  const done = itensSalvos.filter(isItemRespondido).length;
  return { total, done };
}

export function getProgressStatus(ficha) {
  const { total, done } = getChecklistProgress(ficha);

  if (total === 0) return "empty";
  if (done === 0) return "empty";
  if (done === total) return "done";
  return "progress";
}

export function computeStatusField(ficha) {
  if (ficha.status === "finalizada") return "finalizada";

  const { total, done } = getChecklistProgress(ficha);

  if (total === 0) return ficha.status || "aberta";
  if (done > 0) return "em andamento";
  return "aberta";
}

export function getProgressPct(ficha) {
  const { total, done } = getChecklistProgress(ficha);

  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export function getApprovalStatus(ficha) {
  if (ficha.statusAprovacao === "aprovado") {
    return "approved";
  }

  if (ficha.statusAprovacao === "reprovado") {
    return "rejected";
  }

  if (ficha.status === "finalizada" && ficha.statusAprovacao === "aguardando") {
    return "waiting";
  }

  return "none";
}

export function getFichaStatus(ficha) {
  const approval = getApprovalStatus(ficha);

  if (approval !== "none") {
    return approval;
  }

  return getProgressStatus(ficha);
}
