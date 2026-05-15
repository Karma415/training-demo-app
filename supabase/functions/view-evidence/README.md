# view-evidence Edge Function

Server-side function for retrieving evidence files from Google Drive with proper permission checks and authentication.

## Purpose

Allows authenticated portal users to view evidence files (photos, documents, receipts) without needing direct Google Drive login. Handles file downloads and thumbnail generation.

## Endpoint

```
GET /functions/v1/view-evidence?evidence_id=<uuid>&variant=file
POST /functions/v1/view-evidence
```

## Request Methods

### GET with Query Parameters

```bash
GET /functions/v1/view-evidence?evidence_id=<uuid>&variant=file
Authorization: Bearer <JWT_TOKEN>
```

### POST with JSON Body

```bash
POST /functions/v1/view-evidence
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "evidence_id": "<uuid>",
  "variant": "file"  // or "thumbnail" (defaults to "file")
}
```

## Parameters

- **evidence_id** (required): UUID of the evidence file to retrieve
- **variant** (optional): 
  - `"file"` (default) - Returns the actual file
  - `"thumbnail"` - Returns a thumbnail preview

## Authentication

Requires a valid Supabase JWT in the `Authorization: Bearer <token>` header.

### Authorization Rules

Access is granted if:
1. **Tenant Owner**: The authenticated user's ID matches `evidence_files.tenant_id`, OR
2. **Privileged Role**: The user's row in `tenants` table has `role` in:
   - `admin`
   - `superadmin`
   - `legal_counsel`

## Response

### For File Variant

Raw file bytes with appropriate headers:

```http
HTTP/1.1 200 OK
Content-Type: image/jpeg
Content-Disposition: inline; filename="property-damage.jpg"
Cache-Control: max-age=3600
```

### For Thumbnail Variant

JPEG image bytes:

```http
HTTP/1.1 200 OK
Content-Type: image/jpeg
Cache-Control: max-age=86400
```

### Error Responses

- **400 Bad Request**: Missing `evidence_id` or invalid JSON
  ```json
  { "error": "Missing evidence_id parameter" }
  ```

- **401 Unauthorized**: Missing or invalid JWT
  ```json
  { "error": "Unauthorized" }
  ```

- **403 Forbidden**: User lacks permission to access this evidence
  ```json
  { "error": "Forbidden" }
  ```

- **404 Not Found**: Evidence file does not exist OR thumbnail unavailable
  ```json
  { "error": "Not found" }
  ```

- **500 Internal Server Error**: Server or service failure
  ```json
  { "error": "Failed to access file" }
  ```

## Environment Variables Required

```bash
# Supabase configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Google API credentials (JSON string of entire service account)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n..."}
```

## Google Drive Authentication Flow

1. Function uses service account credentials to generate JWT
2. JWT is exchanged for Google OAuth access token via `https://oauth2.googleapis.com/token`
3. Access token is used to fetch file or thumbnail from Google Drive API
4. Service account must have `drive.readonly` scope

## Local Testing

### 1. Set Environment Variables

Add to `.env.local` in the supabase directory:

```bash
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-sa@your-project.iam.gserviceaccount.com",...}'
```

### 2. Start Supabase

```bash
supabase start
```

### 3. Get a Test JWT Token

```bash
# Sign up or sign in to get a token, or use the anon key if testing in dev
ANON_KEY=$(grep "anon" ~/.config/supabase/local-env-*.json | grep -oP '"anon_key",\s*"K[^"]*' | sed 's/.*"\K//' | head -1)
```

### 4. Test Cases

#### Test 1: Tenant Owner - Download File

```bash
curl -X GET \
  "http://localhost:54321/functions/v1/view-evidence?evidence_id=EVIDENCE_UUID&variant=file" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o evidence_file.jpg
```

#### Test 2: Tenant Owner - Get Thumbnail

```bash
curl -X GET \
  "http://localhost:54321/functions/v1/view-evidence?evidence_id=EVIDENCE_UUID&variant=thumbnail" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o thumbnail.jpg
```

#### Test 3: Admin User Access

```bash
# First ensure the user has admin role in tenants table
curl -X GET \
  "http://localhost:54321/functions/v1/view-evidence?evidence_id=EVIDENCE_UUID" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### Test 4: Legal Counsel Access

```bash
# First ensure the user has legal_counsel role in tenants table
curl -X GET \
  "http://localhost:54321/functions/v1/view-evidence?evidence_id=EVIDENCE_UUID" \
  -H "Authorization: Bearer LEGAL_COUNSEL_JWT_TOKEN"
```

#### Test 5: Unrelated Tenant - Forbidden

```bash
# Try to access evidence belonging to a different tenant
curl -X GET \
  "http://localhost:54321/functions/v1/view-evidence?evidence_id=OTHER_TENANT_EVIDENCE_UUID" \
  -H "Authorization: Bearer DIFFERENT_TENANT_JWT_TOKEN"
# Expected: 403 Forbidden
```

#### Test 6: Logged Out - Unauthorized

```bash
curl -X GET \
  "http://localhost:54321/functions/v1/view-evidence?evidence_id=EVIDENCE_UUID" \
  -H "Authorization: Bearer INVALID_TOKEN"
# Expected: 401 Unauthorized
```

#### Test 7: POST with JSON Body

```bash
curl -X POST \
  "http://localhost:54321/functions/v1/view-evidence" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "evidence_id": "EVIDENCE_UUID",
    "variant": "thumbnail"
  }'
```

## Implementation Details

### File ID Extraction

The function attempts to extract the Google Drive file ID from:
1. `metadata.google_drive_file_id` (primary source)
2. Parse from `file_path` URL (fallback)

### Thumbnail Handling

- For thumbnails, the function fetches the `thumbnailLink` from Google Drive metadata
- Returns 404 if no thumbnail is available
- Caches thumbnails for 24 hours client-side
- Never exposes private Google Drive thumbnail URLs to browser

### File Downloads

- Returns raw file bytes with appropriate `Content-Type`
- Prefers `metadata.file_mime_type` if stored
- Falls back to fetching MIME type from Google Drive metadata
- Sets `Content-Disposition: inline` for browser preview
- Caches files for 1 hour client-side

### Security

- All secrets (Google credentials) remain server-side
- JWT validation required
- Row-level authorization checks before file access
- No credentials exposed in response bodies or logs

## CORS Support

Function supports CORS requests with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`

## Known Limitations

- Thumbnail only available if Google Drive file has a thumbnail
- Large files may take time to download
- Access tokens expire after 1 hour (new token generated per request)

