import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const imageBase64: string | undefined = body.imageBase64;
    const imageUrl: string | undefined = body.imageUrl;

    if (!imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "imageBase64 or imageUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    // If we have an Anthropic key and a base64 image, use Claude vision for real OCR
    if (anthropicKey && imageBase64) {
      try {
        const extracted = await extractWithClaude(imageBase64, anthropicKey);
        return new Response(
          JSON.stringify(extracted),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (claudeErr) {
        console.error("Claude OCR failed, falling back to blank form:", claudeErr);
      }
    }

    // Fallback: return a blank-but-valid structure so the frontend form opens for manual entry
    const fallback = {
      store_name: "",
      receipt_date: today,
      subtotal: 0,
      tax: 0,
      total: 0,
      items: [],
      raw_text: "",
    };

    return new Response(
      JSON.stringify(fallback),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OCR Error:", error);
    // Never return a 500 — always give the client a usable blank form
    const today = new Date().toISOString().split("T")[0];
    return new Response(
      JSON.stringify({
        store_name: "",
        receipt_date: today,
        subtotal: 0,
        tax: 0,
        total: 0,
        items: [],
        raw_text: "",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function extractWithClaude(imageBase64: string, apiKey: string) {
  // Strip the data URI prefix to get the raw base64 and media type
  let mediaType = "image/jpeg";
  let base64Data = imageBase64;
  const match = imageBase64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (match) {
    mediaType = match[1];
    base64Data = match[2];
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            {
              type: "text",
              text: `Extract receipt data from this image. Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "store_name": "Store name or empty string",
  "receipt_date": "YYYY-MM-DD or today's date",
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "items": [
    { "item_name": "Item name", "quantity": 1, "price": 0.00 }
  ],
  "raw_text": "full receipt text you can read"
}
If you cannot read a field clearly, use an empty string or 0. Always return valid JSON.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const result = await response.json();
  const content = result.content?.[0]?.text ?? "";

  // Parse the JSON — strip any accidental markdown fences
  const jsonStr = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(jsonStr);

  // Sanitize: ensure all required fields exist with correct types
  const today = new Date().toISOString().split("T")[0];
  return {
    store_name: String(parsed.store_name ?? ""),
    receipt_date: String(parsed.receipt_date ?? today),
    subtotal: Number(parsed.subtotal ?? 0),
    tax: Number(parsed.tax ?? 0),
    total: Number(parsed.total ?? 0),
    items: Array.isArray(parsed.items)
      ? parsed.items.map((i: Record<string, unknown>) => ({
          item_name: String(i.item_name ?? ""),
          quantity: Number(i.quantity ?? 1),
          price: Number(i.price ?? 0),
        }))
      : [],
    raw_text: String(parsed.raw_text ?? ""),
  };
}
