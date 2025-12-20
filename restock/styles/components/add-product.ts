import { StyleSheet } from 'react-native';
import { typography } from '../typography';
import colors from '../../lib/theme/colors';

export const addProductScreenStyles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontFamily: typography.appTitle.fontFamily,
    color: colors.neutral.darkest,
    marginTop: 16,
    marginBottom: 6,
  },

  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.neutral.light,
    padding: 8,
    borderRadius: 10,
    justifyContent: 'space-between',
    backgroundColor: colors.neutral.lightest,
  },

  qtyButton: {
    padding: 8,
    backgroundColor: colors.neutral.light,
    borderRadius: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  qtyButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.neutral.darkest,
    fontFamily: typography.appTitle.fontFamily,
  },

  qtyValue: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 12,
    color: colors.neutral.darkest,
    fontFamily: typography.appTitle.fontFamily,
    flex: 1,
    textAlign: 'center',
  },
});
