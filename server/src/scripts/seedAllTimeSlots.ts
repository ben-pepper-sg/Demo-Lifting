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
    
    // Times for weekdays (Monday-Thursday)
    const weekdayTimes = ['16:00', '17:00', '18:00', '19:00'];
    
    // Times for Friday
    const fridayTimes = ['16:00', '17:00', '18:00'];
    
    // Times for Saturday
    const saturdayTimes = ['09:00', '10:00'];
    
    // Create a comprehensive array of all schedule slots
    const schedules = [
      // Monday - Upper Body - All time slots
      ...weekdayTimes.map(time => ({ 
        dayOfWeek: 1, 
        time, 
        capacity: 8, 
        workoutType: LiftType.UPPER, 
        coachId: admin.id 
      })),
      
      // Tuesday - Lower Body - All time slots
      ...weekdayTimes.map(time => ({ 
        dayOfWeek: 2, 
        time, 
        capacity: 8, 
        workoutType: LiftType.LOWER, 
        coachId: admin.id 
      })),
      
      // Wednesday - Upper Body - All time slots
      ...weekdayTimes.map(time => ({ 
        dayOfWeek: 3, 
        time, 
        capacity: 8, 
        workoutType: LiftType.UPPER, 
        coachId: admin.id 
      })),
      
      // Thursday - Lower Body - All time slots
      ...weekdayTimes.map(time => ({ 
        dayOfWeek: 4, 
        time, 
        capacity: 8, 
        workoutType: LiftType.LOWER, 
        coachId: admin.id 
      })),
      
      // Friday - Upper and Lower options available
      ...fridayTimes.map(time => ([
        { dayOfWeek: 5, time, capacity: 8, workoutType: LiftType.UPPER, coachId: admin.id },
        { dayOfWeek: 5, time, capacity: 8, workoutType: LiftType.LOWER, coachId: admin.id }
      ])).flat(),
      
      // Saturday - Morning Upper and Lower options available at both times (like Friday)
      ...saturdayTimes.map(time => ([
        { dayOfWeek: 6, time, capacity: 8, workoutType: LiftType.UPPER, coachId: admin.id },
        { dayOfWeek: 6, time, capacity: 8, workoutType: LiftType.LOWER, coachId: admin.id }
      ])).flat(),
    ];

    // Clear existing default schedules first
    await prisma.defaultSchedule.deleteMany({});
    console.log('Cleared existing default schedules');
    
    // Create the schedules
    let createdCount = 0;
    for (const schedule of schedules) {
      await prisma.defaultSchedule.create({
        data: schedule,
      });
      createdCount++;
      console.log(`Created default schedule: ${daysOfWeek[schedule.dayOfWeek]} at ${schedule.time} - ${schedule.workoutType}`);
    }

    console.log(`Default schedules seeded successfully (${createdCount} slots created)`);
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