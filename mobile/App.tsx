import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { cor } from './src/components/ui';
import { Chamados } from './src/screens/Chamados';
import { Dashboard } from './src/screens/Dashboard';
import { DetalheChamado } from './src/screens/DetalheChamado';
import { Login } from './src/screens/Login';
import { NovoChamado } from './src/screens/NovoChamado';
import { AppProvider, useApp } from './src/state/AppContext';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const cabecalho = { headerTintColor: cor.primaria, headerTitleStyle: { color: cor.texto, fontWeight: '700' as const } };

function Abas() {
  return (
    <Tabs.Navigator screenOptions={{ ...cabecalho, tabBarActiveTintColor: cor.primaria, tabBarInactiveTintColor: cor.suave,
      tabBarLabelStyle: { fontSize: 14, fontWeight: '700' }, tabBarStyle: { minHeight: 60, paddingBottom: 6 }, tabBarIcon: () => null }}>
      <Tabs.Screen name="Início" component={Dashboard} />
      <Tabs.Screen name="Chamados" component={Chamados} />
    </Tabs.Navigator>
  );
}

function Rotas() {
  const { pronto, usuario, atendente } = useApp();
  if (!pronto) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={cor.primaria} accessibilityLabel="Carregando" /></View>;
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
