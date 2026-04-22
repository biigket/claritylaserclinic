import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-seo-agent-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_TYPES = new Set(["image/png", "image/webp"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_BUCKETS = new Set(["article-visuals"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizePath(path: string): string | null {
  if (typeof path !== "string" || path.length === 0 || path.length > 512) return null;
  // No leading slash, no traversal, no backslashes, printable only
  if (path.startsWith("/") || path.includes("..") || path.includes("\\")) return null;
  if (!/^[A-Za-z0-9._\-/]+$/.test(path)) return null;
  return path;
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    // --- Auth ---
    const expectedKey = Deno.env.get("SEO_AGENT_API_KEY");
    if (!expectedKey) {
      console.error("SEO_AGENT_API_KEY not configured");
      return json({ error: "Server not configured" }, 500);
    }
    const providedKey = req.headers.get("x-seo-agent-key");
    if (!providedKey || providedKey !== expectedKey) {
      return json({ error: "Unauthorized" }, 401);
    }

    // --- Parse payload (multipart or JSON) ---
    let bucket = "";
    let path = "";
    let contentType = "";
    let bytes: Uint8Array | null = null;

    const reqContentType = req.headers.get("content-type") || "";

    if (reqContentType.includes("multipart/form-data")) {
      const form = await req.formData();
      bucket = String(form.get("bucket") || "");
      path = String(form.get("path") || "");
      contentType = String(form.get("content_type") || "");
      const file = form.get("file");
      if (file instanceof File) {
        if (!contentType) contentType = file.type;
        const buf = await file.arrayBuffer();
        bytes = new Uint8Array(buf);
      } else {
        const b64 = form.get("file_base64");
        if (typeof b64 === "string" && b64.length > 0) {
          bytes = base64ToBytes(b64);
        }
      }
    } else {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return json({ error: "Invalid JSON body" }, 400);
      }
      bucket = String(body.bucket || "");
      path = String(body.path || "");
      contentType = String(body.content_type || "");
      const b64 = body.file_base64;
      if (typeof b64 !== "string" || b64.length === 0) {
        return json({ error: "file_base64 is required" }, 400);
      }
      try {
        bytes = base64ToBytes(b64);
      } catch {
        return json({ error: "Invalid base64 payload" }, 400);
      }
    }

    // --- Validate ---
    if (!ALLOWED_BUCKETS.has(bucket)) {
      return json({ error: `Bucket not allowed. Allowed: ${[...ALLOWED_BUCKETS].join(", ")}` }, 400);
    }
    const safePath = sanitizePath(path);
    if (!safePath) {
      return json({ error: "Invalid path. Use [A-Za-z0-9._-/], no leading slash, no '..'" }, 400);
    }
    if (!ALLOWED_TYPES.has(contentType)) {
      return json({ error: `Unsupported content_type. Allowed: ${[...ALLOWED_TYPES].join(", ")}` }, 400);
    }
    if (!bytes || bytes.length === 0) {
      return json({ error: "Empty file payload" }, 400);
    }
    if (bytes.length > MAX_FILE_BYTES) {
      return json({ error: `File too large. Max ${MAX_FILE_BYTES} bytes` }, 413);
    }

    // --- Magic-bytes sanity check (defense-in-depth) ---
    const head = bytes.slice(0, 12);
    const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    const isWebp =
      head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
      head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
    if (contentType === "image/png" && !isPng) {
      return json({ error: "File header does not match image/png" }, 400);
    }
    if (contentType === "image/webp" && !isWebp) {
      return json({ error: "File header does not match image/webp" }, 400);
    }

    // --- Upload ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      console.error("Supabase env vars missing");
      return json({ error: "Server not configured" }, 500);
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(safePath, new Blob([bytes], { type: contentType }), {
        contentType,
        upsert: true,
      });

    if (upErr) {
      console.error("Upload error:", upErr.message);
      // Temporary debug details (no secrets) to diagnose storage failures
      return json(
        {
          error: "Upload failed",
          debug: {
            message: upErr.message,
            bucket,
            safePath,
            contentType,
            bytesLength: bytes.length,
          },
        },
        500,
      );
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(safePath);

    return json({
      ok: true,
      bucket,
      path: safePath,
      public_url: urlData.publicUrl,
    });
  } catch (e) {
    console.error("seo-agent-upload-visual error:", e instanceof Error ? e.message : e);
    return json({ error: "Internal error" }, 500);
  }
});