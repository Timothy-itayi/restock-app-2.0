import { StyleSheet } from 'react-native';
import { fontFamily } from '../typography';
import colors, { type AppColors } from '../../lib/theme/colors';

export const getAuthStyles = (t: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.neutral.lighter,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  title: {
    fontFamily: fontFamily.satoshiBlack,
    fontSize: 32,
    fontWeight: 'bold',
    color: t.neutral.darkest,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.satoshiBold,
    fontSize: 18,
    color: t.brand.primary,
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: fontFamily.satoshiBold,
    fontSize: 14,
    color: t.neutral.dark,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    fontFamily: fontFamily.satoshi,
    backgroundColor: t.neutral.lightest,
    borderWidth: 1,
    borderColor: t.neutral.light,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: t.neutral.darkest,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: fontFamily.satoshi,
    fontSize: 14,
    color: '#CC0000',
    marginLeft: 8,
  },
  button: {
    backgroundColor: t.brand.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: fontFamily.satoshiBold,
    color: t.neutral.lightest,
    fontSize: 17,
    fontWeight: '700',
  },
  // Original index styles
  primaryButton: {
    backgroundColor: t.brand.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: fontFamily.satoshiBold,
    color: t.neutral.lightest,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: t.neutral.lightest,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: t.brand.primary,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: fontFamily.satoshiBold,
    color: t.brand.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  linkButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    fontFamily: fontFamily.satoshi,
    color: t.brand.primary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

// Backward-compatible export
export const getAuthIndexStyles = getAuthStyles;
export const authIndexStyles = getAuthIndexStyles(colors);