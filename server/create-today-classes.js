const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Today's date at midnight
    const today = new Date();
    const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    console.log('Creating schedules for date:', midnight.toISOString());
    
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
    
    // Create schedules for 8am and 9am
    const times = ['08:00', '09:00'];
    
    for (const time of times) {
      // Check if schedule already exists
      const existingSchedule = await prisma.schedule.findFirst({
        where: {
          date: midnight,
          time: time
        }
      });
      
      if (existingSchedule) {
        console.log(`Schedule for ${time} already exists:`, existingSchedule.id);
        continue;
      }
      
      // Create new schedule
      const schedule = await prisma.schedule.create({
        data: {
          date: midnight,
          time: time,
          capacity: 8,
          currentParticipants: 0,
          coachId: coach.id,
          workoutType: 'UPPER'
        }
      });
      
      console.log(`Created ${time} schedule:`, schedule.id);
    }
    
    // Find the user by name
    const user = await prisma.user.findFirst({
      where: {
        firstName: 'Ben'
      }
    });
    
    if (user) {
      console.log(`Found user ${user.firstName} ${user.lastName}:`, user.id);
      
      // Get the 8am schedule
      const eightAmSchedule = await prisma.schedule.findFirst({
        where: {
          date: midnight,
          time: '08:00'
        }
      });
      
      if (eightAmSchedule) {
        // Check if user is already booked
        const existingBooking = await prisma.booking.findFirst({
          where: {
            scheduleId: eightAmSchedule.id,
            userId: user.id
          }
        });
        
        if (existingBooking) {
          console.log(`User ${user.firstName} is already booked for 8am class`);
        } else {
          // Book the user for 8am class
          const booking = await prisma.booking.create({
            data: {
              scheduleId: eightAmSchedule.id,
              userId: user.id
            }
          });
          
          // Update participants count
          await prisma.schedule.update({
            where: { id: eightAmSchedule.id },
            data: { currentParticipants: { increment: 1 } }
          });
          
          console.log(`Booked user ${user.firstName} to the 8am class`);
        }
      }
    } else {
      console.log('User not found - could not book');
    }
  } catch (error) {
    console.error('Error creating schedules:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());