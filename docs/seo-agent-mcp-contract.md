# SEO Agent / MCP Integration Contract

## Purpose

ClarityClinic should act as the CMS target and human review surface. The SEO Agent/MCP is the external brain that generates, scores, and sends draft articles into the existing admin workflow.

The first integration endpoint is:

```text
POST /functions/v1/seo-agent-create-draft
```

This endpoint creates a draft article only. It never publishes public content.

## Required Lovable Cloud Secret

Set this in Lovable Cloud / Supabase Edge Function secrets:

```text
SEO_AGENT_API_KEY=<strong random token>
```

The SEO MCP must send the same value in either:

```text
x-seo-agent-key: <token>
```

or:

```text
Authorization: Bearer <token>
```

Do not expose this token in frontend code.

## Required Migration

Apply this migration before enabling the endpoint:

```text
supabase/migrations/20260421134000_seo_agent_content_contract.sql
```

It adds SEO/AEO/GEO/Safety metadata fields and the visual/approval tables.

## Request Payload

Minimum payload:

```json
{
  "title_th": "หัวข้อบทความภาษาไทย",
  "content_th": "Markdown content in Thai"
}
```

Recommended full payload:

```json
{
  "slug": "acne-scar-treatment-guide",
  "title_th": "รักษาหลุมสิวแบบไหนดี?",
  "title_en": "Which acne scar treatment is right for you?",
  "content_th": "Markdown Thai article body",
  "content_en": "Markdown English article body",
  "excerpt_th": "บทคัดย่อภาษาไทย",
  "excerpt_en": "English excerpt",
  "cover_image_url": "https://...",
  "tags": ["หลุมสิว", "laser", "ratchathewi"],
  "meta_title_th": "Meta title Thai",
  "meta_title_en": "Meta title English",
  "meta_description_th": "Meta description Thai",
  "meta_description_en": "Meta description English",
  "seo_score": 84,
  "aeo_score": 78,
  "geo_score": 82,
  "safety_score": 91,
  "score_issues_json": [
    { "severity": "medium", "message": "Add one more internal link to a service page." }
  ],
  "score_recommendations_json": [
    { "type": "seo", "message": "Shorten Thai meta title to under 60 characters." }
  ],
  "faq_json": [
    { "question_th": "รักษาหลุมสิวเจ็บไหม?", "answer_th": "ขึ้นอยู่กับวิธีรักษาและสภาพผิว" }
  ],
  "schema_json": {
    "@context": "https://schema.org",
    "@type": "BlogPosting"
  },
  "internal_links_json": [
    { "href": "/blog/example", "anchor_th": "บทความที่เกี่ยวข้อง" }
  ],
  "visual_assets_json": [
    {
      "asset_type": "treatment_journey",
      "renderer_type": "satori",
      "alt_text_th": "แผนภาพเส้นทางการรักษาหลุมสิว"
    }
  ]
}
```

## Response

Success response:

```json
{
  "article": {
    "id": "uuid",
    "slug": "generated-slug",
    "status": "draft",
    "workflow_status": "needs_review"
  }
}
```

The admin should review the article at:

```text
/admin/blogs/<article.id>
```

## Draft-Only Safety Contract

The endpoint always writes:

```json
{
  "status": "draft",
  "workflow_status": "needs_review",
  "source_system": "seo_agent_mcp",
  "published_at": null
}
```

Public pages already require `status = "published"`, so drafts remain hidden from `/blog` and `/blog/:slug`.

## MCP Responsibilities

The SEO MCP should:

1. Crawl/analyze the target site.
2. Generate the brief and article.
3. Produce SEO/AEO/GEO/Safety scores.
4. Generate visual asset specs or URLs.
5. Send the final draft package to `seo-agent-create-draft`.
6. Return the admin edit URL to the human reviewer.

The MCP should not publish content directly in Phase 1.

## ClarityClinic Responsibilities

ClarityClinic should:

1. Store incoming drafts.
2. Hide drafts from public routes.
3. Show drafts in `/admin/blogs`.
4. Let editors review in `/admin/blogs/:id`.
5. Publish only after human review.

## Example curl

```bash
curl -X POST "$VITE_SUPABASE_URL/functions/v1/seo-agent-create-draft" \
  -H "Content-Type: application/json" \
  -H "x-seo-agent-key: $SEO_AGENT_API_KEY" \
  -d '{
    "title_th": "รักษาหลุมสิวแบบไหนดี?",
    "content_th": "## คำตอบสั้น\nควรให้แพทย์ประเมินชนิดหลุมสิวก่อน...",
    "seo_score": 82,
    "aeo_score": 80,
    "geo_score": 78,
    "safety_score": 92
  }'
```
