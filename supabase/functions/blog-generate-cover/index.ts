import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, excerpt, extra_prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const context = [title, excerpt].filter(Boolean).join(" — ");
    if (!context) throw new Error("ต้องมีชื่อบทความหรือบทคัดย่อเพื่อสร้างรูป");

    const prompt = `Create a professional 16:9 ultra high-resolution professional blog cover image, clean medical aesthetic clinic blog cover image for an article about: "${context}".

STYLE & MOOD:
Modern, minimal, luxury aesthetic medicine.
Muted professional tones.
Dark brown and taupe background palette inspired by high-end dermatology branding.
Premium, trustworthy, clean clinical atmosphere.

BACKGROUND:
- Deep dark brown or taupe gradient background.
- Soft studio lighting with subtle depth.
- Cinematic yet minimal.
- Smooth gradient transitions.
- Slight vignette for elegance.

DESIGN ELEMENTS:
- Abstract medical-inspired shapes (very subtle).
- Soft flowing wave textures or light diffusion layers.
- Minimal gold or rose-gold accent glow (very refined, not flashy).
- Soft reflective surface or shadow gradient to create depth.
- Clean negative space for editorial balance.

LIGHTING:
- Soft diffused lighting.
- Gentle rim highlights.
- Subtle volumetric light for premium depth.
- No harsh shadows.

COLOR GRADING:
- Unified warm taupe color grading.
- Muted tones.
- Slight warm highlight accents.
- Balanced contrast.
- High-end dermatology campaign feel.

STRICT RULES:
- No text.
- No letters.
- No logos.
- No watermark.
- No people.
- No typography.
- No medical tools visible.
- Keep minimal and elegant.

OUTPUT:
Ultra-detailed, photorealistic.
High dynamic range.
Crisp and clean.
Editorial blog cover quality.
16:9 aspect ratio.${extra_prompt ? `\n\nADDITIONAL INSTRUCTIONS:\n${extra_prompt}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
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
      console.error("AI image error:", response.status, t);
      throw new Error("AI image generation failed");
    }

    const data = await response.json();
    const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageBase64) throw new Error("ไม่สามารถสร้างรูปภาพได้");

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert base64 to Uint8Array
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const fileName = `blog/ai-cover-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("promotions")
      .upload(fileName, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("promotions").getPublicUrl(fileName);

    return new Response(JSON.stringify({ url: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("blog-generate-cover error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
