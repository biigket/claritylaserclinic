# SVG Visual Style Guide

Use this guide for SEO/AEO/GEO visual assets generated for ClarityClinic articles.

## Font Stack

Default Thai/English SVG font stack:

```css
font-family: "Anuphan", "Noto Sans Thai", sans-serif;
```

Recommended roles:

- `Anuphan`: primary visual font for Thai and English labels, cards, diagrams, and infographic text.
- `Noto Sans Thai`: fallback for Thai glyph stability and tone mark safety.

## Thai Typography Rules

Important rules to avoid broken Thai tone marks and vowel positioning:

- Do not split Thai text character by character.
- Do not use `letter-spacing` on Thai text.
- Do not use negative `line-height`.
- Use `line-height` around `1.45` to `1.65`.
- For direct SVG text, keep `<text>` nodes as whole words or whole phrases. Avoid splitting one Thai phrase into many spans/tspans unless wrapping requires it.
- For final static export where visual stability matters most, convert text to paths only at the final render/export step.

## Preferred Visual Types

Each generated article can include more than one visual asset:

- Featured image
- Treatment journey diagram
- Recovery timeline
- Decision tree
- Comparison visual
- FAQ answer card
- Procedure checklist
- Skin layer explainer
- CTA card

## Renderer Strategy

Do not ask the AI model to write raw SVG as the primary output.

Preferred pipeline:

```text
Article context
-> AI visual_spec_json
-> deterministic renderer
-> SVG markup
-> Supabase storage or database record
-> article placement
```

Recommended renderers:

- Satori for React/JSX-like infographic cards and article visuals.
- Mermaid for flowcharts, timelines, and decision trees.
- Rough.js for friendly sketch-style explanatory diagrams.
- Excalidraw only when editors need a manually adjustable visual draft.

## Visual Spec Shape

Example visual spec:

```json
{
  "type": "treatment_journey",
  "title_th": "เส้นทางการรักษาหลุมสิว",
  "title_en": "Acne Scar Treatment Journey",
  "blocks": [
    {
      "label_th": "ประเมินผิว",
      "label_en": "Assessment",
      "description_th": "แพทย์ประเมินชนิดหลุมสิวและสภาพผิว",
      "description_en": "A doctor assesses scar type and skin condition"
    },
    {
      "label_th": "วางแผน",
      "label_en": "Plan",
      "description_th": "เลือกแนวทางรักษาที่เหมาะกับแต่ละบุคคล",
      "description_en": "Choose an individualized treatment plan"
    }
  ],
  "style": "soft_clinic_infographic"
}
```

## Medical Content Guardrails

Visuals must avoid overclaiming.

Do not use wording like:

- Guaranteed result
- 100% cure
- Permanent result for everyone
- Before/after claims without context

Prefer safer wording:

- Results vary by individual.
- A doctor should assess treatment suitability.
- Recovery and treatment response depend on skin condition and treatment plan.

## Storage Plan

Future table:

```sql
create table if not exists article_visual_assets (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references blog_articles(id) on delete cascade,
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
```
