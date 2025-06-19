// Script to check a specific 4 PM class with ID ecb72ddf-86b3-401e-a4a5-8de4dd9ef6d1
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const scheduleId = 'ecb72ddf-86b3-401e-a4a5-8de4dd9ef6d1';
    
    // Get current date (without time)
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log(`Today's date: ${currentDate.toISOString()}`);
    
    // Fetch the specific schedule
    const schedule = await prisma.schedule.findUnique({
      where: {
        id: scheduleId
      },
      include: {
        bookings: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!schedule) {
      console.log(`No schedule found with ID ${scheduleId}`);
      return;
    }
    
    console.log('\nSchedule Details:');
    console.log('--------------------------');
    console.log(`ID: ${schedule.id}`);
    console.log(`Date: ${schedule.date} (${new Date(schedule.date).toDateString()})`);
    console.log(`Time: ${schedule.time}`);
    console.log(`Workout Type: ${schedule.workoutType}`);
    console.log(`Capacity: ${schedule.currentParticipants}/${schedule.capacity}`);
    
    // Check if date formats match
    const scheduleDate = new Date(schedule.date);
    
    console.log('\nDate Comparison:');
    console.log('--------------------------');
    console.log(`Schedule date (ISO): ${schedule.date}`);
    console.log(`Schedule date (Date obj): ${scheduleDate.toISOString()}`);
    console.log(`Current date (ISO): ${currentDate.toISOString()}`);
    console.log(`Are dates equal: ${scheduleDate.toDateString() === currentDate.toDateString()}`);
    console.log(`Different in hours from today: ${Math.floor((scheduleDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60))}`);
    
    console.log('\nParticipants:');
    console.log('--------------------------');
    
    if (schedule.bookings.length === 0) {
      console.log('No participants signed up yet.');
    } else {
      schedule.bookings.forEach((booking, index) => {
        console.log(`${index + 1}. ${booking.user.firstName} ${booking.user.lastName} (ID: ${booking.user.id})`);
      });
    }
    
    // Mimic the getClassDetails controller query
    console.log('\nTrying getClassDetails query:');
    console.log('--------------------------');
    
    const controllerSchedule = await prisma.schedule.findFirst({
      where: {
        date: { equals: currentDate },
        time: '16:00',
      },
      include: {
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });
    
    if (controllerSchedule) {
      console.log(`Found 4 PM class with controller query! ID: ${controllerSchedule.id}`);
      console.log(`Date: ${controllerSchedule.date}`);
      console.log(`Participants: ${controllerSchedule.bookings.length}`);
    } else {
      console.log('No 4 PM class found with controller query');
    }
    
  } catch (error) {
    console.error('Error checking schedule:', error);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });