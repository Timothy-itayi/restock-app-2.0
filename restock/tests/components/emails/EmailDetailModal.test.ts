/**
 * Tests for EmailDetailModal Component
 * @file tests/components/emails/EmailDetailModal.test.ts
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmailDetailModal } from '../../../components/emails/EmailEditModal';

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

describe('EmailDetailModal', () => {
  const mockEmail = {
    supplierName: 'Test Supplier',
    supplierEmail: 'supplier@example.com',
    subject: 'Test Subject',
    body: 'Test email body content',
    items: [
      { productName: 'Product A', quantity: 5 },
      { productName: 'Product B', quantity: 10 },
    ],
  };

  const mockOnClose = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when visible with email data', () => {
    const { getByText } = render(
      <EmailDetailModal
        visible={true}
        email={mockEmail}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(getByText('Email Details')).toBeTruthy();
    expect(getByText('Test Supplier')).toBeTruthy();
    expect(getByText('supplier@example.com')).toBeTruthy();
    expect(getByText('Test Subject')).toBeTruthy();
    expect(getByText('Test email body content')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <EmailDetailModal
        visible={false}
        email={mockEmail}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(queryByText('Email Details')).toBeNull();
  });

  it('should not render when email is null', () => {
    const { queryByText } = render(
      <EmailDetailModal
        visible={true}
        email={null}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(queryByText('Email Details')).toBeNull();
  });

  it('should display items list when items are provided', () => {
    const { getByText } = render(
      <EmailDetailModal
        visible={true}
        email={mockEmail}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(getByText('Items in this order')).toBeTruthy();
    expect(getByText(/Product A/)).toBeTruthy();
    expect(getByText(/Product B/)).toBeTruthy();
    expect(getByText(/\(x5\)/)).toBeTruthy();
    expect(getByText(/\(x10\)/)).toBeTruthy();
  });

  it('should not display items section when items are empty', () => {
    const emailWithoutItems = {
      ...mockEmail,
      items: [],
    };

    const { queryByText } = render(
      <EmailDetailModal
        visible={true}
        email={emailWithoutItems}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(queryByText('Items in this order')).toBeNull();
  });

  it('should not display items section when items are undefined', () => {
    const emailWithoutItems = {
      ...mockEmail,
      items: undefined,
    };

    const { queryByText } = render(
      <EmailDetailModal
        visible={true}
        email={emailWithoutItems}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(queryByText('Items in this order')).toBeNull();
  });

  it('should call onClose when close button is pressed', () => {
    const { UNSAFE_getAllByType } = render(
      <EmailDetailModal
        visible={true}
        email={mockEmail}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    // Find the close button (first TouchableOpacity with close icon)
    const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const closeButton = touchables[0];
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  it('should call onEdit and onClose when edit button is pressed', () => {
    const { UNSAFE_getAllByType } = render(
      <EmailDetailModal
        visible={true}
        email={mockEmail}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    // Find the edit button (last TouchableOpacity with pencil icon)
    const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const editButton = touchables[touchables.length - 1];
    fireEvent.press(editButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockEmail);
  });

  it('should handle items with quantity 1 (no x1 display)', () => {
    const emailWithSingleQuantity = {
      ...mockEmail,
      items: [{ productName: 'Single Product', quantity: 1 }],
    };

    const { getByText, queryByText } = render(
      <EmailDetailModal
        visible={true}
        email={emailWithSingleQuantity}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(getByText(/Single Product/)).toBeTruthy();
    // Should not show (x1) for quantity 1
    expect(queryByText(/\(x1\)/)).toBeNull();
  });
});

