import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase session payloads (access_token JWT + refresh_token + user metadata)
// routinely exceed expo-secure-store's hard 2KB-per-item limit on iOS, which
// causes silent persistence failures and "Auth session missing!" errors.
// AsyncStorage has no such limit and is the storage adapter Supabase
// officially recommends for Expo apps.
//
// Note: AsyncStorage is not encrypted at rest. iOS app sandboxing protects
// the file from other apps, but a jailbroken device could read it. For this
// app the JWT only authorizes API access — actual chat content is fetched
// server-side and never stored in the JWT itself — so the trade-off is fine.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
