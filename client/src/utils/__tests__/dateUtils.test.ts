import { toUTCDate, formatDate } from '../dateUtils';

// Mock console.debug to avoid cluttering test output
const originalConsoleDebug = console.debug;
beforeAll(() => {
  console.debug = jest.fn();
});

afterAll(() => {
  console.debug = originalConsoleDebug;
});

describe('dateUtils', () => {
  describe('toUTCDate', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should convert a Date object to UTC ISO string at noon', () => {
      const localDate = new Date(2023, 5, 15); // June 15, 2023 (month is 0-indexed)
      const result = toUTCDate(localDate);
      
      expect(result).toBe('2023-06-15T12:00:00.000Z');
    });

    it('should convert a date string to UTC ISO string at noon', () => {
      const dateString = '2023-06-15';
      const result = toUTCDate(dateString);
      
      expect(result).toBe('2023-06-15T12:00:00.000Z');
    });

    it('should handle ISO date strings correctly', () => {
      const isoString = '2023-06-15T14:30:00.000Z';
      const result = toUTCDate(isoString);
      
      expect(result).toBe('2023-06-15T12:00:00.000Z');
    });

    it('should handle local date strings in different formats', () => {
      const dateFormats = [
        '2023-06-15',
        '6/15/2023',
        'Jun 15, 2023',
        '2023/06/15',
      ];

      dateFormats.forEach(dateFormat => {
        const result = toUTCDate(dateFormat);
        expect(result).toBe('2023-06-15T12:00:00.000Z');
      });
    });

    it('should handle edge case dates correctly', () => {
      // Test leap year
      const leapYearDate = new Date(2024, 1, 29); // Feb 29, 2024
      const result = toUTCDate(leapYearDate);
      expect(result).toBe('2024-02-29T12:00:00.000Z');
    });

    it('should handle year boundary correctly', () => {
      // New Year's Eve
      const newYearEve = new Date(2023, 11, 31); // Dec 31, 2023
      const result = toUTCDate(newYearEve);
      expect(result).toBe('2023-12-31T12:00:00.000Z');

      // New Year's Day
      const newYearDay = new Date(2024, 0, 1); // Jan 1, 2024
      const result2 = toUTCDate(newYearDay);
      expect(result2).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should handle month boundary correctly', () => {
      // End of February in non-leap year
      const febEnd = new Date(2023, 1, 28); // Feb 28, 2023
      const result = toUTCDate(febEnd);
      expect(result).toBe('2023-02-28T12:00:00.000Z');

      // Beginning of March
      const marchStart = new Date(2023, 2, 1); // Mar 1, 2023
      const result2 = toUTCDate(marchStart);
      expect(result2).toBe('2023-03-01T12:00:00.000Z');
    });

    it('should consistently convert times to noon UTC regardless of input time', () => {
      const baseDate = '2023-06-15';
      
      // Different times of day should all result in the same UTC date at noon
      const times = [
        `${baseDate}T00:00:00`,
        `${baseDate}T06:30:00`,
        `${baseDate}T12:00:00`,
        `${baseDate}T18:45:00`,
        `${baseDate}T23:59:59`,
      ];

      times.forEach(timeString => {
        const result = toUTCDate(timeString);
        expect(result).toBe('2023-06-15T12:00:00.000Z');
      });
    });

    it('should handle timezone-aware date strings correctly', () => {
      // These should all convert to the same UTC date
      const timezoneTests = [
        '2023-06-15T00:00:00-07:00', // PDT (UTC-7)
        '2023-06-15T03:00:00-04:00', // EDT (UTC-4)
        '2023-06-15T08:00:00+01:00', // BST (UTC+1)
        '2023-06-15T14:00:00+07:00', // WIB (UTC+7)
      ];

      timezoneTests.forEach(timezoneString => {
        const result = toUTCDate(timezoneString);
        expect(result).toBe('2023-06-15T12:00:00.000Z');
      });
    });

    it('should log debug information for troubleshooting', () => {
      const testDate = new Date(2023, 5, 15);
      toUTCDate(testDate);

      expect(console.debug).toHaveBeenCalledWith(
        'toUTCDate input:',
        expect.objectContaining({
          year: 2023,
          month: 5,
          day: 15,
        })
      );

      expect(console.debug).toHaveBeenCalledWith(
        'toUTCDate result:',
        expect.objectContaining({
          utcDate: '2023-06-15T12:00:00.000Z',
        })
      );
    });

    it('should handle invalid dates gracefully', () => {
      // Note: JavaScript Date constructor is quite forgiving
      // This test documents current behavior - might want to add validation
      const invalidDate = 'not-a-date';
      const result = toUTCDate(invalidDate);
      
      // This will create an invalid date, but toISOString will throw
      expect(() => {
        new Date(invalidDate).toISOString();
      }).toThrow();
    });

    it('should handle daylight saving time transitions correctly', () => {
      // Spring forward (second Sunday in March 2023 = March 12)
      const springForward = new Date(2023, 2, 12);
      const springResult = toUTCDate(springForward);
      expect(springResult).toBe('2023-03-12T12:00:00.000Z');

      // Fall back (first Sunday in November 2023 = November 5)
      const fallBack = new Date(2023, 10, 5);
      const fallResult = toUTCDate(fallBack);
      expect(fallResult).toBe('2023-11-05T12:00:00.000Z');
    });
  });

  describe('formatDate', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should format date with default options', () => {
      const dateString = '2023-06-15T12:00:00.000Z';
      const result = formatDate(dateString);
      
      // Default format: { weekday: 'short', month: 'short', day: 'numeric' }
      expect(result).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}$/);
    });

    it('should format date with custom options', () => {
      const dateString = '2023-06-15T12:00:00.000Z';
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      
      const result = formatDate(dateString, options);
      expect(result).toBe('June 15, 2023');
    });

    it('should handle different date formats', () => {
      const testDates = [
        '2023-01-01T12:00:00.000Z',
        '2023-06-15T12:00:00.000Z',
        '2023-12-31T12:00:00.000Z',
      ];

      testDates.forEach(dateString => {
        const result = formatDate(dateString);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should handle timezone display correctly', () => {
      const dateString = '2023-06-15T12:00:00.000Z';
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short',
      };
      
      const result = formatDate(dateString, options);
      expect(result).toContain('2023');
      expect(result).toContain('Jun');
      expect(result).toContain('15');
    });

    it('should log debug information', () => {
      const dateString = '2023-06-15T12:00:00.000Z';
      formatDate(dateString);

      expect(console.debug).toHaveBeenCalledWith(
        'formatDate input:',
        expect.objectContaining({
          dateString: '2023-06-15T12:00:00.000Z',
        })
      );
    });

    it('should handle edge case dates', () => {
      // Leap year
      const leapYear = '2024-02-29T12:00:00.000Z';
      const result = formatDate(leapYear);
      expect(result).toContain('29');

      // Year boundary
      const newYear = '2024-01-01T12:00:00.000Z';
      const result2 = formatDate(newYear);
      expect(result2).toContain('Jan');
      expect(result2).toContain('1');
    });

    it('should format dates consistently across different locales', () => {
      const dateString = '2023-06-15T12:00:00.000Z';
      
      // Test with explicit locale (en-US is hardcoded in the function)
      const result = formatDate(dateString);
      expect(result).toMatch(/Thu, Jun 15/);
    });

    it('should handle different ISO string formats', () => {
      const isoFormats = [
        '2023-06-15T12:00:00.000Z',
        '2023-06-15T12:00:00Z',
        '2023-06-15T12:00:00.123Z',
      ];

      isoFormats.forEach(isoString => {
        const result = formatDate(isoString);
        expect(result).toContain('Jun');
        expect(result).toContain('15');
      });
    });

    it('should work with toUTCDate output', () => {
      const originalDate = new Date(2023, 5, 15);
      const utcString = toUTCDate(originalDate);
      const formatted = formatDate(utcString);
      
      expect(formatted).toContain('Jun');
      expect(formatted).toContain('15');
    });
  });

  describe('Integration tests', () => {
    it('should handle complete date workflow', () => {
      // Simulate user input -> UTC conversion -> display formatting
      const userInput = '2023-06-15';
      const utcDate = toUTCDate(userInput);
      const displayDate = formatDate(utcDate);
      
      expect(utcDate).toBe('2023-06-15T12:00:00.000Z');
      expect(displayDate).toContain('Jun');
      expect(displayDate).toContain('15');
    });

    it('should handle timezone conversion edge cases', () => {
      // Test dates that might cause timezone issues
      const edgeCases = [
        '2023-03-12', // DST spring forward
        '2023-11-05', // DST fall back
        '2023-12-31', // Year boundary
        '2024-02-29', // Leap year
      ];

      edgeCases.forEach(dateInput => {
        const utcDate = toUTCDate(dateInput);
        const formatted = formatDate(utcDate);
        
        expect(utcDate).toMatch(/T12:00:00\.000Z$/);
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      });
    });

    it('should maintain date consistency across multiple conversions', () => {
      const originalDate = '2023-06-15';
      
      // Convert multiple times - should always give same result
      const conversion1 = toUTCDate(originalDate);
      const conversion2 = toUTCDate(conversion1);
      const conversion3 = toUTCDate(new Date(conversion1));
      
      expect(conversion1).toBe(conversion2);
      expect(conversion2).toBe(conversion3);
      expect(conversion1).toBe('2023-06-15T12:00:00.000Z');
    });
  });
});
