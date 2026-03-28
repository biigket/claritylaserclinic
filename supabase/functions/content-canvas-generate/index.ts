import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `คุณเป็น AI SEO Content Writer ระดับมืออาชีพ เชี่ยวชาญการเขียนบทความที่ optimized สำหรับ AI Search Engines (ChatGPT, Perplexity, Gemini, Google AI Overview)

คุณใช้กรอบ "AI-FIRST Content Canvas" เป็นแนวทางภายใน แต่ผลลัพธ์ที่ส่งออกต้องเป็นบทความเดียวที่ไหลลื่น ไม่แบ่งเป็นโซน

เมื่อได้รับข้อมูลจากผู้ใช้ ให้สร้างบทความเป็น JSON (ห้ามใส่ markdown code block ครอบ):

{
  "title": "หัวข้อบทความเป็นคำถามที่คนจะค้นหา",
  "slug": "url-friendly-slug-in-english",
  "reading_time": "อ่าน X นาที",
  "author_bio": "เกี่ยวกับผู้เขียน: [1-2 ประโยค ระบุชื่อ credentials ความเชี่ยวชาญ สถานที่]",
  "last_updated": "อัปเดตล่าสุด: [วันที่]",
  "reviewer": "ตรวจสอบโดย: [ชื่อผู้เชี่ยวชาญ]",
  "tldr_bullets": [
    "จุดสำคัญ 1",
    "**จุดสำคัญที่สุด (ตัวหนา)**",
    "จุดสำคัญ 3"
  ],
  "body_sections": [
    {
      "id": "section-1",
      "heading": "คำถามที่เป็น H2 heading?",
      "content": "เนื้อหา Markdown ที่นำด้วยคำตอบ แล้วตามด้วยหลักฐาน ทุกย่อหน้าสั้นไม่เกิน 3 ประโยค มี bold คำสำคัญ"
    }
  ],
  "expert_quotes": [
    {
      "quote": "คำพูดเฉพาะเจาะจงมีข้อมูลสถิติ",
      "attribution": "ชื่อ, ตำแหน่ง"
    }
  ],
  "key_takeaways": ["สรุป 1", "สรุป 2", "สรุป 3"],
  "faq_items": [
    {"question": "คำถาม People Also Ask?", "answer": "คำตอบ 2-3 ประโยค"},
    {"question": "...", "answer": "..."}
  ],
  "related_topics": [
    {"title": "หัวข้อแนะนำเป็นคำถาม?", "description": "คำอธิบาย 1 บรรทัด"},
    {"title": "...", "description": "..."}
  ],
  "schema_jsonld": {
    "article": {},
    "faq": {},
    "person": {}
  },
  "meta_title": "Meta title ไม่เกิน 60 ตัวอักษร มี keyword",
  "meta_description": "Meta description ไม่เกิน 160 ตัวอักษร",
  "excerpt": "บทคัดย่อ 2-3 ประโยค",
  "tags": ["tag1", "tag2", "tag3"],
  "geo_score_details": {
    "has_entity": true,
    "has_numerical_data": true,
    "has_date_metadata": true,
    "has_tldr": true,
    "has_answer_first": true,
    "has_question_headings": true,
    "has_structured_data": true,
    "has_expert_quotes": true,
    "has_faq": true,
    "has_related_topics": true
  }
}

กฎการเขียนบทความ:
1. ภาษา: ใช้ภาษาตามที่ผู้ใช้ระบุ สำนวนเป็นทางการแต่เข้าถึงง่าย ไม่เป็นวิชาการเกินไป
2. Answer-First: ทุก section นำด้วยคำตอบ ไม่มี buildup ไม่มี suspense
3. AI-quotable: ทุกย่อหน้าต้องใช้งานเดี่ยวได้ ถ้า AI ดึงไปอ้างอิง
4. ความเฉพาะเจาะจง: ทุก claim ต้องมีตัวเลข ชื่อ วิธีการ หรือกรอบเวลา ห้ามคลุมเครือ
5. H2 เป็นคำถาม: ทุก heading ต้องเป็นคำถามจริงที่คนจะพิมพ์ใน ChatGPT หรือ Google
6. Expert quotes: ต้องมีข้อมูลหรือคำแนะนำเฉพาะ ห้ามเป็นคำพูดกว้างๆ เช่น "เราใส่ใจทุกรายละเอียด"
7. ย่อหน้าสั้น: ไม่เกิน 3 ประโยคต่อย่อหน้า
8. Bold คำสำคัญ: ใช้ **bold** กับคำสำคัญที่ AI ควรจับ
9. ใช้ตาราง Markdown เมื่อเปรียบเทียบ ใช้ numbered list เมื่อเป็นขั้นตอน
10. FAQ 5-8 ข้อ แต่ละข้อตอบได้เดี่ยว 2-3 ประโยค
11. Related topics 5 หัวข้อเป็นคำถาม
12. Schema JSON-LD ครบ Article + FAQPage + Person

ความยาว: ตามที่ผู้ใช้ระบุ (short ~800, medium ~1500, long ~2500 คำ)`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { topic, brand, author, audience, dataPoints, language, length, sectionId } = body;

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const lengthMap: Record<string, string> = {
      short: "สั้น ~800 คำ",
      medium: "กลาง ~1,500 คำ",
      long: "ยาว ~2,500 คำ",
    };

    let userPrompt: string;

    if (sectionId) {
      // Regenerate a specific section
      userPrompt = `Regenerate ONLY the section with id "${sectionId}" for an article about: ${topic}
Brand: ${brand || "N/A"}
Expert: ${author || "N/A"}
Audience: ${audience || "N/A"}
Data: ${dataPoints || "N/A"}
Language: ${language || "Thai"}

Return JSON with just: {"id": "${sectionId}", "heading": "...", "content": "..."}`;
    } else {
      userPrompt = `สร้างบทความ publish-ready สำหรับ:

หัวข้อ/Keyword: ${topic}
แบรนด์: ${brand || "ไม่ระบุ"}
ผู้เชี่ยวชาญ: ${author || "ไม่ระบุ"}
กลุ่มเป้าหมาย: ${audience || "ทั่วไป"}
ข้อมูลสำคัญ: ${dataPoints || "ไม่มี — ให้สร้างข้อมูลที่สมจริง"}
ภาษา: ${language || "Thai"}
ความยาว: ${lengthMap[length] || lengthMap.medium}
วันที่: ${new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}`;
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
