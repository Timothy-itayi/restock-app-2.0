/**
 * Tests for EmailCard Component
 * @file tests/components/emails/EmailCard.test.ts
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { EmailCard } from '../../../components/emails/EmailCard';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

describe('EmailCard', () => {
  const mockEmailDraft = {
    supplierName: 'Test Supplier',
    supplierEmail: 'supplier@example.com',
    subject: 'Test Subject',
    body: 'Test body',
    items: [
      { productName: 'Product A', quantity: 5 },
      { productName: 'Product B', quantity: 10 },
    ],
  };

  it('should render email card with supplier information', () => {
    const { getByText } = render(
      <EmailCard
        draft={mockEmailDraft}
        onPress={() => {}}
        onEdit={() => {}}
      />
    );

    expect(getByText('Test Supplier')).toBeTruthy();
    expect(getByText('Test Subject')).toBeTruthy();
  });

  it('should display item count', () => {
    const { getByText } = render(
      <EmailCard
        draft={mockEmailDraft}
        onPress={() => {}}
        onEdit={() => {}}
      />
    );

    // Should show item count (2 items in mockEmailDraft)
    expect(getByText(/2/)).toBeTruthy();
  });

  it('should handle tap to view details', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EmailCard
        draft={mockEmailDraft}
        onPress={onPress}
        onEdit={() => {}}
      />
    );

    const card = getByText('Test Supplier');
    card.props.onPress();

    expect(onPress).toHaveBeenCalled();
  });

  it('should handle edit button press', () => {
    const onEdit = jest.fn();
    const { getByTestId } = render(
      <EmailCard
        draft={mockEmailDraft}
        onPress={() => {}}
        onEdit={onEdit}
      />
    );

    const editButton = getByTestId('email-card-edit');
    editButton.props.onPress();

    expect(onEdit).toHaveBeenCalledWith(mockEmailDraft);
  });

  it('should handle empty items list', () => {
    const draftWithNoItems = {
      ...mockEmailDraft,
      items: [],
    };

    const { getByText } = render(
      <EmailCard
        draft={draftWithNoItems}
        onPress={() => {}}
        onEdit={() => {}}
      />
    );

    expect(getByText('Test Supplier')).toBeTruthy();
  });

  it('should display supplier email', () => {
    const { getByText } = render(
      <EmailCard
        draft={mockEmailDraft}
        onPress={() => {}}
        onEdit={() => {}}
      />
    );

    expect(getByText('supplier@example.com')).toBeTruthy();
  });
});
