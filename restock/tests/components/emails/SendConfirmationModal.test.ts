/**
 * Tests for SendConfirmationModal Component
 * @file tests/components/emails/SendConfirmationModal.test.ts
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SendConfirmationModal } from '../../../components/emails/SendConfirmationModal';

// Mock theme store
jest.mock('../../../styles/useThemeStore', () => ({
  useThemeStore: () => ({
    theme: {
      brand: { primary: '#6d9f72' },
      neutral: {
        lightest: '#ffffff',
        lighter: '#f0eee4',
        light: '#e1e8ed',
        medium: '#a0a38f',
        dark: '#4a4c38',
        darkest: '#1c2011',
      },
    },
  }),
}));

describe('SendConfirmationModal', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when visible', () => {
    const { getByText } = render(
      <SendConfirmationModal
        visible={true}
        emailCount={3}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('Send 3 Emails?')).toBeTruthy();
    expect(getByText('This will send your restock order emails to all suppliers.')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <SendConfirmationModal
        visible={false}
        emailCount={3}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(queryByText('Send 3 Emails?')).toBeNull();
  });

  it('should handle singular email count', () => {
    const { getByText } = render(
      <SendConfirmationModal
        visible={true}
        emailCount={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('Send 1 Emails?')).toBeTruthy();
  });

  it('should call onConfirm when Send All is pressed', () => {
    const { getByText } = render(
      <SendConfirmationModal
        visible={true}
        emailCount={3}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const sendButton = getByText('Send All');
    fireEvent.press(sendButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should call onCancel when Cancel is pressed', () => {
    const { getByText } = render(
      <SendConfirmationModal
        visible={true}
        emailCount={3}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should handle zero email count', () => {
    const { getByText } = render(
      <SendConfirmationModal
        visible={true}
        emailCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('Send 0 Emails?')).toBeTruthy();
  });

  it('should display correct message text', () => {
    const { getByText } = render(
      <SendConfirmationModal
        visible={true}
        emailCount={5}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('Send 5 Emails?')).toBeTruthy();
    expect(getByText('This will send your restock order emails to all suppliers.')).toBeTruthy();
  });
});

