import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { House, LifeBuoy } from 'lucide-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { cor } from './src/components/ui';
import { Chamados } from './src/screens/Chamados';
import { Dashboard } from './src/screens/Dashboard';
import { DetalheChamado } from './src/screens/DetalheChamado';
import { Login } from './src/screens/Login';
import { NovoChamado } from './src/screens/NovoChamado';
import { AppProvider, useApp } from './src/state/AppContext';
import { fonte, paleta } from './src/theme';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const cabecalho = {
  headerTintColor: cor.primaria, headerStyle: { backgroundColor: paleta.branco },
  headerTitleStyle: { color: cor.texto, fontFamily: fonte.tituloSemi },
  contentStyle: { backgroundColor: cor.fundo },
};

function Abas() {
  return (
    <Tabs.Navigator screenOptions={{ ...cabecalho, tabBarActiveTintColor: cor.primaria, tabBarInactiveTintColor: cor.suave,
      tabBarLabelStyle: { fontSize: 12, fontFamily: fonte.textoSemi }, tabBarStyle: { minHeight: 64, paddingBottom: 8, paddingTop: 6, backgroundColor: paleta.branco, borderTopColor: paleta.neutro200 } }}>
      <Tabs.Screen name="Início" component={Dashboard}
        options={{ tabBarIcon: ({ color }) => <House size={22} color={color} strokeWidth={2} /> }} />
      <Tabs.Screen name="Chamados" component={Chamados}
        options={{ tabBarIcon: ({ color }) => <LifeBuoy size={22} color={color} strokeWidth={2} /> }} />
    </Tabs.Navigator>
  );
}

function Rotas() {
  const { pronto, usuario, atendente } = useApp();
  const [fontesOk, fontesErro] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, JetBrainsMono_500Medium, Sora_600SemiBold, Sora_700Bold });
  if (!pronto || (!fontesOk && !fontesErro)) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={cor.primaria} accessibilityLabel="Carregando" /></View>;
  return (
    <Stack.Navigator screenOptions={cabecalho}>
      {usuario ? (
        <>
          <Stack.Screen name="Abas" component={Abas} options={{ headerShown: false }} />
          {!atendente && <Stack.Screen name="NovoChamado" component={NovoChamado} options={{ title: 'Novo chamado' }} />}
          <Stack.Screen name="DetalheChamado" component={DetalheChamado} options={{ title: 'Chamado' }} />
        </>
      ) : (
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <Rotas />
        </NavigationContainer>
        <StatusBar style="dark" />
      </AppProvider>
    </SafeAreaProvider>
  );
}
