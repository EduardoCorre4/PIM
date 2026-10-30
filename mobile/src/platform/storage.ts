import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { Session, SessionStore } from '../core/http';
import type { KV } from '../core/kv';

/**
 * Tokens ficam no Keychain (iOS) / Keystore (Android) via SecureStore: armazenamento criptografado
 * pelo sistema. Nunca vão para o AsyncStorage.
 */
const CHAVE_SESSAO = 'jake.sessao';
export const sessionStore: SessionStore = {
  async load() {
    try {
      const s = await SecureStore.getItemAsync(CHAVE_SESSAO);
      return s ? (JSON.parse(s) as Session) : null;
    } catch { return null; }
  },
  save: s => SecureStore.setItemAsync(CHAVE_SESSAO, JSON.stringify(s)),
  clear: () => SecureStore.deleteItemAsync(CHAVE_SESSAO),
};

/** Cache de dados e fila de envio (não contêm credenciais). */
export const dataKV: KV = AsyncStorage;
