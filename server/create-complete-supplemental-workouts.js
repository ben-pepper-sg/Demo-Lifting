// Create comprehensive supplemental workouts with specific exercise counts
// Upper Body: 5 exercises covering all main muscle groups
// Lower Body: 4 exercises covering all main muscle groups
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Create/update Upper Body Complete Circuit with 5 exercises
    let upperCircuit = await prisma.supplementalWorkout.findFirst({
      where: {
        name: 'Upper Body Complete Circuit'
      }
    });
    
    if (!upperCircuit) {
      upperCircuit = await prisma.supplementalWorkout.create({
        data: {
          name: 'Upper Body Complete Circuit',
          category: 'UPPER',
          bodyPart: 'CHEST', // Primary focus, but includes all upper body parts
          description: 'Complete upper body circuit targeting all major muscle groups: chest, back, shoulders, biceps, and triceps.'
        }
      });
      console.log('Created Upper Body Complete Circuit:', upperCircuit.id);
    } else {
      console.log('Found existing Upper Body Complete Circuit:', upperCircuit.id);
    }
    
    // Check if exercises already exist for this workout
    const existingUpperExercises = await prisma.exercise.findMany({
      where: {
        supplementalWorkoutId: upperCircuit.id
      }
    });
    
    // If exercises already exist, delete them to recreate the proper set
    if (existingUpperExercises.length > 0) {
      await prisma.exercise.deleteMany({
        where: {
          supplementalWorkoutId: upperCircuit.id
        }
      });
      console.log(`Deleted ${existingUpperExercises.length} existing exercises from Upper Body Circuit`);
    }
    
    // Create 5 exercises for upper body, one for each major muscle group
    const upperExercises = [
      {
        name: 'Push-Up Variations',
        description: 'Perform 10 standard push-ups, 10 wide-grip push-ups, and 10 diamond push-ups for chest development.',
        bodyPart: 'CHEST'
      },
      {
        name: 'Bent-Over Rows',
        description: 'Using dumbbells or a barbell, perform 15 bent-over rows to target the middle and upper back.',
        bodyPart: 'BACK'
      },
      {
        name: 'Shoulder Press Complex',
        description: 'Perform 12 overhead presses followed by 12 lateral raises to develop shoulder strength and stability.',
        bodyPart: 'SHOULDERS'
      },
      {
        name: 'Bicep 21s',
        description: 'Perform 7 curls in the lower half of the range, 7 in the upper half, and 7 full curls for complete bicep engagement.',
        bodyPart: 'BICEPS'
      },
      {
        name: 'Tricep Dips & Extensions',
        description: 'Perform 15 tricep dips on a bench or chair, followed by 15 overhead tricep extensions with a dumbbell.',
        bodyPart: 'TRICEPS'
      }
    ];
    
    for (const exercise of upperExercises) {
      await prisma.exercise.create({
        data: {
          name: exercise.name,
          description: exercise.description,
          supplementalWorkoutId: upperCircuit.id
        }
      });
      console.log(`Added ${exercise.name} (${exercise.bodyPart}) to Upper Body Circuit`);
    }
    
    // 2. Check if Leg Circuit Complex already exists and has exactly 4 exercises
    let lowerCircuit = await prisma.supplementalWorkout.findFirst({
      where: {
        name: 'Leg Circuit Complex'
      },
      include: {
        exercises: true
      }
    });
    
    if (!lowerCircuit) {
      lowerCircuit = await prisma.supplementalWorkout.create({
        data: {
          name: 'Leg Circuit Complex',
          category: 'LOWER',
          bodyPart: 'QUADS', // Primary focus, but includes all lower body parts
          description: 'A comprehensive lower body circuit targeting quads, hamstrings, glutes, and calves in one efficient workout.'
        }
      });
      console.log('Created Leg Circuit Complex:', lowerCircuit.id);
    } else {
      console.log('Found existing Leg Circuit Complex:', lowerCircuit.id);
    }
    
    // Delete existing exercises if not exactly the ones we want
    if (lowerCircuit.exercises.length !== 4 || 
        !lowerCircuit.exercises.some(e => e.name.includes('Calf')) ||
        !lowerCircuit.exercises.some(e => e.name.includes('Glute'))) {
      
      await prisma.exercise.deleteMany({
        where: {
          supplementalWorkoutId: lowerCircuit.id
        }
      });
      console.log('Deleted existing exercises from Leg Circuit Complex to recreate the proper set');
      
      // Create 4 exercises for lower body, one for each major muscle group
      const lowerExercises = [
        {
          name: 'Squat Variations',
          description: 'Perform 20 bodyweight squats with variations: standard, sumo, and pulse squats to target quadriceps.',
          bodyPart: 'QUADS'
        },
        {
          name: 'Hamstring Curls & Deadlifts',
          description: 'Perform 15 lying or standing hamstring curls followed by 10 single-leg Romanian deadlifts per leg.',
          bodyPart: 'HAMSTRINGS'
        },
        {
          name: 'Glute Bridge Progressions',
          description: 'Perform 20 glute bridges, progressing from basic to single leg to weighted variations.',
          bodyPart: 'GLUTES'
        },
        {
          name: 'Calf Raise Series',
          description: 'Perform 30 calf raises in three positions: toes forward, toes inward, and toes outward.',
          bodyPart: 'CALVES'
        }
      ];
      
      for (const exercise of lowerExercises) {
        await prisma.exercise.create({
          data: {
            name: exercise.name,
            description: exercise.description,
            supplementalWorkoutId: lowerCircuit.id
          }
        });
        console.log(`Added ${exercise.name} (${exercise.bodyPart}) to Leg Circuit Complex`);
      }
    } else {
      console.log('Leg Circuit Complex already has the correct 4 exercises');
    }
    
    // 3. Update the workout schemes to include both of these workouts
    const now = new Date();
    const currentDay = now.getDay();
    const weekNumber = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) % 8 + 1;
    
    // Get UPPER scheme
    const upperScheme = await prisma.workoutScheme.findFirst({
      where: {
        week: weekNumber,
        day: currentDay,
        liftType: 'UPPER'
      }
    });
    
    if (upperScheme) {
      // Update to include our Upper Body Circuit
      let supplementals = [...upperScheme.supplementalWorkouts];
      if (!supplementals.includes(upperCircuit.id)) {
        supplementals.unshift(upperCircuit.id);
        await prisma.workoutScheme.update({
          where: { id: upperScheme.id },
          data: { supplementalWorkouts: supplementals }
        });
        console.log('Added Upper Body Circuit to UPPER workout scheme');
      } else {
        console.log('Upper Body Circuit already in UPPER workout scheme');
      }
    }
    
    // Get LOWER scheme
    const lowerScheme = await prisma.workoutScheme.findFirst({
      where: {
        week: weekNumber,
        day: currentDay,
        liftType: 'LOWER'
      }
    });
    
    if (lowerScheme) {
      // Update to include our Leg Circuit Complex
      let supplementals = [...lowerScheme.supplementalWorkouts];
      if (!supplementals.includes(lowerCircuit.id)) {
        supplementals.unshift(lowerCircuit.id);
        await prisma.workoutScheme.update({
          where: { id: lowerScheme.id },
          data: { supplementalWorkouts: supplementals }
        });
        console.log('Added Leg Circuit Complex to LOWER workout scheme');
      } else {
        console.log('Leg Circuit Complex already in LOWER workout scheme');
      }
    }
    
    console.log('Successfully updated supplemental workouts with correct exercise counts');
  } catch (error) {
    console.error('Error creating supplemental workouts:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());