import { StyleSheet, Platform } from 'react-native';
import { TYPOGRAPHY, SPACING } from '../../../constants';

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    color: 'white',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  modalContent: {
    padding: 20,
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 10,
    marginBottom: 15,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#000',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 2,
    marginBottom: 20,
  },
  toggle: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: 'white',
  },
  toggleText: {
    fontSize: 16,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  toggleTextActive: {
    color: '#000',
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  celebrationScrollView: {
    marginBottom: 20,
  },
  celebrationOptions: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  celebrationOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginRight: 10,
    backgroundColor: 'white',
  },
  celebrationActive: {
    borderColor: '#007AFF',
  },
  celebrationText: {
    fontSize: 14,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  celebrationTextActive: {
    color: 'white',
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  infoSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  infoButtonText: {
    fontSize: 16,
    color: 'white',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
});