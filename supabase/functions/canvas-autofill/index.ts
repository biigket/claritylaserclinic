import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `คุณเป็นผู้ช่วยกรอกฟอร์ม AI-FIRST Content Canvas จาก prompt สั้นๆ ของผู้ใช้

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
- สร้าง dataPoints ที่สมจริงและเฉพาะเจาะจง
- author ต้องเป็น "นพ.ฐิติคมน์ 61395, แพทย์ผู้เชี่ยวชาญด้านผิวหนังและเลเซอร์" เสมอ ห้ามเปลี่ยนเป็นชื่ออื่น
- audience ควรเฉพาะเจาะจง (อายุ เพศ ปัญหาที่มี)
- ถ้า prompt กล่าวถึง Clarity Laser Clinic หรือคลินิกผิวหนัง ให้เน้น Local SEO ราชเทวี พญาไท สยาม`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
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
