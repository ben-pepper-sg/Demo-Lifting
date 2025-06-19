const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function ensureWorkoutSchemes() {
  try {
    // Get current date and day of week
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    console.log('Ensuring workout schemes for day of week:', currentDay);
    
    // Calculate current week number (1-8)
    const weekNumber = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) % 8 + 1;
    console.log('Current week number:', weekNumber);
    
    // Check if workout schemes already exist
    const existingUpperScheme = await prisma.workoutScheme.findFirst({
      where: {
        week: weekNumber,
        day: currentDay,
        liftType: 'UPPER'
      }
    });
    
    const existingLowerScheme = await prisma.workoutScheme.findFirst({
      where: {
        week: weekNumber,
        day: currentDay,
        liftType: 'LOWER'
      }
    });
    
    // Get or create a program
    let program = await prisma.program.findFirst();
    
    if (!program) {
      program = await prisma.program.create({
        data: {
          name: 'TFW MMA 8-Week Lifting Program',
          description: 'Progressive strength program for mixed martial arts',
          weeks: 8
        }
      });
      console.log('Created new program:', program.id);
    } else {
      console.log('Using existing program:', program.id);
    }
    
    // Create workout scheme for UPPER body if it doesn't exist
    if (!existingUpperScheme) {
      const upperScheme = await prisma.workoutScheme.create({
        data: {
          programId: program.id,
          week: weekNumber,
          day: currentDay,
          liftType: 'UPPER',
          sets: [1, 1, 1, 1, 1],
          reps: [10, 10, 10, 10, 10],
          percentages: [50, 55, 60, 65, 70],
          restTime: 120, // 2 minutes
          supplementalWorkouts: []
        }
      });
      
      console.log('Created UPPER workout scheme for today:', upperScheme);
    } else {
      console.log('UPPER workout scheme already exists for today');
    }
    
    // Create workout scheme for LOWER body if it doesn't exist
    if (!existingLowerScheme) {
      const lowerScheme = await prisma.workoutScheme.create({
        data: {
          programId: program.id,
          week: weekNumber,
          day: currentDay,
          liftType: 'LOWER',
          sets: [1, 1, 1, 1, 1],
          reps: [10, 10, 10, 10, 10],
          percentages: [50, 55, 60, 65, 70],
          restTime: 120, // 2 minutes
          supplementalWorkouts: []
        }
      });
      
      console.log('Created LOWER workout scheme for today:', lowerScheme);
    } else {
      console.log('LOWER workout scheme already exists for today');
    }
    
    return { upperExists: !!existingUpperScheme, lowerExists: !!existingLowerScheme };
  } catch (error) {
    console.error('Error ensuring workout schemes:', error);
    throw error;
  }
}

// Run directly if this file is executed
if (require.main === module) {
  ensureWorkoutSchemes()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
}

module.exports = { ensureWorkoutSchemes };