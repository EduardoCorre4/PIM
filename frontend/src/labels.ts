// Textos em linguagem simples usados em toda a interface.
export const PERFIL_CLIENTE = 1;
export const PERFIL_FUNCIONARIO = 2;
export const PERFIL_GERENTE = 3;
export const NOME_PERFIL: Record<number, string> = { 1: 'Cliente', 2: 'Funcionário', 3: 'Gerente' };
/** Página inicial após entrar: o Gerente começa no resumo; os demais, nos chamados. */
export const paginaInicial = (perfil: number | null) => (perfil === PERFIL_GERENTE ? '/painel' : '/chamados');

export const TIPO_CONTRATO: Record<number, string> = {
  1: 'Sistemas',
  2: 'Suporte',
  3: 'Segurança na nuvem',
};
export const SITUACAO_CONTRATO: Record<number, string> = {
  1: 'Ativo',
  2: 'Inativo',
  3: 'Encerrado',
};
export const SITUACAO_CHAMADO: Record<number, string> = {
  1: 'Aberto',
  2: 'Em andamento',
  3: 'Resolvido',
  4: 'Fechado',
};
// Chaves devolvidas pelo painel de indicadores -> texto exibido.
export const NOME_INDICADOR: Record<string, string> = {
  Aberto: 'Aberto', EmAndamento: 'Em andamento', Resolvido: 'Resolvido', Fechado: 'Fechado',
  Ativo: 'Ativo', Inativo: 'Inativo', Encerrado: 'Encerrado',
};

/** Datas de contrato não têm hora: "2026-01-31T00:00:00" -> "31/01/2026", sem conversão de fuso. */
export const formatarData = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

/** Data de abertura do chamado é gravada em UTC (sem "Z" no texto): converte para o horário local. */
export const formatarDataHora = (iso: string) =>
  new Date(iso.endsWith('Z') ? iso : `${iso}Z`).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
