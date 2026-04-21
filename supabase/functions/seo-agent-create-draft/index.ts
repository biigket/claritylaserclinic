import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-seo-agent-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface DraftPayload {
  title_th: string;
  title_en?: string;
  content_th: string;
  content_en?: string;
  excerpt_th?: string;
  excerpt_en?: string;
  slug?: string;
  tags?: string[];
  cover_image_url?: string;
  meta_title_th?: string;
  meta_title_en?: string;
  meta_description_th?: string;
  meta_description_en?: string;
  target_keyword?: string;
  target_intent?: string;
  answer_summary?: string;
  citations?: unknown[];
  schema_jsonld?: Record<string, unknown>;
  seo_score?: number;
  aeo_score?: number;
  geo_score?: number;
  safety_score?: number;
  visual_assets?: Array<{
    asset_url: string;
    alt_text?: string;
    caption?: string;
    role?: string;
    position?: number;
    metadata?: Record<string, unknown>;
  }>;
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : `seo-draft-${suffix}`;
}

function isValidScore(n: unknown): boolean {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth: shared API key for the SEO Agent MCP
  const expectedKey = Deno.env.get("SEO_AGENT_API_KEY");
  if (!expectedKey) {
    return new Response(
      JSON.stringify({ error: "SEO_AGENT_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const headerKey =
    req.headers.get("x-seo-agent-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!headerKey || headerKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: DraftPayload;
  try {
    payload = (await req.json()) as DraftPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Minimal validation
  if (
    !payload?.title_th ||
    typeof payload.title_th !== "string" ||
    !payload?.content_th ||
    typeof payload.content_th !== "string"
  ) {
    return new Response(
      JSON.stringify({
        error: "title_th and content_th are required strings",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  for (const k of ["seo_score", "aeo_score", "geo_score", "safety_score"] as const) {
    if (payload[k] !== undefined && !isValidScore(payload[k])) {
      return new Response(
        JSON.stringify({ error: `${k} must be a number between 0 and 100` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const slug = (payload.slug && payload.slug.trim()) || slugify(payload.title_th);

  // FORCE draft state regardless of incoming payload
  const insertRow = {
    slug,
    title_th: payload.title_th,
    title_en: payload.title_en ?? null,
    content_th: payload.content_th,
    content_en: payload.content_en ?? null,
    excerpt_th: payload.excerpt_th ?? null,
    excerpt_en: payload.excerpt_en ?? null,
    cover_image_url: payload.cover_image_url ?? null,
    meta_title_th: payload.meta_title_th ?? null,
    meta_title_en: payload.meta_title_en ?? null,
    meta_description_th: payload.meta_description_th ?? null,
    meta_description_en: payload.meta_description_en ?? null,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    target_keyword: payload.target_keyword ?? null,
    target_intent: payload.target_intent ?? null,
    answer_summary: payload.answer_summary ?? null,
    citations: Array.isArray(payload.citations) ? payload.citations : [],
    schema_jsonld: payload.schema_jsonld ?? null,
    seo_score: payload.seo_score ?? null,
    aeo_score: payload.aeo_score ?? null,
    geo_score: payload.geo_score ?? null,
    safety_score: payload.safety_score ?? null,
    // Hard-coded safety guarantees:
    status: "draft",
    workflow_status: "needs_review",
    source_system: "seo_agent_mcp",
    published_at: null,
    is_pinned: false,
  };

  const { data: article, error: insertError } = await supabase
    .from("blog_articles")
    .insert(insertRow)
    .select()
    .single();

  if (insertError || !article) {
    console.error("Insert failed:", insertError);
    return new Response(
      JSON.stringify({ error: "Failed to create draft", details: insertError?.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Optional: insert visual assets
  if (Array.isArray(payload.visual_assets) && payload.visual_assets.length > 0) {
    const assets = payload.visual_assets
      .filter((a) => a && typeof a.asset_url === "string")
      .map((a, idx) => ({
        article_id: article.id,
        asset_url: a.asset_url,
        alt_text: a.alt_text ?? null,
        caption: a.caption ?? null,
        role: a.role ?? "inline",
        position: typeof a.position === "number" ? a.position : idx,
        metadata: a.metadata ?? {},
      }));

    if (assets.length > 0) {
      const { error: assetErr } = await supabase
        .from("article_visual_assets")
        .insert(assets);
      if (assetErr) console.error("Visual asset insert failed:", assetErr);
    }
  }

  // Audit event
  await supabase.from("content_approval_events").insert({
    article_id: article.id,
    event_type: "draft_created",
    actor_label: "seo_agent_mcp",
    notes: "Draft created via SEO Agent MCP endpoint",
    snapshot: {
      seo_score: insertRow.seo_score,
      aeo_score: insertRow.aeo_score,
      geo_score: insertRow.geo_score,
      safety_score: insertRow.safety_score,
    },
  });

  return new Response(
    JSON.stringify({
      ok: true,
      article: {
        id: article.id,
        slug: article.slug,
        status: article.status,
        workflow_status: article.workflow_status,
        source_system: article.source_system,
      },
    }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});