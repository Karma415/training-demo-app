import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
      email: 'sf-housing-hub-intake@sf-housing-hub-storage.iam.gserviceaccount.com',
      key: `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC1GWq4LHV5Do1+
XOK+f1ipOwMxrPWNxmTGwanET0diHD40BbDEIAY80fvM5vTdLF1Orrrx5XBpSOmJ
ahRwdUN81ZIalm+ZETU6KBdPg0+qvZbhXCW1+0A9IpYlQEAz28NDT3BJJzJlQkkW
tDH3B8lcMXazwjTKV0ob6YqbPmLpU0hRKOZEJI41N14bdrHDRmveT9Fm1Z6uNtqh
MjbdV/GXuvutAFaGy9wPTizmBZLTWNnZVQ4ok0NgpA0kyliKIuMvBRqLSF7zrFtz
VoeFLBHUrUnQ/WqZjA7+Z7KO57Sk5FG4kn0gT/onFa0BSsvkL5simPM4XXCc0xjp
P9zp4zR5AgMBAAECggEAD5IRn6es6v1iE38DfMsAsb4x6lu7Whb4c7FTeh4x3kDc
5Uam+dniB2kre+TQoVKO7DSwPJuURG0hLTAqdTfT12AaeYA9NJ0q5SbsyCibWSwH
VLWCRYkGbysx2x6Q1pSaz4b9OcDtv5CJLbNNB3cLLErRcKeuN8Z1B/zWrr3YrcRX
DVR8sqIJhRjpv7VQa9MNyaaN2sBS+InuOBJPcA3Dr9/6nKDUcZZD/kogfg1ro6Vd
ATV6Yrk6yYoUfa9PH0yFLT0OB51Z7R/Ay53dIuokBMfZUvzXVKjed7lRa0byPXsN
h+U3VyuwtKGp4LBAdZFVnMfq84a4bA5Elpk9jQj8wQKBgQDddxa3jv9LyzxFgnMr
VfELkaD6JKXmoHxxS684q1wxC6xOW0vhzRD4Mo5KbLUWXpHuejg0i7L8E5DXva1m
ZmSZuzqCqmtkEagkNQ7V5IKgowohyIN89Ja4vuy6trYaSF+jkdydEOwGENC8MY0G
kOO51X1mZG0AWlu+ZJhOxH9+YQKBgQDRVurZHnJ0E6mTH48QkbnYQSCr4SVoNmUF
XxLpMF9rd/rkT2bgfq5hlR62P6opMsZprnvbLrKHE21pxjZLZd//tC5lX2LpqkYv
70Eslsd0CXhDcpZgkMQVGufaBnM03ms3BL/5JNgvuZ2uVtzUFnXiroB6mccqYitc
hfUFocr9GQKBgAgZm/YYv9Oo2kp8i/PQz+EpcWbUwlCeHA8UwpLjCZstnx66jhrz
IiTBzJyCP1lTGilLxRR+64v2tzx8zoPJSPKqe2heDVF6p9izLBi8o952OB+mMtD2
LTESopvtpNlvPjhAVH5WKRvLr6bCdTMBR6L7YPvGvondxC9BhKSU4UjhAoGAbIbb
CeS3AWaQKy3ZRYXHC034WiNG+Vf512cKrsndLiHteB+R/iCu1vgwC9vFo8YnBvLm
UyNKeqyftI6F52DRWAdZZkSlSu5zpLYs26jvjkC6kHz/aOCkRyzDtkxRvb7xZnyX
6dooGdXo4VE2+t0KEJLXGLhQgLCUOktYU6slSUECgYAC7SsFbYrkSaRNAliSocgr
hJqJVxE0xOlek1Ob+8Raotq8k4znt8BpgNww5f+eZ5drwmIqvFkyjuWPuaQ+RZvm
kakEh87qmT8osjGA/VWDo6Ea9EgmqMfAk7YcDtvgJZiE53vyca2gj84bIbrVVBYs
HEbjq4yR8h3JFBSe9yPIHQ==
-----END PRIVATE KEY-----
`,
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
