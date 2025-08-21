import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://vnifbgwtqtvzpjoicuip.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuaWZiZ3d0cXR2enBqb2ljdWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NTgwNTIsImV4cCI6MjA3MTMzNDA1Mn0.ack3XGrHTn1AiqF0RnH65hBEeG3quU8Wa0z2eiBmZXg';

// Check for placeholders
if (supabaseUrl.includes('YOUR_')) {
  console.warn('Please update your .env with real Supabase credentials.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Use AsyncStorage directly
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
