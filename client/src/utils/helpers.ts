/**
 * Creates a debounced function that delays invoking the provided function
 * until after 'wait' milliseconds have elapsed since the last time it was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Rounds a number to the nearest 5
 * @param value Number to round
 * @returns Rounded number
 */
export function roundToNearest5(value: number | null | undefined): number | null | undefined {
  if (value === null || value === undefined) return value;
  return Math.round(value / 5) * 5;
}

/**
 * Formats a number as a weight value, rounding to the nearest 5 pounds
 * @param value Number to format
 * @returns Formatted weight string
 */
export function formatWeight(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  // No need to round again as we're now rounding on the server side
  return `${value} lbs`;
}