# View-Evidence Edge Function - Test Documentation

## Function Status
✓ DEPLOYED - Endpoint is responding at `http://127.0.0.1:54321/functions/v1/view-evidence`

## Quick Tests Completed

### Test 1: No JWT (Expected: 401 Unauthorized)
```bash
curl.exe -X GET "http://127.0.0.1:54321/functions/v1/view-evidence?evidence_id=test" 
```
✓ **PASS** - Returns 401 with message: "Missing authorization header"

## Test Commands for Manual Testing

### Prerequisites
1. Supabase running on `http://127.0.0.1:54321`
2. Valid Supabase JWT token (from auth system)
3. Evidence file ID (UUID)

### Test 2: Missing evidence_id parameter (should return 400)
```bash
curl.exe -s -w "\nStatus: %{http_code}\n" \
  -X GET "http://127.0.0.1:54321/functions/v1/view-evidence" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Test 3: Invalid JWT (should return 401)
```bash
curl.exe -s -w "\nStatus: %{http_code}\n" \
  -X GET "http://127.0.0.1:54321/functions/v1/view-evidence?evidence_id=<EVIDENCE_ID>" \
  -H "Authorization: Bearer invalid_token"
```

### Test 4: Non-existent evidence (should return 404)
```bash
curl.exe -s -w "\nStatus: %{http_code}\n" \
  -X GET "http://127.0.0.1:54321/functions/v1/view-evidence?evidence_id=00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Test 5: Tenant owner accessing own evidence (should return 200 or 500 if Google creds missing)
```bash
curl.exe -s -w "\nStatus: %{http_code}\n" \
  -X GET "http://127.0.0.1:54321/functions/v1/view-evidence?evidence_id=<EVIDENCE_ID>" \
  -H "Authorization: Bearer <TENANT_JWT>" \
  -v
```

### Test 6: Admin accessing any evidence (should return 200 or 500 if Google creds missing)
```bash
curl.exe -s -w "\nStatus: %{http_code}\n" \
  -X GET "http://127.0.0.1:54321/functions/v1/view-evidence?evidence_id=<EVIDENCE_ID>" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -v
```

### Test 7: Unrelated tenant accessing other's evidence (should return 403)
```bash
curl.exe -s -w "\nStatus: %{http_code}\n" \
  -X GET "http://127.0.0.1:54321/functions/v1/view-evidence?evidence_id=<OTHER_TENANT_EVIDENCE_ID>" \
  -H "Authorization: Bearer <DIFFERENT_TENANT_JWT>" \
  -v
```

### Test 8: POST request with JSON body
```bash
curl.exe -s -w "\nStatus: %{http_code}\n" \
  -X POST "http://127.0.0.1:54321/functions/v1/view-evidence" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"evidence_id":"<EVIDENCE_ID>","variant":"file"}' \
  -v
```

### Test 9: Thumbnail variant
```bash
curl.exe -s -w "\nStatus: %{http_code}\n" \
  -X GET "http://127.0.0.1:54321/functions/v1/view-evidence?evidence_id=<EVIDENCE_ID>&variant=thumbnail" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -v
```

## Expected Behavior Summary

| Test | Input | Expected | Actual |
|------|-------|----------|--------|
| No JWT | GET with missing Authorization | 401 | ✓ 401 |
| Invalid JWT | GET with bad token | 401 | TBD |
| Missing evidence_id | GET without evidence_id param | 400 | TBD |
| Non-existent file | GET with fake UUID | 404 | TBD |
| Tenant owner - success | GET with owner JWT | 200 or 500* | TBD |
| Admin access | GET with admin JWT | 200 or 500* | TBD |
| Forbidden access | GET with other tenant JWT | 403 | TBD |
| Thumbnail unavailable | GET with thumbnail variant | 404 | TBD |

*Returns 500 if `GOOGLE_SERVICE_ACCOUNT_JSON` environment variable is not set. This is expected in local dev until Google credentials are configured.

## Setting Up Google Credentials for Local Testing

To test file download functionality, you need to set up Google Drive service account credentials:

1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Export as environment variable in Supabase:

```bash
export GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

Then restart Supabase:
```bash
supabase stop && supabase start
```

## Error Handling Tests

Once Google credentials are configured, additional tests can validate:
- File download with correct MIME type
- Thumbnail retrieval from Google Drive API
- Permission validation for different user roles
- Correct Content-Disposition headers
- Cache-Control headers
