/**
 * Generate a unique 8-character invite code (e.g., GROC-7X2M)
 * Uses a limited character set to avoid ambiguous characters (0, O, 1, I)
 */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const generatePart = (length: number) =>
    Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

  return `${generatePart(4)}-${generatePart(4)}`;
}

