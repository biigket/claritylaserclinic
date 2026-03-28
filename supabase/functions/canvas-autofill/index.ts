import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const buildSystemPrompt = (knowledgeContext: string) => `คุณเป็นผู้ช่วยกรอกฟอร์ม AI-FIRST Content Canvas จาก prompt สั้นๆ ของผู้ใช้

เมื่อผู้ใช้พิมพ์ prompt สั้นๆ เช่น "เขียนเรื่องหลุมสิว" หรือ "Doublo treatment guide"
ให้วิเคราะห์แล้วตอบเป็น JSON (ห้ามใส่ markdown code block ครอบ) ดังนี้:

{
  "topic": "หัวข้อ/keyword หลัก",
  "brand": "ชื่อแบรนด์ (ถ้าระบุใน prompt ใช้ตามนั้น ถ้าไม่ระบุใช้ Clarity Laser Clinic)",
  "author": "นพ.ฐิติคมน์ 61395, แพทย์ผู้เชี่ยวชาญด้านผิวหนังและเลเซอร์ (ค่านี้ต้องเป็นค่านี้เสมอ ห้ามเปลี่ยน)",
  "industry": "เลือกจาก: Medical Aesthetics, Healthcare, Technology, Finance, Education, Real Estate, Food & Beverage, Travel & Tourism, E-commerce, Other",
  "audience": "กลุ่มเป้าหมายที่เหมาะสมกับหัวข้อ",
  "language": "Thai หรือ English หรือ Both (วิเคราะห์จากภาษาของ prompt)",
  "contentType": "blog หรือ press หรือ landing หรือ knowledge (เลือกที่เหมาะสมที่สุด)",
  "dataPoints": "สร้างข้อมูลสถิติ/กรณีศึกษาที่เกี่ยวข้อง 3-5 จุด"
}

กฎ:
- วิเคราะห์ภาษาจาก prompt: ถ้า prompt เป็นไทยให้ตอบเป็นไทย ถ้าอังกฤษให้ตอบเป็นอังกฤษ
- author ต้องเป็น "นพ.ฐิติคมน์ 61395, แพทย์ผู้เชี่ยวชาญด้านผิวหนังและเลเซอร์" เสมอ ห้ามเปลี่ยนเป็นชื่ออื่น
- audience ควรเฉพาะเจาะจง (อายุ เพศ ปัญหาที่มี)
- ถ้า prompt กล่าวถึง Clarity Laser Clinic หรือคลินิกผิวหนัง ให้เน้น Local SEO ราชเทวี พญาไท สยาม
- **สำคัญมาก**: ใช้ข้อมูลจาก "คลังความรู้ของคลินิก" ด้านล่างในการสร้าง dataPoints ให้เป็นข้อมูลจริงจากเอกสารของคลินิก แทนที่จะสร้างขึ้นเอง
- ถ้าคลังความรู้มีสถิติ ตัวเลข ชื่อผลิตภัณฑ์ หรือโปรโตคอลการรักษา ให้นำมาใช้ใน dataPoints โดยตรง
- audience ควรวิเคราะห์จากเนื้อหาในคลังความรู้ว่าเหมาะกับกลุ่มเป้าหมายใด

${knowledgeContext ? `\n--- คลังความรู้ของคลินิก ---\n${knowledgeContext}\n--- จบคลังความรู้ ---` : ""}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, mode, count } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isBulkMode = mode === "bulk_topics" && typeof count === "number" && count > 0;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch knowledge documents from database
    let knowledgeContext = "";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: docs } = await supabase
        .from("knowledge_documents")
        .select("title, extracted_text, tags")
        .eq("status", "ready")
        .order("created_at", { ascending: false })
        .limit(10);

      if (docs && docs.length > 0) {
        knowledgeContext = docs
          .map((doc: any) => {
            const text = doc.extracted_text || "";
            // Truncate each doc to ~2000 chars to stay within token limits
            const truncated = text.length > 2000 ? text.substring(0, 2000) + "..." : text;
            const tagsStr = doc.tags?.length ? `Tags: ${doc.tags.join(", ")}` : "";
            return `### ${doc.title}\n${tagsStr}\n${truncated}`;
          })
          .join("\n\n");
      }
    } catch (e) {
      console.error("Failed to fetch knowledge docs:", e);
      // Continue without knowledge context
    }

    const systemPrompt = isBulkMode
      ? `คุณเป็น AI สำหรับ Clarity Laser Clinic สร้างหัวข้อบทความ SEO สำหรับคลินิกผิวหนังและเลเซอร์ ย่านราชเทวี ใกล้ BTS พญาไท สยาม

เมื่อได้รับคำสั่ง ให้สร้างหัวข้อบทความที่หลากหลาย ไม่ซ้ำกัน เหมาะกับ AI Search (ChatGPT, Perplexity, Google AI Overview)

${knowledgeContext ? `--- คลังความรู้ ---\n${knowledgeContext}\n--- จบ ---\nใช้ข้อมูลจากคลังความรู้ช่วยสร้างหัวข้อที่เฉพาะเจาะจงและมีข้อมูลรองรับ` : ""}

ตอบเป็น JSON เท่านั้น: {"topics": ["หัวข้อ 1", "หัวข้อ 2", ...]}
ห้ามใส่ markdown code block`
      : buildSystemPrompt(knowledgeContext);

    const userMsg = isBulkMode
      ? `สร้าง ${count} หัวข้อบทความที่แตกต่างกัน จากคำสั่ง: "${prompt}"\nต้องมีจำนวนครบ ${count} หัวข้อ แต่ละหัวข้อเป็นคำถามหรือ keyword ที่คนจะค้นหา`
      : prompt;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "คำขอมากเกินไป กรุณารอสักครู่" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "เครดิต AI หมด" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("ไม่สามารถ parse ผลลัพธ์จาก AI ได้");
      }
    }

    // Always lock author to Dr. Thitikamon
    parsed.author = "นพ.ฐิติคมน์ 61395, แพทย์ผู้เชี่ยวชาญด้านผิวหนังและเลเซอร์";

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("canvas-autofill error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
