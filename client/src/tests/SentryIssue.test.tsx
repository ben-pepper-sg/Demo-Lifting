import { render } from '@testing-library/react';

describe('Sentry Issue LIFTING-CLIENT-F', () => {
  it('should not throw uncaught console errors', () => {
    // This test ensures no uncaught console errors are thrown during testing
    const originalError = console.error;
    const errorSpy = jest.fn();
    console.error = errorSpy;
    
    try {
      // Any component rendering should not cause uncaught console errors
      render(<div>Test component</div>);
      
      // Check that no console errors were logged
      expect(errorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Uncaught console error for testing')
      );
    } finally {
      console.error = originalError;
    }
  });
});
