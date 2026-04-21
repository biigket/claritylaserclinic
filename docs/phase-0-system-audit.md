# Phase 0 System Audit

## Purpose

Phase 0 stabilizes the current ClarityClinic content system before any workflow changes. The goal is to avoid breaking the existing Lovable admin/blog flow while preparing for SEO/AEO/GEO semi-automation.

## Confirmed Stack

- Vite
- React
- TypeScript
- shadcn/ui
- Tailwind CSS
- Supabase client via Lovable Cloud environment variables
- Lovable Cloud database/functions/storage in the current project

## Confirmed Environment Variables

The app uses these browser-facing Supabase variables in `src/integrations/supabase/client.ts`:

```ts
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Do not add server secrets to frontend code. AI provider keys must remain in Lovable Cloud Secrets / Edge Functions.

## Current Admin Routes

Defined in `src/App.tsx`:

- `/admin` -> admin login
- `/admin/promotions` -> promotion list
- `/admin/promotions/new` -> promotion editor
- `/admin/promotions/:id` -> promotion editor
- `/admin/blogs` -> blog list
- `/admin/blogs/new` -> blog editor
- `/admin/blogs/:id` -> blog editor
- `/admin/content-canvas` -> AI content generator

## Current Public Routes

Defined in `src/App.tsx`:

- `/` -> homepage
- `/scar-assessment` -> scar assessment
- `/blog` -> public blog list
- `/blog/:slug` -> public blog article

## Current Content Tables

Confirmed from `src/integrations/supabase/types.ts`:

- `blog_articles`
- `content_topic_backlog`
- `knowledge_documents`
- `auto_publish_settings`
- `reference_images`
- `profiles`
- `promotions`
- `user_roles`

## Current Article Visibility Behavior

Public article list only shows published articles.

`src/pages/BlogList.tsx` queries:

```ts
.eq("status", "published")
```

Public article detail also only resolves published articles.

`src/pages/BlogArticle.tsx` queries:

```ts
.eq("slug", slug)
.eq("status", "published")
.single()
```

Therefore, existing articles can be hidden from the public site by changing `blog_articles.status` to `draft` and clearing `published_at`.

Example:

```sql
update blog_articles
set status = 'draft', published_at = null
where slug = 'ARTICLE_SLUG_HERE';
```

Do not delete articles to hide them.

## Current AI Content Behavior

`src/pages/admin/ContentCanvas.tsx` currently creates an article payload and inserts it into `blog_articles`.

Risky current behavior:

```ts
status: "published",
published_at: new Date().toISOString(),
```

This means an AI-generated article can become public immediately after generation/publish action. Phase 1 must change this to draft-first behavior.

## Current Blog Editor Behavior

`src/pages/admin/BlogEditor.tsx` supports:

- Manual editing of Thai/English article fields
- Slug editing and slug generation
- Cover upload
- AI cover generation through `blog-generate-cover`
- Tags
- SEO title and description fields
- Draft save
- Publish action

This editor should remain the final human review screen during Phase 1.

## Current Blog List Behavior

`src/pages/admin/BlogsList.tsx` supports:

- Article search
- Status filtering for `draft` and `published`
- Tag filtering
- Edit/delete actions
- Publish/unpublish toggle
- Pin/unpin action

This list is adequate for Phase 1. Later phases can add `workflow_status` filters.

## Current Edge Function Calls Observed

Referenced from admin content/editor components:

- `content-canvas-generate`
- `blog-generate-cover`
- `canvas-autofill`

These should stay server-side because they likely need AI provider secrets.

## Phase 0 Risk Register

### Risk: AI content goes live too early

Current mitigation: public pages hide non-published records.

Required Phase 1 fix: save AI-generated articles as `draft` by default.

### Risk: medical/aesthetic claims

Current mitigation: human editor can manually review in `BlogEditor`.

Required Phase 2/3 fix: add Safety score and approval trail.

### Risk: Lovable Cloud schema drift

Current mitigation: schema is reflected in generated `types.ts`.

Required workflow: run SQL migrations in Lovable Cloud SQL editor first, then update generated types if needed.

### Risk: branch changes sync into Lovable unexpectedly

Current mitigation: all work is on `feature/seo-content-maker-workflow`.

Required workflow: do not merge to `main` until preview/manual review passes.

## Phase 0 Checklist

- [x] Confirm repo access through GitHub connector.
- [x] Create working branch: `feature/seo-content-maker-workflow`.
- [x] Confirm existing public blog hides non-published articles.
- [x] Confirm current AI content generation path.
- [x] Confirm current admin blog editor and list capabilities.
- [x] Add implementation docs.
- [x] Add SVG visual style guide.
- [x] Add this system audit.

## Phase 0 Exit Criteria

Phase 0 is complete when:

- The team understands that existing articles should be hidden by status change, not deletion.
- The current content routes, tables, and risky publish behavior are documented.
- A protected feature branch exists for implementation.
- The next patch is clearly scoped to draft-first behavior in `ContentCanvas.tsx`.

## Next Phase

Phase 1: Draft-first content workflow.

Primary code target:

- `src/pages/admin/ContentCanvas.tsx`

Expected behavior change:

- AI-generated articles are saved as drafts first.
- Public visibility requires final human publish action from the admin/editor flow.
