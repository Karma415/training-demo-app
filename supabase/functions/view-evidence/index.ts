import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept, origin",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Disposition, Content-Type, Cache-Control",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

interface ViewEvidenceRequest {
  evidence_id: string;
  variant?: "file" | "thumbnail"; // defaults to "file"
}

interface EvidenceFileRecord {
  id: string;
  tenant_id: string;
  file_path: string;
  metadata: Record<string, unknown>;
}

interface TenantRecord {
  id: string;
  role?: string;
}

/**
 * Base64url encode bytes or text for JWT signing.
 */
function base64UrlEncode(input: string | ArrayBuffer): string {
  const bytes = typeof input === "string"
    ? new TextEncoder().encode(input)
    : new Uint8Array(input);

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/**
 * Convert a PEM private key to DER bytes for WebCrypto.
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/["\r\n]/g, "_") || "download";
}

/**
 * Extract Google Drive file ID from metadata or file_path
 */
function extractGoogleDriveFileId(
  metadata: Record<string, unknown>,
  filePath: string
): string | null {
  // Try metadata first
  const fileId = metadata.google_drive_file_id as string | undefined;
  if (fileId) return fileId;

  const legacyFileId = metadata.drive_file_id as string | undefined;
  if (legacyFileId) return legacyFileId;

  // Try to parse from file_path (Google Drive URLs contain the file ID)
  // Format: https://drive.google.com/file/d/{FILE_ID}/view
  // or: https://drive.google.com/open?id={FILE_ID}
  try {
    const idMatch = filePath.match(
      /(?:\/d\/|id=)([a-zA-Z0-9-_]+)/
    );
    return idMatch ? idMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Get Google access token using service account credentials
 */
async function getGoogleAccessToken(
  serviceAccountJson: string
): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiry

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp,
    iat: now,
  };

  // Encode header and payload with base64url, as required by JWT.
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;

  // Sign with private key using subtle crypto
  const keyData = serviceAccount.private_key;
  const algorithm = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };

  // Import the private key
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(keyData),
    algorithm,
    false,
    ["sign"]
  );

  // Sign the message
  const signature = await crypto.subtle.sign(
    algorithm,
    key,
    new TextEncoder().encode(message)
  );

  // Convert signature to base64url.
  const signatureB64 = base64UrlEncode(signature);

  const jwt = `${message}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(
      `Failed to get Google access token: ${tokenResponse.statusText}`
    );
  }

  const tokenData = await tokenResponse.json() as {access_token: string};
  return tokenData.access_token;
}

/**
 * Fetch file metadata from Google Drive
 */
async function getGoogleDriveFileMetadata(
  fileId: string,
  accessToken: string
) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true&fields=mimeType,thumbnailLink,name`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Google Drive metadata: ${response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Fetch file from Google Drive
 */
async function downloadGoogleDriveFile(
  fileId: string,
  accessToken: string
): Promise<ArrayBuffer> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true&alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to download from Google Drive: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

/**
 * Fetch thumbnail from Google Drive
 */
async function downloadGoogleDriveThumbnail(
  thumbnailUrl: string,
  accessToken: string
): Promise<ArrayBuffer> {
  const response = await fetch(thumbnailUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download thumbnail: ${response.statusText}`
    );
  }

  return await response.arrayBuffer();
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  // Only allow GET and POST
  if (!["GET", "POST"].includes(req.method)) {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Parse evidence_id and variant from request
    let evidenceId: string | null = null;
    let variant: "file" | "thumbnail" = "file";

    if (req.method === "GET") {
      const url = new URL(req.url);
      evidenceId = url.searchParams.get("evidence_id");
      const variantParam = url.searchParams.get("variant");
      if (variantParam === "thumbnail") {
        variant = "thumbnail";
      }
    } else {
      // POST
      try {
        const body = (await req.json()) as ViewEvidenceRequest;
        evidenceId = body.evidence_id;
        if (body.variant === "thumbnail") {
          variant = "thumbnail";
        }
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (!evidenceId) {
      return new Response(
        JSON.stringify({ error: "Missing evidence_id parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify user is authenticated via JWT
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Invalid JWT token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Query evidence_files
    const { data: evidenceFile, error: fileError } = await supabase
      .from("evidence_files")
      .select("*")
      .eq("id", evidenceId)
      .single() as {
        data: EvidenceFileRecord | null;
        error: unknown;
      };

    if (fileError || !evidenceFile) {
      console.error("Evidence file not found:", fileError);
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check authorization
    const tenantId = evidenceFile.tenant_id;
    const userId = user.id;

    let isAuthorized = false;

    // Check if user is the tenant owner
    if (tenantId === userId) {
      isAuthorized = true;
    } else {
      // Check if user has admin/superadmin/legal_counsel role
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .select("role")
        .eq("id", userId)
        .single() as {
          data: TenantRecord | null;
          error: unknown;
        };

      if (!tenantError && tenant) {
        const role = tenant.role?.toLowerCase() || "";
        if (
          role === "admin" ||
          role === "superadmin" ||
          role === "legal_counsel"
        ) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      console.error(
        `Authorization failed for user ${userId} accessing evidence ${evidenceId}`
      );
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Google credentials
    const googleServiceAccountJson = Deno.env.get(
      "GOOGLE_SERVICE_ACCOUNT_JSON"
    );
    if (!googleServiceAccountJson) {
      console.error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract or parse Google Drive file ID
    const metadata = (evidenceFile.metadata || {}) as Record<string, unknown>;
    const googleFileId = extractGoogleDriveFileId(metadata, evidenceFile.file_path);

    if (!googleFileId) {
      console.error("Could not extract Google Drive file ID");
      return new Response(
        JSON.stringify({ error: "Invalid evidence file reference" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Google access token
    let accessToken: string;
    try {
      accessToken = await getGoogleAccessToken(googleServiceAccountJson);
    } catch (error) {
      console.error("Failed to get Google access token:", error);
      return new Response(
        JSON.stringify({ error: "Failed to access file" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle thumbnail variant
    if (variant === "thumbnail") {
      // Fetch Drive metadata to get thumbnailLink
      let driveMetadata;
      try {
        driveMetadata = await getGoogleDriveFileMetadata(
          googleFileId,
          accessToken
        );
      } catch (error) {
        console.error("Failed to fetch Drive metadata:", error);
        return new Response(
          JSON.stringify({ error: "Thumbnail not available" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!driveMetadata.thumbnailLink) {
        console.error("No thumbnail available for file");
        return new Response(
          JSON.stringify({ error: "Thumbnail not available" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Download and return thumbnail
      try {
        const thumbnailData = await downloadGoogleDriveThumbnail(
          driveMetadata.thumbnailLink,
          accessToken
        );

        return new Response(thumbnailData, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "image/jpeg",
            "Cache-Control": "max-age=86400", // Cache for 24 hours
          },
        });
      } catch (error) {
        console.error("Failed to download thumbnail:", error);
        return new Response(
          JSON.stringify({ error: "Failed to download thumbnail" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Handle file variant (default)
    try {
      // Fetch file from Google Drive
      const fileData = await downloadGoogleDriveFile(
        googleFileId,
        accessToken
      );

      // Get metadata for content-type and filename
      let driveMetadata;
      try {
        driveMetadata = await getGoogleDriveFileMetadata(
          googleFileId,
          accessToken
        );
      } catch {
        driveMetadata = null;
      }

      // Determine content type
      let contentType =
        (metadata.file_mime_type as string) ||
        driveMetadata?.mimeType ||
        "application/octet-stream";

      // Determine filename
      const filename =
        sanitizeFilename((metadata.filename as string) || driveMetadata?.name || "download");

      return new Response(fileData, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "max-age=3600", // Cache for 1 hour
        },
      });
    } catch (error) {
      console.error("Failed to download file:", error);
      return new Response(
        JSON.stringify({ error: "Failed to download file" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Unexpected error in view-evidence function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
