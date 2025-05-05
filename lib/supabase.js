import { createClient } from '@supabase/supabase-js';

// Créer un client Supabase pour utilisation côté client
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Créer un client Supabase avec la clé de service pour accès admin
// À utiliser uniquement côté serveur pour les opérations sensibles
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return createClient(supabaseUrl, supabaseServiceKey);
}