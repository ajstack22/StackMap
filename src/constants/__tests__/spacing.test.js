import { SPACING, DIMENSIONS, LEGACY_SPACING, getSpacing, getDimension } from '../spacing';

describe('Spacing Constants', () => {
  describe('SPACING', () => {
    it('should have all expected spacing values', () => {
      expect(SPACING.XXS).toBe(2);
      expect(SPACING.XS).toBe(4);
      expect(SPACING.XS_MD).toBe(6);
      expect(SPACING.XS_LG).toBe(7);
      expect(SPACING.SM).toBe(8);
      expect(SPACING.SM_MD).toBe(10);
      expect(SPACING.MD_SM).toBe(12);
      expect(SPACING.MD_LG).toBe(15);
      expect(SPACING.MD).toBe(16);
      expect(SPACING.LG).toBe(20);
      expect(SPACING.XL).toBe(24);
      expect(SPACING.XXL).toBe(32);
      expect(SPACING.XXL_MD).toBe(35);
      expect(SPACING.XXXL).toBe(48);
    });

    it('should follow 8px grid for main values', () => {
      expect(SPACING.SM).toBe(8);
      expect(SPACING.MD).toBe(16);
      expect(SPACING.XL).toBe(24);
      expect(SPACING.XXL).toBe(32);
      expect(SPACING.XXXL).toBe(48);
    });
  });

  describe('DIMENSIONS', () => {
    it('should have icon dimensions', () => {
      expect(DIMENSIONS.ICON.SM).toBe(18);
      expect(DIMENSIONS.ICON.MD).toBe(24);
      expect(DIMENSIONS.ICON.LG).toBe(32);
      expect(DIMENSIONS.ICON.XL).toBe(40);
      expect(DIMENSIONS.ICON.XXL).toBe(48);
      expect(DIMENSIONS.ICON.XXXL).toBe(60);
      expect(DIMENSIONS.ICON.JUMBO).toBe(81);
    });

    it('should have height dimensions', () => {
      expect(DIMENSIONS.HEIGHT.HAIRLINE).toBe(2.5);
      expect(DIMENSIONS.HEIGHT.LINE).toBe(5);
      expect(DIMENSIONS.HEIGHT.BUTTON).toBe(60);
      expect(DIMENSIONS.HEIGHT.CARD).toBe(100);
      expect(DIMENSIONS.HEIGHT.CARD_LG).toBe(110);
    });

    it('should have width dimensions', () => {
      expect(DIMENSIONS.WIDTH.NARROW).toBe(32);
      expect(DIMENSIONS.WIDTH.SM).toBe(40);
      expect(DIMENSIONS.WIDTH.MD).toBe(60);
      expect(DIMENSIONS.WIDTH.SQUARE).toBe(81);
    });
  });

  describe('LEGACY_SPACING', () => {
    it('should map legacy values to new constants', () => {
      expect(LEGACY_SPACING.PADDING_4).toBe(SPACING.XS);
      expect(LEGACY_SPACING.PADDING_7).toBe(SPACING.XS_LG);
      expect(LEGACY_SPACING.PADDING_8).toBe(SPACING.SM);
      expect(LEGACY_SPACING.PADDING_10).toBe(SPACING.SM_MD);
      expect(LEGACY_SPACING.PADDING_12).toBe(SPACING.MD_SM);
      expect(LEGACY_SPACING.PADDING_15).toBe(SPACING.MD_LG);
      expect(LEGACY_SPACING.PADDING_16).toBe(SPACING.MD);
      expect(LEGACY_SPACING.PADDING_20).toBe(SPACING.LG);
      expect(LEGACY_SPACING.PADDING_24).toBe(SPACING.XL);
      expect(LEGACY_SPACING.PADDING_35).toBe(SPACING.XXL_MD);
    });
  });

  describe('Helper Functions', () => {
    describe('getSpacing', () => {
      it('should return correct spacing value', () => {
        expect(getSpacing('SM')).toBe(8);
        expect(getSpacing('MD')).toBe(16);
        expect(getSpacing('LG')).toBe(20);
      });

      it('should return default value for invalid key', () => {
        expect(getSpacing('INVALID')).toBe(16); // MD is default
        expect(getSpacing(undefined)).toBe(16);
      });
    });

    describe('getDimension', () => {
      it('should return correct dimension value', () => {
        expect(getDimension('ICON', 'SM')).toBe(18);
        expect(getDimension('ICON', 'LG')).toBe(32);
        expect(getDimension('HEIGHT', 'CARD')).toBe(100);
        expect(getDimension('WIDTH', 'NARROW')).toBe(32);
      });

      it('should return default value for invalid parameters', () => {
        expect(getDimension('INVALID', 'SM')).toBe(24); // ICON.MD is default
        expect(getDimension('ICON', 'INVALID')).toBe(24);
        expect(getDimension(undefined, undefined)).toBe(24);
      });
    });
  });

  describe('Consistency Checks', () => {
    it('should have consistent progression in spacing', () => {
      // Check that larger values are indeed larger
      expect(SPACING.XS).toBeLessThan(SPACING.SM);
      expect(SPACING.SM).toBeLessThan(SPACING.MD);
      expect(SPACING.MD).toBeLessThan(SPACING.LG);
      expect(SPACING.LG).toBeLessThan(SPACING.XL);
      expect(SPACING.XL).toBeLessThan(SPACING.XXL);
      expect(SPACING.XXL).toBeLessThan(SPACING.XXXL);
    });

    it('should have consistent progression in icon dimensions', () => {
      expect(DIMENSIONS.ICON.SM).toBeLessThan(DIMENSIONS.ICON.MD);
      expect(DIMENSIONS.ICON.MD).toBeLessThan(DIMENSIONS.ICON.LG);
      expect(DIMENSIONS.ICON.LG).toBeLessThan(DIMENSIONS.ICON.XL);
      expect(DIMENSIONS.ICON.XL).toBeLessThan(DIMENSIONS.ICON.XXL);
      expect(DIMENSIONS.ICON.XXL).toBeLessThan(DIMENSIONS.ICON.XXXL);
    });
  });
});