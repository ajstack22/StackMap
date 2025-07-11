import { StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS, COLORS, SHADOWS } from '../../../constants';

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
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
    fontWeight: '600',
    color: 'white',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 24,
  },
  usersList: {
    backgroundColor: 'white',
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userItemActive: {
    backgroundColor: '#f0f9ff',
  },
  userItemEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  userItemName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  userItemNameActive: {
    fontWeight: '600',
  },
  editUserButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteUserButton: {
    padding: 8,
    marginLeft: 4,
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  addUserText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: RADIUS.medium,
    padding: 4,
  },
  toggle: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: RADIUS.small,
  },
  toggleActive: {
    backgroundColor: 'white',
    ...SHADOWS.small,
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
  },
  toggleTextActive: {
    fontWeight: '600',
    color: '#333',
  },
  pinSection: {
    backgroundColor: 'white',
    borderRadius: RADIUS.medium,
    padding: 20,
    ...SHADOWS.medium,
  },
  pinStatus: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  pinButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  pinButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.small,
    alignItems: 'center',
  },
  pinButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS.medium,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsSection: {
    backgroundColor: 'white',
    borderRadius: RADIUS.medium,
    padding: 20,
    ...SHADOWS.medium,
  },
});