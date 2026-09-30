export function calcularTempoDecorridoReal(sessoes) {
  if (!sessoes || sessoes.length === 0) return 0;
  const agora = Date.now();
  const intervalos = sessoes
    .map((s) => {
      const inicio = new Date(s.inicio).getTime();
      const fim = s.fim ? new Date(s.fim).getTime() : agora;
      return [inicio, fim];
    })
    .filter(([inicio, fim]) => fim > inicio && !isNaN(inicio) && !isNaN(fim))
    .sort((a, b) => a[0] - b[0]);

  if (intervalos.length === 0) return 0;

  let totalMs = 0;
  let [inicioAtual, fimAtual] = intervalos[0];
  for (let i = 1; i < intervalos.length; i++) {
    const [inicio, fim] = intervalos[i];
    if (inicio <= fimAtual) {
      fimAtual = Math.max(fimAtual, fim);
    } else {
      totalMs += fimAtual - inicioAtual;
      [inicioAtual, fimAtual] = [inicio, fim];
    }
  }
  totalMs += fimAtual - inicioAtual;
  return Math.floor(totalMs / 1000);
}

export function calcularTempoDecorridoAte(sessoes, timestampLimite) {
  if (!sessoes || sessoes.length === 0) return 0;
  const limite = new Date(timestampLimite).getTime();

  const intervalos = sessoes
    .map((s) => {
      const inicio = new Date(s.inicio).getTime();
      const fimReal = s.fim ? new Date(s.fim).getTime() : Date.now();
      const fim = Math.min(fimReal, limite);
      return [inicio, fim];
    })
    .filter(
      ([inicio, fim]) =>
        fim > inicio && inicio < limite && !isNaN(inicio) && !isNaN(fim),
    )
    .sort((a, b) => a[0] - b[0]);

  if (intervalos.length === 0) return 0;

  let totalMs = 0;
  let [inicioAtual, fimAtual] = intervalos[0];
  for (let i = 1; i < intervalos.length; i++) {
    const [inicio, fim] = intervalos[i];
    if (inicio <= fimAtual) {
      fimAtual = Math.max(fimAtual, fim);
    } else {
      totalMs += fimAtual - inicioAtual;
      [inicioAtual, fimAtual] = [inicio, fim];
    }
  }
  totalMs += fimAtual - inicioAtual;
  return Math.floor(totalMs / 1000);
}

export function formatarNomeUsuario(usuario) {
  if (!usuario) return "Usuário";
  return usuario
    .split(".")
    .map(
      (parte) => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase(),
    )
    .join(" ");
}

export function calcularTemposDasMarcacoes(
  marcacoes,
  sessoes,
  campoData = "data",
) {
  const ordenadas = [...marcacoes].sort(
    (a, b) => new Date(a[campoData]) - new Date(b[campoData]),
  );

  let anterior = 0;
  return ordenadas.map((m) => {
    const tempoAcumulado = calcularTempoDecorridoAte(sessoes, m[campoData]);
    const duracao = Math.max(tempoAcumulado - anterior, 0);
    anterior = tempoAcumulado;
    return { ...m, tempoAcumulado, duracao };
  });
}

export function formatarTempo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}min${String(s).padStart(2, "0")}s`;
}
