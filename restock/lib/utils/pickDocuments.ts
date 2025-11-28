import * as DocumentPicker from 'expo-document-picker';

export type PickedAsset = {
  uri: string;
  name: string;
  size?: number | null;
  mimeType?: string | null;
};

export type PickResult = {
  canceled: boolean;
  assets: PickedAsset[];
};

export type PickOptions = {
  multiple?: boolean;
  copyToCacheDirectory?: boolean;
  // Mime types or UTIs; leave undefined to allow common docs/images
  types?: string[];
};

// Only accept images - PDF conversion is unreliable on mobile
// Users should take photos of their catalogs
const DEFAULT_TYPES = [
  'image/*',
];

export async function pickDocuments(options: PickOptions = {}): Promise<PickResult> {
  const { multiple = true, copyToCacheDirectory = false, types } = options;
  const result = await DocumentPicker.getDocumentAsync({
    multiple,
    copyToCacheDirectory,
    type: types && types.length > 0 ? types : DEFAULT_TYPES
  });

  if (result.canceled) {
    return { canceled: true, assets: [] };
  }

  const assets: PickedAsset[] = (result.assets || []).map(a => ({
    uri: a.uri,
    name: a.name ?? 'Unnamed',
    size: a.size ?? null,
    mimeType: (a as any).mimeType ?? null
  }));

  return { canceled: false, assets };
}

export default pickDocuments;


