import AsyncStorage from '@react-native-async-storage/async-storage';

const COMPANY_LINK_KEY = 'company_link';
const SNAPSHOT_CACHE_KEY = 'snapshot_cache';

export type CompanyLink = {
  code: string;
  orgId: string;
  storeName: string;
  joinedAt: number;
};

export async function getCompanyLink(): Promise<CompanyLink | null> {
  const json = await AsyncStorage.getItem(COMPANY_LINK_KEY);
  return json ? JSON.parse(json) : null;
}

export async function setCompanyLink(link: CompanyLink | null): Promise<void> {
  if (link) {
    await AsyncStorage.setItem(COMPANY_LINK_KEY, JSON.stringify(link));
  } else {
    await AsyncStorage.removeItem(COMPANY_LINK_KEY);
  }
}

export async function getCachedSnapshots(): Promise<Record<string, any>> {
  const json = await AsyncStorage.getItem(SNAPSHOT_CACHE_KEY);
  return json ? JSON.parse(json) : {};
}

export async function setCachedSnapshots(snapshots: Record<string, any>): Promise<void> {
  await AsyncStorage.setItem(SNAPSHOT_CACHE_KEY, JSON.stringify(snapshots));
}

