/**
 * Utility functions for handling dates consistently across the application
 */

/**
 * Converts a local date to a UTC date at midnight
 * This ensures dates are stored in UTC without timezone shifts
 */
export function toUTCDate(localDate: string | Date): string {
  const date = typeof localDate === 'string' ? new Date(localDate) : localDate;
  
  // Log original date details for debugging
  const originalDateInfo = {
    localDate: typeof localDate === 'string' ? localDate : localDate.toString(),
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    asString: date.toString(),
  };
  console.debug('toUTCDate input:', originalDateInfo);
  
  // Create date in UTC at noon (to avoid any timezone edge cases)
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, 0, 0 // noon UTC to avoid any date-shifting issues
  ));
  
  // Log resulting UTC date
  console.debug('toUTCDate result:', {
    utcDate: utcDate.toISOString(),
    localString: utcDate.toString(),
  });
  
  return utcDate.toISOString();
}

/**
 * Formats a date for display with the specified options
 */
export function formatDate(dateString: string, options: Intl.DateTimeFormatOptions = { 
  weekday: 'short', 
  month: 'short', 
  day: 'numeric' 
}): string {
  // Parse the ISO string into a Date object
  const date = new Date(dateString);
  
  // Log date parsing for debugging
  console.debug('formatDate input:', {
    dateString,
    parsedDate: date.toString(),
    utcString: date.toUTCString()
  });
  
  // Format the date for display in the local timezone
  return date.toLocaleDateString('en-US', options);
}