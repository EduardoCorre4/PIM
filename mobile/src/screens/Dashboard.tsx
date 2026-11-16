import { useNavigation } from '@react-navigation/native';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { BarraConexao } from '../components/BarraConexao';
import { Avatar, Botao, Cartao, Selo, SeloFila, codigoChamado, cor, tx } from '../components/ui';
import { fonte, paleta, raio } from '../theme';
import { contratoElegivel, formatarDataHora } from '../core/regras';
import { useApp } from '../state/AppContext';

function Numero({ valor, rotulo, nota }: { valor: number; rotulo: string; nota?: string }) {
  return (
    <View accessible accessibilityLabel={`${rotulo}: ${valor}${nota ? `, ${nota}` : ''}`}
      style={{ flexGrow: 1, flexBasis: '45%', padding: 14, borderWidth: 1, borderColor: cor.borda, borderRadius: raio.lg, backgroundColor: cor.superficie }}>
      <Text allowFontScaling style={tx.suave}>{rotulo}</Text>
      <Text allowFontScaling style={{ fontFamily: fonte.titulo, fontSize: 28, color: cor.texto, letterSpacing: -0.5 }}>{valor}</Text>
      {nota ? <Text allowFontScaling style={{ fontFamily: fonte.texto, fontSize: 12, color: cor.suave }}>{nota}</Text> : null}
    </View>
  );
}

export function Dashboard() {
  const nav = useNavigation<any>();
  const { usuario, atendente, chamados, contratos, pendentes, sincronizando, atualizar, sair, ultimaSincronizacao } = useApp();
  const fila = pendentes.filter(p => p.estado === 'pendente').length;
  const falhas = pendentes.filter(p => p.estado === 'falhou').length;
  const abertos = chamados.filter(c => c.status === 1).length;
  const andamento = chamados.filter(c => c.status === 2).length;
  const resolvidos = chamados.filter(c => c.status === 3 || c.status === 4).length;
  const ativos = contratos.filter(c => contratoElegivel(c)).length;
  const recentes = chamados.slice(0, 3);

  function confirmarSaida() {
    const aviso = fila ? ` Você tem ${fila} ${fila === 1 ? 'chamado que ainda não foi enviado' : 'chamados que ainda não foram enviados'} e ${fila === 1 ? 'ele será perdido' : 'eles serão perdidos'}.` : '';
    Alert.alert('Sair do aplicativo?', `Os dados guardados neste aparelho serão apagados.${aviso}`, [
      { text: 'Ficar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void sair() },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: cor.fundo }}>
      <BarraConexao />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} refreshControl={<RefreshControl refreshing={sincronizando} onRefresh={atualizar} />}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text allowFontScaling style={tx.suave}>Olá,</Text>
            <Text accessibilityRole="header" allowFontScaling style={{ fontFamily: fonte.titulo, fontSize: 22, color: cor.texto, letterSpacing: -0.5 }}>{usuario?.nome}</Text>
          </View>
          <Avatar nome={usuario?.nome} />
        </View>

        <View style={{ backgroundColor: paleta.azul, borderRadius: 18, padding: 16, gap: 10 }}>
          <Text allowFontScaling style={{ fontFamily: fonte.titulo, fontSize: 18, lineHeight: 24, color: '#fff' }}>
            {atendente ? 'Fila de atendimento' : 'Precisa de ajuda?'}
          </Text>
          <Text allowFontScaling style={{ fontFamily: fonte.texto, fontSize: 13, color: paleta.azul100 }}>
            {atendente ? 'Veja os chamados e altere a situação.' : 'Abra um chamado em até 3 passos.'}
          </Text>
          <View style={{ alignSelf: 'flex-start' }}>
            {atendente
              ? <Botao variante="destaque" rotulo="Ver fila de chamados" onPress={() => nav.navigate('Chamados')} />
              : <Botao variante="destaque" rotulo="Abrir chamado" dica="Abre um passo a passo de 3 etapas"
                  icone={<Plus size={20} color={paleta.noite} strokeWidth={2} />} onPress={() => nav.navigate('NovoChamado')} />}
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Numero valor={abertos} rotulo="Abertos" />
          <Numero valor={andamento} rotulo="Em atendimento" />
          <Numero valor={resolvidos} rotulo="Resolvidos" />
          {!atendente && <Numero valor={ativos} rotulo="Contratos" nota="ativos" />}
        </View>

        {(fila > 0 || falhas > 0) && (
          <Cartao>
            {fila > 0 && <Text allowFontScaling style={{ fontFamily: fonte.textoSemi, fontSize: 15, color: paleta.alertaTexto }}>
              {fila === 1 ? '1 chamado aguardando envio' : `${fila} chamados aguardando envio`}
            </Text>}
            {falhas > 0 && <Text allowFontScaling style={{ fontFamily: fonte.textoSemi, fontSize: 15, color: paleta.erroTexto }}>
              {falhas === 1 ? '1 chamado não foi enviado e precisa da sua atenção' : `${falhas} chamados não foram enviados e precisam da sua atenção`}
            </Text>}
            <View style={{ height: 8 }} />
            <Botao variante="secundario" rotulo="Ver chamados" onPress={() => nav.navigate('Chamados')} />
          </Cartao>
        )}

        <Text accessibilityRole="header" allowFontScaling style={[tx.h2, { marginVertical: 0 }]}>{atendente ? 'Mais recentes na fila' : 'Últimos chamados'}</Text>
        {recentes.length === 0 && <Text allowFontScaling style={tx.suave}>{atendente ? 'Não há chamados na fila.' : 'Você ainda não abriu nenhum chamado.'}</Text>}
        {recentes.map(c => (
          <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`${c.titulo}. ${codigoChamado(c.id)}`}
            onPress={() => nav.navigate('DetalheChamado', { id: c.id })}
            style={{ minHeight: 48, backgroundColor: cor.superficie, borderWidth: 1, borderColor: cor.borda, borderRadius: raio.lg, padding: 14, gap: 6 }}>
            <Text allowFontScaling style={{ fontFamily: fonte.textoSemi, fontSize: 15, color: cor.texto }}>{c.titulo}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text allowFontScaling style={[tx.mono, { fontSize: 12, color: cor.suave }]}>{codigoChamado(c.id)} · {formatarDataHora(c.dataAbertura)}</Text>
              <Selo situacao={c.status} />
            </View>
          </Pressable>
        ))}
        {pendentes.slice(0, 1).map(p => (
          <Cartao key={p.localId}>
            <Text allowFontScaling style={{ fontFamily: fonte.textoSemi, fontSize: 15, color: cor.texto, marginBottom: 6 }}>{p.titulo}</Text>
            <SeloFila falhou={p.estado === 'falhou'} />
          </Cartao>
        ))}

        <Text allowFontScaling style={tx.suave}>
          {ultimaSincronizacao ? `Atualizado em ${formatarDataHora(ultimaSincronizacao)}. Puxe a tela para baixo para atualizar.` : 'Ainda não atualizado.'}
        </Text>
        <Botao variante="secundario" rotulo="Sair" onPress={confirmarSaida} />
      </ScrollView>
    </View>
  );
}
