// Identidade visual JAKE Tecnologia (identidade-visual/tokens.css espelhado para React Native).
export const paleta = {
  azul: '#2B4EEA',        // Azul JAKE — cor principal
  azul700: '#1F3BC4',
  azul50: '#EEF2FF',
  azul100: '#DDE5FF',
  azul800: '#182E96',
  noite: '#0E1530',       // Noite — texto e fundos escuros
  ipe: '#FFC233',         // Amarelo Ipê — destaque, sempre com texto Noite
  ipe300: '#FFD970',
  nevoa: '#F6F7FB',       // Névoa — fundo das telas
  branco: '#FFFFFF',
  neutro100: '#ECEEF5',
  neutro200: '#DADDE8',
  neutro400: '#8C93AB',
  neutro500: '#666E88',
  neutro600: '#4A5169',
  sucesso: '#12805C', sucessoFundo: '#D6F3E6', sucessoTexto: '#0B5C41',
  alerta: '#B45309', alertaFundo: '#FFEFC7', alertaTexto: '#7A4A00',
  erro: '#C62828', erroFundo: '#FDE0E0', erroTexto: '#9B1C1C',
  contratoSuporte: '#2B4EEA', contratoSistema: '#7C3AED', contratoCloud: '#0F766E',
};

// Nomes registrados em useFonts (App.tsx). Com fontes customizadas, o peso vem do nome da família.
export const fonte = {
  titulo: 'Sora_700Bold',
  tituloSemi: 'Sora_600SemiBold',
  texto: 'Inter_400Regular',
  textoMedio: 'Inter_500Medium',
  textoSemi: 'Inter_600SemiBold',
  mono: 'JetBrainsMono_500Medium',
} as const;

export const raio = { sm: 6, md: 10, lg: 16, pill: 999 };
/** Alvo de toque mínimo: 48 dp. */
export const ALVO = 48;
