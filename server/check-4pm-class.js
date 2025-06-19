// Script to check who is signed up for the 4 PM class
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get current date (without time)
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log(`Checking for TODAY: ${currentDate.toDateString()}`)
    
    // Find today's 4 PM class
    const schedule = await prisma.schedule.findFirst({
      where: {
        date: { equals: currentDate },
        time: '16:00',
      },
      include: {
        bookings: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (schedule) {
      console.log('4 PM Class Details:');
      console.log('--------------------------');
      console.log(`Class ID: ${schedule.id}`);
      console.log(`Workout Type: ${schedule.workoutType}`);
      console.log(`Capacity: ${schedule.currentParticipants}/${schedule.capacity}`);
      console.log('\nParticipants:');
      console.log('--------------------------');
      
      if (schedule.bookings.length === 0) {
        console.log('No participants signed up yet.');
      } else {
        schedule.bookings.forEach((booking, index) => {
          console.log(`${index + 1}. ${booking.user.firstName} ${booking.user.lastName}`);
        });
      }
      
      console.log('--------------------------');
      console.log(`Total participants: ${schedule.bookings.length}`);
    } else {
      console.log('No 4 PM class found for today');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });