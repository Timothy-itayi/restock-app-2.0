/**
 * Tests for EmailCard Component
 * @file tests/components/emails/EmailCard.test.ts
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmailCard } from '../../../components/emails/EmailCard';

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

describe('EmailCard', () => {
  const mockEmail = {
    supplierId: 'supplier-1',
    supplierName: 'Test Supplier',
    supplierEmail: 'supplier@example.com',
    subject: 'Test Subject',
    body: 'Test body content\nSecond line',
  };

  it('should render email card with supplier information', () => {
    const { getByText } = render(
      <EmailCard
        email={mockEmail}
        onEdit={() => {}}
        onTap={() => {}}
      />
    );

    expect(getByText('Test Supplier')).toBeTruthy();
    expect(getByText('supplier@example.com')).toBeTruthy();
    expect(getByText('Test Subject')).toBeTruthy();
  });

  it('should display body preview (first line)', () => {
    const { getByText } = render(
      <EmailCard
        email={mockEmail}
        onEdit={() => {}}
        onTap={() => {}}
      />
    );

    expect(getByText('Test body content')).toBeTruthy();
    // Should not show second line (numberOfLines={1})
    expect(() => getByText('Second line')).toThrow();
  });

  it('should handle tap to view details', () => {
    const onTap = jest.fn();
    const { getByText } = render(
      <EmailCard
        email={mockEmail}
        onEdit={() => {}}
        onTap={onTap}
      />
    );

    const card = getByText('Test Supplier');
    fireEvent.press(card.parent?.parent || card);

    expect(onTap).toHaveBeenCalled();
  });

  it('should handle edit button press', () => {
    const onEdit = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <EmailCard
        email={mockEmail}
        onEdit={onEdit}
        onTap={() => {}}
      />
    );

    // Find the edit button (TouchableOpacity with pencil icon)
    const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const editButton = touchables[1]; // Second TouchableOpacity is the edit button
    fireEvent.press(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('should handle optional onTap', () => {
    const { getByText } = render(
      <EmailCard
        email={mockEmail}
        onEdit={() => {}}
      />
    );

    // Should render without onTap
    expect(getByText('Test Supplier')).toBeTruthy();
  });

  it('should display supplier email', () => {
    const { getByText } = render(
      <EmailCard
        email={mockEmail}
        onEdit={() => {}}
        onTap={() => {}}
      />
    );

    expect(getByText('supplier@example.com')).toBeTruthy();
  });

  it('should handle empty body', () => {
    const emailWithEmptyBody = {
      ...mockEmail,
      body: '',
    };

    const { getByText } = render(
      <EmailCard
        email={emailWithEmptyBody}
        onEdit={() => {}}
        onTap={() => {}}
      />
    );

    expect(getByText('Test Supplier')).toBeTruthy();
  });

  it('should handle long body with truncation', () => {
    const longBody = 'A'.repeat(200);
    const emailWithLongBody = {
      ...mockEmail,
      body: longBody,
    };

    const { getByText } = render(
      <EmailCard
        email={emailWithLongBody}
        onEdit={() => {}}
        onTap={() => {}}
      />
    );

    // Should still render the card
    expect(getByText('Test Supplier')).toBeTruthy();
  });
});
