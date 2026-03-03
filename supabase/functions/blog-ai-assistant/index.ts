import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `คุณเป็นผู้ช่วยเขียนบทความสำหรับ Clarity Laser Clinic ซึ่งเชี่ยวชาญด้านการรักษาหลุมสิว เลเซอร์ และความงาม

หน้าที่ของคุณ:
- ช่วยเขียนบทความภาษาไทยและอังกฤษเกี่ยวกับการรักษาผิว หลุมสิว เลเซอร์ ฟิลเลอร์ โบท็อกซ์
- ให้ข้อมูลทางการแพทย์ที่ถูกต้องและน่าเชื่อถือ
- เขียนในรูปแบบ Markdown ที่พร้อมใช้งาน
- เน้น SEO keywords ที่เกี่ยวข้อง
- ใช้ภาษาที่เป็นมืออาชีพแต่เข้าใจง่าย

เมื่อผู้ใช้ขอให้เขียนบทความ ให้ตอบเป็น Markdown format ที่พร้อมวางในระบบ
เมื่อผู้ใช้ขอ SEO metadata ให้แนะนำ meta title (<60 chars) และ meta description (<160 chars)`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, action } = await req.json();
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
