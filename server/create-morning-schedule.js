const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ensureWorkoutSchemes } = require('./ensure-workout-schemes');

async function main() {
  // First ensure workout schemes exist
  await ensureWorkoutSchemes();
  try {
    const today = new Date();
    const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    console.log('Creating schedule for date:', midnight.toISOString());
    
    // Find or create a coach account to assign to the schedule
    let coach = await prisma.user.findFirst({
      where: {
        role: 'COACH'
      }
    });
    
    if (!coach) {
      // Create a coach if none exists
      coach = await prisma.user.findFirst({
        where: {
          role: 'ADMIN'
        }
      });
      
      if (!coach) {
        coach = await prisma.user.create({
          data: {
            email: 'coach@example.com',
            passwordHash: '$2b$10$YwF0J.EfHRYrS6zSMPJhpO/MaHdxjP.JR4h93GJYG0LS0FdGZ6OWi', // bcrypt hash for 'password123'
            firstName: 'Coach',
            lastName: 'Smith',
            role: 'COACH'
          }
        });
        console.log('Created coach account:', coach.id);
      }
    }
    
    // Create a schedule for 8am today
    const schedule = await prisma.schedule.create({
      data: {
        date: midnight,
        time: '08:00',
        capacity: 8,
        currentParticipants: 0,
        coachId: coach.id,
        workoutType: 'UPPER'
      }
    });
    
    console.log('Created 8am schedule:', schedule);
    
    // Find the first user who is not a coach or admin to book them
    const user = await prisma.user.findFirst({
      where: {
        NOT: {
          role: {
            in: ['COACH', 'ADMIN']
          }
        }
      }
    });
    
    if (user) {
      // Book the user to the 8am class
      const booking = await prisma.booking.create({
        data: {
          scheduleId: schedule.id,
          userId: user.id
        }
      });
      
      // Update the currentParticipants count
      await prisma.schedule.update({
        where: {
          id: schedule.id
        },
        data: {
          currentParticipants: 1
        }
      });
      
      console.log(`Booked user ${user.firstName} ${user.lastName} to the 8am class`);
    } else {
      console.log('No regular users found to book to the class');
    }
  } catch (error) {
    console.error('Error creating schedule:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());