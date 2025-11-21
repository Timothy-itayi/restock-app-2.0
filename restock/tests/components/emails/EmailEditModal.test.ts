/**
 * Tests for EmailEditModal Component
 * @file tests/components/emails/EmailEditModal.test.ts
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmailEditModal } from '../../../components/emails/EmailEditModal';

describe('EmailEditModal', () => {
  const mockDraft = {
    supplierName: 'Test Supplier',
    supplierEmail: 'supplier@example.com',
    subject: 'Original Subject',
    body: 'Original body',
    items: [{ productName: 'Product A', quantity: 5 }],
  };

  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render edit modal with email data', () => {
    const { getByDisplayValue } = render(
      <EmailEditModal
        visible={true}
        draft={mockDraft}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(getByDisplayValue('Original Subject')).toBeTruthy();
    expect(getByDisplayValue('Original body')).toBeTruthy();
  });

  it('should allow editing subject and body', () => {
    const { getByDisplayValue } = render(
      <EmailEditModal
        visible={true}
        draft={mockDraft}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const subjectInput = getByDisplayValue('Original Subject');
    const bodyInput = getByDisplayValue('Original body');

    fireEvent.changeText(subjectInput, 'New Subject');
    fireEvent.changeText(bodyInput, 'New body');

    expect(subjectInput.props.value).toBe('New Subject');
    expect(bodyInput.props.value).toBe('New body');
  });

  it('should handle save button', () => {
    const { getByText, getByDisplayValue } = render(
      <EmailEditModal
        visible={true}
        draft={mockDraft}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const subjectInput = getByDisplayValue('Original Subject');
    fireEvent.changeText(subjectInput, 'Updated Subject');

    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      ...mockDraft,
      subject: 'Updated Subject',
    });
  });

  it('should handle cancel button', () => {
    const { getByText } = render(
      <EmailEditModal
        visible={true}
        draft={mockDraft}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should not render when visible is false', () => {
    const { queryByDisplayValue } = render(
      <EmailEditModal
        visible={false}
        draft={mockDraft}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(queryByDisplayValue('Original Subject')).toBeNull();
  });

  it('should handle keyboard with proper scrolling', () => {
    const { getByTestId } = render(
      <EmailEditModal
        visible={true}
        draft={mockDraft}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const scrollView = getByTestId('email-edit-scroll');
    expect(scrollView).toBeTruthy();
    expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('should trim whitespace from inputs on save', () => {
    const { getByText, getByDisplayValue } = render(
      <EmailEditModal
        visible={true}
        draft={mockDraft}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const subjectInput = getByDisplayValue('Original Subject');
    fireEvent.changeText(subjectInput, '  Trimmed Subject  ');

    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Trimmed Subject',
      })
    );
  });
});
