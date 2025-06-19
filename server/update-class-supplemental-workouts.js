// Update class supplemental workouts to include our new workout
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Find our new workout
    const legCircuitWorkout = await prisma.supplementalWorkout.findFirst({
      where: {
        name: 'Leg Circuit Complex'
      },
      include: {
        exercises: true
      }
    });

    if (!legCircuitWorkout) {
      console.log('Leg Circuit Complex workout not found');
      return;
    }

    console.log('Found Leg Circuit Complex workout:', legCircuitWorkout.id);

    // Find today's lower body class schedule at 10am
    const today = new Date();
    const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const lowerBodyClass = await prisma.schedule.findFirst({
      where: {
        date: midnight,
        time: '10:00',
        workoutType: 'LOWER'
      }
    });

    if (!lowerBodyClass) {
      console.log('Lower body class not found');
      return;
    }

    console.log('Found lower body class:', lowerBodyClass.id);

    // Get the workout scheme for this class
    const currentDay = today.getDay();
    const weekNumber = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) % 8 + 1;
    
    const workoutScheme = await prisma.workoutScheme.findFirst({
      where: {
        week: weekNumber,
        day: currentDay,
        liftType: 'LOWER'
      }
    });

    if (!workoutScheme) {
      console.log('Workout scheme not found');
      return;
    }

    console.log('Found workout scheme:', workoutScheme.id);
    console.log('Current supplemental workouts:', workoutScheme.supplementalWorkouts);

    // Force update - replace the supplemental workouts with our leg circuit and one existing one
    // Find a random existing lower body supplemental workout to keep for variety
    const otherLowerBodyWorkout = await prisma.supplementalWorkout.findFirst({
      where: {
        id: { not: legCircuitWorkout.id },
        category: 'LOWER'
      }
    });

    // Create new array with our workout first, then the other workout
    const newSupplementals = [
      legCircuitWorkout.id,
    ];
    
    if (otherLowerBodyWorkout) {
      newSupplementals.push(otherLowerBodyWorkout.id);
      console.log('Including existing workout:', otherLowerBodyWorkout.name);
    }

    // Update the scheme
    await prisma.workoutScheme.update({
      where: {
        id: workoutScheme.id
      },
      data: {
        supplementalWorkouts: newSupplementals
      }
    });

    console.log('Updated workout scheme with new supplementals:', newSupplementals);
  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());