// Script to check all schedules and their date formatting
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get current date (without time)
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log(`Today's date: ${currentDate.toISOString()}`);
    
    // Find today's schedules
    console.log('\nSchedules for TODAY:');
    console.log('--------------------------');
    const todaySchedules = await prisma.schedule.findMany({
      where: {
        date: {
          equals: currentDate
        }
      },
      orderBy: {
        time: 'asc'
      }
    });
    
    if (todaySchedules.length === 0) {
      console.log('No schedules found for today');
    } else {
      todaySchedules.forEach(schedule => {
        console.log(`Time: ${schedule.time}, Type: ${schedule.workoutType}, ID: ${schedule.id}`);
      });
    }
    
    // Get schedules specifically at 4pm
    console.log('\nAll 4 PM schedules in the database:');
    console.log('--------------------------');
    const fourPMSchedules = await prisma.schedule.findMany({
      where: {
        time: '16:00'
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    if (fourPMSchedules.length === 0) {
      console.log('No 4 PM schedules found in the database');
    } else {
      fourPMSchedules.forEach(schedule => {
        // Convert the date to a readable format
        const scheduleDate = new Date(schedule.date);
        console.log(`Date: ${scheduleDate.toDateString()}, ID: ${schedule.id}, Workout: ${schedule.workoutType}`);
      });
    }
    
    // Also check what startDate and endDate query parameters would fetch
    console.log('\nTesting date range query:');
    console.log('--------------------------');
    const startDate = currentDate;
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + 7);
    
    console.log(`Start date: ${startDate.toISOString()}, End date: ${endDate.toISOString()}`);
    
    const rangeSchedules = await prisma.schedule.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    console.log(`Found ${rangeSchedules.length} schedules in the next 7 days`);
    
  } catch (error) {
    console.error('Error checking schedules:', error);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });