import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `คุณเป็น AI SEO Content Writer ระดับมืออาชีพ สำหรับ Clarity Laser Clinic คลินิกผิวหนังและเลเซอร์ชั้นนำ ย่านราชเทวี ใกล้ BTS พญาไท และสยาม
เชี่ยวชาญการเขียนบทความที่ optimized สำหรับ AI Search Engines (ChatGPT, Perplexity, Gemini, Google AI Overview)

## สำคัญมาก: ต้องเขียน 2 ภาษาเสมอ (ไทย + อังกฤษ)
- ภาษาไทย: สำนวนเป็นทางการแต่อบอุ่น เข้าถึงง่าย
- ภาษาอังกฤษ: International dermatology clinic style, professional yet accessible

## Local SEO Keywords
ภาษาไทย: หลุมสิว, รักษาหลุมสิว, งานผิว, ยกกระชับ, เลเซอร์, คลินิกราชเทวี, คลินิกใกล้ BTS พญาไท, คลินิกย่านสยาม, Clarity Laser Clinic
ภาษาอังกฤษ: acne scar treatment, skin rejuvenation, face lifting, laser clinic, Ratchathewi clinic, near BTS Phaya Thai, Siam area, Clarity Laser Clinic Bangkok

## Internal Links
ถ้ามีรายการบทความที่มีอยู่แล้ว ให้สอดแทรก internal link ใน Markdown format: [ข้อความ](/blog/slug) อย่างน้อย 2-3 จุด

ผลลัพธ์ต้องเป็น JSON (ห้ามใส่ markdown code block ครอบ):
{
  "title_th": "หัวข้อภาษาไทย เป็นคำถามที่คนจะค้นหา",
  "title_en": "English title as a question people would search",
  "slug": "url-friendly-slug-in-english",
  "reading_time": "อ่าน X นาที",
  "author_bio_th": "เกี่ยวกับผู้เขียน: นพ.ฐิติคมน์ (เลขทะเบียน 61395) แพทย์ผู้เชี่ยวชาญด้านผิวหนังและเลเซอร์ ประจำ Clarity Laser Clinic ย่านราชเทวี",
  "author_bio_en": "About the author: Dr. Thitikom (License No. 61395), dermatology and laser specialist at Clarity Laser Clinic, Ratchathewi, Bangkok",
  "last_updated": "อัปเดตล่าสุด: [วันที่]",
  "reviewer": "ตรวจสอบโดย: นพ.ฐิติคมน์",
  "tldr_bullets_th": ["จุดสำคัญ 1", "**จุดสำคัญที่สุด**", "จุดสำคัญ 3"],
  "tldr_bullets_en": ["Key point 1", "**Most important point**", "Key point 3"],
  "body_sections": [
    {"id": "section-1", "heading_th": "คำถาม H2 ภาษาไทย?", "heading_en": "H2 question in English?", "content_th": "เนื้อหาไทย", "content_en": "English content"}
  ],
  "expert_quotes": [{"quote_th": "คำพูดไทย", "quote_en": "English quote", "attribution": "นพ.ฐิติคมน์, ผิวหนังเฉพาะทาง"}],
  "key_takeaways_th": ["สรุปไทย 1"],
  "key_takeaways_en": ["English takeaway 1"],
  "faq_items": [{"question_th": "?", "answer_th": "...", "question_en": "?", "answer_en": "..."}],
  "related_topics": [{"title_th": "?", "title_en": "?", "description_th": "...", "description_en": "...", "suggested_slug": "slug"}],
  "meta_title_th": "Meta title ไทย", "meta_title_en": "English meta title",
  "meta_description_th": "Meta description ไทย", "meta_description_en": "English meta description",
  "excerpt_th": "บทคัดย่อไทย", "excerpt_en": "English excerpt",
  "tags": ["tag1", "tag2"],
  "geo_score_details": {"has_entity": true, "has_numerical_data": true, "has_date_metadata": true, "has_tldr": true, "has_answer_first": true, "has_question_headings": true, "has_structured_data": true, "has_expert_quotes": true, "has_faq": true, "has_related_topics": true}
}

กฎการเขียน:
1. ต้อง 2 ภาษาเสมอ
2. Answer-First ทุก section
3. H2 เป็นคำถาม
4. Expert quotes ต้องมีข้อมูลเฉพาะ
5. ย่อหน้าสั้น ไม่เกิน 3 ประโยค
6. Bold คำสำคัญ
7. สอดแทรก Local SEO keywords
8. FAQ 5-8 ข้อ 2 ภาษา
9. Related topics 5 หัวข้อ 2 ภาษา
10. ความยาว ~1,500 คำ/ภาษา`;

function tryParseArticleJson(text: string): any | null {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.title_th || parsed.body_sections) return parsed;
  } catch {
    const match = cleaned.match(/\{[\s\S]*"body_sections"[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* */ }
    }
  }
  return null;
}

function buildContent(articleData: any, lang: "th" | "en"): string {
  const t = (th?: string, en?: string) => lang === "th" ? (th || en || "") : (en || th || "");
  const parts: string[] = [];

  const bullets = lang === "th" ? articleData.tldr_bullets_th : articleData.tldr_bullets_en;
  if (bullets?.length) parts.push(`> **TL;DR**\n${bullets.map((b: string) => `- ${b}`).join("\n")}`);

  const bio = t(articleData.author_bio_th, articleData.author_bio_en);
  if (bio) parts.push(`*${bio}*`);

  articleData.body_sections?.forEach((s: any) => {
    parts.push(`## ${t(s.heading_th, s.heading_en)}\n\n${t(s.content_th, s.content_en)}`);
  });

  articleData.expert_quotes?.forEach((q: any) => {
    parts.push(`> "${t(q.quote_th, q.quote_en)}"\n> — *${q.attribution}*`);
  });

  const takeaways = lang === "th" ? articleData.key_takeaways_th : articleData.key_takeaways_en;
  if (takeaways?.length) parts.push(`## ${lang === "th" ? "สรุปสำคัญ" : "Key Takeaways"}\n\n${takeaways.map((k: string) => `- ${k}`).join("\n")}`);

  if (articleData.faq_items?.length) {
    parts.push(`## ${lang === "th" ? "คำถามที่พบบ่อย" : "FAQ"}\n\n${articleData.faq_items.map((f: any) => {
      const q = lang === "th" ? f.question_th : f.question_en;
      const a = lang === "th" ? f.answer_th : f.answer_en;
      return `**${q}**\n${a}`;
    }).join("\n\n")}`);
  }

  if (articleData.related_topics?.length) {
    parts.push(`## ${lang === "th" ? "บทความที่เกี่ยวข้อง" : "Related Articles"}\n\n${articleData.related_topics.map((r: any) => {
      const title = t(r.title_th, r.title_en);
      const desc = t(r.description_th, r.description_en);
      const slug = r.suggested_slug;
      return slug ? `→ [${title}](/blog/${slug}) — ${desc}` : `→ **${title}** — ${desc}`;
    }).join("\n")}`);
  }

  return parts.filter(Boolean).join("\n\n---\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 3;

    // Fetch pending topics
    const { data: pendingTopics, error: fetchErr } = await supabase
      .from("content_topic_backlog")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (fetchErr) throw fetchErr;
    if (!pendingTopics?.length) {
      return new Response(JSON.stringify({ message: "ไม่มีหัวข้อรอเขียน", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing articles for internal linking
    const { data: existingArticles } = await supabase
      .from("blog_articles")
      .select("title_th, title_en, slug")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50);

    const existingArticlesContext = (existingArticles || [])
      .map((a: any) => `- "${a.title_th || a.title_en}" → /blog/${a.slug}`)
      .join("\n");

    const results: any[] = [];

    for (const topic of pendingTopics) {
      try {
        // Mark as writing
        await supabase
          .from("content_topic_backlog")
          .update({ status: "writing" })
          .eq("id", topic.id);

        console.log(`[auto-publish] Generating: ${topic.title_th}`);

        // Generate article (non-streaming)
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: `สร้างบทความ publish-ready 2 ภาษา (ไทย + อังกฤษ):
หัวข้อ: ${topic.title_th}${topic.title_en ? ` / ${topic.title_en}` : ""}
แบรนด์: Clarity Laser Clinic
ผู้เชี่ยวชาญ: นพ.ฐิติคมน์ 61395, แพทย์ผู้เชี่ยวชาญด้านผิวหนังและเลเซอร์
${topic.description_th ? `รายละเอียด: ${topic.description_th}` : ""}
วันที่: ${new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
${existingArticlesContext ? `\nบทความที่มีอยู่ (ใช้สร้าง internal links):\n${existingArticlesContext}` : ""}

สำคัญ: ต้องเขียนทั้งภาษาไทยและอังกฤษ สอดแทรก Local SEO keywords`,
              },
            ],
            stream: false,
          }),
        });

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          console.error(`[auto-publish] AI error for ${topic.title_th}:`, aiResp.status, errText);
          await supabase.from("content_topic_backlog").update({ status: "pending" }).eq("id", topic.id);

          if (aiResp.status === 429) {
            console.log("[auto-publish] Rate limited, stopping batch");
            break;
          }
          continue;
        }

        const aiData = await aiResp.json();
        const rawContent = aiData.choices?.[0]?.message?.content;
        if (!rawContent) {
          console.error(`[auto-publish] Empty AI response for ${topic.title_th}`);
          await supabase.from("content_topic_backlog").update({ status: "pending" }).eq("id", topic.id);
          continue;
        }

        const articleData = tryParseArticleJson(rawContent);
        if (!articleData) {
          console.error(`[auto-publish] Failed to parse JSON for ${topic.title_th}`);
          await supabase.from("content_topic_backlog").update({ status: "pending" }).eq("id", topic.id);
          continue;
        }

        // Build slug
        const baseSlug = articleData.slug || topic.suggested_slug || articleData.title_en
          ?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `article-${Date.now()}`;
        const slug = `${baseSlug}-${Date.now().toString(36)}`;

        // Generate cover image with retry (must complete before publishing)
        let coverImageUrl: string | null = null;
        const maxCoverRetries = 3;
        for (let attempt = 1; attempt <= maxCoverRetries; attempt++) {
          try {
            console.log(`[auto-publish] Cover attempt ${attempt}/${maxCoverRetries} for: ${topic.title_th}`);
            const coverResp = await fetch(`${SUPABASE_URL}/functions/v1/blog-generate-cover`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              },
              body: JSON.stringify({
                title: articleData.title_th || topic.title_th,
                excerpt: articleData.excerpt_th,
                tags: articleData.tags?.join(", "),
              }),
            });
            const coverData = await coverResp.json();
            if (coverResp.ok && coverData.url) {
              coverImageUrl = coverData.url;
              console.log(`[auto-publish] Cover generated on attempt ${attempt}`);
              break;
            }
            console.warn(`[auto-publish] Cover attempt ${attempt} failed: ${coverResp.status}`);
          } catch (e) {
            console.warn(`[auto-publish] Cover attempt ${attempt} error:`, e);
          }
          if (attempt < maxCoverRetries) {
            await new Promise((r) => setTimeout(r, 5000)); // wait 5s before retry
          }
        }

        if (!coverImageUrl) {
          console.warn(`[auto-publish] All cover attempts failed for ${topic.title_th}, skipping publish`);
          await supabase.from("content_topic_backlog").update({ status: "pending" }).eq("id", topic.id);
          continue;
        }

        // Insert article
        const payload = {
          slug,
          status: "published",
          title_th: articleData.title_th || topic.title_th,
          title_en: articleData.title_en || topic.title_en || null,
          content_th: buildContent(articleData, "th"),
          content_en: buildContent(articleData, "en"),
          excerpt_th: articleData.excerpt_th || null,
          excerpt_en: articleData.excerpt_en || null,
          cover_image_url: coverImageUrl,
          tags: articleData.tags || [],
          meta_title_th: articleData.meta_title_th || null,
          meta_title_en: articleData.meta_title_en || null,
          meta_description_th: articleData.meta_description_th || null,
          meta_description_en: articleData.meta_description_en || null,
          published_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertErr } = await supabase
          .from("blog_articles")
          .insert(payload)
          .select("id")
          .single();

        if (insertErr) {
          console.error(`[auto-publish] Insert error for ${topic.title_th}:`, insertErr);
          await supabase.from("content_topic_backlog").update({ status: "pending" }).eq("id", topic.id);
          continue;
        }

        // Save new related topics to backlog
        if (articleData.related_topics?.length) {
          const newTopics = articleData.related_topics.map((r: any) => ({
            title_th: r.title_th,
            title_en: r.title_en || null,
            description_th: r.description_th || null,
            description_en: r.description_en || null,
            suggested_slug: r.suggested_slug || null,
            source_article_id: inserted.id,
            source_article_title: articleData.title_th || topic.title_th,
            status: "pending",
          }));
          await supabase.from("content_topic_backlog").insert(newTopics);
        }

        // Mark topic as done
        await supabase
          .from("content_topic_backlog")
          .update({ status: "published" })
          .eq("id", topic.id);

        results.push({
          topic: topic.title_th,
          slug,
          article_id: inserted.id,
          status: "published",
        });

        console.log(`[auto-publish] Published: ${topic.title_th} → /blog/${slug}`);

        // Small delay between articles to avoid rate limits
        if (pendingTopics.indexOf(topic) < pendingTopics.length - 1) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch (topicErr) {
        console.error(`[auto-publish] Error processing ${topic.title_th}:`, topicErr);
        await supabase.from("content_topic_backlog").update({ status: "pending" }).eq("id", topic.id);
      }
    }

    return new Response(JSON.stringify({
      message: `เผยแพร่สำเร็จ ${results.length}/${pendingTopics.length} บทความ`,
      processed: results.length,
      total: pendingTopics.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[auto-publish] Fatal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
