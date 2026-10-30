import { useNavigation } from '@react-navigation/native';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { BarraConexao } from '../components/BarraConexao';
import { Botao, Cartao, Selo, SeloFila, Titulo, cor } from '../components/ui';
import { contratoElegivel, formatarDataHora } from '../core/regras';
import { useApp } from '../state/AppContext';

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <View accessible accessibilityLabel={`${rotulo}: ${valor}`} style={{ flex: 1, minWidth: 140, padding: 12, borderWidth: 2, borderColor: cor.borda, borderRadius: 12, backgroundColor: cor.superficie }}>
      <Text style={{ fontSize: 32, fontWeight: '800', color: cor.primaria }}>{valor}</Text>
      <Text style={{ fontSize: 15, color: cor.texto, fontWeight: '600' }}>{rotulo}</Text>
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
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={sincronizando} onRefresh={atualizar} />}>
        <Titulo>Olá, {usuario?.nome}</Titulo>
        {atendente
          ? <Botao rotulo="Ver fila de chamados" onPress={() => nav.navigate('Chamados')} />
          : <Botao rotulo="Abrir novo chamado" dica="Abre um passo a passo de 3 etapas" onPress={() => nav.navigate('NovoChamado')} />}

        <Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: '700', color: cor.texto, marginVertical: 8 }}>{atendente ? 'Fila de atendimento' : 'Seus chamados'}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <Numero valor={abertos} rotulo="Abertos" />
          <Numero valor={andamento} rotulo="Em andamento" />
          <Numero valor={resolvidos} rotulo="Resolvidos" />
          {!atendente && <Numero valor={ativos} rotulo="Contratos ativos" />}
        </View>

        {(fila > 0 || falhas > 0) && (
          <Cartao>
            {fila > 0 && <Text style={{ fontSize: 16, color: cor.avisoTexto, fontWeight: '700' }}>
              {fila === 1 ? '1 chamado aguardando envio' : `${fila} chamados aguardando envio`}
            </Text>}
            {falhas > 0 && <Text style={{ fontSize: 16, color: cor.erro, fontWeight: '700' }}>
              {falhas === 1 ? '1 chamado não foi enviado e precisa da sua atenção' : `${falhas} chamados não foram enviados e precisam da sua atenção`}
            </Text>}
            <Botao variante="secundario" rotulo="Ver chamados" onPress={() => nav.navigate('Chamados')} />
          </Cartao>
        )}

        <Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: '700', color: cor.texto, marginVertical: 8 }}>Mais recentes</Text>
        {recentes.length === 0 && <Text style={{ fontSize: 16, color: cor.suave, marginBottom: 12 }}>{atendente ? 'Não há chamados na fila.' : 'Você ainda não abriu nenhum chamado.'}</Text>}
        {recentes.map(c => (
          <Cartao key={c.id}>
            <Text accessibilityRole="button" onPress={() => nav.navigate('DetalheChamado', { id: c.id })}
              style={{ fontSize: 17, fontWeight: '700', color: cor.primaria, textDecorationLine: 'underline', minHeight: 32 }}>
              {c.titulo}
            </Text>
            <Text style={{ color: cor.suave, marginVertical: 4 }}>Aberto em {formatarDataHora(c.dataAbertura)}</Text>
            <Selo situacao={c.status} />
          </Cartao>
        ))}
        {pendentes.slice(0, 1).map(p => (
          <Cartao key={p.localId}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: cor.texto }}>{p.titulo}</Text>
            <SeloFila falhou={p.estado === 'falhou'} />
          </Cartao>
        ))}

        <Text style={{ color: cor.suave, fontSize: 14, marginVertical: 8 }}>
          {ultimaSincronizacao ? `Atualizado em ${formatarDataHora(ultimaSincronizacao)}. Puxe a tela para baixo para atualizar.` : 'Ainda não atualizado.'}
        </Text>
        <Botao variante="secundario" rotulo="Sair" onPress={confirmarSaida} />
      </ScrollView>
    </View>
  );
}
