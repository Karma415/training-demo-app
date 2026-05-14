import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ ERROR: Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DUMMY_TENANTS = [
  { first: 'Kevin', last: 'Smith', unit: '208', email: 'test_kevinsmith@example.com', pass: 'Password#208' },
  { first: 'Sarah', last: 'Jones', unit: '315', email: 'test_sarajones@example.com', pass: 'Password#315' },
  { first: 'Jessica', last: 'Jackson', unit: '402', email: 'test_jessicajackson@example.com', pass: 'Password#402' },
  { first: 'Amber', last: 'Brown', unit: '516', email: 'test_amberbrown@example.com', pass: 'Password#516' },
  { first: 'John', last: 'Watson', unit: '707', email: 'test_johnwatson@example.com', pass: 'Password#707' }
];

const REAL_CLIENTS = ['Samuel Gentry', 'Teresa Ritualo', 'Joseph Livingston', 'Samantha lualhati', 'Kallyn Fowler', 'Marc Jones'];

async function run() {
  console.log("🚀 Starting Walkthrough Data Generation...");

  // 1. Get the Test Building & Attorney
  const { data: buildings } = await supabase.from('buildings').select('id').limit(1);
  const buildingId = buildings?.[0]?.id;

  const { data: attorneys } = await supabase.from('tenants').select('id').eq('role', 'legal_counsel').limit(1);
  const attorneyId = attorneys?.[0]?.id;
  
  const { data: admins } = await supabase.from('tenants').select('id, email').eq('role', 'superadmin').limit(1);
  const adminId = admins?.[0]?.id;

  if (!buildingId || !attorneyId) {
    console.error("❌ Missing global building or attorney in DB. Please run normal seed first.");
    process.exit(1);
  }

  // 2. Remove Real Clients
  console.log("🧹 Removing real clients from test environment...");
  for (const name of REAL_CLIENTS) {
    const parts = name.split(' ');
    const first = parts[0];
    const last = parts.slice(1).join(' ');
    
    // Find tenant by name case-insensitive
    const { data: tenants } = await supabase.from('tenants').select('id, email')
      .ilike('first_name', first)
      .ilike('last_name', last);
      
    if (tenants && tenants.length > 0) {
      for (const t of tenants) {
        // Delete dependent data (cascade might handle this, but better to be safe)
        await supabase.from('client_assignments').delete().eq('tenant_id', t.id);
        await supabase.from('interactions').delete().eq('tenant_id', t.id);
        await supabase.from('issues').delete().eq('tenant_id', t.id);
        await supabase.from('calendar_events').delete().eq('tenant_uid', t.id);
        await supabase.from('notifications').delete().eq('recipient_id', t.id);
        
        // Delete from tenants
        await supabase.from('tenants').delete().eq('id', t.id);
        
        // Attempt to delete auth user
        await supabase.auth.admin.deleteUser(t.id);
      }
      console.log(`✅ Removed ${name}`);
    }
  }

  // 3. Create Dummy Tenants and their data
  console.log("👤 Creating dummy tenants and generating their data...");
  const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  for (const tenant of DUMMY_TENANTS) {
      const existing = existingUsers.users.find(u => u.email === tenant.email);
      if (existing) {
          await supabase.auth.admin.deleteUser(existing.id);
      }
  }

  for (const tenant of DUMMY_TENANTS) {
    console.log(`\nProcessing ${tenant.first} ${tenant.last}...`);
    
    // Auth user creation
    let authUser = null;
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: tenant.email,
      password: tenant.pass,
      email_confirm: true
    });
    
    if (authErr && authErr.code !== 'email_exists') {
        console.error(`Error creating auth for ${tenant.email}:`, authErr);
    }
    
    const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    authUser = listData.users.find(u => u.email === tenant.email);

    if (!authUser) continue;

    // Insert into tenants
    const { error: tenantErr } = await supabase.from('tenants').upsert({
      id: authUser.id,
      building_id: buildingId,
      email: tenant.email,
      first_name: tenant.first,
      last_name: tenant.last,
      unit_number: tenant.unit,
      role: 'tenant',
      status: 'current_resident'
    });

    if (tenantErr) console.error("Tenant upsert err:", tenantErr);

    // Assign to Attorney
    const { error: assignErr } = await supabase.from('client_assignments').upsert({
      attorney_id: attorneyId,
      tenant_id: authUser.id,
      status: 'active'
    }, { onConflict: 'attorney_id,tenant_id' });

    // Issues (3-5)
    const numIssues = Math.floor(Math.random() * 3) + 3; // 3 to 5
    for (let i = 0; i < numIssues; i++) {
      const isPast = i === 0; // Ensure at least 1 is a past/resolved event
      const { data: issue, error: issueErr } = await supabase.from('issues').insert({
        tenant_id: authUser.id,
        building_id: buildingId,
        category: [['Plumbing', 'Electrical', 'Heating', 'Pest', 'Security'][Math.floor(Math.random() * 5)]],
        description: `Dummy issue ${i + 1} for walkthrough.`,
        date_reported: new Date(Date.now() - (isPast ? 30 : 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: isPast ? 'resolved' : 'pending'
      }).select().single();
      
      if (issueErr) {
          console.error("Issue insert err:", issueErr);
          continue;
      }

      // Interactions (1-3)
      if (issue) {
        const numInteractions = Math.floor(Math.random() * 3) + 1; // 1 to 3
        for (let j = 0; j < numInteractions; j++) {
          await supabase.from('interactions').insert({
            tenant_id: authUser.id,
            issue_id: issue.id,
            summary: `Staff interaction ${j + 1} regarding this issue.`,
            interaction_type: 'Office Visit'
          });
        }
      }
    }

    // Calendar Events
    // ~3 from Admin
    for(let i = 0; i < 3; i++) {
        await supabase.from('calendar_events').insert({
            title: `Admin Event ${i + 1}`,
            event_date: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            tenant_uid: authUser.id,
            approved_by_admin: true,
            is_global: false,
            description: "Scheduled by Admin"
        });
    }
    // ~2 from Attorney
    for(let i = 0; i < 2; i++) {
        await supabase.from('calendar_events').insert({
            title: `Attorney Meeting ${i + 1}`,
            event_date: new Date(Date.now() + ((i+1) * 2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            tenant_uid: authUser.id,
            approved_by_admin: true,
            is_global: false,
            description: "Legal Consultation"
        });
    }
    // 2-4 personal events
    const numPersonal = Math.floor(Math.random() * 3) + 2; // 2 to 4
    for(let i = 0; i < numPersonal; i++) {
        await supabase.from('calendar_events').insert({
            title: `Personal Event ${i + 1}`,
            event_date: new Date(Date.now() + ((i+3) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            tenant_uid: authUser.id,
            approved_by_admin: false,
            is_global: false,
            description: "Personal Reminder"
        });
    }

    // Notifications
    // 1 unique notification from attorney
    const { error: notifErr1 } = await supabase.from('notifications').insert({
        type: 'message',
        title: 'Direct Message from Attorney',
        content: `Hello ${tenant.first}, here is a specific update regarding your case unit ${tenant.unit}.`,
        urgency: 'medium',
        read: false,
        purpose: 'Direct Communication',
        tenant_id: authUser.id
    });
    if (notifErr1) console.log("Specific notification insert error:", notifErr1);
  }

  // Global Notifications
  console.log("🔔 Creating global notifications...");
  const { error: notifErr2 } = await supabase.from('notifications').insert({
      type: 'alert',
      title: 'Building Maintenance Update',
      content: 'Admin: The main water line will be shut off briefly tomorrow.',
      urgency: 'high',
      read: false,
      purpose: 'Building Announcement',
      is_global: true
  });
  if (notifErr2) console.log("Admin global notification error:", notifErr2);

  const { error: notifErr3 } = await supabase.from('notifications').insert({
      type: 'update',
      title: 'Legal Rights Seminar',
      content: 'Attorney: Join us for a seminar on your tenant rights this Friday.',
      urgency: 'medium',
      read: false,
      purpose: 'Legal Announcement',
      is_global: true
  });
  if (notifErr3) console.log("Attorney global notification error:", notifErr3);

  console.log("✅ Data generation complete!");
  process.exit(0);
}

run();
