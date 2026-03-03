import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `คุณเป็นผู้ช่วยเขียนบทความสำหรับ Clarity Laser Clinic คลินิกผิวหนังและเลเซอร์ชั้นนำ ย่านราชเทวี ใกล้ BTS พญาไท และสยาม

## หน้าที่หลัก
- เขียนบทความ **2 ภาษา (ไทย + อังกฤษ)** พร้อมกันเสมอ
- ให้ข้อมูลทางการแพทย์ที่ถูกต้องและน่าเชื่อถือ
- เขียนในรูปแบบ Markdown ที่พร้อมใช้งาน

## Local SEO Keywords ที่ต้องสอดแทรกในทุกบทความ
ภาษาไทย: หลุมสิว, รักษาหลุมสิว, งานผิว, ยกกระชับ, เลเซอร์, คลินิกราชเทวี, คลินิกใกล้ BTS พญาไท, คลินิกย่านสยาม, Clarity Laser Clinic
ภาษาอังกฤษ: acne scar treatment, skin rejuvenation, face lifting, laser clinic, Ratchathewi clinic, near BTS Phaya Thai, Siam area, Clarity Laser Clinic Bangkok

## รูปแบบการตอบ
เมื่อผู้ใช้ขอให้เขียนบทความ ให้ตอบในรูปแบบ JSON ดังนี้เสมอ (ห้ามใส่ markdown code block ครอบ):
{"title_th":"...","title_en":"...","excerpt_th":"...","excerpt_en":"...","content_th":"...","content_en":"...","meta_title_th":"...","meta_title_en":"...","meta_description_th":"...","meta_description_en":"...","tags":["tag1","tag2"],"slug":"..."}

กฎ:
- title: กระชับ มี keyword หลัก
- excerpt: 2-3 ประโยค สรุปเนื้อหา
- content: เขียน Markdown เต็มรูปแบบ ความยาว 600-1000 คำ มี H2, H3, bullet points
- meta_title: ไม่เกิน 60 ตัวอักษร มี keyword + location
- meta_description: ไม่เกิน 160 ตัวอักษร
- tags: 3-5 tags ที่เกี่ยวข้อง
- slug: English lowercase, ใช้ - คั่น

เมื่อผู้ใช้ถามคำถามทั่วไป (ไม่ใช่ขอเขียนบทความ) ให้ตอบเป็นข้อความปกติ ไม่ต้องเป็น JSON`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const allMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(messages || []),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
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
    console.error("blog-ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
