import { Z_INDEX, COMPONENT_Z_INDEX, LEGACY_Z_INDEX, getComponentZIndex, isAbove, getLayeredZIndex } from '../zIndex';

describe('Z-Index Constants', () => {
  describe('Z_INDEX', () => {
    it('should have all expected z-index layers', () => {
      expect(Z_INDEX.BASE).toBe(1);
      expect(Z_INDEX.ELEVATED).toBe(10);
      expect(Z_INDEX.STICKY).toBe(100);
      expect(Z_INDEX.DROPDOWN).toBe(1000);
      expect(Z_INDEX.MODAL_BACKDROP).toBe(9999);
      expect(Z_INDEX.MODAL).toBe(10000);
      expect(Z_INDEX.NOTIFICATION).toBe(99999);
      expect(Z_INDEX.CRITICAL).toBe(999999);
      expect(Z_INDEX.MAX).toBe(1000000);
    });

    it('should have proper stacking order', () => {
      expect(Z_INDEX.BASE).toBeLessThan(Z_INDEX.ELEVATED);
      expect(Z_INDEX.ELEVATED).toBeLessThan(Z_INDEX.STICKY);
      expect(Z_INDEX.STICKY).toBeLessThan(Z_INDEX.DROPDOWN);
      expect(Z_INDEX.DROPDOWN).toBeLessThan(Z_INDEX.MODAL_BACKDROP);
      expect(Z_INDEX.MODAL_BACKDROP).toBeLessThan(Z_INDEX.MODAL);
      expect(Z_INDEX.MODAL).toBeLessThan(Z_INDEX.NOTIFICATION);
      expect(Z_INDEX.NOTIFICATION).toBeLessThan(Z_INDEX.CRITICAL);
      expect(Z_INDEX.CRITICAL).toBeLessThan(Z_INDEX.MAX);
    });
  });

  describe('COMPONENT_Z_INDEX', () => {
    it('should map navigation components correctly', () => {
      expect(COMPONENT_Z_INDEX.HEADER).toBe(Z_INDEX.STICKY);
      expect(COMPONENT_Z_INDEX.TOOLBAR).toBe(Z_INDEX.STICKY);
      expect(COMPONENT_Z_INDEX.FAB).toBe(Z_INDEX.MODAL);
    });

    it('should map dropdown components correctly', () => {
      expect(COMPONENT_Z_INDEX.DROPDOWN_MENU).toBe(Z_INDEX.DROPDOWN);
      expect(COMPONENT_Z_INDEX.CONTEXT_MENU).toBe(Z_INDEX.DROPDOWN);
      expect(COMPONENT_Z_INDEX.AUTOCOMPLETE).toBe(Z_INDEX.DROPDOWN);
    });

    it('should map modal components correctly', () => {
      expect(COMPONENT_Z_INDEX.MODAL_OVERLAY).toBe(Z_INDEX.MODAL_BACKDROP);
      expect(COMPONENT_Z_INDEX.MODAL_CONTENT).toBe(Z_INDEX.MODAL);
      expect(COMPONENT_Z_INDEX.DRAWER).toBe(Z_INDEX.MODAL);
    });

    it('should map notification components correctly', () => {
      expect(COMPONENT_Z_INDEX.TOAST).toBe(Z_INDEX.NOTIFICATION);
      expect(COMPONENT_Z_INDEX.SNACKBAR).toBe(Z_INDEX.NOTIFICATION);
      expect(COMPONENT_Z_INDEX.ALERT).toBe(Z_INDEX.NOTIFICATION);
    });

    it('should map critical UI components correctly', () => {
      expect(COMPONENT_Z_INDEX.CONFIRM_DIALOG).toBe(Z_INDEX.CRITICAL);
      expect(COMPONENT_Z_INDEX.ERROR_BOUNDARY).toBe(Z_INDEX.MAX);
    });

    it('should map special case components correctly', () => {
      expect(COMPONENT_Z_INDEX.SYNC_PROGRESS).toBe(Z_INDEX.MODAL_BACKDROP);
      expect(COMPONENT_Z_INDEX.CELEBRATION).toBe(Z_INDEX.MODAL_BACKDROP);
      expect(COMPONENT_Z_INDEX.EDIT_MODE_TOOLBAR).toBe(Z_INDEX.STICKY);
      expect(COMPONENT_Z_INDEX.ACTIVITY_LIBRARY_DROPDOWN).toBe(Z_INDEX.DROPDOWN);
    });
  });

  describe('LEGACY_Z_INDEX', () => {
    it('should map legacy values to new constants', () => {
      expect(LEGACY_Z_INDEX.Z_1).toBe(Z_INDEX.BASE);
      expect(LEGACY_Z_INDEX.Z_10).toBe(Z_INDEX.ELEVATED);
      expect(LEGACY_Z_INDEX.Z_100).toBe(Z_INDEX.STICKY);
      expect(LEGACY_Z_INDEX.Z_1000).toBe(Z_INDEX.DROPDOWN);
      expect(LEGACY_Z_INDEX.Z_9999).toBe(Z_INDEX.MODAL_BACKDROP);
      expect(LEGACY_Z_INDEX.Z_10000).toBe(Z_INDEX.MODAL);
      expect(LEGACY_Z_INDEX.Z_99999).toBe(Z_INDEX.NOTIFICATION);
      expect(LEGACY_Z_INDEX.Z_999999).toBe(Z_INDEX.CRITICAL);
      expect(LEGACY_Z_INDEX.Z_1000000).toBe(Z_INDEX.MAX);
    });
  });

  describe('Helper Functions', () => {
    describe('getComponentZIndex', () => {
      it('should return correct z-index for components', () => {
        expect(getComponentZIndex('TOAST')).toBe(Z_INDEX.NOTIFICATION);
        expect(getComponentZIndex('MODAL_CONTENT')).toBe(Z_INDEX.MODAL);
        expect(getComponentZIndex('HEADER')).toBe(Z_INDEX.STICKY);
      });

      it('should return BASE z-index for unknown components', () => {
        expect(getComponentZIndex('UNKNOWN')).toBe(Z_INDEX.BASE);
        expect(getComponentZIndex(undefined)).toBe(Z_INDEX.BASE);
      });
    });

    describe('isAbove', () => {
      it('should correctly compare z-index values', () => {
        expect(isAbove(Z_INDEX.MODAL, Z_INDEX.DROPDOWN)).toBe(true);
        expect(isAbove(Z_INDEX.BASE, Z_INDEX.ELEVATED)).toBe(false);
        expect(isAbove(Z_INDEX.MAX, Z_INDEX.CRITICAL)).toBe(true);
        expect(isAbove(100, 100)).toBe(false);
      });
    });

    describe('getLayeredZIndex', () => {
      it('should calculate layered z-index correctly', () => {
        expect(getLayeredZIndex(Z_INDEX.DROPDOWN)).toBe(1001);
        expect(getLayeredZIndex(Z_INDEX.DROPDOWN, 5)).toBe(1005);
        expect(getLayeredZIndex(Z_INDEX.MODAL, 0)).toBe(10000);
      });

      it('should use default offset of 1', () => {
        expect(getLayeredZIndex(Z_INDEX.BASE)).toBe(2);
        expect(getLayeredZIndex(Z_INDEX.STICKY)).toBe(101);
      });
    });
  });

  describe('Layer Separation', () => {
    it('should have sufficient separation between layers', () => {
      // Ensure there's enough room for sub-layers
      expect(Z_INDEX.STICKY - Z_INDEX.ELEVATED).toBeGreaterThanOrEqual(90);
      expect(Z_INDEX.DROPDOWN - Z_INDEX.STICKY).toBeGreaterThanOrEqual(900);
      expect(Z_INDEX.MODAL - Z_INDEX.MODAL_BACKDROP).toBeGreaterThanOrEqual(1);
      expect(Z_INDEX.NOTIFICATION - Z_INDEX.MODAL).toBeGreaterThanOrEqual(89999);
    });
  });

  describe('Component Priority', () => {
    it('should ensure critical UI is always on top', () => {
      expect(COMPONENT_Z_INDEX.CONFIRM_DIALOG).toBeGreaterThan(COMPONENT_Z_INDEX.TOAST);
      expect(COMPONENT_Z_INDEX.ERROR_BOUNDARY).toBeGreaterThan(COMPONENT_Z_INDEX.CONFIRM_DIALOG);
    });

    it('should ensure modals are above dropdowns', () => {
      expect(COMPONENT_Z_INDEX.MODAL_CONTENT).toBeGreaterThan(COMPONENT_Z_INDEX.DROPDOWN_MENU);
      expect(COMPONENT_Z_INDEX.MODAL_OVERLAY).toBeGreaterThan(COMPONENT_Z_INDEX.DROPDOWN_MENU);
    });

    it('should ensure notifications are above modals', () => {
      expect(COMPONENT_Z_INDEX.TOAST).toBeGreaterThan(COMPONENT_Z_INDEX.MODAL_CONTENT);
      expect(COMPONENT_Z_INDEX.SNACKBAR).toBeGreaterThan(COMPONENT_Z_INDEX.MODAL_CONTENT);
    });

    it('should ensure FABs are at modal level', () => {
      expect(COMPONENT_Z_INDEX.FAB).toBe(COMPONENT_Z_INDEX.MODAL_CONTENT);
    });
  });
});