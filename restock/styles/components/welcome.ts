import { StyleSheet, Dimensions } from 'react-native';
import { fontFamily } from '../typography';
import colors from '../../lib/theme/colors';

const { width: screenWidth } = Dimensions.get('window');

const colours = {
  background: colors.neutral.lighter,
  textDark: colors.neutral.darkest,
  brandPrimary: colors.brand.primary,
  brandSecondary: colors.brand.secondary,
  highlight: colors.brand.accent,
  neutralLight: colors.neutral.lightest,
  neutralDark: colors.neutral.dark,
  borderLight: colors.neutral.light,
  paginationInactive: colors.pagination.inactive,
};

export const welcomeStyles = StyleSheet.create({
  // Container styles
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colours.textDark,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },

  // Header styles
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
    paddingBottom: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  titleBackground: {
    width: screenWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 100,
    opacity: 1,
    fontFamily: fontFamily.satoshiBold,
    fontSize: 32,
    fontWeight: 'bold',
    color: colours.textDark, // Dark bold color as requested
    textAlign: 'center',
    // Removed text shadow to keep it clean/flat as per "modern"
  },

  // Carousel styles
  carouselContainer: {
    flex: 1,
    width: screenWidth,
  },
  carouselScrollView: {
    flex: 1,
  },
  slideContainer: {
    width: screenWidth,
    flex: 1,
    position: 'relative',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: '100%',
    zIndex: 0,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  
  // Text overlay (Modern, Clean, No Cards)
  textContainer: {
    position: 'absolute',
    bottom: 0, 
    left: 0,
    right: 0,
    alignItems: 'center', // Center align
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',

    paddingBottom: 160, // Maintain the original spacing for the text
  },
  slideTextBackground: {
    width: screenWidth,
    alignItems: 'center',
  },
  slideTitle: {
    fontFamily: fontFamily.satoshiBlack,
    fontSize: 48, // Larger, hierarchical
    fontWeight: '800',
    color: '#FFFFFF', // White text for contrast on images
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)', // Soft shadow for readability
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  slideSubtitle: {
    fontFamily: fontFamily.satoshi,
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 0,
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Pagination styles
  paginationContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center', // Center the pills
    alignItems: 'center',
    zIndex: 2,
  },
  paginationDotContainer: {
    paddingHorizontal: 4, // Even spacing
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral.medium,
  },
  paginationDotActive: {
    backgroundColor: colors.cypress.pale, // Use app's cypress color
    width: 28,
  },

  // Auth buttons styles
  authButtonsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 24,
    right: 24,
    zIndex: 2,
  },
  signUpButton: {
    backgroundColor: colors.cypress.deep, // Use cypress deep for brand consistency
    borderRadius: 14, // Rounded but not pill
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: colors.cypress.deep,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signUpButtonText: {
    fontFamily: fontFamily.satoshiBold,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  signInButton: {
    backgroundColor: colours.neutralLight,
    borderWidth: 1,
    borderColor: colours.brandPrimary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  signInButtonText: {
    fontFamily: fontFamily.satoshiBold,
    color: colours.brandPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Swipe hint styles
  swipeHintContainer: {
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 20,
    marginTop: -40,
  },
  swipeHintText: {
    fontFamily: fontFamily.satoshi,
    fontSize: 14,
    color: colours.neutralDark,
    textAlign: 'center',
  },

  // Legacy styles
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: fontFamily.satoshiBlack,
    fontSize: 55,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.satoshiBold,
    fontSize: 20,
    color: colours.brandPrimary,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    fontFamily: fontFamily.satoshi,
    fontSize: 16,
    color: colours.neutralDark,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsSection: {
    marginBottom: 20,
  },
  emailSection: {
    marginBottom: 20,
  },
  passwordSection: {
    marginBottom: 20,
  },
  storeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: fontFamily.satoshiBold,
    fontSize: 20,
    fontWeight: '600',
    color: colours.textDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    fontFamily: fontFamily.satoshi,
    backgroundColor: colours.neutralLight,
    borderWidth: 1,
    borderColor: colours.borderLight,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: colours.textDark,
  },
  button: {
    backgroundColor: colours.brandPrimary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: colours.neutralLight,
    borderWidth: 1,
    borderColor: colours.borderLight,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  returningUserButton: {
    backgroundColor: colours.brandSecondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: fontFamily.satoshiBold,
    color: colours.neutralLight,
    fontSize: 16,
    fontWeight: '600',
  },
  googleButtonText: {
    fontFamily: fontFamily.satoshiBold,
    color: colours.textDark,
    fontSize: 16,
    fontWeight: '600',
  },
  returningUserButtonText: {
    fontFamily: fontFamily.satoshiBold,
    color: colours.neutralLight,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colours.borderLight,
  },
  dividerText: {
    fontFamily: fontFamily.satoshi,
    marginHorizontal: 16,
    color: colours.neutralDark,
    fontSize: 14,
  },
  backButton: {
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    fontFamily: fontFamily.satoshi,
    color: colours.brandPrimary,
    fontSize: 16,
  },
  signInLink: {
    alignItems: 'center',
    padding: 12,
    marginTop: 8,
  },
  signInLinkText: {
    fontFamily: fontFamily.satoshi,
    color: colours.brandPrimary,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  primaryButton: {
    backgroundColor: colours.brandPrimary,
    borderWidth: 2,
    borderColor: colours.brandPrimary,
  },
  primaryButtonText: {
    fontFamily: fontFamily.satoshiBold,
    color: colours.neutralLight,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colours.neutralLight,
    borderWidth: 1,
    borderColor: colours.brandPrimary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontFamily: fontFamily.satoshiBold,
    color: colours.brandPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colours.brandPrimary,
    backgroundColor: colours.neutralLight,
  },
  navButtonText: {
    fontFamily: fontFamily.satoshiBold,
    color: colours.brandPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryNavButton: {
    backgroundColor: colours.brandPrimary,
    borderColor: colours.brandPrimary,
  },
  primaryNavButtonText: {
    fontFamily: fontFamily.satoshiBold,
    color: colours.neutralLight,
    fontSize: 16,
    fontWeight: '600',
  },
});
