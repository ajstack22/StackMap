import { StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS, COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    fontWeight: '600',
    color: 'white',
  },
  supportContent: {
    flex: 1,
    padding: 20,
  },
  supportHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  supportHeart: {
    fontSize: 60,
    marginBottom: 16,
  },
  supportTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5C7E9D',
    marginBottom: 8,
  },
  supportSubtitle: {
    fontSize: 18,
    color: '#8FA5B8',
  },
  teamCaption: {
    fontSize: 16,
    color: '#5C7E9D',
    fontWeight: '500',
    marginBottom: 16,
    marginTop: 8,
  },
  supportMessageBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  supportMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4a5568',
    textAlign: 'center',
  },
  supportWaysSection: {
    marginBottom: 32,
  },
  supportSectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#5C7E9D',
    textAlign: 'center',
    marginBottom: 24,
  },
  supportOptionFun: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportIconBig: {
    fontSize: 36,
    marginRight: 16,
  },
  supportOptionContent: {
    flex: 1,
  },
  supportOptionTitleFun: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5C7E9D',
    marginBottom: 4,
  },
  supportOptionTextFun: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4a5568',
  },
  supportContactBox: {
    backgroundColor: '#5C7E9D',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  supportContactTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  supportContactText: {
    fontSize: 16,
    color: 'white',
  },
  supportFooter: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  supportFooterText: {
    fontSize: 16,
    color: '#8FA5B8',
    textAlign: 'center',
  },
});