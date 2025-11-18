import { AppColors } from "@styles/theme/colors";
import { fontFamily } from "@styles/typography";
import { StyleSheet } from "react-native";

export const getDashboardStyles = (t: AppColors) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: t.neutral.lightest,

      },
  
      contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
     
     
        // reduced from 32 → minimal clean space
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
  
      /* WELCOME SECTION */
      welcomeSection: {
        marginBottom: 16, 
        gap: 16,  // tighter hero → menu spacing
      },
  
      welcomeTitle: {
        fontFamily: fontFamily.satoshi,
        fontSize: 32,
        lineHeight: 38,
        color: t.neutral.darkest,
      },
  
      userName: {
        fontFamily: fontFamily.satoshiBold,
        fontSize: 28,
        lineHeight: 34,
        color: t.neutral.darkest,
      },
  
      welcomeEmail: {
        fontFamily: fontFamily.satoshi,
        fontSize: 15,
        lineHeight: 20,
        color: t.neutral.medium,
        marginTop: 4,
      },
  
      welcomeSubtitle: {
        fontFamily: fontFamily.satoshi,
        fontSize: 15,
        lineHeight: 20,
        color: t.neutral.medium,
        marginTop: 2,
      },
  
      /* MENU LIST */
      menuList: {
        gap: 20,         // modern app rhythm
        marginTop: 4,
        marginBottom: 8  // ensures no giant white space
      },
  
      menuCard: {
        backgroundColor: t.neutral.lightest,
        borderRadius: 12,
        paddingVertical: 18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: t.neutral.light,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      },
  
      menuCardPrimary: {
        backgroundColor: t.brand.primary,
        borderColor: t.brand.primary,
      },
  
      menuCardText: {
        fontFamily: fontFamily.satoshiMedium,
        fontSize: 16,
        flex: 1,
        color: t.neutral.darkest,
      },
  
      menuCardTextPrimary: {
        color: t.neutral.lightest,
      },
  
      menuIcon: {
        marginRight: 16,
        color: t.brand.secondary,
      },
  
      menuIconPrimary: {
        color: t.neutral.lightest,
      },
  
      menuChevron: {
        color: t.neutral.medium,
      },
  
      /* ACTIVE SESSION */
      activeSessionCard: {
        marginTop: 20,
        padding: 16,
        backgroundColor: t.neutral.lighter,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: t.brand.primary,
        marginBottom: 8,   // prevents that weird abyss
      },
  
      activeSessionTitle: {
        fontFamily: fontFamily.satoshiBold,
        fontSize: 14,
        color: t.brand.primary,
        marginBottom: 4,
      },
  
      activeSessionText: {
        fontFamily: fontFamily.satoshi,
        fontSize: 14,
        color: t.neutral.dark,
      },
    });
  