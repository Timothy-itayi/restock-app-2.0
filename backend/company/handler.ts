/**
 * Company/Organization handlers
 * Implements KV logic for multi-store visibility
 */

import { generateInviteCode } from "../shared/utils/codeGen";
import { createError, createSuccess } from "../shared/utils/errors";

export interface Env {
  COMPANY_KV: KVNamespace;
}

interface OrgRecord {
  orgId: string;
  code: string;
  createdAt: number;
  stores: string[];
}

/**
 * POST /org - Create a new organization
 */
export async function handleCreateOrg(storeName: string, env: Env): Promise<Response> {
  if (!storeName) return createError("storeName is required", 400).response;

  const code = generateInviteCode();
  const orgId = `org_${crypto.randomUUID()}`;
  
  const orgRecord: OrgRecord = {
    orgId,
    code,
    createdAt: Date.now(),
    stores: [storeName]
  };

  // Store by code for easy lookup
  await env.COMPANY_KV.put(`org:${code}`, JSON.stringify(orgRecord));
  
  return new Response(JSON.stringify(orgRecord), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}

/**
 * POST /org/join - Join an existing organization
 */
export async function handleJoinOrg(code: string, storeName: string, env: Env): Promise<Response> {
  if (!code || !storeName) return createError("code and storeName are required", 400).response;

  const orgJson = await env.COMPANY_KV.get(`org:${code}`);
  if (!orgJson) return createError("Invalid invite code", 404).response;

  const orgRecord = JSON.parse(orgJson) as OrgRecord;
  
  if (!orgRecord.stores.includes(storeName)) {
    orgRecord.stores.push(storeName);
    await env.COMPANY_KV.put(`org:${code}`, JSON.stringify(orgRecord));
  }

  return new Response(JSON.stringify(orgRecord), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

/**
 * GET /org/:code/stores - Get all stores in org
 */
export async function handleGetStores(code: string, env: Env): Promise<Response> {
  const orgJson = await env.COMPANY_KV.get(`org:${code}`);
  if (!orgJson) return createError("Invalid invite code", 404).response;

  const orgRecord = JSON.parse(orgJson) as OrgRecord;
  
  return new Response(JSON.stringify({
    orgId: orgRecord.orgId,
    stores: orgRecord.stores
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

/**
 * POST /snapshot - Publish a store snapshot
 */
export async function handlePublishSnapshot(
  code: string, 
  storeName: string, 
  snapshot: any, 
  env: Env
): Promise<Response> {
  if (!code || !storeName || !snapshot) {
    return createError("code, storeName, and snapshot are required", 400).response;
  }

  // Validate org exists
  const orgJson = await env.COMPANY_KV.get(`org:${code}`);
  if (!orgJson) return createError("Invalid invite code", 404).response;

  const orgRecord = JSON.parse(orgJson) as OrgRecord;
  if (!orgRecord.stores.includes(storeName)) {
    return createError("Store not part of this organization", 403).response;
  }

  // Store snapshot with 30-day TTL
  const snapshotKey = `snapshot:${orgRecord.orgId}:${storeName}`;
  await env.COMPANY_KV.put(snapshotKey, JSON.stringify({
    ...snapshot,
    publishedAt: Date.now()
  }), {
    expirationTtl: 60 * 60 * 24 * 30 // 30 days
  });

  return new Response(JSON.stringify({ publishedAt: Date.now() }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

/**
 * GET /snapshot/:code/:storeName - Fetch a store's latest snapshot
 */
export async function handleGetSnapshot(code: string, storeName: string, env: Env): Promise<Response> {
  const orgJson = await env.COMPANY_KV.get(`org:${code}`);
  if (!orgJson) return createError("Invalid invite code", 404).response;

  const orgRecord = JSON.parse(orgJson) as OrgRecord;
  const snapshotKey = `snapshot:${orgRecord.orgId}:${storeName}`;
  
  const snapshotJson = await env.COMPANY_KV.get(snapshotKey);
  if (!snapshotJson) return createError("No snapshot found for this store", 404).response;

  return new Response(snapshotJson, {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

