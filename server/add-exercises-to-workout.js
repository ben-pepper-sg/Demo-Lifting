// Adding exercises to the Leg Circuit Complex
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the supplemental workout
    const supplementalWorkout = await prisma.supplementalWorkout.findFirst({
      where: {
        name: 'Leg Circuit Complex'
      }
    });

    if (!supplementalWorkout) {
      console.log('Supplemental workout not found');
      return;
    }

    console.log('Found supplemental workout:', supplementalWorkout.id);

    // Define exercises to add
    const exercises = [
      {
        name: 'Squat Jumps',
        description: 'Perform 10 explosive jumps from a squat position, landing softly back into a squat.'
      },
      {
        name: 'Walking Lunges',
        description: 'Perform 15 walking lunges (total), alternating legs with each step.'
      },
      {
        name: 'Bodyweight Squats', 
        description: 'Perform 20 deep bodyweight squats with proper form.'
      },
      {
        name: 'Lateral Lunges',
        description: 'Perform 15 lateral lunges (total), alternating sides.'
      }
    ];

    // Add each exercise
    for (const exercise of exercises) {
      // Check if exercise already exists
      const existingExercise = await prisma.exercise.findFirst({
        where: {
          name: exercise.name,
          supplementalWorkoutId: supplementalWorkout.id
        }
      });

      if (!existingExercise) {
        const newExercise = await prisma.exercise.create({
          data: {
            name: exercise.name,
            description: exercise.description,
            supplementalWorkoutId: supplementalWorkout.id
          }
        });
        console.log(`Added exercise: ${newExercise.name}`);
      } else {
        console.log(`Exercise ${exercise.name} already exists`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());