import { AppColors } from "@styles/theme/colors";
import { typographyVariants } from "@styles/typography";
import { StyleSheet } from "react-native";

export const getCompanyStyles = (t: AppColors) =>
  StyleSheet.create({
    // Shared
    container: {
      flex: 1,
      backgroundColor: t.neutral.lightest,
    },
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
    content: {
      padding: 24,
      flex: 1,
      justifyContent: 'center',
    },
    label: {
      ...typographyVariants.caption,
      color: t.neutral.medium,
      marginBottom: 8,
      marginTop: 16,
    },
    input: {
      backgroundColor: t.neutral.lighter,
      color: t.neutral.darkest,
      padding: 16,
      borderRadius: 8,
      ...typographyVariants.body,
      marginBottom: 12,
    },
    button: {
      backgroundColor: t.brand.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 24,
    },
    buttonText: {
      ...typographyVariants.button,
      color: t.neutral.lightest,
    },
    disabledButton: {
      opacity: 0.5,
    },
    hint: {
      ...typographyVariants.caption,
      color: t.neutral.medium,
      marginBottom: 32,
    },
    empty: {
      ...typographyVariants.body,
      color: t.neutral.medium,
      textAlign: 'center',
      marginTop: 40,
    },

    // Index Screen
    title: {
      ...typographyVariants.h1,
      color: t.neutral.darkest,
      textAlign: 'center',
      marginBottom: 12,
    },
    description: {
      ...typographyVariants.body,
      color: t.neutral.medium,
      textAlign: 'center',
      marginBottom: 32,
    },
    infoCard: {
      backgroundColor: t.neutral.lighter,
      padding: 24,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 32,
    },
    code: {
      ...typographyVariants.h1,
      color: t.brand.primary,
      letterSpacing: 4,
    },
    primaryButton: {
      backgroundColor: t.brand.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 12,
    },
    secondaryButton: {
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.brand.primary,
      alignItems: 'center',
    },
    secondaryButtonText: {
      ...typographyVariants.button,
      color: t.brand.primary,
    },

    // Store List Screen
    list: {
      padding: 16,
    },
    item: {
      backgroundColor: t.neutral.lighter,
      padding: 20,
      borderRadius: 12,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemName: {
      ...typographyVariants.h3,
      color: t.neutral.darkest,
    },
    meTag: {
      ...typographyVariants.caption,
      color: t.brand.primary,
      marginTop: 4,
    },
    chevron: {
      ...typographyVariants.h3,
      color: t.neutral.medium,
    },

    // Snapshot Screen
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.neutral.light,
    },
    timestamp: {
      ...typographyVariants.caption,
      color: t.neutral.medium,
    },
    sessionCard: {
      backgroundColor: t.neutral.lighter,
      margin: 16,
      padding: 16,
      borderRadius: 12,
    },
    sessionTitle: {
      ...typographyVariants.h3,
      color: t.neutral.darkest,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
      paddingBottom: 8,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    itemText: {
      ...typographyVariants.body,
      color: t.neutral.darkest,
      flex: 1,
    },
    qtyText: {
      ...typographyVariants.body,
      color: t.brand.primary,
      fontWeight: 'bold',
      marginLeft: 12,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    error: {
      ...typographyVariants.body,
      color: t.status.error,
      textAlign: 'center',
    },
  });
