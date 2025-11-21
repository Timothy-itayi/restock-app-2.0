/**
 * Tests for EmailsSummary Component
 * @file tests/components/emails/EmailsSummary.test.ts
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { EmailsSummary } from '../../../components/emails/EmailsSummary';

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

describe('EmailsSummary', () => {
  const defaultProps = {
    emailCount: 3,
    senderName: 'John Doe',
    senderEmail: 'john@example.com',
  };

  it('should render email count', () => {
    const { getByText } = render(<EmailsSummary {...defaultProps} />);
    
    expect(getByText('3 Emails Ready')).toBeTruthy();
    expect(getByText('Review and send restock orders')).toBeTruthy();
  });

  it('should display sender information', () => {
    const { getByText } = render(<EmailsSummary {...defaultProps} />);
    
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@example.com')).toBeTruthy();
  });

  it('should display store name when provided', () => {
    const { getByText } = render(
      <EmailsSummary {...defaultProps} storeName="Test Store" />
    );
    
    expect(getByText('Test Store')).toBeTruthy();
    expect(getByText('John Doe')).toBeTruthy();
  });

  it('should not display store name when not provided', () => {
    const { queryByText } = render(<EmailsSummary {...defaultProps} />);
    
    // Store name should not be in the tree
    const storeNameElements = queryByText(/Test Store/i);
    expect(storeNameElements).toBeNull();
  });

  it('should handle singular email count', () => {
    const { getByText } = render(
      <EmailsSummary {...defaultProps} emailCount={1} />
    );
    
    expect(getByText('1 Emails Ready')).toBeTruthy();
  });

  it('should handle zero email count', () => {
    const { getByText } = render(
      <EmailsSummary {...defaultProps} emailCount={0} />
    );
    
    expect(getByText('0 Emails Ready')).toBeTruthy();
  });

  it('should handle empty sender name', () => {
    const { getByText } = render(
      <EmailsSummary {...defaultProps} senderName="" />
    );
    
    expect(getByText('john@example.com')).toBeTruthy();
  });

  it('should display mail icon', () => {
    const { UNSAFE_getByType } = render(<EmailsSummary {...defaultProps} />);
    
    // Check that Ionicons with mail name is rendered
    const icons = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
    expect(icons).toBeTruthy();
  });
});

