param()

# Configuration
$SUPABASE_URL = "http://127.0.0.1:54321"
$SUPABASE_ANON_KEY = "<your_anon_key_here>"
$SUPABASE_SERVICE_ROLE_KEY = "<your_service_role_key_here>"

Write-Host "`n================================" -ForegroundColor Blue
Write-Host "View-Evidence Function Test" -ForegroundColor Blue
Write-Host "================================`n" -ForegroundColor Blue

# Step 1: Create test tenants
Write-Host "Creating test tenants..." -ForegroundColor Yellow

# Tenant 1: Regular user
$TENANT1_EMAIL = "tenant1@example.com"
$TENANT1_PASSWORD = "TestPassword123!"

$body1 = @{
    email = $TENANT1_EMAIL
    password = $TENANT1_PASSWORD
} | ConvertTo-Json

$auth1 = Invoke-WebRequest -Uri "$SUPABASE_URL/auth/v1/signup" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "apikey" = $SUPABASE_ANON_KEY
  } `
  -Body $body1 | ConvertFrom-Json

$TENANT1_ID = $auth1.user.id
$TENANT1_JWT = $auth1.session.access_token

Write-Host "✓ Tenant 1 created" -ForegroundColor Green
Write-Host "  ID: $TENANT1_ID"
Write-Host "  Email: $TENANT1_EMAIL`n"

# Tenant 2: Admin
$TENANT2_EMAIL = "admin@example.com"
$TENANT2_PASSWORD = "AdminPassword123!"

$body2 = @{
    email = $TENANT2_EMAIL
    password = $TENANT2_PASSWORD
} | ConvertTo-Json

$auth2 = Invoke-WebRequest -Uri "$SUPABASE_URL/auth/v1/signup" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "apikey" = $SUPABASE_ANON_KEY
  } `
  -Body $body2 | ConvertFrom-Json

$TENANT2_ID = $auth2.user.id
$TENANT2_JWT = $auth2.session.access_token

Write-Host "✓ Admin user created" -ForegroundColor Green
Write-Host "  ID: $TENANT2_ID"
Write-Host "  Email: $TENANT2_EMAIL`n"

# Tenant 3: Unrelated
$TENANT3_EMAIL = "other@example.com"
$TENANT3_PASSWORD = "OtherPassword123!"

$body3 = @{
    email = $TENANT3_EMAIL
    password = $TENANT3_PASSWORD
} | ConvertTo-Json

$auth3 = Invoke-WebRequest -Uri "$SUPABASE_URL/auth/v1/signup" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "apikey" = $SUPABASE_ANON_KEY
  } `
  -Body $body3 | ConvertFrom-Json

$TENANT3_ID = $auth3.user.id
$TENANT3_JWT = $auth3.session.access_token

Write-Host "✓ Unrelated tenant created" -ForegroundColor Green
Write-Host "  ID: $TENANT3_ID"
Write-Host "  Email: $TENANT3_EMAIL`n"

# Step 2: Insert tenant records
Write-Host "Setting up tenant roles..." -ForegroundColor Yellow

$tenantBody1 = @{
    id = $TENANT1_ID
    name = "Tenant One"
    email = $TENANT1_EMAIL
    role = "tenant"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/tenants" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $TENANT1_JWT"
    "apikey" = $SUPABASE_ANON_KEY
  } `
  -Body $tenantBody1 -ErrorAction SilentlyContinue | Out-Null

Write-Host "✓ Tenant 1 role set to 'tenant'" -ForegroundColor Green

$tenantBody2 = @{
    id = $TENANT2_ID
    name = "Admin User"
    email = $TENANT2_EMAIL
    role = "admin"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/tenants" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $TENANT2_JWT"
    "apikey" = $SUPABASE_ANON_KEY
  } `
  -Body $tenantBody2 -ErrorAction SilentlyContinue | Out-Null

Write-Host "✓ Tenant 2 role set to 'admin'" -ForegroundColor Green

$tenantBody3 = @{
    id = $TENANT3_ID
    name = "Other Tenant"
    email = $TENANT3_EMAIL
    role = "tenant"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/tenants" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $TENANT3_JWT"
    "apikey" = $SUPABASE_ANON_KEY
  } `
  -Body $tenantBody3 -ErrorAction SilentlyContinue | Out-Null

Write-Host "✓ Tenant 3 role set to 'tenant'" -ForegroundColor Green
Write-Host ""

# Step 3: Create test evidence files
Write-Host "Creating test evidence files..." -ForegroundColor Yellow

$GOOGLE_FILE_ID_1 = "1mock_google_file_id_for_test_001"
$GOOGLE_FILE_ID_2 = "1mock_google_file_id_for_test_002"

$evBody1 = @{
    tenant_id = $TENANT1_ID
    issue_id = $null
    file_path = "https://drive.google.com/file/d/$GOOGLE_FILE_ID_1/view"
    metadata = @{
        google_drive_file_id = $GOOGLE_FILE_ID_1
        filename = "property-damage.jpg"
        file_mime_type = "image/jpeg"
        thumbnail_url = "https://example.com/thumb.jpg"
        record_type = "photograph"
        description = "Water damage in bedroom"
    }
} | ConvertTo-Json

$ev1Resp = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/evidence_files" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "apikey" = $SUPABASE_ANON_KEY
  } `
  -Body $evBody1 | ConvertFrom-Json

$EVIDENCE1_ID = $ev1Resp[0].id

Write-Host "✓ Evidence 1 created (Tenant 1)" -ForegroundColor Green
Write-Host "  ID: $EVIDENCE1_ID`n"

$evBody2 = @{
    tenant_id = $TENANT3_ID
    issue_id = $null
    file_path = "https://drive.google.com/file/d/$GOOGLE_FILE_ID_2/view"
    metadata = @{
        google_drive_file_id = $GOOGLE_FILE_ID_2
        filename = "receipt.pdf"
        file_mime_type = "application/pdf"
        record_type = "document"
        description = "Repair receipt"
    }
} | ConvertTo-Json

$ev2Resp = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/evidence_files" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "apikey" = $SUPABASE_ANON_KEY
  } `
  -Body $evBody2 | ConvertFrom-Json

$EVIDENCE2_ID = $ev2Resp[0].id

Write-Host "✓ Evidence 2 created (Tenant 3)" -ForegroundColor Green
Write-Host "  ID: $EVIDENCE2_ID`n"

# Step 4: Run tests
Write-Host "`n================================" -ForegroundColor Blue
Write-Host "Running Tests" -ForegroundColor Blue
Write-Host "================================`n" -ForegroundColor Blue

# Test 1: Tenant owner - success
Write-Host "Test 1: Tenant owner accessing own evidence" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID" `
      -Method GET `
      -Headers @{
        "Authorization" = "Bearer $TENANT1_JWT"
      } `
      -ErrorAction Stop
    Write-Host "✓ PASS - Status: 200" -ForegroundColor Green
} catch {
    Write-Host "✗ FAIL - Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Admin access
Write-Host "Test 2: Admin user accessing any evidence" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID" `
      -Method GET `
      -Headers @{
        "Authorization" = "Bearer $TENANT2_JWT"
      } `
      -ErrorAction Stop
    Write-Host "✓ PASS - Status: 200" -ForegroundColor Green
} catch {
    Write-Host "✗ FAIL - Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Unrelated tenant - 403 Forbidden
Write-Host "Test 3: Unrelated tenant accessing other's evidence (should be 403)" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID" `
      -Method GET `
      -Headers @{
        "Authorization" = "Bearer $TENANT3_JWT"
      } `
      -ErrorAction Stop
    Write-Host "✗ FAIL - Expected 403, got 200" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✓ PASS - Status: 403 (Forbidden)" -ForegroundColor Green
    } else {
        Write-Host "✗ FAIL - Expected 403, got: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Missing JWT - 401 Unauthorized
Write-Host "Test 4: Missing JWT token (should be 401)" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID" `
      -Method GET `
      -ErrorAction Stop
    Write-Host "✗ FAIL - Expected 401, got 200" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ PASS - Status: 401 (Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "✗ FAIL - Expected 401, got: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Invalid JWT - 401 Unauthorized
Write-Host "Test 5: Invalid JWT token (should be 401)" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID" `
      -Method GET `
      -Headers @{
        "Authorization" = "Bearer invalid_token_xyz"
      } `
      -ErrorAction Stop
    Write-Host "✗ FAIL - Expected 401, got 200" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ PASS - Status: 401 (Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "✗ FAIL - Expected 401, got: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 6: Non-existent evidence - 404
Write-Host "Test 6: Non-existent evidence (should be 404)" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=00000000-0000-0000-0000-000000000000" `
      -Method GET `
      -Headers @{
        "Authorization" = "Bearer $TENANT1_JWT"
      } `
      -ErrorAction Stop
    Write-Host "✗ FAIL - Expected 404, got 200" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✓ PASS - Status: 404 (Not Found)" -ForegroundColor Green
    } else {
        Write-Host "✗ FAIL - Expected 404, got: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 7: POST with JSON
Write-Host "Test 7: POST request with JSON body" -ForegroundColor Yellow
$postBody = @{
    evidence_id = $EVIDENCE1_ID
    variant = "file"
} | ConvertTo-Json

try {
    $resp = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/view-evidence" `
      -Method POST `
      -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $TENANT1_JWT"
      } `
      -Body $postBody `
      -ErrorAction Stop
    Write-Host "✓ PASS - Status: 200" -ForegroundColor Green
}
catch {
    Write-Host "✗ FAIL - Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "`n================================" -ForegroundColor Blue
Write-Host "Test Summary" -ForegroundColor Blue
Write-Host "================================`n" -ForegroundColor Blue

Write-Host "Tenant 1 JWT: $($TENANT1_JWT.Substring(0, 20))..."
Write-Host "Admin JWT: $($TENANT2_JWT.Substring(0, 20))..."
Write-Host "Other JWT: $($TENANT3_JWT.Substring(0, 20))..."
Write-Host ""
Write-Host "Evidence 1 ID: $EVIDENCE1_ID (owner: $TENANT1_ID)"
Write-Host "Evidence 2 ID: $EVIDENCE2_ID (owner: $TENANT3_ID)"
Write-Host ""
Write-Host "Manual test commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "# Get file (tenant owner):"
Write-Host "curl -X GET 'http://localhost:54321/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID' \" 
Write-Host "  -H 'Authorization: Bearer $TENANT1_JWT'"
Write-Host ""
Write-Host "# Admin access:"
Write-Host "curl -X GET 'http://localhost:54321/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID' \"
Write-Host "  -H 'Authorization: Bearer $TENANT2_JWT'"
Write-Host ""
