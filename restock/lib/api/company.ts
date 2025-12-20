/**
 * API Client for Company/Organization endpoints
 */

const BASE_URL = 'https://restock-company.parse-doc.workers.dev';

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
  const response = await fetch(`${BASE_URL}/org`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeName }),
  });

  if (!response.ok) {
    const err = await response.json() as any;
    throw new Error(err.message || 'Failed to create company');
  }

  return response.json();
}

export async function joinOrg(code: string, storeName: string): Promise<JoinOrgResponse> {
  const response = await fetch(`${BASE_URL}/org/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, storeName }),
  });

  if (!response.ok) {
    const err = await response.json() as any;
    throw new Error(err.message || 'Failed to join company');
  }

  return response.json();
}

export async function fetchStores(code: string): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/org/${code}/stores`);
  
  if (!response.ok) {
    const err = await response.json() as any;
    throw new Error(err.message || 'Failed to fetch stores');
  }

  const data = await response.json() as StoresResponse;
  return data.stores;
}

export async function publishSnapshot(code: string, storeName: string, snapshot: any): Promise<void> {
  const response = await fetch(`${BASE_URL}/snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, storeName, snapshot }),
  });

  if (!response.ok) {
    const err = await response.json() as any;
    throw new Error(err.message || 'Failed to publish snapshot');
  }
}

export async function fetchSnapshot(code: string, storeName: string): Promise<Snapshot> {
  const response = await fetch(`${BASE_URL}/snapshot/${code}/${encodeURIComponent(storeName)}`);
  
  if (!response.ok) {
    const err = await response.json() as any;
    throw new Error(err.message || 'Failed to fetch snapshot');
  }

  return response.json();
}

