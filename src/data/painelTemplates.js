export const TIPOS_PAINEL = {
  SOBREPOR_EMBUTIR: "sobrepor_embutir",
  AUTOPORTANTE: "autoportante",
  PMT: "pmt",
};

export const PAINEL_LABELS = {
  [TIPOS_PAINEL.SOBREPOR_EMBUTIR]: "Quadro sobrepor ou embutir",
  [TIPOS_PAINEL.AUTOPORTANTE]: "Quadro autoportante",
  [TIPOS_PAINEL.PMT]: "PMT",
};

export const PAINEL_KEYS = Object.values(TIPOS_PAINEL);

export const painelTemplates = {
  [TIPOS_PAINEL.SOBREPOR_EMBUTIR]: {
    montagemMecanica: {
      titulo: "Quadro de sobrepor/embutir",
      sequenciaMontagem: [
        "O projeto tem todas as dimensões e cotas necessárias para a montagem?",
        "Os componentes estão conforme a lista de materiais?",
        "Conferência do projeto mecânico e layout aprovado (Verificar se tem todas as informações para as etapas seguintes).",
        "Preparo da placa de montagem para a fixação dos componentes (Fixação de trilhos e canaletas).",
        "Realizar recortes e furos no painel conforme projeto (Acabamento com pintura de proteção das partes cortadas).",
        "Instalação de componentes (com tagueamento).",
        "Recorte e instalação de policarbonato conforme projeto;",
        "Colar os adesivos. (Atenção na porta com a tensão nominal do painel, plaqueta com a tag do painel, plaqueta de dados, adesivo de reaperto)",
        "Validar todas as etapas anteriores.",
      ],
      verificacaoMontagem: [
        "Conferência do projeto mecânico e layout aprovado",
        "Integridade física do invólucro (sem amassados, trincas ou pintura danificada)",
        "Existência de ponto de aterramento do invólucro",
        "Instalação correta de: Trilhos DIN",
        "Instalação correta de: Placas de montagem",
        "Instalação correta de: Canaletas",
        "Componentes conforme projeto",
        "Espaçamento adequado entre componentes para dissipação térmica",
        "Furações para: Sinaleiros",
        "Furações para: Multimedidores",
        "Furações para: Ventiladores / filtros",
        "Sem rebarbas e com acabamento adequado",
        "Vedação mantida após furações (Grau de proteção preservado)",
      ],
    },
    barramento: {
      titulo: "Quadro de sobrepor/embutir",
      sequenciaMontagem: [
        "Conferência do diagrama trifilar, projeto do barramento e layout aprovado (Verificar se tem todas a informações para as etapas seguintes).",
        "Selecionar a barra adequada. (Seção).",
        "Realizar dobras e furos no barramento (marcar a barra o mínimo possível).",
        "Limpeza na barra (tirar toda marca de caneta de marcação).",
        "Instalação do barramento no painel. (Obedecendo os distanciamentos);",
        "Identificar as fases conforme projeto. (com termocontrátil)",
        "Torquear o barramento e selar.",
        "Validar todas as etapas anteriores.",
      ],
      verificacaoMontagem: [
        "Conferência do projeto do barramento e layout aprovado",
        "Integridade física do barramento (sem amassados, trincas ou manchado)",
        "Verificar distanciamento entre os barramentos de fase e neutro e partes aterradas. (todo o invólucro)",
        "Verificar se as barras estão torqueadas.",
        "Verificar se os parafusos e seus acessórios estão corretos e torqueados. (Parafuso, arruela lisa, arruela de pressão e quando necessário porca)",
      ],
    },
    cabeamento: {
      titulo: "Quadro de sobrepor/embutir",
      sequenciaMontagem: [
        "Conferência dos diagramas e layout aprovado (Verificar se tem todas a informações para as etapas seguintes).",
        "Conferência da lista de material (Se os componentes estão corretos e não esta faltando nada).",
        "Conferencia da tensão nominal dos componentes. (Verificar se esta adequado para a tensão de operação)",
        "Verificar se os diagramas estão corretos. (verificar se as ligações estão corretas, se o comando funcionará)",
        "Verificar se o tagueamento esta correto. (Todos os componentes e painel identificados corretamente)",
        "Selecionar os cabos corretos para o projeto. (Cor, Bitola).",
        "Cabear os componentes e anilha-los. (Usar os terminais corretos, checar crimpagem, usar luvas de anilha na dimensão correta dos cabos)",
        "Conferir as ligações. (seguir cabos e teste de continuidade)",
        "Conferir aperto dos terminais com torque adequado. (Teste de tração dos cabos)",
        "Validar todas as etapas anteriores.",
      ],
      verificacaoMontagem: [
        "Conferência dos diagramas e layout aprovado",
        "Integridade dos cabos elétricos (sem corte, emenda ou mal crimpado)",
        "Verificar terminais crimpados (se estão corretos com a aplicação)",
        "Verificar conexão de cabos nas barras.",
        "Teste de continuidade.",
        "Teste de tração",
        "Verificar se os parafusos e seus acessórios estão corretos e torqueados. (Parafuso, arruela lisa, arruela de pressão e quando necessário porca)",
      ],
    },
  },

  [TIPOS_PAINEL.AUTOPORTANTE]: {
    montagemMecanica: {
      titulo: "Quadro autoportante",
      sequenciaMontagem: [
        "O projeto tem todas as dimensões e cotas necessárias para a montagem?",
        "Os componentes estão conforme a lista de materiais?",
        "Conferência do projeto mecânico e layout aprovado.",
        "Montagem do chassi (Torque dos parafusos conforme instrução do fabricante)",
        "Instalação da tampa inferior e superior no chassi (se houver corte ou furação realiza-los antes da instalação)",
        "Instalação das colunas de compartimento interno (Torque dos parafusos conforme instrução do fabricante)",
        "Montagem das cantoneiras de base e dos flanges (Torque dos parafusos conforme instrução do fabricante)",
        "Instalação de isoladores e tirantes para barra de neutro e terra;",
        "Montagem das travessas para a placa de montagem e kits de disjuntor (Torque dos parafusos conforme instrução do fabricante, nos kits de disjuntor, prestar atenção nos cortes se houver)",
        "Preparo da placa de montagem ou kits de disjuntor para a fixação dos componentes (Fixação de trilhos e canaletas).",
        "Se houver, Instalação da estrutura para fechamento frontal dos kits de disjuntor (Torque dos parafusos conforme instrução do fabricante, atenção nos cortes se houver)",
        "Instalação de kit de isoladores (Torque dos parafusos conforme instrução do fabricante)",
        "Instalação da porta (Torque dos parafusos conforme instrução do fabricante)",
        "Se for mais de uma estrutura, instalar kit de união.",
        "Realizar recortes e furos conforme projeto.",
        "Instalação de componentes (com tagueamento).",
        "Recorte e instalação de policarbonato conforme projeto;",
        "Colar os adesivos. (Atenção na porta com a tensão nominal do painel, plaqueta com a tag do painel, plaqueta de dados, adesivo de reaperto)",
        "Validar todas as etapas anteriores.",
      ],
      verificacaoMontagem: [
        "Conferência do projeto mecânico e layout aprovado",
        "Verificação do grau de proteção (IP). (Verificar se os acessórios necessários para manter o grau de proteção estão instalados)",
        "Integridade física do invólucro (sem amassados, trincas ou pintura danificada)",
        "Parafusos, porcas e arruelas com torque adequado e selados (Recomendações do fabricante)",
        "Existência de ponto de aterramento do invólucro",
        "Montagem do chassi conforme instrução da ABB",
        "Estrutura nivelada e esquadrejada",
        "Portas alinhadas, abertura e fechamento suave",
        "Instalação correta de: Trilhos DIN",
        "Instalação correta de: Placas de montagem",
        "Instalação correta de: Canaletas",
        "Furações para: Sinaleiros",
        "Furações para: Multimedidores",
        "Furações para: Ventiladores / filtros",
        "Acessórios para barras de terra e neutro corretamente fixadas na estrutura.",
        "Componentes conforme projeto;",
      ],
    },
    barramento: {
      titulo: "Quadro autoportante",
      sequenciaMontagem: [
        "Conferência do projeto do barramento e layout aprovado (Verificar se tem todas a informações para as etapas seguintes).",
        "Selecionar a barra adequada para o barramento principal. (Seção).",
        "Realizar dobras e furos do barramento principal (marcar a barra o mínimo possível).",
        "Limpeza do barramento principal (tirar toda marca de caneta de marcação).",
        "Instalação do barramento principal no painel. (Obedecendo os distanciamentos);",
        "Selecionar a barra adequada para o barramento de saída e entrada dos disjuntores. (Seção).",
        "Realizar dobras e furos do barramento dos disjuntores (marcar a barra o mínimo possível).",
        "Limpeza do barramento dos disjuntores (tirar toda marca de caneta de marcação).",
        "Instalação do barramento nos disjuntores. (Obedecendo os distanciamentos);",
        "Identificar as fases conforme projeto. (com termocontrátil)",
        "Torquear o barramento e selar.",
        "Validar todas as etapas anteriores.",
      ],
      verificacaoMontagem: [
        "Conferência do projeto do barramento e layout aprovado",
        "Integridade física do barramento (sem amassados, trincas ou manchado)",
        "Verificar distanciamento entre os barramentos de fase e neutro e partes aterradas. (todo o invólucro)",
        "Verificar se as barras estão torqueadas.",
        "Verificar se os parafusos e seus acessórios estão corretos e torqueados. (Parafuso, arruela lisa, arruela de pressão e quando necessário porca)",
      ],
    },
    cabeamento: {
      titulo: "Quadro autoportante",
      sequenciaMontagem: [
        "Conferência dos diagramas e layout aprovado (Verificar se tem todas a informações para as etapas seguintes).",
        "Conferência da lista de material (Se os componentes estão corretos e não esta faltando nada).",
        "Conferencia da tensão nominal dos componentes. (Verificar se esta adequado para a tensão de operação)",
        "Verificar se os diagramas estão corretos. (verificar se as ligações estão corretas, se o comando funcionará)",
        "Verificar se o tagueamento esta correto. (Todos os componentes e painel identificados corretamente)",
        "Selecionar os cabos corretos para o projeto. (Cor, Bitola).",
        "Cabear os componentes e anilha-los. (Usar os terminais corretos, checar crimpagem, usar luvas de anilha na dimensão correta dos cabos)",
        "Conferir as ligações. (seguir cabos e teste de continuidade)",
        "Conferir aperto dos terminais com torque adequado. (Teste de tração dos cabos)",
        "Validar todas as etapas anteriores.",
      ],
      verificacaoMontagem: [
        "Conferência dos diagramas e layout aprovado",
        "Integridade dos cabos elétricos (sem corte, emenda ou mal crimpado)",
        "Verificar terminais crimpados (se estão corretos com a aplicação)",
        "Verificar conexão de cabos nas barras.",
        "Teste de continuidade.",
        "Teste de tração",
        "Verificar se os parafusos e seus acessórios estão corretos e torqueados. (Parafuso, arruela lisa, arruela de pressão e quando necessário porca)",
      ],
    },
  },

  [TIPOS_PAINEL.PMT]: {
    montagemMecanica: {
      titulo: "PMT",
      sequenciaMontagem: [
        "O projeto tem todas as dimensões e cotas necessárias para a montagem?",
        "Os componentes estão conforme a lista de materiais?",
        "Conferência do projeto mecânico e layout aprovado.",
        "Instalar travessas para as seccionadoras, TPs e TCs (Torque dos parafusos conforme instrução do fabricante)",
        "Se houver, instalar infra para os equipamentos da concessionária na coluna de medição.",
        "Fixação dos TCs e TPs na coluna de saída.",
        "Fixação de isoladores e buchas.",
        "Instalação dos isoladores capacitivos e do VPIS",
        "Preparo da placa de montagem para a fixação dos componentes (Fixação de trilhos e canaletas).",
        "Instalação de componentes (com tagueamento).",
        "Realizar recortes e furos conforme projeto.",
        "Colar os adesivos. (Atenção na porta com a tensão nominal do painel, plaqueta com a tag do painel, plaqueta de dados, adesivo de reaperto)",
        "Validar todas as etapas anteriores.",
      ],
      verificacaoMontagem: [
        "Conferência do projeto mecânico e layout aprovado",
        "Verificação do grau de proteção (IP). (Verificar se os acessórios necessários para manter o grau de proteção estão instalados)",
        "Integridade física do invólucro (sem amassados, trincas ou pintura danificada)",
        "Parafusos, porcas e arruelas com torque adequado e selados (Recomendações do fabricante)",
        "Existência de ponto de aterramento do invólucro",
        "Estrutura nivelada e esquadrejada",
        "Portas alinhadas, abertura e fechamento suave",
        "Instalação correta de: Trilhos DIN",
        "Instalação correta de: Placas de montagem",
        "Instalação correta de: Canaletas",
        "Furações para: Sinaleiros",
        "Furações para: VPIS",
        "Furações para: Relé de proteção",
        "Acessórios para barras de terra e neutro corretamente fixadas na estrutura.",
        "Componentes conforme projeto;",
      ],
    },
    barramento: {
      titulo: "PMT",
      sequenciaMontagem: [
        "Conferência do projeto do barramento e layout aprovado (Verificar se tem todas a informações para as etapas seguintes).",
        "Selecionar a barra adequada para o barramento principal. (Seção).",
        "Realizar dobras e furos do barramento principal (marcar a barra o mínimo possível).",
        "Limpeza do barramento principal (tirar toda marca de caneta de marcação).",
        "Instalação do barramento principal no painel. (Obedecendo os distanciamentos);",
        "Selecionar a barra adequada para o barramento de terra do painel. (Seção).",
        "Realizar dobras e furos do barramento de terra (marcar a barra o mínimo possível).",
        "Limpeza do barramento de terra (tirar toda marca de caneta de marcação).",
        "Instalação do barramento terra. (Obedecendo os distanciamentos);",
        "Instalação das cordoalhas",
        "Identificar as fases conforme projeto. (com termocontrátil)",
        "Torquear o barramento e selar.",
        "Validar todas as etapas anteriores.",
      ],
      verificacaoMontagem: [
        "Conferência do projeto do barramento e layout aprovado",
        "Integridade física do barramento (sem amassados, trincas ou manchado)",
        "Verificar distanciamento entre os barramentos de fase e neutro e partes aterradas. (todo o invólucro)",
        "Verificar se as barras estão torqueadas.",
        "Verificar se os parafusos e seus acessórios estão corretos e torqueados. (Parafuso, arruela lisa, arruela de pressão e quando necessário porca)",
      ],
    },
    cabeamento: {
      titulo: "PMT",
      sequenciaMontagem: [
        "Conferência dos diagramas e layout aprovado (Verificar se tem todas a informações para as etapas seguintes).",
        "Conferência da lista de material (Se os componentes estão corretos e não esta faltando nada).",
        "Conferencia da tensão nominal dos componentes. (Verificar se esta adequado para a tensão de operação)",
        "Verificar se os diagramas estão corretos. (verificar se as ligações estão corretas, se o comando funcionará)",
        "Verificar se o tagueamento esta correto. (Todos os componentes e painel identificados corretamente)",
        "Selecionar os cabos corretos para o projeto. (Cor, Bitola).",
        "Cabear os componentes e anilha-los. (Usar os terminais corretos, checar crimpagem, usar luvas de anilha na dimensão correta dos cabos)",
        "Conferir as ligações. (seguir cabos e teste de continuidade)",
        "Conferir aperto dos terminais com torque adequado. (Teste de tração dos cabos)",
        "Validar todas as etapas anteriores.",
      ],
      verificacaoMontagem: [
        "Conferência dos diagramas e layout aprovado",
        "Integridade dos cabos elétricos (sem corte, emenda ou mal crimpado)",
        "Verificar terminais crimpados (se estão corretos com a aplicação)",
        "Verificar conexão de cabos nas barras.",
        "Teste de continuidade.",
        "Teste de tração",
        "Verificar se os parafusos e seus acessórios estão corretos e torqueados. (Parafuso, arruela lisa, arruela de pressão e quando necessário porca)",
      ],
    },
  },
};

export function getPainelChecklistItems(tipoPainel, options = {}) {
  const { incluirVerificacao = true } = options;
  const tpl = painelTemplates[tipoPainel];
  if (!tpl) return [];

  const items = [];
  let contador = 1;

  tpl.montagemMecanica.sequenciaMontagem.forEach((descricao, i) => {
    items.push({
      id: `mm-seq-${i}`,
      numero: contador++,
      descricao,
      etapa: "montagem",
      categoria: `Sequência de Montagem — ${tpl.montagemMecanica.titulo}`,
    });
  });

  if (incluirVerificacao) {
    tpl.montagemMecanica.verificacaoMontagem.forEach((descricao, i) => {
      items.push({
        id: `mm-ver-${i}`,
        numero: contador++,
        descricao,
        etapa: "montagem",
        categoria: "Verificação da Montagem",
      });
    });
  }

  if (tpl.barramento) {
    tpl.barramento.sequenciaMontagem.forEach((descricao, i) => {
      items.push({
        id: `bar-seq-${i}`,
        numero: contador++,
        descricao,
        etapa: "barramento",
        categoria: `Barramento — ${tpl.barramento.titulo}`,
      });
    });
    if (incluirVerificacao) {
      tpl.barramento.verificacaoMontagem.forEach((descricao, i) => {
        items.push({
          id: `bar-ver-${i}`,
          numero: contador++,
          descricao,
          etapa: "barramento",
          categoria: "Verificação do Barramento",
        });
      });
    }
  }

  if (tpl.cabeamento) {
    tpl.cabeamento.sequenciaMontagem.forEach((descricao, i) => {
      items.push({
        id: `cab-seq-${i}`,
        numero: contador++,
        descricao,
        etapa: "cabeamento",
        categoria: `Cabeamento — ${tpl.cabeamento.titulo}`,
      });
    });
    if (incluirVerificacao) {
      tpl.cabeamento.verificacaoMontagem.forEach((descricao, i) => {
        items.push({
          id: `cab-ver-${i}`,
          numero: contador++,
          descricao,
          etapa: "cabeamento",
          categoria: "Verificação do Cabeamento",
        });
      });
    }
  }

  return items;
}

export function getPainelVerificacaoItems(tipoPainel) {
  return getPainelChecklistItems(tipoPainel, {
    incluirVerificacao: true,
  }).filter((item) => String(item.id ?? "").includes("-ver-"));
}

const ETAPA_PARA_SECAO = {
  montagem: "montagemMecanica",
  barramento: "barramento",
  cabeamento: "cabeamento",
};

export function getPainelVerificacaoPorEtapa(tipoPainel, etapa) {
  const tpl = painelTemplates[tipoPainel];
  if (!tpl) return [];
  const secao = tpl[ETAPA_PARA_SECAO[etapa]];
  return secao?.verificacaoMontagem || [];
}
