/**
 * Company/Organization worker entry point
 * Handles KV-based multi-store visibility
 */

import { handleCorsPreflight, withCors } from "../shared/utils/cors";
import { createError } from "../shared/utils/errors";
import { 
  handleCreateOrg, 
  handleJoinOrg, 
  handleGetStores, 
  handlePublishSnapshot, 
  handleGetSnapshot,
  type Env 
} from "./handler";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return handleCorsPreflight();
      }

      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      // POST /org - Create a new company
      if (method === "POST" && path === "/org") {
        const body = await request.json() as { storeName: string };
        const response = await handleCreateOrg(body.storeName, env);
        return withCors(response);
      }

      // POST /org/join - Join an existing company
      if (method === "POST" && path === "/org/join") {
        const body = await request.json() as { code: string; storeName: string };
        const response = await handleJoinOrg(body.code, body.storeName, env);
        return withCors(response);
      }

      // GET /org/:code/stores - List all stores in the company
      const storesMatch = path.match(/^\/org\/([^/]+)\/stores$/);
      if (method === "GET" && storesMatch) {
        const code = storesMatch[1];
        const response = await handleGetStores(code, env);
        return withCors(response);
      }

      // POST /snapshot - Publish a snapshot
      if (method === "POST" && path === "/snapshot") {
        const body = await request.json() as { code: string; storeName: string; snapshot: any };
        const response = await handlePublishSnapshot(body.code, body.storeName, body.snapshot, env);
        return withCors(response);
      }

      // GET /snapshot/:code/:storeName - Fetch a store's snapshot
      const snapshotMatch = path.match(/^\/snapshot\/([^/]+)\/([^/]+)$/);
      if (method === "GET" && snapshotMatch) {
        const code = snapshotMatch[1];
        const storeName = decodeURIComponent(snapshotMatch[2]);
        const response = await handleGetSnapshot(code, storeName, env);
        return withCors(response);
      }

      const { response } = createError("Not found", 404);
      return withCors(response);
    } catch (err) {
      console.error("company-worker error:", err);
      const { response } = createError("Unexpected server error", 500);
      return withCors(response);
    }
  },
};

