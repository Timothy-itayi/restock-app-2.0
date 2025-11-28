/**
 * Tests for Document Picker Utility
 * @file tests/utils/pickDocuments.test.ts
 */
import * as DocumentPicker from 'expo-document-picker';
import { pickDocuments } from '../../lib/utils/pickDocuments';

// Mock Expo Document Picker
jest.mock('expo-document-picker');

describe('pickDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should enforce image-only types by default', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null
    });

    await pickDocuments();

    expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith(expect.objectContaining({
      type: ['image/*']
    }));
  });

  it('should allow overriding types', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null
    });

    await pickDocuments({ types: ['application/pdf'] });

    expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith(expect.objectContaining({
      type: ['application/pdf']
    }));
  });

  it('should return canceled result when user cancels', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null
    });

    const result = await pickDocuments();
    expect(result.canceled).toBe(true);
    expect(result.assets).toEqual([]);
  });

  it('should return assets when user picks a file', async () => {
    const mockAsset = {
      uri: 'file://test.jpg',
      name: 'test.jpg',
      size: 1024,
      mimeType: 'image/jpeg'
    };

    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [mockAsset]
    });

    const result = await pickDocuments();
    
    expect(result.canceled).toBe(false);
    expect(result.assets.length).toBe(1);
    expect(result.assets[0].name).toBe('test.jpg');
    expect(result.assets[0].uri).toBe('file://test.jpg');
  });
});
