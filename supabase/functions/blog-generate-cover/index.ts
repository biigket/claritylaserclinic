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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build rich article context for the AI
    const contextParts: string[] = [];
    if (title) contextParts.push(`Article Title: "${title}"`);
    if (excerpt) contextParts.push(`Summary: "${excerpt}"`);
    if (tags) contextParts.push(`Topics/Tags: ${tags}`);
    if (content_summary) contextParts.push(`Content Preview: "${content_summary}"`);
    const articleContext = contextParts.join("\n");

    // Fetch relevant reference images from database
    let referenceImageUrls: string[] = [];
    let doctorImageUrl: string | null = null;
    try {
      // Build search terms from title/tags
      const searchTerms = [
        ...(title ? title.toLowerCase().split(/\s+/) : []),
        ...(tags ? tags.toLowerCase().split(",").map((t: string) => t.trim()) : []),
      ].filter((t: string) => t.length > 2);

      // Fetch all reference images
      const { data: refImages } = await supabase
        .from("reference_images")
        .select("image_url, title, category, tags")
        .order("created_at", { ascending: false })
        .limit(20);

      if (refImages && refImages.length > 0) {
        // Separate doctor images from others
        const doctorImages = refImages.filter((img: any) => img.category === "doctor");
        const nonDoctorImages = refImages.filter((img: any) => img.category !== "doctor");

        // Always pick a random doctor image if any exist
        if (doctorImages.length > 0) {
          const randomIdx = Math.floor(Math.random() * doctorImages.length);
          doctorImageUrl = doctorImages[randomIdx].image_url;
        }

        // Score non-doctor images by relevance to article
        const scored = nonDoctorImages.map((img: any) => {
          let score = 0;
          const imgText = `${img.title} ${img.category} ${(img.tags || []).join(" ")}`.toLowerCase();
          for (const term of searchTerms) {
            if (imgText.includes(term)) score += 2;
          }
          // Category boost
          if (img.category === "device" && articleContext.toLowerCase().match(/เครื่อง|laser|เลเซอร์|device|doublo|hifu|rf|ultraformer/)) score += 3;
          if (img.category === "result" && articleContext.toLowerCase().match(/ผลลัพธ์|result|before|after|รีวิว/)) score += 3;
          if (img.category === "clinic" && articleContext.toLowerCase().match(/คลินิก|clinic|clarity/)) score += 3;
          return { ...img, score };
        });

        // Always take top 2-3 reference images (force usage if any exist)
        scored.sort((a: any, b: any) => b.score - a.score);
        const topImages = scored.slice(0, 3);
        referenceImageUrls = topImages.map((img: any) => img.image_url);
      }
    } catch (e) {
      console.error("Failed to fetch reference images:", e);
    }

    const referenceBlock = referenceImageUrls.length > 0 ? `
CRITICAL — REFERENCE IMAGES PROVIDED:
I've attached actual photos of the clinic's real medical devices.

RULE 1 — DO NOT MODIFY THE DEVICE:
Reproduce each device/machine EXACTLY as it appears in the reference photos. Same shape, color, proportions, buttons, screens, handles, cables — EVERYTHING identical. Do NOT stylize, redesign, recolor, or reimagine the equipment in any way. Treat the device as a sacred object that cannot be changed.

RULE 2 — CAMERA DISTANCE (MOST IMPORTANT):
- Place the camera FAR AWAY so the ENTIRE device fits comfortably in the frame with generous space around it.
- The device should occupy only about 40-50% of the image height, centered vertically.
- There MUST be visible empty space above the device and on both sides.
- Think "product catalog photo taken from 3 meters away" — NOT a close-up.
- ABSOLUTELY FORBIDDEN: zooming in, close-up shots, cropping any part of the device.
- If the 16:9 layout makes it tight, you may hide up to 20% of the bottom (base/wheels only), but NEVER crop top or sides.

RULE 3 — BACKGROUND ONLY:
Design ONLY the background and environment around the untouched device. Use elegant clinic interiors, soft lighting, bokeh, color accents, and atmospheric effects to create a premium mood that matches the article topic.` : "";

    const doctorBlock = doctorImageUrl ? `
RULE 4 — DOCTOR/STAFF PLACEMENT (MANDATORY):
I've also attached a photo of a doctor/staff member. You MUST include this person in the final image.
- Place the doctor on the RIGHT side of the image.
- The doctor's HEAD should be positioned at approximately 20% from the top of the image (80% above the horizontal center line).
- Show them from roughly waist-up or chest-up, standing tall and prominently on the right side.
- Reproduce the doctor's face, hair, clothing, and appearance EXACTLY as in the reference photo — do NOT change or stylize them.
- The doctor should look professional, confident, and approachable.
- The doctor is a SECONDARY element — the device remains the hero.` : "";

    const textPrompt = `You are a professional medical aesthetic blog cover designer.

${articleContext}

${referenceBlock}
${doctorBlock}

COMPOSITION:
${referenceImageUrls.length > 0 ? "- The reference device is the HERO element, shown in FULL from a DISTANT camera angle" : "- Create imagery that directly represents the article topic"}
${doctorImageUrl ? "- Doctor/staff member positioned on the RIGHT side, head at ~20% from top (tall, prominent)" : ""}
- Premium clinic environment background
- Wide shot, NOT close-up
- 16:9 aspect ratio, ultra high resolution, photorealistic

STYLE:
- Modern, minimal, luxury aesthetic medicine
- Dark brown and taupe background palette with warm accents
- Soft diffused cinematic lighting
- Premium, trustworthy, clean clinical atmosphere

STRICT RULES:
- No text, letters, logos, watermarks, or typography of any kind
- No visible medical tools or needles
- Keep minimal and elegant${extra_prompt ? `\n\nADDITIONAL STYLE INSTRUCTIONS FROM EDITOR:\n${extra_prompt}` : ""}`;

    // Build message content - multimodal if we have reference images or doctor image
    const allImageUrls = [...referenceImageUrls];
    if (doctorImageUrl) allImageUrls.push(doctorImageUrl);

    let messageContent: any;
    if (allImageUrls.length > 0) {
      messageContent = [
        { type: "text", text: textPrompt },
        ...allImageUrls.map(url => ({
          type: "image_url",
          image_url: { url },
        })),
      ];
    } else {
      messageContent = textPrompt;
    }

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
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: messageContent }],
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
      imageBase64 = choice?.message?.images?.[0]?.image_url?.url;
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
