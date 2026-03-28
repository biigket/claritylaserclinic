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
    const { documentId, fileUrl, fileName, fileType } = await req.json();
    if (!documentId || !fileUrl) {
      return new Response(JSON.stringify({ error: "documentId and fileUrl are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download the file from storage
    const pathMatch = fileUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/knowledge\/(.+)/);
    const filePath = pathMatch ? pathMatch[1] : fileUrl;

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("knowledge")
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message || "unknown"}`);
    }

    // Convert file to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Determine mime type
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
      txt: "text/plain",
      md: "text/markdown",
      csv: "text/csv",
    };
    const ext = (fileName || "").split(".").pop()?.toLowerCase() || "";
    const mimeType = mimeMap[ext] || "application/octet-stream";

    // For text files, extract directly
    let extractedText = "";
    if (["txt", "md", "csv"].includes(ext)) {
      extractedText = new TextDecoder().decode(arrayBuffer);
    } else {
      // Use Gemini vision to extract text from PDF/images
      const messages: any[] = [
        {
          role: "system",
          content: `คุณเป็นผู้ช่วยสกัดข้อมูลจากเอกสาร ให้สกัดเนื้อหาทั้งหมดออกมาเป็นข้อความ โดยรักษาโครงสร้างเดิม (หัวข้อ, ย่อหน้า, ตาราง) ให้มากที่สุด
สิ่งที่ต้องทำ:
1. สกัดข้อความทั้งหมดจากเอกสาร
2. สรุปประเด็นสำคัญ 5-10 ข้อ
3. ระบุ keywords สำคัญ
4. ถ้ามีข้อมูลสถิติ ตัวเลข ผลวิจัย ให้แยกออกมาชัดเจน

ตอบเป็นภาษาเดียวกับเอกสาร ถ้ามีทั้ง 2 ภาษา ให้สกัดทั้ง 2 ภาษา

Format:
## เนื้อหาหลัก
[เนื้อหาที่สกัดมา]

## ประเด็นสำคัญ
- จุดที่ 1
- จุดที่ 2
...

## Keywords
keyword1, keyword2, ...

## ข้อมูลสถิติ/ตัวเลข
- สถิติ 1
- สถิติ 2
...`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `สกัดข้อมูลจากไฟล์ "${fileName}" (${fileType})`,
            },
            ...(["txt", "md", "csv"].includes(ext) ? [] : [{
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            }]),
          ],
        },
      ];

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "คำขอมากเกินไป กรุณารอสักครู่" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "เครดิต AI หมด" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await aiResponse.text();
        console.error("AI extraction error:", aiResponse.status, errText);
        throw new Error("AI extraction failed");
      }

      const aiData = await aiResponse.json();
      extractedText = aiData.choices?.[0]?.message?.content || "";
    }

    // Extract tags from the text
    let tags: string[] = [];
    const keywordsMatch = extractedText.match(/## Keywords\n([^\n#]+)/);
    if (keywordsMatch) {
      tags = keywordsMatch[1].split(",").map((t: string) => t.trim()).filter(Boolean).slice(0, 10);
    }

    // Update the document record
    await supabase
      .from("knowledge_documents")
      .update({
        extracted_text: extractedText,
        tags,
        status: "ready",
      })
      .eq("id", documentId);

    return new Response(JSON.stringify({ success: true, textLength: extractedText.length, tags }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-document-text error:", e);

    // Try to mark document as failed
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      const body = await req.clone().json().catch(() => ({}));
      if (body.documentId) {
        await supabase.from("knowledge_documents").update({ status: "failed" }).eq("id", body.documentId);
      }
    } catch { /* ignore */ }

    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
