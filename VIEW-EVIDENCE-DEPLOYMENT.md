# View-Evidence Edge Function - Deployment Summary

## ✅ COMPLETED

### Function Deployed
- **Location**: `supabase/functions/view-evidence/index.ts`
- **Status**: ✓ Running and responding
- **Endpoint**: `http://127.0.0.1:54321/functions/v1/view-evidence`
- **Methods**: GET, POST, OPTIONS (CORS enabled)

### Implementation Includes

#### 1. Request Handling
- **GET**: `?evidence_id=<uuid>&variant=file|thumbnail`
- **POST**: JSON body with `evidence_id` and optional `variant`
- **CORS**: Full cross-origin support

#### 2. Authentication & Authorization
- ✓ JWT validation via Authorization header
- ✓ Tenant ownership check (`evidence_files.tenant_id === auth.user.id`)
- ✓ Role-based access control:
  - `admin`
  - `superadmin`
  - `legal_counsel`
- ✓ Proper error responses:
  - `401` - Missing or invalid JWT
  - `403` - Insufficient permissions
  - `404` - Evidence not found
  - `400` - Missing evidence_id parameter

#### 3. Google Drive Integration
- ✓ JWT signing for Google OAuth
- ✓ Service account authentication flow
- ✓ File ID extraction (from metadata or URL parsing)
- ✓ Two variants:
  - `file`: Raw file download with proper Content-Type
  - `thumbnail`: Google Drive thumbnail image
- ✓ No credentials exposed in responses

#### 4. Documentation
- ✓ README.md - API specification and usage examples
- ✓ TESTING.md - Manual test commands
- ✓ Inline comments and error logging

## 🔧 Fixes Applied

1. **Seed SQL schema mismatch**: Fixed `habitability_rules` table insertion
   - Changed: `(category, issue_name, ...)` → `(name, ...)`
   - File: `supabase/seed.sql`

2. **Supabase startup**: Successfully deployed with all migrations applied

## ✅ Verified

```bash
# Test: Missing JWT (returns 401)
curl.exe -X GET "http://127.0.0.1:54321/functions/v1/view-evidence?evidence_id=test"
# Response: {"msg":"Error: Missing authorization header"}
# Status: 401
```

## 📋 REQUIRED BEFORE FULL TESTING

### Set Google Service Account Credentials

Create a service account in Google Cloud and export the JSON credentials:

```bash
# In Windows PowerShell
$env:GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"YOUR_PROJECT","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"..."}'
```

Or for Linux/Mac:
```bash
export GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

Then restart Supabase:
```bash
cd e:\Codex\sf-housing-hub\training-demo-app
supabase stop
supabase start
```

## 🧪 Test Commands

### Test 1: 401 - No JWT (READY NOW)
```bash
curl.exe -s -w "`nStatus: %{http_code}`n" \
  -X GET "http://127.0.0.1:54321/functions/v1/view-evidence?evidence_id=test-id"
# Expected: 401
```

### Test 2: 400 - Missing evidence_id (READY NOW)
```bash
curl.exe -s -w "`nStatus: %{http_code}`n" \
  -X GET "http://127.0.0.1:54321/functions/v1/view-evidence" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYWluaW5nLWRlbW8tYXBwIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJpYXQiOjE1ODAzMjQyNTAsImV4cCI6MTEzMjk2MDI1MCwidXNlcl9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImVtYWlsIjoicHJvbmtAZXhhbXBsZS5jb20iLCJwaG9uZSI6IiJ9.V2xqTt3pLBvuVLB_8iYqF-2UT4kqd3bQdg5bYvDqkNo"
# Expected: 400
```

### Test 3: 404 - Non-existent evidence (READY NOW)
```bash
curl.exe -s -w "`nStatus: %{http_code}`n" \
  -X GET "http://127.0.0.1:54321/functions/v1/view-evidence?evidence_id=00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYWluaW5nLWRlbW8tYXBwIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJpYXQiOjE1ODAzMjQyNTAsImV4cCI6MTEzMjk2MDI1MCwidXNlcl9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImVtYWlsIjoicHJvbmtAZXhhbXBsZS5jb20iLCJwaG9uZSI6IiJ9.V2xqTt3pLBvuVLB_8iYqF-2UT4kqd3bQdg5bYvDqkNo"
# Expected: 404
```

### Test 4: 403 - Permission denied (NEEDS TEST DATA)
After setting up test tenants with different roles in the database, test:
```bash
# Unrelated tenant trying to access other's evidence
curl.exe -X GET "http://127.0.0.1:54321/functions/v1/view-evidence?evidence_id=<OTHER_EVIDENCE_ID>" \
  -H "Authorization: Bearer <OTHER_TENANT_JWT>" \
  -v
# Expected: 403
```

### Test 5: 200 - Successful file download (NEEDS GOOGLE CREDS + TEST DATA)
```bash
curl.exe -X GET "http://127.0.0.1:54321/functions/v1/view-evidence?evidence_id=<EVIDENCE_ID>" \
  -H "Authorization: Bearer <VALID_JWT>" \
  -o downloaded_file.jpg
# Expected: 200 with file bytes
```

## 📄 File Structure

```
supabase/functions/view-evidence/
├── index.ts          # Main function implementation (450+ lines)
├── README.md         # Complete API documentation
└── TESTING.md        # Test commands and troubleshooting
```

## 🔐 Environment Variables Required for Google Integration

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key_here>
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}  # NEEDED FOR FULL FUNCTIONALITY
```

## 🚀 Next Steps

### Phase 1: Full Testing (Optional - before React integration)
1. Set up Google Service Account credentials
2. Create test tenants and evidence files in database
3. Run all test commands from TESTING.md
4. Verify all status codes and response formats

### Phase 2: React Integration (When ready)
The React app will call this function via:
```typescript
// Example from EvidenceUploader.tsx or similar
const { data, error } = await supabase.functions.invoke('view-evidence', {
  body: {
    evidence_id: fileId,
    variant: 'file' // or 'thumbnail'
  },
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

### Phase 3: Component Updates (When Phase 2 is ready)
Replace direct evidence file access in these components:
- `EvidenceUploader.tsx` - Display uploaded files
- `EvidenceTimeline.tsx` - Show evidence timeline
- `LegalIssueDetail.tsx` - View evidence for legal review
- `IssueDetail.tsx` - View issue evidence
- Any other component using `evidence_files` table

## 🎯 Benefits of This Implementation

1. **Server-side auth**: All permission checks happen server-side, not in browser
2. **Secure credentials**: Google API credentials never exposed to frontend
3. **CORS friendly**: Can be called from any origin
4. **Role-based access**: Admin and legal counsel can view any evidence
5. **Two variants**: Support for both file downloads and thumbnails
6. **Error handling**: Clear error messages for debugging
7. **Performance**: Caching headers (1 hour for files, 24 hours for thumbnails)

## ⚠️ Known Limitations

1. Requires Google Service Account credentials to be set (for actual file downloads)
2. Mock evidence files in tests won't actually download without valid Google Drive IDs
3. Thumbnail only available if Google Drive file has thumbnail metadata
4. Large files may take time to download

## 📞 Support

See documentation:
- API Spec: `supabase/functions/view-evidence/README.md`
- Test Guide: `supabase/functions/view-evidence/TESTING.md`
- Main Logic: `supabase/functions/view-evidence/index.ts` (inline comments)
