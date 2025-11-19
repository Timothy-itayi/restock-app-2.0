// backend/send-email/index.ts

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      if (request.method === "OPTIONS") {
        return corsResponse();
      }

      if (request.method !== "POST") {
        return json({ success: false, error: "Method not allowed" }, 405);
      }

      const payload = await safeJson(request);
      if (!payload.ok) {
        return json({ success: false, error: payload.error }, 400);
      }

      const body = payload.value;

      const validation = validateEmailRequest(body);
      if (!validation.ok) {
        return json({ success: false, error: validation.error }, 400);
      }

      const { supplierEmail, replyTo, subject, body: emailBody, items, storeName } =
        validation.value!;

      const textBody = renderTextBody(emailBody, items, storeName);
      const htmlBody = renderHtmlBody(emailBody, items, storeName);

      const res = await sendViaResend(
        {
          to: supplierEmail,
          replyTo,
          subject,
          html: htmlBody,
          text: textBody,
          storeName
        },
        env
      );

      if (!res.ok) {
        return json({ success: false, error: res.error }, 502);
      }

      return json({ success: true, messageId: res.id });
    } catch (err: any) {
      console.error("send-email error:", err);
      return json({ success: false, error: "Unexpected server error" }, 500);
    }
  }
};

// ---------------------------------------------------------------------
// Email provider: Resend
// ---------------------------------------------------------------------
async function sendViaResend(
  params: {
    to: string;
    replyTo: string;
    subject: string;
    html: string;
    text: string;
    storeName: string;
  },
  env: Env
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const payload = {
    from: env.EMAIL_FROM_ADDRESS,
    to: [params.to],
    reply_to: params.replyTo,
    subject: params.subject,
    text: params.text,
    html: params.html
  };

  const r = await fetch(env.EMAIL_PROVIDER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!r.ok) {
    const err = await r.text().catch(() => "Unknown error");
    console.error("Resend failure:", err);
    return { ok: false, error: err };
  }

  const data = await r.json();
  return { ok: true, id: data.id };
}

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------
function validateEmailRequest(input: any) {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Invalid JSON" };
  }

  const supplierEmail = safeEmail(input.supplierEmail);
  const replyTo = safeEmail(input.replyTo);
  const subject = safeString(input.subject);
  const body = safeString(input.body);
  const items = Array.isArray(input.items) ? input.items : [];

  if (!supplierEmail) return { ok: false, error: "supplierEmail is required" };
  if (!replyTo) return { ok: false, error: "replyTo is required" };
  if (!subject) return { ok: false, error: "subject is required" };
  if (!body) return { ok: false, error: "body is required" };

  const cleanedItems = items
    .map((i: any) => {
      const name = safeString(i.productName);
      const qty = typeof i.quantity === "number" ? i.quantity : 0;
      if (!name || qty <= 0) return null;
      return { productName: name, quantity: qty };
    })
    .filter(Boolean);

  return {
    ok: true,
    value: {
      supplierEmail,
      replyTo,
      subject,
      body,
      items: cleanedItems,
      storeName: safeString(input.storeName || "Restock App")
    }
  };
}

// ---------------------------------------------------------------------
// Email Rendering
// ---------------------------------------------------------------------
function renderTextBody(body: string, items: any[], storeName: string): string {
  const lines = [body.trim(), "", "Items:"];
  for (const i of items) lines.push(`- ${i.quantity} x ${i.productName}`);
  lines.push("", `Sent on behalf of ${storeName}`);
  return lines.join("\n");
}

function renderHtmlBody(body: string, items: any[], storeName: string): string {
  const formatted = body
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  const itemsHtml = items
    .map((i) => `<li>${i.quantity} × ${i.productName}</li>`)
    .join("");

  return `
    <html>
      <body>
        <p>${formatted}</p>
        <ul>${itemsHtml}</ul>
        <p>Sent on behalf of ${storeName}</p>
      </body>
    </html>
  `;
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
async function safeJson(req: Request) {
  try {
    return { ok: true, value: await req.json() };
  } catch {
    return { ok: false, error: "Invalid JSON payload" };
  }
}

function safeString(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

function safeEmail(v: any) {
  const s = safeString(v);
  return s.includes("@") ? s : "";
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

function corsResponse() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

interface Env {
  RESEND_API_KEY: string;
  EMAIL_FROM_ADDRESS: string;
  EMAIL_PROVIDER_URL: string;
}
