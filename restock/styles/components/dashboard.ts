import { StyleSheet } from "react-native";
import typography, { fontFamily } from "../typography";
import colors, { AppColors } from '../../lib/theme/colors';

export const getDashboardStyles = (t: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.neutral.lightest,
      
    },

    contentContainer: {
      padding: 20,
      flexGrow: 1,
    
      
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: t.neutral.dark,
      fontFamily: fontFamily.satoshi,
    },

    welcomeSection: {
      marginBottom: 32,
    },
    welcomeTitle: {
      fontFamily: fontFamily.satoshi,
      fontSize: 28,
      color: t.neutral.darkest,
    },
    userName: {
      fontFamily: fontFamily.satoshiBold,
      color: t.neutral.darkest,
    },
    welcomeSubtitle: {
      fontFamily: fontFamily.satoshi,
      fontSize: 16,
      color: t.neutral.medium,
      marginTop: 4,
    },
    welcomeEmail: {
      fontFamily: fontFamily.satoshi,
      fontSize: 16,
      color: t.neutral.medium,
      marginTop: 4,
    },

    /* MENU LIST */
    menuList: {
      gap: 12,
      paddingVertical: 50,

    },

    menuCard: {
      backgroundColor: t.neutral.lightest,
      borderRadius: 12,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.neutral.light,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },

    menuCardPrimary: {
      backgroundColor: t.brand.primary,
      borderColor: t.brand.primary,
    },

    menuCardText: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      color: t.neutral.darkest,
      fontFamily: fontFamily.satoshiMedium,
    },
    menuCardTextPrimary: {
      color: t.neutral.lightest,
    },

    menuIcon: {
      marginRight: 16,
      color: t.brand.primary,
    },
    menuIconPrimary: {
      color: t.neutral.lightest,
    },
    menuChevron: {
      color: t.neutral.medium,
    },

    /* ACTIVE SESSION CARD */
    activeSessionCard: {
      marginTop: 32,
      padding: 16,
      backgroundColor: t.neutral.lighter,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.brand.primary,
    },
    activeSessionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: t.brand.primary,
      fontFamily: fontFamily.satoshiBold,
    },
    activeSessionText: {
      fontSize: 14,
      color: t.neutral.dark,
      fontFamily: fontFamily.satoshi,
    },
  });
