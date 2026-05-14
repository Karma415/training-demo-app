import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the local .env configuration perfectly pointing to the TEST project
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ ERROR: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  console.error("Please make sure you copied the service_role key into your .env.local file from the Dashboard!");
  process.exit(1);
}

// Use Service Role key to bypass RLS for seeding
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runSeed() {
  console.log("🌱 Beginning Seed for SF Housing Hub (Test DB)...");

  console.log("🧹 Wiping previous test data...");
  // Clear application tables
  await supabase.from('client_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('interactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('issues').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('tenants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('buildings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('platform_admins').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
  
  console.log("🏢 Creating global test building...");
  const { data: building, error: buildingErr } = await supabase
    .from('buildings')
    .insert([{ name: 'Test HQ Plaza', address: '123 Fake Street, San Francisco CA' }])
    .select().single();

  if (buildingErr) {
    console.error("Error creating building:", buildingErr);
    process.exit(1);
  }

  console.log("👤 Creating Test Users (Admin, Attorney, Tenants)...");

  // Helper method to ensure auth user exists
  async function createAuthUser(email, password, roleLabel) {
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    // Ignore if user already exists
    if (authErr && authErr.code !== 'email_exists') {
        console.error(`Error creating ${roleLabel}:`, authErr);
    }
    
    // Fetch the user to get their ID regardless if just created or already existed
    const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    return listData.users.find(u => u.email === email);
  }

  const superAdmin = await createAuthUser('karma@sfhelphub.org', 'password123', 'Superadmin');
  const attorney = await createAuthUser('test_attorney@example.com', 'password123', 'Attorney');
  const tenant1 = await createAuthUser('jane@example.com', 'password123', 'Tenant 1');
  const tenant2 = await createAuthUser('sam@example.com', 'password123', 'Tenant 2');

  console.log("📝 Setting up Profiles & Roles...");

  // 1. Setup Super Admin
  if (superAdmin) {
      await supabase.from('tenants').upsert({
          id: superAdmin.id,
          building_id: building.id,
          email: superAdmin.email,
          first_name: 'System',
          last_name: 'Admin',
          role: 'superadmin'
      });
      await supabase.from('platform_admins').upsert({ user_id: superAdmin.id });
  }

  // 2. Setup Attorney
  if (attorney) {
      await supabase.from('tenants').upsert({
          id: attorney.id,
          building_id: building.id,
          email: attorney.email,
          first_name: 'Test',
          last_name: 'Attorney',
          role: 'legal_counsel'
      });
  }

  // 3. Setup Tenants
  if (tenant1) {
      await supabase.from('tenants').upsert({
          id: tenant1.id,
          building_id: building.id,
          email: tenant1.email,
          first_name: 'Jane',
          last_name: 'Doe',
          unit_number: 101,
          role: 'tenant',
          status: 'current_resident'
      });
  }

  if (tenant2) {
      await supabase.from('tenants').upsert({
          id: tenant2.id,
          building_id: building.id,
          email: tenant2.email,
          first_name: 'Sam',
          last_name: 'Smith',
          unit_number: 102,
          role: 'tenant',
          status: 'current_resident',
          requests_attorney: true
      });
  }

  console.log("🔥 Inserting Dummy Issues & Interactions...");
  if (tenant1) {
      const { data: issue1 } = await supabase.from('issues').insert({
          tenant_id: tenant1.id,
          building_id: building.id,
          category: ['Plumbing'],
          description: 'Water leaking from the ceiling in the bathroom.',
          date_reported: new Date().toISOString().split('T')[0],
          status: 'pending'
      }).select().single();

      if (issue1) {
        await supabase.from('interactions').insert({
          tenant_id: tenant1.id,
          issue_id: issue1.id,
          summary: 'Tenant called to report leak.',
          interaction_type: 'phone_call'
        });
      }
  }

  if (tenant2 && attorney) {
      // Assign tenant2 to attorney
      await supabase.from('client_assignments').insert({
          attorney_id: attorney.id,
          tenant_id: tenant2.id,
          status: 'active'
      });

      const { data: issue2 } = await supabase.from('issues').insert({
          tenant_id: tenant2.id,
          building_id: building.id,
          category: ['Heating'],
          description: 'No heat for 3 days.',
          date_reported: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'escalated'
      }).select().single();
  }

  console.log("✅ Seed completed successfully! Test Data is ready.");
  process.exit(0);
}

runSeed();
