import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if the first user has the new fields
    const user = await prisma.user.findFirst();
    console.log('User schema with new reset fields:', {
      id: user?.id,
      email: user?.email,
      hasResetToken: 'resetToken' in (user || {}),
      hasResetTokenExpiry: 'resetTokenExpiry' in (user || {})
    });

    // Try updating a user with reset token fields
    const updateResult = await prisma.user.update({
      where: { id: user?.id },
      data: {
        resetToken: 'test-token',
        resetTokenExpiry: new Date(Date.now() + 3600000) // 1 hour from now
      },
    });

    console.log('Update successful:', {
      resetTokenUpdated: updateResult.resetToken === 'test-token',
      resetTokenExpiryUpdated: updateResult.resetTokenExpiry !== null
    });

    // Reset the token (cleanup)
    await prisma.user.update({
      where: { id: user?.id },
      data: {
        resetToken: null,
        resetTokenExpiry: null
      },
    });

    console.log('Reset token fields cleared successfully');
  } catch (error) {
    console.error('Error verifying reset token fields:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();