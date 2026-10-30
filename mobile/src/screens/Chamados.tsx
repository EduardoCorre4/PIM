import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { BarraConexao } from '../components/BarraConexao';
import { Botao, Cartao, Selo, SeloFila, cor } from '../components/ui';
import { SITUACAO_CHAMADO, formatarDataHora } from '../core/regras';
import { useApp } from '../state/AppContext';

const FILTROS = [0, 1, 2, 3, 4];

export function Chamados() {
  const nav = useNavigation<any>();
  const { atendente, chamados, pendentes, sincronizando, atualizar, tentarDeNovo, descartar } = useApp();
  const [filtro, setFiltro] = useState(0);

  const lista = useMemo(() => chamados.filter(c => !filtro || c.status === filtro), [chamados, filtro]);
  // Itens ainda na fila aparecem primeiro (só no filtro "Todos" ou "Abertos", que é a situação deles ao serem criados).
  const fila = !filtro || filtro === 1 ? pendentes : [];

  const dados = [
    ...fila.map(p => ({ tipo: 'fila' as const, p })),
    ...lista.map(c => ({ tipo: 'chamado' as const, c })),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: cor.fundo }}>
      <BarraConexao />
      <View accessibilityRole="radiogroup" accessibilityLabel="Filtrar por situação" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 }}>
        {FILTROS.map(f => (
          <Pressable key={f} accessibilityRole="radio" accessibilityState={{ selected: filtro === f }}
            accessibilityLabel={f ? SITUACAO_CHAMADO[f] : 'Todos'} onPress={() => setFiltro(f)}
            style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 22, borderWidth: 2, borderColor: cor.primaria,
              backgroundColor: filtro === f ? cor.primaria : cor.fundo }}>
            <Text style={{ fontWeight: '700', fontSize: 15, color: filtro === f ? '#fff' : cor.primaria }}>{f ? SITUACAO_CHAMADO[f] : 'Todos'}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={dados}
        keyExtractor={d => (d.tipo === 'fila' ? `l-${d.p.localId}` : `c-${d.c.id}`)}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={sincronizando} onRefresh={atualizar} />}
        ListEmptyComponent={<Text style={{ fontSize: 16, color: cor.suave, padding: 12 }}>
          {filtro ? 'Nenhum chamado com essa situação.' : atendente ? 'Não há chamados na fila.' : 'Você ainda não abriu nenhum chamado.'}</Text>}
        renderItem={({ item }) => item.tipo === 'chamado' ? (
          <Pressable accessibilityRole="button"
            accessibilityLabel={`${item.c.titulo}. ${SITUACAO_CHAMADO[item.c.status]}. Aberto em ${formatarDataHora(item.c.dataAbertura)}`}
            onPress={() => nav.navigate('DetalheChamado', { id: item.c.id })}>
            <Cartao>
              <Text style={{ fontSize: 17, fontWeight: '700', color: cor.texto, marginBottom: 4 }}>{item.c.titulo}</Text>
              <Text style={{ color: cor.suave, marginBottom: 6 }}>{atendente && item.c.clienteNome ? `${item.c.clienteNome} · ` : ''}Contrato {item.c.contratoNumero} · {formatarDataHora(item.c.dataAbertura)}</Text>
              <Selo situacao={item.c.status} />
            </Cartao>
          </Pressable>
        ) : (
          <Cartao>
            <Text style={{ fontSize: 17, fontWeight: '700', color: cor.texto, marginBottom: 4 }}>{item.p.titulo}</Text>
            <Text style={{ color: cor.suave, marginBottom: 6 }}>Contrato {item.p.contratoNumero} · criado em {formatarDataHora(item.p.criadoEm)}</Text>
            <SeloFila falhou={item.p.estado === 'falhou'} />
            {item.p.estado === 'falhou' ? (
              <View style={{ marginTop: 10 }}>
                <Text style={{ color: cor.erro, fontWeight: '600', marginBottom: 8 }}>{item.p.erro}</Text>
                <Botao variante="secundario" rotulo="Tentar de novo" onPress={() => void tentarDeNovo(item.p.localId)} />
                <Botao variante="perigo" rotulo="Descartar" onPress={() => Alert.alert('Descartar chamado?', 'Ele não será enviado.', [
                  { text: 'Manter', style: 'cancel' }, { text: 'Descartar', style: 'destructive', onPress: () => void descartar(item.p.localId) }])} />
              </View>
            ) : <Text style={{ color: cor.avisoTexto, marginTop: 6 }}>Será enviado assim que houver internet.</Text>}
          </Cartao>
        )}
      />
      {!atendente && <View style={{ padding: 12 }}><Botao rotulo="Abrir novo chamado" onPress={() => nav.navigate('NovoChamado')} /></View>}
    </View>
  );
}
