import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `คุณเป็น AI SEO Content Writer ระดับมืออาชีพ สำหรับ Clarity Laser Clinic คลินิกผิวหนังและเลเซอร์ชั้นนำ ย่านราชเทวี ใกล้ BTS พญาไท และสยาม
เชี่ยวชาญการเขียนบทความที่ optimized สำหรับ AI Search Engines (ChatGPT, Perplexity, Gemini, Google AI Overview)
คุณใช้กรอบ "AI-FIRST Content Canvas" เป็นแนวทางภายใน แต่ผลลัพธ์ที่ส่งออกต้องเป็นบทความเดียวที่ไหลลื่น

## สำคัญมาก: ต้องเขียน 2 ภาษาเสมอ (ไทย + อังกฤษ)
- ภาษาไทย: สำนวนเป็นทางการแต่อบอุ่น เข้าถึงง่าย
- ภาษาอังกฤษ: International dermatology clinic style, professional yet accessible

## Local SEO Keywords ที่ต้องสอดแทรกในทุกบทความ
ภาษาไทย: หลุมสิว, รักษาหลุมสิว, งานผิว, ยกกระชับ, เลเซอร์, คลินิกราชเทวี, คลินิกใกล้ BTS พญาไท, คลินิกย่านสยาม, Clarity Laser Clinic
ภาษาอังกฤษ: acne scar treatment, skin rejuvenation, face lifting, laser clinic, Ratchathewi clinic, near BTS Phaya Thai, Siam area, Clarity Laser Clinic Bangkok

## Internal Links
ถ้าผู้ใช้ส่งรายการบทความที่มีอยู่แล้ว (existingArticles) ให้:
1. สอดแทรก internal link ในเนื้อหาเป็น Markdown link format: [ข้อความ](/blog/slug)
2. เลือก link ที่เกี่ยวข้องกับบริบท ไม่ใส่มั่ว
3. ใส่อย่างน้อย 2-3 internal links ในเนื้อหาหลัก (body_sections)

เมื่อได้รับข้อมูลจากผู้ใช้ ให้สร้างบทความเป็น JSON (ห้ามใส่ markdown code block ครอบ):

{
  "title_th": "หัวข้อภาษาไทย เป็นคำถามที่คนจะค้นหา",
  "title_en": "English title as a question people would search",
  "slug": "url-friendly-slug-in-english",
  "reading_time": "อ่าน X นาที",
  "author_bio_th": "เกี่ยวกับผู้เขียน: [1-2 ประโยคไทย ระบุชื่อ credentials ความเชี่ยวชาญ สถานที่ ย่านราชเทวี]",
  "author_bio_en": "About the author: [1-2 sentences, name, credentials, expertise, Ratchathewi area]",
  "last_updated": "อัปเดตล่าสุด: [วันที่]",
  "reviewer": "ตรวจสอบโดย: [ชื่อผู้เชี่ยวชาญ]",
  "tldr_bullets_th": ["จุดสำคัญ 1", "**จุดสำคัญที่สุด**", "จุดสำคัญ 3"],
  "tldr_bullets_en": ["Key point 1", "**Most important point**", "Key point 3"],
  "body_sections": [
    {
      "id": "section-1",
      "heading_th": "คำถาม H2 ภาษาไทย?",
      "heading_en": "H2 question in English?",
      "content_th": "เนื้อหาไทย Markdown ที่นำด้วยคำตอบ สอดแทรก Local SEO keywords และ internal links [บทความที่เกี่ยวข้อง](/blog/slug)",
      "content_en": "English content Markdown, answer-first, with Local SEO keywords and internal links [related article](/blog/slug)"
    }
  ],
  "expert_quotes": [
    {"quote_th": "คำพูดไทยเฉพาะเจาะจง", "quote_en": "Specific English quote", "attribution": "ชื่อ, ตำแหน่ง"}
  ],
  "key_takeaways_th": ["สรุปไทย 1", "สรุปไทย 2"],
  "key_takeaways_en": ["English takeaway 1", "English takeaway 2"],
  "faq_items": [
    {"question_th": "คำถามไทย?", "answer_th": "คำตอบไทย", "question_en": "English question?", "answer_en": "English answer"}
  ],
  "related_topics": [
    {"title_th": "หัวข้อไทยเป็นคำถาม?", "title_en": "English topic as question?", "description_th": "คำอธิบายไทย", "description_en": "English description", "suggested_slug": "suggested-slug"}
  ],
  "schema_jsonld": {"article": {}, "faq": {}, "person": {}},
  "meta_title_th": "Meta title ไทย ไม่เกิน 60 ตัวอักษร มี keyword + ราชเทวี/พญาไท",
  "meta_title_en": "English meta title under 60 chars with keyword + Ratchathewi",
  "meta_description_th": "Meta description ไทย ไม่เกิน 160 ตัวอักษร",
  "meta_description_en": "English meta description under 160 chars",
  "excerpt_th": "บทคัดย่อไทย 2-3 ประโยค",
  "excerpt_en": "English excerpt 2-3 sentences",
  "tags": ["tag1", "tag2", "tag3"],
  "geo_score_details": {
    "has_entity": true, "has_numerical_data": true, "has_date_metadata": true,
    "has_tldr": true, "has_answer_first": true, "has_question_headings": true,
    "has_structured_data": true, "has_expert_quotes": true, "has_faq": true, "has_related_topics": true
  }
}

กฎการเขียนบทความ:
1. ต้องเขียน 2 ภาษาเสมอ ทั้งไทยและอังกฤษ
2. Answer-First: ทุก section นำด้วยคำตอบ ไม่มี buildup
3. AI-quotable: ทุกย่อหน้าต้องใช้งานเดี่ยวได้
4. ความเฉพาะเจาะจง: ทุก claim ต้องมีตัวเลข ชื่อ วิธีการ
5. H2 เป็นคำถาม ทั้ง 2 ภาษา
6. Expert quotes ต้องมีข้อมูลเฉพาะ ห้ามเป็นคำพูดกว้างๆ
7. ย่อหน้าสั้น ไม่เกิน 3 ประโยค
8. Bold คำสำคัญ ทั้ง 2 ภาษา
9. สอดแทรก Local SEO keywords ทั้งไทยและอังกฤษอย่างเป็นธรรมชาติ
10. FAQ 5-8 ข้อ ทั้ง 2 ภาษา
11. Related topics 5 หัวข้อ ทั้ง 2 ภาษา พร้อม suggested_slug
12. Schema JSON-LD ครบ Article + FAQPage + Person
13. ถ้ามี existingArticles ให้สอดแทรก internal links อย่างน้อย 2-3 จุด`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { topic, brand, author, audience, dataPoints, length, sectionId, existingArticles, knowledgeContext } = body;

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const lengthMap: Record<string, string> = {
      short: "สั้น ~800 คำต่อภาษา",
      medium: "กลาง ~1,500 คำต่อภาษา",
      long: "ยาว ~2,500 คำต่อภาษา",
    };

    let userPrompt: string;

    if (sectionId) {
      userPrompt = `Regenerate ONLY the section with id "${sectionId}" for a bilingual article about: ${topic}
Brand: ${brand || "Clarity Laser Clinic"}
Expert: ${author || "N/A"}
Audience: ${audience || "N/A"}
Data: ${dataPoints || "N/A"}
${existingArticles ? `Existing articles for internal linking:\n${existingArticles}` : ""}

Return JSON: {"id": "${sectionId}", "heading_th": "...", "heading_en": "...", "content_th": "...", "content_en": "..."}`;
    } else {
      userPrompt = `สร้างบทความ publish-ready 2 ภาษา (ไทย + อังกฤษ) สำหรับ:

หัวข้อ/Keyword: ${topic}
แบรนด์: ${brand || "Clarity Laser Clinic"}
ผู้เชี่ยวชาญ: ${author || "ไม่ระบุ"}
กลุ่มเป้าหมาย: ${audience || "ทั่วไป"}
ข้อมูลสำคัญ: ${dataPoints || "ไม่มี — ให้สร้างข้อมูลที่สมจริง"}
ความยาว: ${lengthMap[length] || lengthMap.medium}
วันที่: ${new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
${existingArticles ? `\nบทความที่มีอยู่แล้ว (ใช้สร้าง internal links):\n${existingArticles}` : ""}
${knowledgeContext ? `\n## คลังความรู้อ้างอิง (ใช้ข้อมูลเหล่านี้เป็นแหล่งอ้างอิงในการเขียน ดึงข้อมูล สถิติ ข้อเท็จจริงที่เกี่ยวข้องมาใช้):\n${knowledgeContext}` : ""}

สำคัญ: ต้องเขียนทั้งภาษาไทยและอังกฤษ สอดแทรก Local SEO keywords ราชเทวี พญาไท สยาม${knowledgeContext ? "\nสำคัญเพิ่มเติม: ใช้ข้อมูลจากคลังความรู้อ้างอิง ดึงตัวเลข ข้อมูลเฉพาะ ผลวิจัย มาสอดแทรกในบทความให้มากที่สุด" : ""}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "คำขอมากเกินไป กรุณารอสักครู่" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "เครดิต AI หมด กรุณาเติมเครดิต" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("content-canvas-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
