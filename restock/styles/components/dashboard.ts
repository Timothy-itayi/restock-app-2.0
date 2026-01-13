import colors, { AppColors } from "@styles/theme/colors";
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
        paddingBottom: 40, // Increased padding for scroll room
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
  
      /* WELCOME SECTION */
      welcomeSection: {
        marginBottom: 12, 
        gap: 6,
      },
  
      welcomeTitle: {
        fontFamily: fontFamily.satoshiBlack,
        fontSize: 32,
        lineHeight: 38,
        
      },
  
    userName: {
        fontFamily: fontFamily.satoshiLightItalic,
        fontSize: 32,
        lineHeight: 38,
        color: t.brand.secondary,
      },
  
      welcomeEmail: {
        fontFamily: fontFamily.satoshi,
        fontSize: 15,
        lineHeight: 20,
        color: t.neutral.medium,
        
      },
  
      welcomeSubtitle: {
        fontFamily: fontFamily.satoshi,
        fontSize: 15,
        lineHeight: 20,
        color: t.neutral.medium,
      
      },
      welcomeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      },

      welcomeRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },

      helpIconButton: {
        padding: 4,
      },

      helpIcon: {
        color: t.brand.accent,
      },

      welcomeLabel: {
        fontFamily: fontFamily.satoshi,
        fontSize: 14,
        fontWeight: '500',
        color: t.neutral.medium,
        marginTop: 4,
      },
      
      welcomeValue: {
        fontFamily: fontFamily.satoshiBold,
        fontSize: 16,
        fontWeight: '700',
        color: t.neutral.dark,
      },
      
  
      /* MENU LIST */
      menuList: {
        gap: 12,         // tighter spacing for no-scroll
        marginTop: 4,
        marginBottom: 8
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
  
      menuCardGreen: {
        backgroundColor: t.brand.primary,
        borderRadius: 12,
        paddingVertical: 18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: t.brand.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      },
  
      menuCardText: {
        fontFamily: fontFamily.satoshiMedium,
        fontSize: 16,
        flex: 1,
        color: t.neutral.darkest,
      },
   sentryText: {
    fontFamily: fontFamily.satoshiMedium,
    fontSize: 1,
    flex: 0.5,
    color: t.neutral.darkest,
   },
      menuCardTextGreen: {
        fontFamily: fontFamily.satoshiMedium,
        fontSize: 16,
        flex: 1,
        color: t.neutral.lightest,
        fontWeight: '700',
      },
  
      menuIcon: {
        marginRight: 16,
        color: t.brand.secondary,
      },
      sentryIcon: {
        marginRight: 3,
        color: t.brand.secondary,
      },
      menuIconGreen: {
        marginRight: 16,
        color: t.neutral.lightest,
      },
  
      menuChevron: {
        color: t.neutral.medium,
      },

      menuChevronGreen: {
        color: t.neutral.lightest,
      },
  
      /* PROGRESS SECTION */
      progressSection: {
        marginTop: 12,
        marginBottom: 12,
      },

      progressTitle: {
        fontFamily: fontFamily.satoshiBold,
        fontSize: 14,
        color: t.neutral.darkest,
        marginBottom: 12,
      },

      progressBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
      },

      progressStep: {
        alignItems: 'center',
        flex: 1,
      },

      progressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: t.neutral.light,
        borderWidth: 2,
        borderColor: t.neutral.light,
        marginBottom: 6,
      },

      progressDotActive: {
        backgroundColor: t.status.success,
        borderColor: t.status.success,
      },

      progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: t.neutral.light,
        marginHorizontal: 8,
        marginBottom: 12,
      },

      progressLineActive: {
        backgroundColor: t.status.success,
      },

      progressLabel: {
        fontFamily: fontFamily.satoshi,
        fontSize: 11,
        color: t.neutral.medium,
        textAlign: 'center',
      },

      /* READY TO SEND CARD */
      readyToSendCard: {
        backgroundColor: t.neutral.lightest,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: t.status.success,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },

      readyToSendText: {
        fontFamily: fontFamily.satoshiMedium,
        fontSize: 14,
        color: t.neutral.darkest,
        flex: 1,
      },

      readyToSendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.status.success,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
      },

      readyToSendButtonText: {
        fontFamily: fontFamily.satoshiBold,
        fontSize: 13,
        color: t.neutral.lightest,
        fontWeight: '700',
        marginRight: 4,
      },

      readyToSendButtonIcon: {
        color: t.neutral.lightest,
      },

      /* STATUS CHIPS ROW */
      statusChipsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
        flexWrap: 'wrap',
      },

      statusChipActive: {
        backgroundColor: t.cypress.pale, // Light green background
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: t.status.success,
      },

      statusChipTextActive: {
        fontFamily: fontFamily.satoshiMedium,
        fontSize: 12,
        color: t.status.success,
        fontWeight: '600',
      },

      statusChipPending: {
        backgroundColor: t.analytics.clay, // Light orange/beige background
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: t.status.warning,
      },

      statusChipTextPending: {
        fontFamily: fontFamily.satoshiMedium,
        fontSize: 12,
        color: t.status.warning,
        fontWeight: '600',
      },

      historyChip: {
        backgroundColor: t.neutral.lightest,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: t.neutral.light,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },

      historyChipText: {
        fontFamily: fontFamily.satoshiMedium,
        fontSize: 12,
        color: t.neutral.medium,
        fontWeight: '500',
      },

      historyChipIcon: {
        color: t.neutral.medium,
      },

      /* SECTION HEADER */
      sectionHeader: {
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 4,
      },

      sectionHeaderText: {
        fontFamily: fontFamily.satoshiBold,
        fontSize: 12,
        color: t.neutral.medium,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      },

      /* MANAGE ROW */
      manageRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
      },

      manageCard: {
        flex: 1,
        backgroundColor: t.neutral.lightest,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
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

      manageCardText: {
        fontFamily: fontFamily.satoshiMedium,
        fontSize: 14,
        flex: 1,
        color: t.neutral.darkest,
      },

      /* TIPS SECTION */
      tipsCard: {
        backgroundColor: '#F3F0FF', // Light purple background
        borderRadius: 8,
        padding: 10,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#8B5CF6', // Purple border
      },

      tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
      },

      tipsHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },

      tipsIcon: {
        color: '#8B5CF6', // Purple
      },

      tipsTitle: {
        fontFamily: fontFamily.satoshiBold,
        fontSize: 12,
        color: '#6D28D9', // Darker purple
        fontWeight: '700',
      },

      tipsCloseIcon: {
        color: t.neutral.medium,
      },

      tipsContent: {
        gap: 10,
      },

      tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
      },

      tipTextCompact: {
        fontFamily: fontFamily.satoshi,
        fontSize: 11,
        lineHeight: 15,
        color: t.neutral.dark,
        flexShrink: 1,
      },

      tipPillExample: {
        marginLeft: 4,
      },

      statusChipActiveExample: {
        backgroundColor: t.cypress.pale,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: t.status.success,
      },

      statusChipTextActiveExample: {
        fontFamily: fontFamily.satoshiMedium,
        fontSize: 12,
        color: t.status.success,
        fontWeight: '600',
      },

      tipHighlight: {
        fontFamily: fontFamily.satoshiBold,
        color: '#8B5CF6', // Purple
        fontWeight: '600',
      },
      
    });
  