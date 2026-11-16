import { Text, View } from 'react-native';
import { formatarDataHora } from '../core/regras';
import { useApp } from '../state/AppContext';
import { WifiOff } from 'lucide-react-native';
import { cor } from './ui';
import { fonte, paleta } from '../theme';

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
    <View accessibilityRole="alert" accessibilityLiveRegion="polite"
      style={{ backgroundColor: online ? cor.avisoFundo : paleta.noite, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      {!online && <WifiOff size={18} color="#fff" strokeWidth={2} />}
      <Text allowFontScaling style={{ flex: 1, color: online ? cor.avisoTexto : '#fff', fontFamily: fonte.textoMedio, fontSize: 14 }}>{texto}</Text>
    </View>
  );
}
