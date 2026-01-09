import Config from '../config';
import logger from '../helpers/logger';

/**
 * API Client for Company/Organization endpoints
 */

const BASE_URL = Config.COMPANY_API_URL;

export type CreateOrgResponse = {
  orgId: string;
  code: string;
  stores: string[];
};

export type JoinOrgResponse = {
  orgId: string;
  stores: string[];
};

export type StoresResponse = {
  orgId: string;
  stores: string[];
};

export type Snapshot = {
  storeName: string;
  publishedAt: number;
  sessions: any[];
  suppliers: any[];
};

export async function createOrg(storeName: string): Promise<CreateOrgResponse> {
  logger.info('[company] Creating organization', { storeName });
  const response = await fetch(`${BASE_URL}/org`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeName }),
  });

  if (!response.ok) {
    const err = await response.json() as any;
    logger.error('[company] Failed to create organization', { status: response.status, message: err.message });
    throw new Error(err.message || 'Failed to create company');
  }

  return response.json();
}

export async function joinOrg(code: string, storeName: string): Promise<JoinOrgResponse> {
  logger.info('[company] Joining organization', { code, storeName });
  const response = await fetch(`${BASE_URL}/org/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, storeName }),
  });

  if (!response.ok) {
    const err = await response.json() as any;
    logger.error('[company] Failed to join organization', { status: response.status, message: err.message });
    throw new Error(err.message || 'Failed to join company');
  }

  return response.json();
}

export async function fetchStores(code: string): Promise<string[]> {
  logger.info('[company] Fetching stores', { code });
  const response = await fetch(`${BASE_URL}/org/${code}/stores`);
  
  if (!response.ok) {
    const err = await response.json() as any;
    logger.error('[company] Failed to fetch stores', { status: response.status, message: err.message });
    throw new Error(err.message || 'Failed to fetch stores');
  }

  const data = await response.json() as StoresResponse;
  return data.stores;
}

export async function publishSnapshot(code: string, storeName: string, snapshot: any): Promise<void> {
  logger.info('[company] Publishing snapshot', { code, storeName });
  const response = await fetch(`${BASE_URL}/snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, storeName, snapshot }),
  });

  if (!response.ok) {
    const err = await response.json() as any;
    logger.error('[company] Failed to publish snapshot', { status: response.status, message: err.message });
    throw new Error(err.message || 'Failed to publish snapshot');
  }
}

export async function fetchSnapshot(code: string, storeName: string): Promise<Snapshot> {
  logger.info('[company] Fetching snapshot', { code, storeName });
  const response = await fetch(`${BASE_URL}/snapshot/${code}/${encodeURIComponent(storeName)}`);
  
  if (!response.ok) {
    const err = await response.json() as any;
    logger.error('[company] Failed to fetch snapshot', { status: response.status, message: err.message });
    throw new Error(err.message || 'Failed to fetch snapshot');
  }

  return response.json();
}
