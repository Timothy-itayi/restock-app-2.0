/**
 * Email formatting utilities
 * Ported from legacy Deno function
 * Converts plain text to HTML with proper formatting
 */

/**
 * Converts plain text email body to HTML
 * - Converts double newlines to paragraph breaks
 * - Preserves single newlines as <br>
 * - Handles bullet points
 */
export function formatEmailHtml(body: string): string {
  if (!body || typeof body !== "string") {
    return "";
  }

  // Split by double newlines to create paragraphs
  const paragraphs = body.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const formattedParagraphs = paragraphs.map((para) => {
    const trimmed = para.trim();
    
    // Check if this looks like a bullet list
    if (trimmed.split("\n").every((line) => /^[-*•]\s/.test(line.trim()))) {
      const items = trimmed
        .split("\n")
        .map((line) => {
          const text = line.replace(/^[-*•]\s+/, "").trim();
          return text ? `<li>${escapeHtml(text)}</li>` : "";
        })
        .filter(Boolean);
      return items.length > 0 ? `<ul>${items.join("")}</ul>` : "";
    }

    // Regular paragraph: convert single newlines to <br>
    // Escape HTML first, then add <br> tags so they aren't escaped
    const escapedText = escapeHtml(trimmed);
    const withBreaks = escapedText.replace(/\n/g, "<br>");
    return `<p>${withBreaks}</p>`;
  });

  return formattedParagraphs.join("");
}

/**
 * Formats email body with items list
 * Creates a professional order table
 */
export function formatEmailWithItems(
  body: string,
  items: Array<{ productName: string; quantity: number }>,
  storeName: string
): { text: string; html: string } {
  const formattedBody = body.trim();
  
  // Plain text version
  const itemsText = items
    .map((i) => `${i.quantity} x ${i.productName}`)
    .join("\n");
    
  const text = [
    formattedBody,
    "",
    "Order Items:",
    "----------------------------------------",
    itemsText,
    "----------------------------------------",
    "",
    `Sent via Restock App for ${storeName}`,
  ].join("\n");

  // HTML version
  const bodyHtml = formatEmailHtml(formattedBody);
  
  // Generate items table
  const tableRows = items
    .map(
      (i) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: bold; width: 60px; text-align: center;">${i.quantity}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${escapeHtml(i.productName)}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; padding-top: 20px; }
          .logo { width: 64px; height: 64px; border-radius: 12px; }
          .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; text-align: center; }
          p { margin-bottom: 1em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <!-- Replace with your hosted image URL -->
            <img src="https://round-sunset-fc34.parse-doc.workers.dev/" alt="Restock" class="logo" />
            <div style="color: #6B7F6B; font-weight: bold; margin-top: 8px; font-size: 18px;">Restock App</div>
          </div>

          <div class="content">
            ${bodyHtml}
          </div>
          
          ${items.length > 0 ? `
            <table class="order-table">
              <thead style="background-color: #f9f9f9;">
                <tr>
                  <th style="padding: 8px 12px; text-align: center; border-bottom: 1px solid #eee;">Qty</th>
                  <th style="padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee;">Item</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          ` : ""}
          
          <div class="footer">
            <p>Sent via <strong>Restock App</strong> for <strong>${escapeHtml(storeName)}</strong></p>
          </div>
        </div>
      </body>
    </html>
  `.trim();

  return { text, html };
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

