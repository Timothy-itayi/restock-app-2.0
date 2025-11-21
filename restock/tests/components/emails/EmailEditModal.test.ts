/**
 * Tests for EmailEditModal Component
 * @file tests/components/emails/EmailEditModal.test.ts
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmailEditModal } from '../../../components/emails/EmailEditModal';

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

describe('EmailEditModal', () => {
  const mockEditingEmail = {
    supplierName: 'Test Supplier',
    supplierEmail: 'supplier@example.com',
    subject: 'Original Subject',
    body: 'Original body',
    items: [{ productName: 'Product A', quantity: 5 }],
  };

  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render edit modal with email data', () => {
    const { getByDisplayValue, getByText } = render(
      <EmailEditModal
        visible={true}
        editingEmail={mockEditingEmail}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(getByDisplayValue('Original Subject')).toBeTruthy();
    expect(getByDisplayValue('Original body')).toBeTruthy();
    expect(getByText('Test Supplier')).toBeTruthy();
    expect(getByText('supplier@example.com')).toBeTruthy();
  });

  it('should allow editing subject and body', () => {
    const { getByDisplayValue } = render(
      <EmailEditModal
        visible={true}
        editingEmail={mockEditingEmail}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const subjectInput = getByDisplayValue('Original Subject');
    const bodyInput = getByDisplayValue('Original body');

    fireEvent.changeText(subjectInput, 'New Subject');
    fireEvent.changeText(bodyInput, 'New body');

    expect(subjectInput.props.value).toBe('New Subject');
    expect(bodyInput.props.value).toBe('New body');
  });

  it('should handle save button (checkmark icon)', () => {
    const { getByDisplayValue, UNSAFE_getAllByType } = render(
      <EmailEditModal
        visible={true}
        editingEmail={mockEditingEmail}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const subjectInput = getByDisplayValue('Original Subject');
    fireEvent.changeText(subjectInput, 'Updated Subject');

    // Find the save button (last TouchableOpacity with checkmark icon)
    const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const saveButton = touchables[touchables.length - 1];
    fireEvent.press(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      subject: 'Updated Subject',
      body: 'Original body',
    });
  });

  it('should handle cancel button (close icon)', () => {
    const { UNSAFE_getAllByType } = render(
      <EmailEditModal
        visible={true}
        editingEmail={mockEditingEmail}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Find the cancel button (first TouchableOpacity with close icon)
    const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const cancelButton = touchables[0];
    fireEvent.press(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should not render when visible is false', () => {
    const { queryByDisplayValue } = render(
      <EmailEditModal
        visible={false}
        editingEmail={mockEditingEmail}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(queryByDisplayValue('Original Subject')).toBeNull();
  });

  it('should not render when editingEmail is null', () => {
    const { queryByDisplayValue } = render(
      <EmailEditModal
        visible={true}
        editingEmail={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(queryByDisplayValue('Original Subject')).toBeNull();
  });

  it('should display items list when items are provided', () => {
    const { getByText } = render(
      <EmailEditModal
        visible={true}
        editingEmail={mockEditingEmail}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('Items in this order')).toBeTruthy();
    expect(getByText(/Product A/)).toBeTruthy();
    expect(getByText(/\(x5\)/)).toBeTruthy();
  });

  it('should not display items section when items are empty', () => {
    const emailWithoutItems = {
      ...mockEditingEmail,
      items: [],
    };

    const { queryByText } = render(
      <EmailEditModal
        visible={true}
        editingEmail={emailWithoutItems}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(queryByText('Items in this order')).toBeNull();
  });

  it('should update state when editingEmail changes', () => {
    const { rerender, getByDisplayValue } = render(
      <EmailEditModal
        visible={true}
        editingEmail={mockEditingEmail}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const newEmail = {
      ...mockEditingEmail,
      subject: 'New Subject',
      body: 'New body',
    };

    rerender(
      <EmailEditModal
        visible={true}
        editingEmail={newEmail}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(getByDisplayValue('New Subject')).toBeTruthy();
    expect(getByDisplayValue('New body')).toBeTruthy();
  });

  it('should handle multiline body input', () => {
    const { getByDisplayValue } = render(
      <EmailEditModal
        visible={true}
        editingEmail={mockEditingEmail}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const bodyInput = getByDisplayValue('Original body');
    expect(bodyInput.props.multiline).toBe(true);
    expect(bodyInput.props.textAlignVertical).toBe('top');
  });
});
