import { formatWeight, roundToNearest5 } from './helpers';

describe('helper functions', () => {
  describe('roundToNearest5', () => {
    it('should round to the nearest 5 pounds', () => {
      // Test a variety of values
      expect(roundToNearest5(0)).toBe(0);
      expect(roundToNearest5(2)).toBe(0);
      expect(roundToNearest5(3)).toBe(5);
      expect(roundToNearest5(5)).toBe(5);
      expect(roundToNearest5(7)).toBe(5);
      expect(roundToNearest5(8)).toBe(10);
      expect(roundToNearest5(10)).toBe(10);
      expect(roundToNearest5(12)).toBe(10);
      expect(roundToNearest5(13)).toBe(15);
      expect(roundToNearest5(22)).toBe(20);
      expect(roundToNearest5(22.4)).toBe(20);
      expect(roundToNearest5(22.5)).toBe(25);
      expect(roundToNearest5(23)).toBe(25);
      expect(roundToNearest5(147)).toBe(145);
      expect(roundToNearest5(148)).toBe(150);
    });

    it('should handle null, undefined and negative values', () => {
      expect(roundToNearest5(null)).toBeNull();
      expect(roundToNearest5(undefined)).toBeUndefined();
      expect(roundToNearest5(-5)).toBe(-5);
      expect(roundToNearest5(-7)).toBe(-5);
      expect(roundToNearest5(-13)).toBe(-15);
    });
  });

  describe('formatWeight', () => {
    it('should format weight with rounding to nearest 5', () => {
      expect(formatWeight(102)).toBe('100 lbs');
      expect(formatWeight(103)).toBe('105 lbs');
      expect(formatWeight(147.5)).toBe('150 lbs'); 
      expect(formatWeight(147.4)).toBe('145 lbs');
    });

    it('should handle null and undefined values', () => {
      expect(formatWeight(null)).toBe('-');
      expect(formatWeight(undefined)).toBe('-');
    });
  });
});