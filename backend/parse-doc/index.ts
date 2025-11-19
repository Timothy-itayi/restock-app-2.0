// backend/parse-doc/index.ts

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
      try {
        if (request.method !== "POST") {
          return json({ error: "Method not allowed" }, 405);
        }
  
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
          return json({ error: "Expected multipart/form-data" }, 400);
        }
  
        const form = await request.formData();
        const file = form.get("file") as File;
  
        if (!file) {
          return json({ error: "No file uploaded" }, 400);
        }
  
        // -------------------------------------------------------------------
        // FILE SIZE LIMIT (10 MB)
        // -------------------------------------------------------------------
        if (file.size > 10 * 1024 * 1024) {
          return json({ error: "File too large (limit 10 MB)" }, 413);
        }
  
        const mime = file.type || "application/octet-stream";
  
        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = base64FromArrayBuffer(arrayBuffer);
  
        // -------------------------------------------------------------------
        // CALL OPENAI VISION
        // -------------------------------------------------------------------
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "input_file",
                    input_file: { data: base64, mime_type: mime }
                  },
                  {
                    type: "text",
                    text: `Extract a clean JSON array of supplier items.
  
  Return ONLY this JSON shape:
  
  {
    "items": [
      { "supplier": "<string>", "product": "<string>" }
    ]
  }
  
  Rules:
  - No extra text
  - No markdown
  - No comments
  - Ignore empty rows
  - Ignore prices, totals, discounts
  - Supplier may be null or empty
  - Product must be a readable product name`
                  }
                ]
              }
            ],
            temperature: 0.1
          })
        });
  
        if (!aiResponse.ok) {
          console.log(await aiResponse.text());
          return json({ error: "AI service failed" }, 500);
        }
  
        const data = await aiResponse.json();
        const raw = data?.choices?.[0]?.message?.content;
  
        if (!raw) {
          return json({ error: "Empty AI response" }, 500);
        }
  
        // -------------------------------------------------------------------
        // SAFELY PARSE AI JSON
        // -------------------------------------------------------------------
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return json({ error: "Invalid JSON returned from AI" }, 500);
        }
  
        if (!parsed.items || !Array.isArray(parsed.items)) {
          return json({ error: "Malformed item list" }, 500);
        }
  
        // Normalize result
        const items = parsed.items
          .map((i: any, idx: number) => {
            const product = safe(i.product);
            if (!product) return null;
            return {
              id: `parsed-${Date.now()}-${idx}`,
              product,
              supplier: safe(i.supplier)
            };
          })
          .filter(Boolean);
  
        return json({ items });
      } catch (err: any) {
        console.error("parse-doc error:", err);
        return json({ error: "Unexpected server error" }, 500);
      }
    }
  };
  
  // ---------------------------------------------------------------------------
  // Helper functions
  // ---------------------------------------------------------------------------
  function base64FromArrayBuffer(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }
  
  function safe(v: any): string {
    return typeof v === "string" ? v.trim() : "";
  }
  
  function json(data: any, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  export interface Env {
    OPENAI_API_KEY: string;
  }
  