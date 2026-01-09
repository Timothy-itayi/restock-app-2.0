/**
 * Tests for Theme Store
 * @file tests/stores/useThemeStore.test.ts
 */
import { useThemeStore } from '../../lib/store/useThemeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    // Reset store
    useThemeStore.setState({ mode: 'light' });
  });

  it('should provide theme colors', () => {
    const theme = useThemeStore.getState().theme;
    
    expect(theme).toBeDefined();
    expect(theme.brand).toBeDefined();
    expect(theme.neutral).toBeDefined();
    expect(theme.status).toBeDefined();
  });

  it('should support switching theme modes', () => {
    const store = useThemeStore.getState();
    expect(store.mode).toBe('light');
    
    store.setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
    
    store.toggleMode();
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('should update theme colors when mode changes', () => {
    const store = useThemeStore.getState();
    const lightColor = store.theme.neutral.lightest;
    
    store.setMode('dark');
    const darkColor = useThemeStore.getState().theme.neutral.lightest;
    
    // In many themes, light mode background is white and dark mode is dark
    expect(lightColor).not.toBe(darkColor);
  });
});
