import { Text, View } from 'react-native';
import { formatarDataHora } from '../core/regras';
import { useApp } from '../state/AppContext';
import { cor } from './ui';

/** Mostra, em texto simples, se está sem internet e quantos chamados aguardam envio. */
export function BarraConexao() {
  const { online, pendentes, sincronizando, ultimaSincronizacao } = useApp();
  const fila = pendentes.filter(p => p.estado === 'pendente').length;
  if (online && !fila && !sincronizando) return null;

  const texto = !online
    ? `Sem internet. Você pode continuar usando o app${ultimaSincronizacao ? ` (dados de ${formatarDataHora(ultimaSincronizacao)})` : ''}.${fila ? ` ${fila === 1 ? '1 chamado será enviado' : `${fila} chamados serão enviados`} quando a conexão voltar.` : ''}`
    : sincronizando ? 'Atualizando…'
    : `${fila === 1 ? '1 chamado aguarda' : `${fila} chamados aguardam`} envio.`;

  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ backgroundColor: online ? cor.avisoFundo : '#14181f', padding: 10 }}>
      <Text style={{ color: online ? cor.avisoTexto : '#fff', fontWeight: '600', fontSize: 15 }}>{texto}</Text>
    </View>
  );
}
