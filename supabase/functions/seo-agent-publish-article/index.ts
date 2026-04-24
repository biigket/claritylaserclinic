import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-seo-agent-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface VisualAssetInput {
  asset_url: string;
  alt_text?: string | null;
  caption?: string | null;
  role?: string;
  position?: number;
  metadata?: Record<string, unknown>;
}

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
  schema_jsonld?: Record<string, unknown> | null;
  seo_score?: number;
  aeo_score?: number;
  geo_score?: number;
  safety_score?: number;
  score_issues_json?: unknown;
  score_recommendations_json?: unknown;
  internal_links_json?: unknown;
  visual_assets?: VisualAssetInput[];
}

interface RequestBody {
  article_id?: string;
  draft?: DraftPayload;
}

interface CheckResult {
  key: string;
  label: string;
  status: "pass" | "fail";
  details?: string;
}

const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\([^)]+\)/;

function hasMarkdownImage(content: string | null | undefined): boolean {
  if (!content || typeof content !== "string") return false;
  return MARKDOWN_IMAGE_RE.test(content);
}

function nonEmptyString(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
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

function hasNonEmptyJsonArrayOrObject(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as Record<string, unknown>).length > 0;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed || trimmed === "[]" || trimmed === "{}" || trimmed === "null") return false;
    try {
      const parsed = JSON.parse(trimmed);
      return hasNonEmptyJsonArrayOrObject(parsed);
    } catch {
      return true;
    }
  }
  return false;
}

function isNonEmptyObjectOrArray(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") {
    return Object.keys(v as Record<string, unknown>).length > 0;
  }
  return false;
}

/**
 * Run all publish gates against an article record + its visual assets.
 * Returns failing checks. Empty array = ready to publish.
 */
function runPublishChecks(
  article: Record<string, any>,
  visuals: Array<Record<string, any>>,
): CheckResult[] {
  const failures: CheckResult[] = [];

  // Bilingual content completeness
  const requiredBilingual: Array<[string, string]> = [
    ["title_th", "Thai title"],
    ["title_en", "English title"],
    ["content_th", "Thai content"],
    ["content_en", "English content"],
    ["excerpt_th", "Thai excerpt"],
    ["excerpt_en", "English excerpt"],
    ["meta_title_th", "Thai meta title"],
    ["meta_title_en", "English meta title"],
    ["meta_description_th", "Thai meta description"],
    ["meta_description_en", "English meta description"],
  ];
  for (const [key, label] of requiredBilingual) {
    if (!nonEmptyString(article[key])) {
      failures.push({
        key,
        label,
        status: "fail",
        details: `${key} is empty`,
      });
    }
  }

  // Cover image required
  if (!nonEmptyString(article.cover_image_url)) {
    failures.push({
      key: "cover_image_url",
      label: "Cover image",
      status: "fail",
      details: "cover_image_url is required",
    });
  }

  // Visuals: at least one
  if (!Array.isArray(visuals) || visuals.length === 0) {
    failures.push({
      key: "visual_assets",
      label: "Visual assets",
      status: "fail",
      details: "At least one visual asset is required",
    });
  }

  // Markdown image embeds in both languages
  if (!hasMarkdownImage(article.content_th)) {
    failures.push({
      key: "content_th_images",
      label: "Embedded images in Thai content",
      status: "fail",
      details: "content_th must include at least one Markdown image",
    });
  }
  if (!hasMarkdownImage(article.content_en)) {
    failures.push({
      key: "content_en_images",
      label: "Embedded images in English content",
      status: "fail",
      details: "content_en must include at least one Markdown image",
    });
  }

  // Bilingual visual metadata completeness
  if (Array.isArray(visuals) && visuals.length > 0) {
    for (const v of visuals) {
      const metadata = (v.metadata ?? {}) as Record<string, unknown>;
      const missing: string[] = [];
      if (!nonEmptyString(v.alt_text)) missing.push("alt_text");
      if (!nonEmptyString(v.caption)) missing.push("caption");
      if (!nonEmptyString(metadata.alt_text_en)) missing.push("metadata.alt_text_en");
      if (!nonEmptyString(metadata.caption_en)) missing.push("metadata.caption_en");
      if (missing.length > 0) {
        failures.push({
          key: `visual_metadata:${v.id ?? v.asset_url ?? "unknown"}`,
          label: "Bilingual visual metadata",
          status: "fail",
          details: `Visual missing: ${missing.join(", ")}`,
        });
      }
    }
  }

  // schema_jsonld must exist (non-empty object OR non-empty array)
  if (!isNonEmptyObjectOrArray(article.schema_jsonld)) {
    failures.push({
      key: "schema_jsonld",
      label: "Structured data (schema_jsonld)",
      status: "fail",
      details:
        "schema_jsonld is required and must be a non-empty object or array",
    });
  }

  // Safety score >= 80
  const safety = article.safety_score;
  if (typeof safety !== "number" || !Number.isFinite(safety) || safety < 80) {
    failures.push({
      key: "safety_score",
      label: "Safety score",
      status: "fail",
      details: `safety_score must be >= 80 (got ${safety ?? "null"})`,
    });
  }

  // score_issues_json must be empty
  if (hasNonEmptyJsonArrayOrObject(article.score_issues_json)) {
    failures.push({
      key: "score_issues_json",
      label: "Outstanding score issues",
      status: "fail",
      details: "score_issues_json must be empty before publish",
    });
  }

  return failures;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // --- Auth ---
  const expectedKey = Deno.env.get("SEO_AGENT_API_KEY");
  if (!expectedKey) {
    return json({ error: "SEO_AGENT_API_KEY not configured" }, 500);
  }
  const headerKey =
    req.headers.get("x-seo-agent-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!headerKey || headerKey !== expectedKey) {
    return json({ error: "Unauthorized" }, 401);
  }

  // --- Body ---
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const hasArticleId = nonEmptyString(body?.article_id);
  const hasDraft = body?.draft && typeof body.draft === "object";
  if (hasArticleId === !!hasDraft) {
    return json(
      {
        error: "Invalid request",
        details: "Provide exactly one of article_id or draft",
      },
      400,
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ===========================================================
  // Branch 1: publish existing article by id
  // ===========================================================
  if (hasArticleId) {
    const articleId = body.article_id!.trim();

    const { data: article, error: loadErr } = await supabase
      .from("blog_articles")
      .select("*")
      .eq("id", articleId)
      .maybeSingle();

    if (loadErr) {
      console.error("Load article failed:", loadErr);
      return json(
        { error: "Failed to load article", details: loadErr.message },
        500,
      );
    }
    if (!article) {
      return json({ error: "Article not found" }, 404);
    }

    // Idempotent: if already published, return current state BEFORE running gates.
    // This prevents already-live articles from being blocked by newer/stricter checks.
    if (article.status === "published") {
      return json(
        {
          ok: true,
          article: {
            id: article.id,
            slug: article.slug,
            status: article.status,
            workflow_status: article.workflow_status,
            published_at: article.published_at,
          },
        },
        200,
      );
    }

    const { data: visuals, error: visualErr } = await supabase
      .from("article_visual_assets")
      .select("*")
      .eq("article_id", articleId);

    if (visualErr) {
      console.error("Load visuals failed:", visualErr);
      return json(
        { error: "Failed to load visual assets", details: visualErr.message },
        500,
      );
    }

    const failures = runPublishChecks(article, visuals ?? []);
    if (failures.length > 0) {
      return json(
        {
          error: "Article not ready for publish",
          details: failures[0].details ?? "Publish checks failed",
          blocking_checks: failures,
        },
        409,
      );
    }

    const publishedAt = new Date().toISOString();
    const { data: updated, error: updErr } = await supabase
      .from("blog_articles")
      .update({
        status: "published",
        workflow_status: "published",
        published_at: publishedAt,
      })
      .eq("id", articleId)
      .select()
      .single();

    if (updErr || !updated) {
      console.error("Publish update failed:", updErr);
      return json(
        { error: "Failed to publish article", details: updErr?.message },
        500,
      );
    }

    const { error: auditErr } = await supabase.from("content_approval_events").insert({
      article_id: updated.id,
      event_type: "seo_agent_published_from_chat",
      actor_label: "seo_agent_mcp",
      notes: "Published via SEO Agent MCP (article_id branch)",
      snapshot: {
        source: "article_id",
        seo_score: updated.seo_score,
        aeo_score: updated.aeo_score,
        geo_score: updated.geo_score,
        safety_score: updated.safety_score,
      },
    });

    if (auditErr) {
      console.error("Audit event insert failed:", auditErr);
      return json(
        {
          error: "Failed to publish article",
          details: `Audit log insert failed: ${auditErr.message}`,
        },
        500,
      );
    }

    return json(
      {
        ok: true,
        article: {
          id: updated.id,
          slug: updated.slug,
          status: updated.status,
          workflow_status: updated.workflow_status,
          published_at: updated.published_at,
        },
      },
      200,
    );
  }

  // ===========================================================
  // Branch 2: publish from inline draft payload
  // ===========================================================
  const draft = body.draft as DraftPayload;

  // Minimal shape validation before running publish checks
  if (!nonEmptyString(draft.title_th) || !nonEmptyString(draft.content_th)) {
    return json(
      {
        error: "Invalid request",
        details: "draft.title_th and draft.content_th are required",
      },
      400,
    );
  }
  for (const k of ["seo_score", "aeo_score", "geo_score", "safety_score"] as const) {
    if (draft[k] !== undefined && !isValidScore(draft[k])) {
      return json(
        {
          error: "Invalid request",
          details: `${k} must be a number between 0 and 100`,
        },
        400,
      );
    }
  }

  // Build pseudo-article + visuals for the gate
  const visualsInput = Array.isArray(draft.visual_assets)
    ? draft.visual_assets.filter((a) => a && typeof a.asset_url === "string")
    : [];

  const candidateArticle: Record<string, any> = {
    title_th: draft.title_th,
    title_en: draft.title_en ?? null,
    content_th: draft.content_th,
    content_en: draft.content_en ?? null,
    excerpt_th: draft.excerpt_th ?? null,
    excerpt_en: draft.excerpt_en ?? null,
    meta_title_th: draft.meta_title_th ?? null,
    meta_title_en: draft.meta_title_en ?? null,
    meta_description_th: draft.meta_description_th ?? null,
    meta_description_en: draft.meta_description_en ?? null,
    cover_image_url: draft.cover_image_url ?? null,
    schema_jsonld: draft.schema_jsonld ?? null,
    safety_score: draft.safety_score ?? null,
    score_issues_json: draft.score_issues_json ?? null,
  };

  const failures = runPublishChecks(candidateArticle, visualsInput);
  if (failures.length > 0) {
    return json(
      {
        error: "Article not ready for publish",
        details: failures[0].details ?? "Publish checks failed",
        blocking_checks: failures,
      },
      409,
    );
  }

  const slug = (draft.slug && draft.slug.trim()) || slugify(draft.title_th);
  const publishedAt = new Date().toISOString();

  const insertRow = {
    slug,
    title_th: draft.title_th,
    title_en: draft.title_en ?? null,
    content_th: draft.content_th,
    content_en: draft.content_en ?? null,
    excerpt_th: draft.excerpt_th ?? null,
    excerpt_en: draft.excerpt_en ?? null,
    cover_image_url: draft.cover_image_url ?? null,
    meta_title_th: draft.meta_title_th ?? null,
    meta_title_en: draft.meta_title_en ?? null,
    meta_description_th: draft.meta_description_th ?? null,
    meta_description_en: draft.meta_description_en ?? null,
    tags: Array.isArray(draft.tags) ? draft.tags : [],
    target_keyword: draft.target_keyword ?? null,
    target_intent: draft.target_intent ?? null,
    answer_summary: draft.answer_summary ?? null,
    citations: Array.isArray(draft.citations) ? draft.citations : [],
    schema_jsonld: draft.schema_jsonld ?? null,
    seo_score: draft.seo_score ?? null,
    aeo_score: draft.aeo_score ?? null,
    geo_score: draft.geo_score ?? null,
    safety_score: draft.safety_score ?? null,
    source_system: "seo_agent_mcp",
    status: "published",
    workflow_status: "published",
    published_at: publishedAt,
    is_pinned: false,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from("blog_articles")
    .insert(insertRow)
    .select()
    .single();

  if (insertErr || !inserted) {
    console.error("Insert failed:", insertErr);
    return json(
      { error: "Failed to publish article", details: insertErr?.message },
      500,
    );
  }

  if (visualsInput.length > 0) {
    const assetRows = visualsInput.map((a, idx) => ({
      article_id: inserted.id,
      asset_url: a.asset_url,
      alt_text: a.alt_text ?? null,
      caption: a.caption ?? null,
      role: a.role ?? "inline",
      position: typeof a.position === "number" ? a.position : idx,
      metadata: a.metadata ?? {},
    }));
    const { error: assetErr } = await supabase
      .from("article_visual_assets")
      .insert(assetRows);
    if (assetErr) {
      console.error("Visual asset insert failed:", assetErr);
      // Rollback: delete the article we just inserted to avoid a published
      // article without its visual rows.
      const { error: rollbackErr } = await supabase
        .from("blog_articles")
        .delete()
        .eq("id", inserted.id);
      if (rollbackErr) {
        console.error("Rollback delete failed:", rollbackErr);
      }
      return json(
        {
          error: "Failed to publish article",
          details: `Visual asset insert failed: ${assetErr.message}`,
        },
        500,
      );
    }
  }

  const { error: auditErr } = await supabase.from("content_approval_events").insert({
    article_id: inserted.id,
    event_type: "seo_agent_published_from_chat",
    actor_label: "seo_agent_mcp",
    notes: "Published via SEO Agent MCP (draft branch)",
    snapshot: {
      source: "draft",
      seo_score: inserted.seo_score,
      aeo_score: inserted.aeo_score,
      geo_score: inserted.geo_score,
      safety_score: inserted.safety_score,
    },
  });

  if (auditErr) {
    console.error("Audit event insert failed:", auditErr);
    return json(
      {
        error: "Failed to publish article",
        details: `Audit log insert failed: ${auditErr.message}`,
      },
      500,
    );
  }

  return json(
    {
      ok: true,
      article: {
        id: inserted.id,
        slug: inserted.slug,
        status: inserted.status,
        workflow_status: inserted.workflow_status,
        published_at: inserted.published_at,
      },
    },
    200,
  );
});