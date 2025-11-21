/**
 * CORS utilities for Cloudflare Workers
 * Handles OPTIONS requests and adds CORS headers to responses
 */

export interface CorsOptions {
  origin?: string;
  methods?: string[];
  headers?: string[];
  maxAge?: number;
}

const DEFAULT_OPTIONS: CorsOptions = {
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  headers: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24 hours
};

/**
 * Handles OPTIONS preflight requests
 */
export function handleCorsPreflight(options: CorsOptions = {}): Response {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": opts.origin!,
      "Access-Control-Allow-Methods": opts.methods!.join(", "),
      "Access-Control-Allow-Headers": opts.headers!.join(", "),
      "Access-Control-Max-Age": String(opts.maxAge!),
    },
  });
}

/**
 * Wraps a response with CORS headers
 */
export function withCors(
  response: Response,
  options: CorsOptions = {}
): Response {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", opts.origin!);
  headers.set("Access-Control-Allow-Methods", opts.methods!.join(", "));
  headers.set("Access-Control-Allow-Headers", opts.headers!.join(", "));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Creates a CORS-enabled JSON response
 */
export function corsJson(
  data: any,
  status: number = 200,
  options: CorsOptions = {}
): Response {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
  return withCors(response, options);
}

