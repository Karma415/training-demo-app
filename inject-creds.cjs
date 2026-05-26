const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('e:\\downloads\\sf-housing-hub-storage-5a258232d29d.json', 'utf8'));

const code = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleSpreadsheet } from 'npm:google-spreadsheet@4.1.1';
import { JWT } from 'npm:google-auth-library@9.6.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const { email, name, unit } = await req.json();
    if (!email && !name && !unit) throw new Error('Email, Name, or Unit required');

    const serviceAccountAuth = new JWT({
      email: '${creds.client_email}',
      key: \`${creds.private_key}\`,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const doc = new GoogleSpreadsheet('1FWbWz9ZhewTrjxCt3IZQ1fIcF-mdDvPleBPbO_CiJlc', serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsById[594718677] || doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    
    const matchedRow = rows.find(r => {
      // 1. Try matching by Unit Number
      const sheetUnit = (r.get('Unit #') || r.get('Unit'))?.toString().trim();
      if (unit && sheetUnit && sheetUnit === unit.toString().trim()) return true;

      // 2. Try matching by Name
      const sheetFirstName = (r.get('What is your first name?') || r.get('First Name'))?.toLowerCase().trim() || '';
      const sheetLastName = (r.get('What is your last name?') || r.get('Last Name'))?.toLowerCase().trim() || '';
      const sheetFullName = (sheetFirstName + ' ' + sheetLastName).trim();
      const providedName = (name || '').toLowerCase().trim();
      
      if (providedName && sheetFullName && providedName === sheetFullName) return true;
      if (providedName && sheetFirstName && providedName.includes(sheetFirstName) && providedName.includes(sheetLastName)) return true;

      // 3. Try matching by Email
      const sheetEmail = r.get('Email Address')?.toLowerCase().trim();
      const sheetEmail2 = r.get('email')?.toLowerCase().trim();
      const providedEmail = (email || '').toLowerCase().trim();
      if (providedEmail && sheetEmail && sheetEmail === providedEmail) return true;
      if (providedEmail && sheetEmail2 && sheetEmail2 === providedEmail) return true;

      return false;
    });

    if (!matchedRow) {
      return new Response(JSON.stringify({ data: null, message: 'No intake form found for this email' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }
    return new Response(JSON.stringify({ data: matchedRow.toObject() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
`;
fs.writeFileSync('supabase/functions/get-intake-data/index.ts', code);
