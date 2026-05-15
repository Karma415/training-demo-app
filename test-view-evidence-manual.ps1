# Simple curl-based tests instead of PowerShell script
# These can be run manually to test the view-evidence function

$SUPABASE_URL = "http://127.0.0.1:54321"
$SUPABASE_ANON_KEY = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"

Write-Host "`nView-Evidence Function - Manual Test Commands" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

Write-Host "Step 1: Create test tenants and evidence files" -ForegroundColor Yellow
Write-Host @"
# Tenant 1 (regular user - owner of evidence)
curl -X POST "$SUPABASE_URL/auth/v1/signup" `
  -H "Content-Type: application/json" `
  -H "apikey: $SUPABASE_ANON_KEY" `
  -d '{"email":"tenant1@test.com","password":"Test123!"}'

# Note the access_token and user.id from response

Write-Host "`nStep 2: Create evidence_files record (as service role)" -ForegroundColor Yellow
Write-Host @"
curl -X POST "$SUPABASE_URL/rest/v1/evidence_files" `
  -H "Content-Type: application/json" `
  -H "apikey: $SUPABASE_ANON_KEY" `
  -d '{
    "tenant_id": "<USER_ID>",
    "file_path": "https://drive.google.com/file/d/MOCK_FILE_ID/view",
    "metadata": {
      "google_drive_file_id": "MOCK_FILE_ID",
      "filename": "test-photo.jpg",
      "file_mime_type": "image/jpeg"
    }
  }'

Write-Host "`nStep 3: Test GET file (with valid JWT)" -ForegroundColor Yellow
Write-Host @"
# Tenant owner - Success (200)
curl -X GET "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=<EVIDENCE_ID>" `
  -H "Authorization: Bearer <JWT_TOKEN>" `
  -v

Write-Host "`nStep 4: Test error cases" -ForegroundColor Yellow
Write-Host @"
# Missing JWT - Unauthorized (401)
curl -X GET "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=<EVIDENCE_ID>" -v

# Invalid JWT - Unauthorized (401)
curl -X GET "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=<EVIDENCE_ID>" `
  -H "Authorization: Bearer invalid_token" -v

# Non-existent evidence - Not Found (404)
curl -X GET "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=00000000-0000-0000-0000-000000000000" `
  -H "Authorization: Bearer <JWT_TOKEN>" -v

Write-Host "`nStep 5: Test POST variant" -ForegroundColor Yellow
Write-Host @"
curl -X POST "$SUPABASE_URL/functions/v1/view-evidence" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <JWT_TOKEN>" `
  -d '{"evidence_id": "<EVIDENCE_ID>", "variant": "thumbnail"}' -v

"@
