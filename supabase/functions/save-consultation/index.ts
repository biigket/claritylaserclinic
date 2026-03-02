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
