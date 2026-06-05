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

export const rawSupabase = createClient(
    normalizedSupabaseUrl || fallbackSupabaseUrl,
    normalizedSupabaseAnonKey || fallbackSupabaseAnonKey
);

// Environment check: local dev vs live prod
const getIsDevEnv = () => {
    return !!(
        import.meta.env.DEV ||
        (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    );
};

// List of tables containing the 'is_dev' column
const ENV_AWARE_TABLES = [
    'tenants',
    'issues',
    'evidence_files',
    'interactions',
    'tenant_checklists',
    'calendar_events',
    'official_letters',
    'access_requests',
    'tenant_qr_logins',
    'signup_codes'
];

// Helper to recursively wrap Supabase query/filter builder results
const wrapBuilder = (target: any): any => {
    if (!target || typeof target !== 'object') return target;

    return new Proxy(target, {
        get(obj, prop) {
            const value = obj[prop];
            if (typeof value === 'function') {
                return function (...args: any[]) {
                    const isDev = getIsDevEnv();

                    if (prop === 'select') {
                        const res = value.apply(obj, args);
                        return wrapBuilder(res.eq('is_dev', isDev));
                    }
                    if (prop === 'insert') {
                        let val = args[0];
                        if (Array.isArray(val)) {
                            val = val.map(v => ({ ...v, is_dev: isDev }));
                        } else if (val) {
                            val = { ...val, is_dev: isDev };
                        }
                        args[0] = val;
                        const res = value.apply(obj, args);
                        return wrapBuilder(res);
                    }
                    if (prop === 'update') {
                        let val = args[0];
                        if (val) {
                            val = { ...val, is_dev: isDev };
                        }
                        args[0] = val;
                        const res = value.apply(obj, args);
                        return wrapBuilder(res.eq('is_dev', isDev));
                    }
                    if (prop === 'upsert') {
                        let val = args[0];
                        if (Array.isArray(val)) {
                            val = val.map(v => ({ ...v, is_dev: isDev }));
                        } else if (val) {
                            val = { ...val, is_dev: isDev };
                        }
                        args[0] = val;
                        const res = value.apply(obj, args);
                        return wrapBuilder(res.eq('is_dev', isDev));
                    }
                    if (prop === 'delete') {
                        const res = value.apply(obj, args);
                        return wrapBuilder(res.eq('is_dev', isDev));
                    }

                    const res = value.apply(obj, args);
                    return wrapBuilder(res);
                };
            }
            return value;
        }
    });
};

// Wrap the supabase client's 'from' and 'rpc' methods
export const supabase = new Proxy(rawSupabase, {
    get(target, prop) {
        const value = (target as any)[prop];
        if (prop === 'from') {
            return function (table: string) {
                const builder = value.call(target, table);
                if (ENV_AWARE_TABLES.includes(table)) {
                    return wrapBuilder(builder);
                }
                return builder;
            };
        }
        if (prop === 'rpc') {
            return function (fn: string, args?: any, options?: any) {
                if (fn === 'admin_create_tenant_with_qr') {
                    const isDev = getIsDevEnv();
                    args = {
                        ...args,
                        p_is_dev: isDev
                    };
                }
                return value.call(target, fn, args, options);
            };
        }
        if (typeof value === 'function') {
            return value.bind(target);
        }
        return value;
    }
}) as typeof rawSupabase;

