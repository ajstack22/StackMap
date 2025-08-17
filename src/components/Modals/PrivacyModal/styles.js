import { StyleSheet, Platform } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS, COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: 'white',
  },
  privacyContent: {
    padding: 20,
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  privacyHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  privacyTitle: {
    fontSize: 28,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  privacyDate: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#7f8c8d',
  },
  privacySection: {
    marginBottom: 24,
  },
  privacySubtitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    lineHeight: 24,
    color: '#34495e',
  },
  privacyBold: {
    fontWeight: '600',
  },
  privacyList: {
    marginTop: 8,
  },
  privacyListItem: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    lineHeight: 24,
    color: '#34495e',
    marginBottom: 8,
  },
  privacyFooter: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    marginBottom: 20,
  },
  privacyFooterText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    lineHeight: 20,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});
