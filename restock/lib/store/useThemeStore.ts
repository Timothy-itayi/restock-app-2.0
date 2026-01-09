import { create } from 'zustand';
import { Platform, Dimensions } from 'react-native';
import { AppColors, light as lightTheme, dark as darkTheme } from '../theme/colors';
import logger from '../helpers/logger';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  theme: AppColors;
  screen: {
    width: number;
    height: number;
  };
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  updateScreenDimensions: () => void;
}

/**
 * Hook to get the system color scheme in a way that works for the store.
 */
const getSystemTheme = (mode: ThemeMode): AppColors => {
  if (mode === 'light') return lightTheme;
  if (mode === 'dark') return darkTheme;
  
  // For 'system' mode
  // Note: we can't use useColorScheme hook here as it's a Zustand store, not a React component.
  // The themed hook will handle actual reactivity.
  return lightTheme;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  theme: lightTheme,
  screen: {
    width: Platform.OS === 'web' ? 1200 : Dimensions.get('window').width,
    height: Platform.OS === 'web' ? 800 : Dimensions.get('window').height,
  },

  setMode: (mode) => {
    let theme = mode === 'dark' ? darkTheme : lightTheme;
    
    if (mode === 'system' && Platform.OS === 'web') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = isDark ? darkTheme : lightTheme;
    }

    set({ mode, theme });
  },

  toggleMode: () => {
    const currentMode = get().mode;
    let nextMode: ThemeMode = 'light';
    
    if (currentMode === 'light') nextMode = 'dark';
    else if (currentMode === 'dark') nextMode = 'system';
    else nextMode = 'light';

    let theme = nextMode === 'dark' ? darkTheme : lightTheme;
    
    if (nextMode === 'system' && Platform.OS === 'web') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = isDark ? darkTheme : lightTheme;
    }

    set({ mode: nextMode, theme });
  },

  updateScreenDimensions: () => {
    set({
      screen: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
      }
    });
  },
}));

/**
 * React hook to access the theme store safely
 */
export const useSafeTheme = () => {
  const store = useThemeStore();

  if (!store || !store.theme) {
    logger.warn('⚠️ Theme store not ready, using fallback');
    return {
      theme: lightTheme,
      mode: 'light' as ThemeMode,
      screen: {
        width: Dimensions.get('window').width || 1200,
        height: Dimensions.get('window').height || 800,
      },
      toggleMode: () => logger.warn('Theme store not ready'),
      setMode: () => logger.warn('Theme store not ready'),
      updateScreenDimensions: () => logger.warn('Theme store not ready'),
    };
  }

  return store;
};

/**
 * Initialize the theme store with logging
 */
if (Platform.OS === 'web') {
  logger.info('🌙 Theme store initialized in browser');
} else {
  logger.info('🌙 Theme store initialized in React Native');
}

/**
 * A safe version of useThemeStore for use outside of React components
 */
export const getThemeStore = () => {
  try {
    return useThemeStore.getState();
  } catch (error) {
    logger.warn('⚠️ Theme store access failed, using fallback', { error });
    return {
      theme: lightTheme,
      mode: 'light' as ThemeMode,
      screen: {
        width: Dimensions.get('window').width || 1200,
        height: Dimensions.get('window').height || 800,
      },
      toggleMode: () => logger.warn('Theme store not ready'),
      setMode: () => logger.warn('Theme store not ready'),
      updateScreenDimensions: () => logger.warn('Theme store not ready'),
    };
  }
};
