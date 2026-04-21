Deno.serve(async () => {
  const key = Deno.env.get("SEO_AGENT_API_KEY")!;
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/seo-agent-create-draft`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-seo-agent-key": key,
    },
    body: JSON.stringify({
      title_th: "ทดสอบบทความจาก SEO Agent",
      content_th: "## คำตอบสั้น\nนี่คือ draft ทดสอบจาก SEO Agent",
      seo_score: 80,
      aeo_score: 80,
      geo_score: 80,
      safety_score: 95,
    }),
  });
  const body = await resp.text();
  return new Response(JSON.stringify({ status: resp.status, body }), {
    headers: { "Content-Type": "application/json" },
  });
});