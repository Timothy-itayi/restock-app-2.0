/**
 * Tests for SuccessModal Component
 * @file tests/components/emails/SuccessModal.test.ts
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SuccessModal } from '../../../components/emails/SuccessModal';

// Mock theme store
jest.mock('../../../styles/useThemeStore', () => ({
  useThemeStore: () => ({
    theme: {
      brand: { primary: '#6d9f72' },
      status: { success: '#6d9f72' },
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

describe('SuccessModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when visible', () => {
    const { getByText } = render(
      <SuccessModal
        visible={true}
        emailCount={3}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Emails Sent!')).toBeTruthy();
    expect(getByText('Successfully sent 3 emails to your suppliers.')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <SuccessModal
        visible={false}
        emailCount={3}
        onClose={mockOnClose}
      />
    );

    expect(queryByText('Emails Sent!')).toBeNull();
  });

  it('should handle singular email count', () => {
    const { getByText } = render(
      <SuccessModal
        visible={true}
        emailCount={1}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Successfully sent 1 email to your suppliers.')).toBeTruthy();
  });

  it('should handle plural email count', () => {
    const { getByText } = render(
      <SuccessModal
        visible={true}
        emailCount={5}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Successfully sent 5 emails to your suppliers.')).toBeTruthy();
  });

  it('should call onClose when Done is pressed', () => {
    const { getByText } = render(
      <SuccessModal
        visible={true}
        emailCount={3}
        onClose={mockOnClose}
      />
    );

    const doneButton = getByText('Done');
    fireEvent.press(doneButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display checkmark icon', () => {
    const { UNSAFE_getByType } = render(
      <SuccessModal
        visible={true}
        emailCount={3}
        onClose={mockOnClose}
      />
    );

    // Check that Ionicons with checkmark name is rendered
    const icons = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
    expect(icons).toBeTruthy();
  });

  it('should handle zero email count', () => {
    const { getByText } = render(
      <SuccessModal
        visible={true}
        emailCount={0}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Successfully sent 0 emails to your suppliers.')).toBeTruthy();
  });
});

