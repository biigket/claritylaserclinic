import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get("GOOGLE_SHEET_WEBHOOK_URL");
    if (!webhookUrl) {
      throw new Error("GOOGLE_SHEET_WEBHOOK_URL is not configured");
    }

    const body = await req.json();
    const { name, concern, phone, note } = body;

    if (!name || !concern) {
      return new Response(
        JSON.stringify({ error: "Name and concern are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = { name, concern, phone: phone && phone !== "-" ? `'${phone}` : "-", note: note || "" };

    // Send to Google Sheets
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Google Sheets responded with ${response.status}`);
    }

    // Send to additional webhook
    const formWebhookUrl = Deno.env.get("FORM_WEBHOOK_URL");
    if (formWebhookUrl) {
      try {
        await fetch(formWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.error("Additional webhook failed:", e);
      }
    }

    // Send LINE push message to admin
    const lineToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
    const lineAdminId = Deno.env.get("LINE_ADMIN_USER_ID");
    if (lineToken && lineAdminId) {
      try {
        const lineMessage = `📋 แจ้งเตือนปรึกษาใหม่\n👤 ชื่อ: ${name}\n🔍 ปัญหา: ${concern}\n📱 เบอร์: ${payload.phone}\n📝 หมายเหตุ: ${payload.note || "-"}`;
        const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lineToken}`,
          },
          body: JSON.stringify({
            to: lineAdminId,
            messages: [{ type: "text", text: lineMessage }],
          }),
        });
        if (!lineRes.ok) {
          const errBody = await lineRes.text();
          console.error(`LINE API error [${lineRes.status}]: ${errBody}`);
        }
      } catch (e) {
        console.error("LINE push message failed:", e);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error saving to Google Sheets:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
