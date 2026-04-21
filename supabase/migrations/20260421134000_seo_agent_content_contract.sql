-- SEO Agent / MCP content contract for ClarityClinic.
-- Apply this in Lovable Cloud SQL editor before enabling the external create-draft function.

alter table public.blog_articles
  add column if not exists source_system text,
  add column if not exists workflow_status text default 'draft_generated',
  add column if not exists seo_score integer,
  add column if not exists aeo_score integer,
  add column if not exists geo_score integer,
  add column if not exists safety_score integer,
  add column if not exists score_issues_json jsonb,
  add column if not exists score_recommendations_json jsonb,
  add column if not exists faq_json jsonb,
  add column if not exists schema_json jsonb,
  add column if not exists internal_links_json jsonb,
  add column if not exists visual_assets_json jsonb,
  add column if not exists final_approved_by uuid,
  add column if not exists final_approved_at timestamptz;

create index if not exists idx_blog_articles_workflow_status
  on public.blog_articles (workflow_status);

create index if not exists idx_blog_articles_source_system
  on public.blog_articles (source_system);

create table if not exists public.article_visual_assets (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.blog_articles(id) on delete cascade,
  asset_type text not null,
  renderer_type text not null,
  visual_spec_json jsonb,
  svg_markup text,
  image_url text,
  alt_text_th text,
  alt_text_en text,
  caption_th text,
  caption_en text,
  placement text,
  created_at timestamptz default now()
);

create index if not exists idx_article_visual_assets_article_id
  on public.article_visual_assets (article_id);

create table if not exists public.content_approval_events (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.blog_articles(id) on delete cascade,
  approval_type text not null,
  status text not null,
  notes text,
  user_id uuid,
  created_at timestamptz default now()
);

create index if not exists idx_content_approval_events_article_id
  on public.content_approval_events (article_id);

create index if not exists idx_content_approval_events_type_status
  on public.content_approval_events (approval_type, status);

comment on column public.blog_articles.source_system is 'Origin of content, e.g. manual, content_canvas, seo_agent_mcp.';
comment on column public.blog_articles.workflow_status is 'Editorial workflow status independent of public status.';
comment on column public.blog_articles.safety_score is 'Safety review score for medical/aesthetic content.';
comment on table public.article_visual_assets is 'Generated or uploaded visual assets attached to blog articles.';
comment on table public.content_approval_events is 'Audit trail for human-in-the-loop editorial approvals.';
