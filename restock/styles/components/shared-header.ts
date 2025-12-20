import { AppColors } from "@styles/theme/colors";
import { StyleSheet } from "react-native";

/**
 * Shared header styles for consistent navigation across all screens
 * Based on company/stores.tsx blueprint
 */
export const getSharedHeaderStyles = (t: AppColors) =>
  StyleSheet.create({
    stickyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: t.neutral.lightest,
      borderBottomWidth: 1,
      borderBottomColor: t.neutral.light,
    },
    stickyBackButton: {
      padding: 4,
      marginRight: 12,
    },
    stickyHeaderTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: t.neutral.darkest,
    },
  });

