import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // First, find the first admin user to set as coach
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }

    console.log(`Using admin user ${admin.firstName} ${admin.lastName} as default coach`);

    // Import LiftType enum
    const { LiftType } = await import('@prisma/client');
    
    // Create default schedules for each day of the week
    const schedules = [
      // Weekdays - Upper Body at 5PM
      { dayOfWeek: 1, time: '17:00', capacity: 8, workoutType: LiftType.UPPER, coachId: admin.id }, // Monday
      { dayOfWeek: 2, time: '17:00', capacity: 8, workoutType: LiftType.LOWER, coachId: admin.id }, // Tuesday
      { dayOfWeek: 3, time: '17:00', capacity: 8, workoutType: LiftType.UPPER, coachId: admin.id }, // Wednesday
      { dayOfWeek: 4, time: '17:00', capacity: 8, workoutType: LiftType.LOWER, coachId: admin.id }, // Thursday
      
      // Friday has both types available
      { dayOfWeek: 5, time: '17:00', capacity: 8, workoutType: LiftType.UPPER, coachId: admin.id }, // Friday Upper
      
      // Saturday multiple options
      { dayOfWeek: 6, time: '09:00', capacity: 10, workoutType: LiftType.UPPER, coachId: admin.id }, // Saturday morning
      { dayOfWeek: 6, time: '10:00', capacity: 10, workoutType: LiftType.LOWER, coachId: admin.id }, // Saturday morning
    ];

    // Create the schedules
    for (const schedule of schedules) {
      // Check if schedule already exists
      const existing = await prisma.defaultSchedule.findFirst({
        where: {
          dayOfWeek: schedule.dayOfWeek,
          time: schedule.time,
          workoutType: schedule.workoutType,
        },
      });

      if (!existing) {
        await prisma.defaultSchedule.create({
          data: schedule,
        });
        console.log(`Created default schedule: ${daysOfWeek[schedule.dayOfWeek]} at ${schedule.time} - ${schedule.workoutType}`);
      } else {
        console.log(`Schedule already exists: ${daysOfWeek[schedule.dayOfWeek]} at ${schedule.time} - ${schedule.workoutType}`);
      }
    }

    console.log('Default schedules seeded successfully');
  } catch (error) {
    console.error('Error seeding default schedules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

main()
  .then(() => console.log('Seeding complete'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });