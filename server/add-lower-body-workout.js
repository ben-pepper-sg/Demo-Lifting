// Adding a Lower Body Supplemental Workout
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Create or get the supplemental workout
    let supplementalWorkout = await prisma.supplementalWorkout.findFirst({
      where: {
        name: 'Leg Circuit Complex'
      }
    });

    if (!supplementalWorkout) {
      supplementalWorkout = await prisma.supplementalWorkout.create({
        data: {
          name: 'Leg Circuit Complex',
          category: 'LOWER',
          bodyPart: 'QUADS',
          description: 'A comprehensive leg circuit combining exercises for quads, hamstrings and glutes: 10 squat jumps, 15 walking lunges, 20 bodyweight squats, and 15 lateral lunges. Complete all exercises without rest between them.'
        }
      });
      console.log('Created new supplemental workout:', supplementalWorkout.id);
    }

    // Get current date and day of week
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Calculate current week number (1-8)
    const weekNumber = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) % 8 + 1;
    
    // Get workout scheme for LOWER
    const lowerScheme = await prisma.workoutScheme.findFirst({
      where: {
        week: weekNumber,
        day: currentDay,
        liftType: 'LOWER'
      }
    });

    if (lowerScheme) {
      // Add our supplemental workout id to the scheme
      const updatedSupplementals = [...lowerScheme.supplementalWorkouts, supplementalWorkout.id];
      
      // Update the scheme
      await prisma.workoutScheme.update({
        where: {
          id: lowerScheme.id
        },
        data: {
          supplementalWorkouts: updatedSupplementals
        }
      });
      
      console.log('Updated LOWER workout scheme with new supplemental workout');
    } else {
      console.log('No LOWER workout scheme found for today');
    }
    
    // Create a schedule for lower body workout
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find a coach
    const coach = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'COACH' },
          { role: 'ADMIN' }
        ]
      }
    });
    
    if (coach) {
      // Create lower body class at 10am if it doesn't exist
      const existingSchedule = await prisma.schedule.findFirst({
        where: {
          date: midnight,
          time: '10:00'
        }
      });
      
      if (!existingSchedule) {
        const schedule = await prisma.schedule.create({
          data: {
            date: midnight,
            time: '10:00',
            capacity: 8,
            currentParticipants: 0,
            coachId: coach.id,
            workoutType: 'LOWER'
          }
        });
        
        console.log('Created 10:00 LOWER body class:', schedule.id);
      } else {
        console.log('10:00 schedule already exists');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());