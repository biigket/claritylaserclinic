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
    const { title, excerpt, tags, content_summary, extra_prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!title && !excerpt) throw new Error("ต้องมีชื่อบทความหรือบทคัดย่อเพื่อสร้างรูป");

    // Build rich article context for the AI
    const contextParts: string[] = [];
    if (title) contextParts.push(`Article Title: "${title}"`);
    if (excerpt) contextParts.push(`Summary: "${excerpt}"`);
    if (tags) contextParts.push(`Topics/Tags: ${tags}`);
    if (content_summary) contextParts.push(`Content Preview: "${content_summary}"`);
    const articleContext = contextParts.join("\n");

    const prompt = `You are a professional medical aesthetic blog cover designer. Analyze the following article details carefully and create a cover image that DIRECTLY represents the article's specific topic and content.

${articleContext}

INSTRUCTIONS:
1. First, identify the CORE SUBJECT of the article (e.g. acne treatment, laser skin, anti-aging, skincare ingredients, dermatology procedure, etc.)
2. Then design a cover that visually represents THAT specific subject — not a generic medical image.

VISUAL APPROACH — choose the most fitting for the article topic:
- If about a specific skin condition → show abstract representation of skin texture, cellular patterns, or before/after concept
- If about a treatment/procedure → show the concept through elegant medical-inspired abstract art (laser beams, light therapy glow, molecular structures)
- If about skincare/ingredients → show beautiful product-inspired compositions, ingredient textures, botanical elements
- If about beauty/anti-aging → show elegant, aspirational imagery with flowing forms, golden light, youthful energy
- If about science/research → show data visualization aesthetics, molecular structures, DNA-inspired patterns

STYLE:
- Modern, minimal, luxury aesthetic medicine
- Dark brown and taupe background palette with warm accents
- Soft diffused cinematic lighting
- Premium, trustworthy, clean clinical atmosphere
- Ultra high resolution, photorealistic, 16:9 aspect ratio

STRICT RULES:
- No text, letters, logos, watermarks, or typography of any kind
- No people or faces
- No visible medical tools or needles
- Keep minimal and elegant
- The image MUST relate to the article topic, not be generic${extra_prompt ? `\n\nADDITIONAL STYLE INSTRUCTIONS FROM EDITOR:\n${extra_prompt}` : ""}`;

    // Retry up to 2 times if model returns text-only without an image
    let imageBase64: string | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
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
      const choice = data.choices?.[0];

      // Try multiple known response formats
      // Format 1: images array (most common)
      imageBase64 = choice?.message?.images?.[0]?.image_url?.url;
      // Format 2: inline_data in content parts
      if (!imageBase64 && Array.isArray(choice?.message?.content)) {
        const imgPart = choice.message.content.find((p: any) => p.type === "image_url" || p.type === "image" || p.inline_data);
        if (imgPart?.image_url?.url) imageBase64 = imgPart.image_url.url;
        else if (imgPart?.inline_data?.data) imageBase64 = `data:${imgPart.inline_data.mime_type || "image/png"};base64,${imgPart.inline_data.data}`;
      }

      if (imageBase64) break;
      console.warn(`Attempt ${attempt + 1}: AI returned text-only, retrying...`);
    }

    if (!imageBase64) throw new Error("ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่");

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
