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
    const withBreaks = trimmed.replace(/\n/g, "<br>");
    return `<p>${escapeHtml(withBreaks)}</p>`;
  });

  return formattedParagraphs.join("");
}

/**
 * Formats email body with items list
 */
export function formatEmailWithItems(
  body: string,
  items: Array<{ productName: string; quantity: number }>,
  storeName: string
): { text: string; html: string } {
  const formattedBody = body.trim();
  const itemsText = items
    .map((i) => `- ${i.quantity} x ${i.productName}`)
    .join("\n");
  const itemsHtml = items
    .map((i) => `<li>${i.quantity} × ${escapeHtml(i.productName)}</li>`)
    .join("");

  const text = [
    formattedBody,
    "",
    "Items:",
    itemsText,
    "",
    `Sent on behalf of ${storeName}`,
  ].join("\n");

  const bodyHtml = formatEmailHtml(formattedBody);
  const html = `
    <html>
      <body>
        ${bodyHtml}
        ${items.length > 0 ? `<ul>${itemsHtml}</ul>` : ""}
        <p>Sent on behalf of ${escapeHtml(storeName)}</p>
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

