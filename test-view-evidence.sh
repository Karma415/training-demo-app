#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_ANON_KEY="<your_anon_key_here>"
SUPABASE_SERVICE_ROLE_KEY="<your_service_role_key_here>"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}View-Evidence Function Test${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Step 1: Create test tenants
echo -e "${YELLOW}Creating test tenants...${NC}"

# Tenant 1: Regular user (owner of evidence)
TENANT1_EMAIL="tenant1@example.com"
TENANT1_PASSWORD="TestPassword123!"

AUTH_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d "{
    \"email\": \"$TENANT1_EMAIL\",
    \"password\": \"$TENANT1_PASSWORD\"
  }")

TENANT1_ID=$(echo $AUTH_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
TENANT1_JWT=$(echo $AUTH_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo -e "${GREEN}✓ Tenant 1 created${NC}"
echo "  ID: $TENANT1_ID"
echo "  Email: $TENANT1_EMAIL"
echo ""

# Tenant 2: Admin user
TENANT2_EMAIL="admin@example.com"
TENANT2_PASSWORD="AdminPassword123!"

AUTH_RESPONSE2=$(curl -s -X POST "$SUPABASE_URL/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d "{
    \"email\": \"$TENANT2_EMAIL\",
    \"password\": \"$TENANT2_PASSWORD\"
  }")

TENANT2_ID=$(echo $AUTH_RESPONSE2 | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
TENANT2_JWT=$(echo $AUTH_RESPONSE2 | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo -e "${GREEN}✓ Admin user created${NC}"
echo "  ID: $TENANT2_ID"
echo "  Email: $TENANT2_EMAIL"
echo ""

# Tenant 3: Unrelated tenant
TENANT3_EMAIL="other@example.com"
TENANT3_PASSWORD="OtherPassword123!"

AUTH_RESPONSE3=$(curl -s -X POST "$SUPABASE_URL/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d "{
    \"email\": \"$TENANT3_EMAIL\",
    \"password\": \"$TENANT3_PASSWORD\"
  }")

TENANT3_ID=$(echo $AUTH_RESPONSE3 | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
TENANT3_JWT=$(echo $AUTH_RESPONSE3 | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo -e "${GREEN}✓ Unrelated tenant created${NC}"
echo "  ID: $TENANT3_ID"
echo "  Email: $TENANT3_EMAIL"
echo ""

# Step 2: Insert tenant records to set roles
echo -e "${YELLOW}Setting up tenant roles...${NC}"

# Tenant 1: tenant role
curl -s -X POST "$SUPABASE_URL/rest/v1/tenants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TENANT1_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d "{
    \"id\": \"$TENANT1_ID\",
    \"name\": \"Tenant One\",
    \"email\": \"$TENANT1_EMAIL\",
    \"role\": \"tenant\"
  }" > /dev/null

echo -e "${GREEN}✓ Tenant 1 role set to 'tenant'${NC}"

# Tenant 2: admin role
curl -s -X POST "$SUPABASE_URL/rest/v1/tenants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TENANT2_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d "{
    \"id\": \"$TENANT2_ID\",
    \"name\": \"Admin User\",
    \"email\": \"$TENANT2_EMAIL\",
    \"role\": \"admin\"
  }" > /dev/null

echo -e "${GREEN}✓ Tenant 2 role set to 'admin'${NC}"

# Tenant 3: tenant role
curl -s -X POST "$SUPABASE_URL/rest/v1/tenants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TENANT3_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d "{
    \"id\": \"$TENANT3_ID\",
    \"name\": \"Other Tenant\",
    \"email\": \"$TENANT3_EMAIL\",
    \"role\": \"tenant\"
  }" > /dev/null

echo -e "${GREEN}✓ Tenant 3 role set to 'tenant'${NC}"
echo ""

# Step 3: Create test evidence files
echo -e "${YELLOW}Creating test evidence files...${NC}"

# Mock Google Drive file ID for testing
GOOGLE_FILE_ID_1="1mock_google_file_id_for_test_001"
GOOGLE_FILE_ID_2="1mock_google_file_id_for_test_002"

# Evidence for Tenant 1
EVIDENCE1_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/evidence_files" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d "{
    \"tenant_id\": \"$TENANT1_ID\",
    \"issue_id\": null,
    \"file_path\": \"https://drive.google.com/file/d/$GOOGLE_FILE_ID_1/view\",
    \"metadata\": {
      \"google_drive_file_id\": \"$GOOGLE_FILE_ID_1\",
      \"filename\": \"property-damage.jpg\",
      \"file_mime_type\": \"image/jpeg\",
      \"thumbnail_url\": \"https://example.com/thumb.jpg\",
      \"record_type\": \"photograph\",
      \"description\": \"Water damage in bedroom\"
    }
  }")

EVIDENCE1_ID=$(echo $EVIDENCE1_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ Evidence 1 created (Tenant 1)${NC}"
echo "  ID: $EVIDENCE1_ID"
echo ""

# Evidence for Tenant 3
EVIDENCE2_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/evidence_files" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d "{
    \"tenant_id\": \"$TENANT3_ID\",
    \"issue_id\": null,
    \"file_path\": \"https://drive.google.com/file/d/$GOOGLE_FILE_ID_2/view\",
    \"metadata\": {
      \"google_drive_file_id\": \"$GOOGLE_FILE_ID_2\",
      \"filename\": \"receipt.pdf\",
      \"file_mime_type\": \"application/pdf\",
      \"record_type\": \"document\",
      \"description\": \"Repair receipt\"
    }
  }")

EVIDENCE2_ID=$(echo $EVIDENCE2_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ Evidence 2 created (Tenant 3)${NC}"
echo "  ID: $EVIDENCE2_ID"
echo ""

# Step 4: Run tests
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Running Tests${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Test 1: Tenant owner - success
echo -e "${YELLOW}Test 1: Tenant owner accessing own evidence${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID" \
  -H "Authorization: Bearer $TENANT1_JWT")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ PASS - Status: $HTTP_CODE${NC}"
else
  echo -e "${RED}✗ FAIL - Status: $HTTP_CODE${NC}"
  echo "Response: $BODY"
fi
echo ""

# Test 2: Admin user access
echo -e "${YELLOW}Test 2: Admin user accessing any evidence${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID" \
  -H "Authorization: Bearer $TENANT2_JWT")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ PASS - Status: $HTTP_CODE${NC}"
else
  echo -e "${RED}✗ FAIL - Status: $HTTP_CODE${NC}"
fi
echo ""

# Test 3: Unrelated tenant - forbidden
echo -e "${YELLOW}Test 3: Unrelated tenant accessing other's evidence (should be 403)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID" \
  -H "Authorization: Bearer $TENANT3_JWT")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "403" ]; then
  echo -e "${GREEN}✓ PASS - Status: $HTTP_CODE (Forbidden)${NC}"
else
  echo -e "${RED}✗ FAIL - Expected 403, got: $HTTP_CODE${NC}"
fi
echo ""

# Test 4: Missing JWT - unauthorized
echo -e "${YELLOW}Test 4: Missing JWT token (should be 401)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✓ PASS - Status: $HTTP_CODE (Unauthorized)${NC}"
else
  echo -e "${RED}✗ FAIL - Expected 401, got: $HTTP_CODE${NC}"
fi
echo ""

# Test 5: Invalid JWT - unauthorized
echo -e "${YELLOW}Test 5: Invalid JWT token (should be 401)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID" \
  -H "Authorization: Bearer invalid_token_xyz")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✓ PASS - Status: $HTTP_CODE (Unauthorized)${NC}"
else
  echo -e "${RED}✗ FAIL - Expected 401, got: $HTTP_CODE${NC}"
fi
echo ""

# Test 6: Non-existent evidence - 404
echo -e "${YELLOW}Test 6: Non-existent evidence (should be 404)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TENANT1_JWT")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "404" ]; then
  echo -e "${GREEN}✓ PASS - Status: $HTTP_CODE (Not Found)${NC}"
else
  echo -e "${RED}✗ FAIL - Expected 404, got: $HTTP_CODE${NC}"
fi
echo ""

# Test 7: POST with JSON body
echo -e "${YELLOW}Test 7: POST request with JSON body${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$SUPABASE_URL/functions/v1/view-evidence" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TENANT1_JWT" \
  -d "{\"evidence_id\": \"$EVIDENCE1_ID\", \"variant\": \"file\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ PASS - Status: $HTTP_CODE${NC}"
else
  echo -e "${RED}✗ FAIL - Status: $HTTP_CODE${NC}"
fi
echo ""

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "Tenant 1 JWT: $TENANT1_JWT"
echo "Admin JWT: $TENANT2_JWT"
echo "Other JWT: $TENANT3_JWT"
echo ""
echo "Evidence 1 ID: $EVIDENCE1_ID (owner: $TENANT1_ID)"
echo "Evidence 2 ID: $EVIDENCE2_ID (owner: $TENANT3_ID)"
echo ""
echo -e "${YELLOW}Manual test commands:${NC}"
echo ""
echo "# Get file (tenant owner):"
echo "curl -X GET 'http://localhost:54321/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID' \\"
echo "  -H 'Authorization: Bearer $TENANT1_JWT'"
echo ""
echo "# Get thumbnail:"
echo "curl -X GET 'http://localhost:54321/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID&variant=thumbnail' \\"
echo "  -H 'Authorization: Bearer $TENANT1_JWT'"
echo ""
echo "# Admin access:"
echo "curl -X GET 'http://localhost:54321/functions/v1/view-evidence?evidence_id=$EVIDENCE1_ID' \\"
echo "  -H 'Authorization: Bearer $TENANT2_JWT'"
echo ""
