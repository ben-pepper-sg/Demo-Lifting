import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function manualTest() {
  console.log('Starting manual test of supplemental workout exercises...');
  
  try {
    // 1. Create a test supplemental workout
    console.log('1. Creating a test supplemental workout...');
    const workout = await prisma.supplementalWorkout.create({
      data: {
        name: 'Test Manual Workout',
        category: 'UPPER',
        bodyPart: 'BICEPS',
        description: 'Created for manual testing',
      },
    });
    console.log(`Created workout with ID: ${workout.id}`);
    
    // 2. Add an exercise to the workout
    console.log('\n2. Adding an exercise to the workout...');
    const exercise = await prisma.exercise.create({
      data: {
        name: 'Test Exercise',
        description: 'Manual test exercise',
        supplementalWorkoutId: workout.id,
      },
    });
    console.log(`Created exercise with ID: ${exercise.id}`);
    
    // 3. Verify the relationship
    console.log('\n3. Verifying relationship between workout and exercise...');
    const workoutWithExercises = await prisma.supplementalWorkout.findUnique({
      where: { id: workout.id },
      include: { exercises: true },
    });
    console.log('Workout with exercises:', JSON.stringify(workoutWithExercises, null, 2));
    
    // 4. Update the exercise
    console.log('\n4. Updating the exercise...');
    const updatedExercise = await prisma.exercise.update({
      where: { id: exercise.id },
      data: {
        name: 'Updated Exercise Name',
        description: 'Updated description',
      },
    });
    console.log('Updated exercise:', JSON.stringify(updatedExercise, null, 2));
    
    // 5. Delete the exercise
    console.log('\n5. Deleting the exercise...');
    await prisma.exercise.delete({
      where: { id: exercise.id },
    });
    console.log('Exercise deleted.');
    
    // 6. Verify exercise was deleted
    console.log('\n6. Verifying exercise was deleted...');
    const workoutAfterDelete = await prisma.supplementalWorkout.findUnique({
      where: { id: workout.id },
      include: { exercises: true },
    });
    console.log('Workout after exercise deletion:', JSON.stringify(workoutAfterDelete, null, 2));
    console.log(`Number of exercises: ${workoutAfterDelete?.exercises.length || 0}`);
    
    // 7. Clean up by deleting the test workout
    console.log('\n7. Cleaning up - deleting test workout...');
    await prisma.supplementalWorkout.delete({
      where: { id: workout.id },
    });
    console.log('Test workout deleted.');
    
    console.log('\nManual test completed successfully!');
  } catch (error) {
    console.error('Error during manual test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

manualTest().catch(console.error);