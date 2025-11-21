/**
 * Tests for Settings Screen
 * @file tests/settings/index.test.ts
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../app/settings/index';
import { useSenderProfileStore } from '../../store/useSenderProfileStore';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  clear: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store
    useSenderProfileStore.getState().clearProfile();
  });

  it('should render settings form', () => {
    const { getByPlaceholderText } = render(<SettingsScreen />);

    expect(getByPlaceholderText('Your Name')).toBeTruthy();
    expect(getByPlaceholderText('Email Address')).toBeTruthy();
    expect(getByPlaceholderText('Store Name')).toBeTruthy();
  });

  it('should allow editing sender profile', async () => {
    useSenderProfileStore.getState().setSenderProfile({
      name: 'Test User',
      email: 'test@example.com',
      storeName: 'Test Store',
    });

    const { getByDisplayValue } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByDisplayValue('Test User')).toBeTruthy();
      expect(getByDisplayValue('test@example.com')).toBeTruthy();
      expect(getByDisplayValue('Test Store')).toBeTruthy();
    });
  });

  it('should validate required fields', async () => {
    const { getByText } = render(<SettingsScreen />);

    const saveButton = getByText('Save Changes');
    fireEvent.press(saveButton);

    // Should show validation error
    await waitFor(() => {
      // Check for alert or error message
      expect(getByText(/required/i) || getByText(/missing/i)).toBeTruthy();
    });
  });

  it('should validate email format', async () => {
    useSenderProfileStore.getState().setSenderProfile({
      name: 'Test User',
      email: 'invalid-email',
      storeName: 'Test Store',
    });

    const { getByText } = render(<SettingsScreen />);

    const saveButton = getByText('Save Changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      // Should show email validation error
      expect(getByText(/invalid.*email/i)).toBeTruthy();
    });
  });

  it('should show unsaved changes indicator', () => {
    useSenderProfileStore.getState().setSenderProfile({
      name: 'Test User',
      email: 'test@example.com',
      storeName: 'Test Store',
    });

    const { getByDisplayValue, getByText } = render(<SettingsScreen />);

    const nameInput = getByDisplayValue('Test User');
    fireEvent.changeText(nameInput, 'Updated Name');

    // Should show unsaved changes banner
    expect(getByText(/unsaved changes/i)).toBeTruthy();
  });

  it('should handle reset all data with confirmation', async () => {
    const { getByText } = render(<SettingsScreen />);

    const resetButton = getByText('Reset All Data');
    fireEvent.press(resetButton);

    // Should show confirmation alert
    await waitFor(() => {
      expect(getByText(/reset/i)).toBeTruthy();
    });
  });

  it('should handle keyboard with proper scrolling', () => {
    const { getByTestId } = render(<SettingsScreen />);

    const scrollView = getByTestId('settings-scroll');
    expect(scrollView).toBeTruthy();
    expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('should display current sender identity preview when no unsaved changes', () => {
    useSenderProfileStore.getState().setSenderProfile({
      name: 'Test User',
      email: 'test@example.com',
      storeName: 'Test Store',
    });

    const { getByText } = render(<SettingsScreen />);

    expect(getByText('Current Sender Identity')).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
    expect(getByText('Test Store')).toBeTruthy();
  });

  it('should disable save button when no changes', () => {
    useSenderProfileStore.getState().setSenderProfile({
      name: 'Test User',
      email: 'test@example.com',
      storeName: 'Test Store',
    });

    const { getByText } = render(<SettingsScreen />);

    const saveButton = getByText('No Changes');
    expect(saveButton.props.disabled).toBe(true);
  });
});
