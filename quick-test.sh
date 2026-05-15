#!/usr/bin/env bash
# Quick test for view-evidence function

SUPABASE_URL="http://127.0.0.1:54321"

echo "Test 1: Missing evidence_id parameter (should be 400)"
curl -s -w "\nStatus: %{http_code}\n" -X GET \
  "$SUPABASE_URL/functions/v1/view-evidence" \
  -H "Authorization: Bearer test_token"

echo -e "\nTest 2: Missing JWT token (should be 401)"
curl -s -w "\nStatus: %{http_code}\n" -X GET \
  "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=test-id"

echo -e "\nTest 3: Invalid JWT token (should be 401)"
curl -s -w "\nStatus: %{http_code}\n" -X GET \
  "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=test-id" \
  -H "Authorization: Bearer invalid_token_xyz"

echo -e "\nTest 4: Non-existent evidence (should be 404)"
curl -s -w "\nStatus: %{http_code}\n" -X GET \
  "$SUPABASE_URL/functions/v1/view-evidence?evidence_id=00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYWluaW5nLWRlbW8tYXBwIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJpYXQiOjE1ODAzMjQyNTAsImV4cCI6MTEzMjk2MDI1MCwidXNlcl9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImVtYWlsIjoicHJvbmtAZXhhbXBsZS5jb20iLCJwaG9uZSI6IiJ9.V2xqTt3pLBvuVLB_8iYqF-2UT4kqd3bQdg5bYvDqkNo"

echo -e "\nAll basic tests completed!"
