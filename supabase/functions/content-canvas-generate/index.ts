import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `คุณเป็น AI SEO Content Strategist ที่เชี่ยวชาญการเขียนเนื้อหาสำหรับ AI Search & Answer Engines (ChatGPT, Perplexity, Gemini)
คุณใช้กรอบ "AI-FIRST Content Canvas" ที่แบ่งเนื้อหาเป็น 4 โซน

เมื่อได้รับข้อมูลจากผู้ใช้ ให้สร้างเนื้อหาในรูปแบบ JSON ที่มีโครงสร้างดังนี้ (ห้ามใส่ markdown code block ครอบ):

{
  "zone1": {
    "entity_block": "ย่อหน้าแนะนำ entity/brand อย่างชัดเจน ระบุชื่อ ความเชี่ยวชาญ พื้นที่ให้บริการ เหตุผลที่เป็น authority",
    "numerical_proofs": [
      {"stat": "ข้อมูลสถิติ", "context": "แหล่งที่มาหรือบริบท"},
      {"stat": "...", "context": "..."},
      {"stat": "...", "context": "..."}
    ],
    "metadata": {
      "publication_date": "วันที่จากข้อมูลผู้ใช้",
      "last_updated": "วันที่อัปเดตล่าสุด",
      "review_note": "ข้อความระบุว่าได้ตรวจสอบล่าสุดเมื่อไหร่",
      "freshness_signal": "อัปเดตล่าสุด [เดือน] [ปี]"
    }
  },
  "zone2": {
    "tldr_summary": "สรุป 3-5 ประโยค ตอบคำถามหลักโดยตรง มีจุดสำคัญเป็น bullet มีประโยคสำคัญที่สุดเป็นตัวหนา",
    "answer_first_content": "เนื้อหาหลักแบบ Markdown ที่นำด้วยคำตอบก่อนแล้วตามด้วยหลักฐาน ทุกย่อหน้าสั้น ไม่เกิน 3 ประโยค แต่ละย่อหน้าสามารถถูก AI อ้างอิงได้อิสระ"
  },
  "zone3": {
    "structured_content": "เนื้อหาที่มี heading เป็นคำถาม (H2/H3) ใช้ตาราง, numbered lists, bullet points ตามความเหมาะสม",
    "expert_quotes": [
      {"quote": "คำพูดเฉพาะเจาะจงมีข้อมูลสถิติ", "attribution": "ชื่อผู้เชี่ยวชาญ + credentials"},
      {"quote": "...", "attribution": "..."}
    ]
  },
  "zone4": {
    "faq_items": [
      {"question": "คำถามแบบ People Also Ask", "answer": "คำตอบ 2-3 ประโยค สามารถใช้งานเดี่ยวได้"},
      ...5-8 items
    ],
    "related_topics": [
      {"title": "หัวข้อแนะนำเป็นคำถาม", "description": "คำอธิบาย 1 บรรทัด", "connection": "เชื่อมโยงกับบทความหลักอย่างไร"},
      ...5-7 items
    ],
    "key_takeaways": ["ข้อสรุปสำคัญ 1", "ข้อสรุปสำคัญ 2", ...],
    "reading_time_minutes": 7,
    "schema_jsonld": "JSON-LD markup สำหรับ Article, FAQPage, Person schemas"
  },
  "estimated_word_count": 2000
}

กฎสำคัญ:
- เนื้อหาทั้งหมดต้องเขียนในภาษาที่ผู้ใช้ระบุ (ถ้าเลือก Both ให้เขียนทั้งสองภาษาโดยแยก field เป็น _th และ _en)
- ทุก claim ต้องมีความเฉพาะเจาะจง (ตัวเลข ชื่อ วิธีการ) ห้ามคลุมเครือ
- Heading ทุกอันต้องเป็นคำถามที่ผู้ใช้จะถามจริง
- Expert quotes ต้องมีข้อมูลเฉพาะ ห้ามเป็นคำพูดทั่วไป
- ความยาวรวม 1,500-2,500 คำ
- ห้ามใส่ markdown code block ครอบ JSON`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { topic, brand, author, industry, audience, language, contentType, dataPoints, publicationDate, zone } = body;

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let userPrompt = `สร้างเนื้อหาตามกรอบ AI-FIRST Content Canvas สำหรับ:

หัวข้อ/Keyword: ${topic}
แบรนด์/Entity: ${brand || "ไม่ระบุ"}
ผู้เขียน/ผู้เชี่ยวชาญ: ${author || "ไม่ระบุ"}
อุตสาหกรรม: ${industry || "ไม่ระบุ"}
กลุ่มเป้าหมาย: ${audience || "ไม่ระบุ"}
ภาษา: ${language || "Thai"}
ประเภทเนื้อหา: ${contentType || "Blog Post"}
วันที่เผยแพร่: ${publicationDate || new Date().toISOString().split("T")[0]}
ข้อมูลสำคัญที่ต้องรวม: ${dataPoints || "ไม่มี"}`;

    if (zone) {
      userPrompt += `\n\nสร้างเฉพาะ Zone ${zone} เท่านั้น ส่งเป็น JSON object ของ zone นั้น`;
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
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "เครดิต AI หมด กรุณาเติมเครดิต" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("content-canvas-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
