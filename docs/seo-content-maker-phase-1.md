# SEO/AEO/GEO Content Maker Phase 1

## Goal

Upgrade the existing ClarityClinic admin content workflow into a safer SEO/AEO/GEO semi-automation system without replacing the current Lovable/Supabase foundation.

The first phase keeps the existing admin/blog architecture and changes the operating model to draft-first content generation with two human checkpoints:

1. Approve or edit the content brief.
2. Approve the final draft before public publishing.

## Current Repo Surface

Existing routes and files:

- `/admin/content-canvas` -> `src/pages/admin/ContentCanvas.tsx`
- `/admin/blogs` -> `src/pages/admin/BlogsList.tsx`
- `/admin/blogs/:id` -> `src/pages/admin/BlogEditor.tsx`
- `/blog` -> `src/pages/BlogList.tsx`
- `/blog/:slug` -> `src/pages/BlogArticle.tsx`

Existing Supabase tables already used by the app:

- `blog_articles`
- `content_topic_backlog`
- `knowledge_documents`
- `auto_publish_settings`
- `reference_images`
- `profiles`
- `user_roles`

## Important Existing Behavior

Public pages already hide unpublished content:

- `BlogList.tsx` queries only `status = "published"`.
- `BlogArticle.tsx` queries only `status = "published"`.

So existing articles can be hidden by updating `blog_articles.status` from `published` to `draft`. Do not delete articles just to hide them.

Example SQL for manually hiding one article:

```sql
update blog_articles
set status = 'draft', published_at = null
where slug = 'ARTICLE_SLUG_HERE';
```

Example SQL for reviewing current published inventory:

```sql
select id, slug, title_th, status, published_at, updated_at
from blog_articles
order by published_at desc nulls last, updated_at desc;
```

## Phase 1 Scope

### 1. Draft-first AI output

Change `ContentCanvas.tsx` so AI-generated articles are inserted into `blog_articles` as drafts first.

Current risky behavior:

```ts
status: "published",
published_at: new Date().toISOString(),
```

Target behavior:

```ts
status: "draft",
published_at: null,
```

The generated article should still navigate to `/admin/blogs/:id` so an editor can review, revise, score, and publish from the editor.

### 2. Add workflow metadata

Add lightweight workflow columns to `blog_articles`.

```sql
alter table blog_articles
add column if not exists workflow_status text default 'draft_generated',
add column if not exists seo_score integer,
add column if not exists aeo_score integer,
add column if not exists geo_score integer,
add column if not exists safety_score integer,
add column if not exists score_issues_json jsonb,
add column if not exists final_approved_by uuid,
add column if not exists final_approved_at timestamptz;
```

Suggested workflow statuses:

- `draft_generated`
- `needs_review`
- `needs_revision`
- `approved`
- `published`
- `archived`

### 3. Add scoring panel

Add a compact scoring panel in `BlogEditor.tsx` before publish.

Scores:

- SEO
- AEO
- GEO
- Safety

Minimum publish guard for clinic content:

- Safety score must not be low.
- The article must not contain guaranteed treatment-result claims.
- The article should include consultation/doctor-review language for medical or aesthetic topics.

### 4. Add approval event table

Create a lightweight audit trail for human-in-the-loop actions.

```sql
create table if not exists content_approval_events (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references blog_articles(id) on delete cascade,
  approval_type text not null,
  status text not null,
  notes text,
  user_id uuid,
  created_at timestamptz default now()
);
```

Approval types:

- `brief_approval`
- `final_approval`
- `publish_override`

Statuses:

- `approved`
- `rejected`
- `needs_revision`

### 5. Keep current public article renderer

Do not rewrite `/blog` or `/blog/:slug` in Phase 1. These already do the most important thing: only published content is public.

Phase 1 public-page changes should be limited to safe schema enhancements only if needed.

## Future Phase Hooks

Phase 2 should extract generation and scoring logic into reusable modules.

Planned modules:

- `contentBriefService`
- `contentScoringService`
- `visualAssetService`
- `schemaBuilder`
- `internalLinkPlanner`

Phase 3 can move those modules into a standalone multi-site dashboard/platform once a second site needs the same workflow.

## First Code Patch Checklist

1. Update `ContentCanvas.tsx` publish action to save generated articles as draft.
2. Rename the UI copy from publish to draft/save-for-review.
3. Add `workflow_status: "draft_generated"` only after the database column exists.
4. Add `BlogsList.tsx` status badges/filters for workflow status after the column exists.
5. Add `BlogEditor.tsx` score panel after scoring columns/functions exist.

## Rollout Notes

- Work only on `feature/seo-content-maker-workflow`.
- Do not update `main` until Lovable preview and manual admin review pass.
- If current live articles need to be hidden, update their `status` in Lovable Cloud SQL editor to `draft` instead of changing frontend code.
