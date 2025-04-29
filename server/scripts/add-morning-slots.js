const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMorningSlots() {
  try {
    // Get admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      throw new Error('No admin user found');
    }

    console.log('Using admin:', admin.firstName, admin.lastName);

    // Days 1-5 (Monday-Friday)
    for (let day = 1; day <= 5; day++) {
      // Determine workout type (odd days = upper, even days = lower)
      const workoutType = day % 2 === 1 ? 'UPPER' : 'LOWER';
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];

      // Create 8am slot
      const slot8am = await prisma.defaultSchedule.create({
        data: {
          dayOfWeek: day,
          time: '08:00',
          capacity: 8,
          workoutType,
          isActive: true,
          coachId: admin.id
        }
      });
      console.log(`Created 8:00 AM slot for ${dayName} (${workoutType})`);

      // Create 9am slot
      const slot9am = await prisma.defaultSchedule.create({
        data: {
          dayOfWeek: day,
          time: '09:00',
          capacity: 8,
          workoutType,
          isActive: true,
          coachId: admin.id
        }
      });
      console.log(`Created 9:00 AM slot for ${dayName} (${workoutType})`);
    }

    console.log('All morning slots created successfully!');
  } catch (error) {
    console.error('Error creating slots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMorningSlots();