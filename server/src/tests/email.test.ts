import { sendPasswordResetEmail } from '../services/email';

describe('Email Service Tests', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console.log to verify email would be sent
    consoleSpy = jest.spyOn(console, 'log');
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('sendPasswordResetEmail', () => {
    it('should log password reset email details', async () => {
      const email = 'test@example.com';
      const resetToken = 'test-reset-token';
      const resetUrl = 'http://example.com/reset-password?token=test-reset-token';

      await sendPasswordResetEmail(email, resetToken, resetUrl);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Sending password reset email to ${email} with reset URL: ${resetUrl}`
      );
    });

    it('should resolve without error', async () => {
      const email = 'test@example.com';
      const resetToken = 'test-reset-token';
      const resetUrl = 'http://example.com/reset-password?token=test-reset-token';

      await expect(sendPasswordResetEmail(email, resetToken, resetUrl))
        .resolves
        .not.toThrow();
    });

    it('should handle special characters in email and URL', async () => {
      const email = 'test+special@example.com';
      const resetToken = 'complex!@#$-token';
      const resetUrl = 'http://example.com/reset-password?token=complex!@%23$-token';

      await sendPasswordResetEmail(email, resetToken, resetUrl);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Sending password reset email to ${email} with reset URL: ${resetUrl}`
      );
    });
  });
});