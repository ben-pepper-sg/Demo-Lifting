import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const email = 'test@example.com';
    const password = 'test1234';
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });

    console.log(`Admin user created successfully with email: ${email}`);
    console.log(`User ID: ${adminUser.id}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createAdminUser()
  .then(() => console.log('Done'))
  .catch(e => console.error(e));