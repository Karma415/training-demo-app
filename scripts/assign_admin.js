import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ ERROR: Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log("Searching for Samuel Gentry...");
  const { data: tenants, error: searchError } = await supabase
    .from('tenants')
    .select('id, email, first_name, last_name, role')
    .ilike('first_name', 'Samuel')
    .ilike('last_name', 'Gentry');

  if (searchError) {
    console.error("Error searching:", searchError);
    process.exit(1);
  }

  if (!tenants || tenants.length === 0) {
    console.error("❌ Samuel Gentry not found in the tenants table.");
    process.exit(1);
  }

  const tenant = tenants[0];
  console.log(`Found tenant: ${tenant.first_name} ${tenant.last_name} (${tenant.email}) with current role: ${tenant.role}`);

  const { error: updateError } = await supabase
    .from('tenants')
    .update({ role: 'superadmin' })
    .eq('id', tenant.id);

  if (updateError) {
    console.error("❌ Error updating role:", updateError);
    process.exit(1);
  }

  console.log("✅ Successfully updated Samuel Gentry to superadmin.");
  process.exit(0);
}

run();
