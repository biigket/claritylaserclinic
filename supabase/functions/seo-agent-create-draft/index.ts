import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-seo-agent-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type DraftPayload = {
  slug?: string;
  title_th: string;
  title_en?: string | null;
  content_th: string;
  content_en?: string | null;
  excerpt_th?: string | null;
  excerpt_en?: string | null;
  cover_image_url?: string | null;
  tags?: string[] | null;
  meta_title_th?: string | null;
  meta_title_en?: string | null;
  meta_description_th?: string | null;
  meta_description_en?: string | null;
  seo_score?: number | null;
  aeo_score?: number | null;
  geo_score?: number | null;
  safety_score?: number | null;
  score_issues_json?: unknown;
  score_recommendations_json?: unknown;
  faq_json?: unknown;
  schema_json?: unknown;
  internal_links_json?: unknown;
  visual_assets_json?: unknown;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\u0e01-\u0e59]+/gu, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const cleanTags = (tags: unknown) => {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
};

const cleanScore = (value: unknown) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const getAgentKey = (req: Request) => {
  const agentKey = req.headers.get("x-seo-agent-key");
  if (agentKey) return agentKey;

  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const expectedKey = Deno.env.get("SEO_AGENT_API_KEY");
    if (!expectedKey) throw new Error("SEO_AGENT_API_KEY is not configured");

    const providedKey = getAgentKey(req);
    if (!providedKey || providedKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as DraftPayload;
    if (!isRecord(payload)) throw new Error("Invalid JSON payload");
    if (!payload.title_th?.trim()) throw new Error("title_th is required");
    if (!payload.content_th?.trim()) throw new Error("content_th is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const baseSlug = slugify(payload.slug || payload.title_en || payload.title_th);
    const slug = `${baseSlug || "seo-agent-draft"}-${Date.now().toString(36)}`;

    const articlePayload = {
      slug,
      status: "draft",
      workflow_status: "needs_review",
      source_system: "seo_agent_mcp",
      title_th: payload.title_th.trim(),
      title_en: payload.title_en || null,
      content_th: payload.content_th,
      content_en: payload.content_en || null,
      excerpt_th: payload.excerpt_th || null,
      excerpt_en: payload.excerpt_en || null,
      cover_image_url: payload.cover_image_url || null,
      tags: cleanTags(payload.tags),
      meta_title_th: payload.meta_title_th || null,
      meta_title_en: payload.meta_title_en || null,
      meta_description_th: payload.meta_description_th || null,
      meta_description_en: payload.meta_description_en || null,
      published_at: null,
      seo_score: cleanScore(payload.seo_score),
      aeo_score: cleanScore(payload.aeo_score),
      geo_score: cleanScore(payload.geo_score),
      safety_score: cleanScore(payload.safety_score),
      score_issues_json: payload.score_issues_json ?? null,
      score_recommendations_json: payload.score_recommendations_json ?? null,
      faq_json: payload.faq_json ?? null,
      schema_json: payload.schema_json ?? null,
      internal_links_json: payload.internal_links_json ?? null,
      visual_assets_json: payload.visual_assets_json ?? null,
    };

    const { data, error } = await supabase
      .from("blog_articles")
      .insert(articlePayload)
      .select("id, slug, status, workflow_status")
      .single();

    if (error) throw error;

    await supabase.from("content_approval_events").insert({
      article_id: data.id,
      approval_type: "agent_draft_created",
      status: "needs_review",
      notes: "Draft created by SEO Agent/MCP endpoint.",
      user_id: null,
    });

    return new Response(JSON.stringify({ article: data }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seo-agent-create-draft error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
