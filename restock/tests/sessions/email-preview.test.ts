/**
 * Tests for Email Preview Screen
 * @file tests/sessions/email-preview.test.ts
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EmailPreviewScreen from '../../../app/sessions/[id]/email-preview';

// Mock dependencies
jest.mock('../../../store/useSessionStore', () => ({
  useSessionStore: (selector: any) => {
    const mockSession = {
      id: 'session-1',
      createdAt: Date.now(),
      status: 'pendingEmails',
      items: [
        { id: 'item-1', productName: 'Product A', quantity: 5, supplierId: 'supplier-1' },
        { id: 'item-2', productName: 'Product B', quantity: 10, supplierId: 'supplier-1' },
        { id: 'item-3', productName: 'Product C', quantity: 3, supplierId: 'supplier-2' },
      ],
    };
    if (selector) {
      return selector({
        getSession: (id: string) => id === 'session-1' ? mockSession : undefined,
        updateSession: jest.fn(),
        sessions: [mockSession],
      });
    }
    return {
      getSession: (id: string) => id === 'session-1' ? mockSession : undefined,
      updateSession: jest.fn(),
      sessions: [mockSession],
    };
  },
}));

jest.mock('../../../store/useSupplierStore', () => ({
  useSupplierStore: () => ({
    suppliers: [
      { id: 'supplier-1', name: 'Supplier One', email: 'supplier1@example.com' },
      { id: 'supplier-2', name: 'Supplier Two', email: 'supplier2@example.com' },
    ],
  }),
}));

const mockSenderProfile = {
  name: 'John Doe',
  email: 'john@example.com',
  storeName: 'Test Store',
};

jest.mock('../../../store/useSenderProfileStore', () => ({
  useSenderProfile: jest.fn(() => mockSenderProfile),
}));

jest.mock('../../../lib/api/sendEmail', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
}));

jest.mock('../../../styles/useThemedStyles', () => ({
  useThemedStyles: (fn: any) => fn({
    brand: { primary: '#6d9f72' },
    neutral: {
      lightest: '#ffffff',
      lighter: '#f0eee4',
      light: '#e1e8ed',
      medium: '#a0a38f',
      dark: '#4a4c38',
      darkest: '#1c2011',
    },
  }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'session-1' }),
  router: {
    back: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

describe('EmailPreviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render email preview screen', () => {
    const { getByText } = render(<EmailPreviewScreen />);

    expect(getByText('Email Preview')).toBeTruthy();
  });

  it('should display emails summary with correct count', () => {
    const { getByText } = render(<EmailPreviewScreen />);

    // Should show 2 emails (one per supplier)
    expect(getByText(/2 Emails Ready/)).toBeTruthy();
  });

  it('should display email cards for each supplier', () => {
    const { getByText } = render(<EmailPreviewScreen />);

    expect(getByText('Supplier One')).toBeTruthy();
    expect(getByText('Supplier Two')).toBeTruthy();
  });

  it('should show sender information', () => {
    const { getByText } = render(<EmailPreviewScreen />);

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@example.com')).toBeTruthy();
    expect(getByText('Test Store')).toBeTruthy();
  });

  it('should display Send All Emails button', () => {
    const { getByText } = render(<EmailPreviewScreen />);

    expect(getByText('Send All Emails')).toBeTruthy();
  });

  it('should show confirmation modal when Send All is pressed', () => {
    const { getByText } = render(<EmailPreviewScreen />);

    const sendButton = getByText('Send All Emails');
    fireEvent.press(sendButton);

    // Confirmation modal should appear
    expect(getByText(/Send \d+ Emails\?/)).toBeTruthy();
  });

  it('should handle back navigation for completed sessions', () => {
    const { router } = require('expo-router');
    const { useSessionStore } = require('../../../store/useSessionStore');
    
    // Mock completed session
    const mockStore = useSessionStore();
    mockStore.getSession = jest.fn(() => ({
      id: 'session-1',
      status: 'completed',
      items: [],
    }));

    const { UNSAFE_getAllByType } = render(<EmailPreviewScreen />);
    const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const backButton = touchables[0];
    fireEvent.press(backButton);

    expect(router.replace).toHaveBeenCalledWith('/sessions');
  });

  it('should handle normal back navigation for active sessions', () => {
    const { router } = require('expo-router');
    const { UNSAFE_getAllByType } = render(<EmailPreviewScreen />);
    
    // Mock active session
    const mockStore = require('../../../store/useSessionStore').useSessionStore();
    mockStore.getSession = jest.fn(() => ({
      id: 'session-1',
      status: 'active',
      items: [],
    }));

    const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const backButton = touchables[0];
    fireEvent.press(backButton);

    expect(router.back).toHaveBeenCalled();
  });

  it('should show loading spinner when sending emails', async () => {
    const { sendEmail } = require('../../../lib/api/sendEmail');
    sendEmail.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

    const { getByText, queryByText } = render(<EmailPreviewScreen />);

    const sendButton = getByText('Send All Emails');
    fireEvent.press(sendButton);

    // Confirm send
    const confirmButton = getByText('Send All');
    fireEvent.press(confirmButton);

    // Should show loading
    await waitFor(() => {
      expect(queryByText(/Sending emails\.\.\./)).toBeTruthy();
    });
  });

  it('should show success modal after sending emails', async () => {
    const { sendEmail } = require('../../../lib/api/sendEmail');
    sendEmail.mockResolvedValue({ success: true, messageId: 'msg-123' });

    const { getByText } = render(<EmailPreviewScreen />);

    const sendButton = getByText('Send All Emails');
    fireEvent.press(sendButton);

    const confirmButton = getByText('Send All');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(getByText('Emails Sent!')).toBeTruthy();
    });
  });

  it('should handle send email errors', async () => {
    const { sendEmail } = require('../../../lib/api/sendEmail');
    sendEmail.mockResolvedValue({ success: false, error: 'Network error' });

    const { getByText } = render(<EmailPreviewScreen />);

    const sendButton = getByText('Send All Emails');
    fireEvent.press(sendButton);

    const confirmButton = getByText('Send All');
    fireEvent.press(confirmButton);

    // Should not show success modal
    await waitFor(() => {
      expect(() => getByText('Emails Sent!')).toThrow();
    });
  });

  it('should navigate to sessions list after success modal close', async () => {
    const { sendEmail } = require('../../../lib/api/sendEmail');
    sendEmail.mockResolvedValue({ success: true });

    const { router } = require('expo-router');
    const { getByText } = render(<EmailPreviewScreen />);

    const sendButton = getByText('Send All Emails');
    fireEvent.press(sendButton);

    const confirmButton = getByText('Send All');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(getByText('Emails Sent!')).toBeTruthy();
    });

    const doneButton = getByText('Done');
    fireEvent.press(doneButton);

    expect(router.replace).toHaveBeenCalledWith('/sessions');
  });

  it('should group items by supplier correctly', () => {
    const { getByText } = render(<EmailPreviewScreen />);

    // Should show 2 email cards (one per supplier)
    expect(getByText('Supplier One')).toBeTruthy();
    expect(getByText('Supplier Two')).toBeTruthy();
  });

  it('should handle missing sender email', async () => {
    const { useSenderProfile } = require('../../../store/useSenderProfileStore');
    useSenderProfile.mockReturnValueOnce({
      name: 'John Doe',
      email: '',
      storeName: 'Test Store',
    });

    const { getByText } = render(<EmailPreviewScreen />);

    const sendButton = getByText('Send All Emails');
    fireEvent.press(sendButton);

    const confirmButton = getByText('Send All');
    fireEvent.press(confirmButton);

    // Should show error toast - sendEmail should not be called
    await waitFor(() => {
      const { sendEmail } = require('../../../lib/api/sendEmail');
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });
});
