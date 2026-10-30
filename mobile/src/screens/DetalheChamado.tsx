import { useRoute } from '@react-navigation/native';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Aviso, Botao, Cartao, Selo, SeloFila, Titulo, cor } from '../components/ui';
import { SITUACAO_CHAMADO, formatarDataHora } from '../core/regras';
import { useApp } from '../state/AppContext';

const Linha = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
  <>
    <Text style={{ fontSize: 14, color: cor.suave, fontWeight: '700', marginTop: 10 }}>{rotulo}</Text>
    <Text style={{ fontSize: 17, color: cor.texto }}>{valor}</Text>
  </>
);

export function DetalheChamado() {
  const { params } = useRoute<any>();
  const { chamados, pendentes, online, atendente, alterarStatus } = useApp();
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const c = chamados.find(x => x.id === params.id);
  const p = pendentes.find(x => x.localId === params.localId);

  async function mudar(status: number) {
    setErro(''); setSalvando(true);
    try { await alterarStatus(c!.id, status); }
    catch (e) { setErro((e as Error).message); }
    finally { setSalvando(false); }
  }

  if (!c && !p) return <ScrollView contentContainerStyle={{ padding: 16 }}><Aviso>Chamado não encontrado. Volte e atualize a lista.</Aviso></ScrollView>;

  return (
    <ScrollView style={{ backgroundColor: cor.fundo }} contentContainerStyle={{ padding: 16 }}>
      <Titulo>{c?.titulo ?? p!.titulo}</Titulo>
      {c ? <Selo situacao={c.status} /> : <SeloFila falhou={p!.estado === 'falhou'} />}
      {!online && <Text style={{ color: cor.suave, marginTop: 8 }}>Sem internet: você está vendo os dados guardados no aparelho.</Text>}
      <Cartao>
        {atendente && c?.clienteNome ? <Linha rotulo="Cliente" valor={c.clienteNome} /> : null}
        <Linha rotulo="Contrato" valor={c?.contratoNumero ?? p!.contratoNumero} />
        <Linha rotulo={c ? 'Aberto em' : 'Criado em'} valor={formatarDataHora(c?.dataAbertura ?? p!.criadoEm)} />
        {c && <Linha rotulo="Número do chamado" valor={String(c.id)} />}
        <Linha rotulo="Descrição" valor={(c?.descricao ?? p!.descricao) || 'Sem descrição.'} />
        {p?.erro && <Linha rotulo="Motivo de não ter sido enviado" valor={p.erro} />}
      </Cartao>
      {atendente && c && (
        <>
          <Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: '700', color: cor.texto, marginVertical: 8 }}>Alterar situação</Text>
          {erro ? <Aviso tom="erro">{erro}</Aviso> : null}
          {c.status === 4 ? <Text style={{ color: cor.suave }}>Chamado fechado não pode mudar.</Text>
            : !online ? <Text style={{ color: cor.suave }}>Conecte-se à internet para alterar a situação.</Text>
            : [1, 2, 3, 4].filter(st => st !== c.status).map(st => (
              <Botao key={st} variante="secundario" rotulo={`Marcar como ${SITUACAO_CHAMADO[st].toLowerCase()}`}
                desabilitado={salvando} onPress={() => void mudar(st)} />
            ))}
        </>
      )}
    </ScrollView>
  );
}
