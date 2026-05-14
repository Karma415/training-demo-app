import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const normalizedSupabaseUrl = supabaseUrl?.trim() ?? '';
const normalizedSupabaseAnonKey = supabaseAnonKey?.trim() ?? '';

const requiredEnvVars = {
    VITE_SUPABASE_URL: normalizedSupabaseUrl,
    VITE_SUPABASE_ANON_KEY: normalizedSupabaseAnonKey,
};

const missingEnvVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([name]) => name);

export const supabaseConfig = {
    isConfigured: missingEnvVars.length === 0,
    missingEnvVars,
};

const fallbackSupabaseUrl = 'https://missing-env.supabase.co';
const fallbackSupabaseAnonKey = 'missing-env-anon-key';

export const supabase = createClient(
    normalizedSupabaseUrl || fallbackSupabaseUrl,
    normalizedSupabaseAnonKey || fallbackSupabaseAnonKey
);
