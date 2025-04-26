import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('Seeding database...');
    
    // Create workout program
    const program = await prisma.program.create({
      data: {
        name: 'TFW MMA 8-Week Lifting Program',
        description: 'An 8-week progressive lifting program focusing on the four main lifts: bench press, overhead press, deadlift, and back squat.',
        weeks: 8,
      },
    });
    
    console.log('Created program:', program.id);
    
    // Create workout schemes for each week
    const weekSchemes = [
      // Week 1
      {
        week: 1,
        sets: [1, 1, 1, 1, 1],
        reps: [1, 1, 1, 1, 1],
        percentages: [95, 100, 105, 105, 105],
        restTime: 60, // 1 minute
      },
      // Week 2
      {
        week: 2,
        sets: [1, 1, 1, 1, 1],
        reps: [10, 10, 10, 10, 10],
        percentages: [50, 55, 60, 60, 60],
        restTime: 120, // 2 minutes
      },
      // Week 3
      {
        week: 3,
        sets: [1, 1, 1, 1, 1],
        reps: [10, 8, 6, 4, 2],
        percentages: [55, 65, 75, 85, 95],
        restTime: 60, // 1 minute
      },
      // Week 4
      {
        week: 4,
        sets: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        reps: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
        percentages: [55, 55, 55, 55, 55, 55, 55, 55, 55, 55],
        restTime: 120, // 2 minutes
      },
      // Week 5
      {
        week: 5,
        sets: [1, 1, 1, 1, 1],
        reps: [5, 5, 5, 5, 5],
        percentages: [65, 75, 85, 85, 85],
        restTime: 60, // 1 minute
      },
      // Week 6
      {
        week: 6,
        sets: [1, 1, 1, 1, 1],
        reps: [20, 20, 20, 20, 20],
        percentages: [45, 45, 45, 45, 45],
        restTime: 120, // 2 minutes
      },
      // Week 7
      {
        week: 7,
        sets: [1, 1, 1, 1, 1],
        reps: [5, 3, 1, 1, 1],
        percentages: [75, 85, 95, 95, 95],
        restTime: 60, // 1 minute
      },
      // Week 8
      {
        week: 8,
        sets: [1, 1, 1, 1, 1],
        reps: [15, 15, 15, 15, 15],
        percentages: [45, 50, 55, 55, 55],
        restTime: 120, // 2 minutes
      },
    ];
    
    // Define supplemental exercises by category
    const supplementalExercises = {
      upper: {
        biceps: [
          { name: 'Curls', category: 'UPPER', bodyPart: 'BICEPS' },
          { name: 'Reverse Curls', category: 'UPPER', bodyPart: 'BICEPS' },
          { name: 'Hammer Curls', category: 'UPPER', bodyPart: 'BICEPS' },
          { name: 'Posted Curls', category: 'UPPER', bodyPart: 'BICEPS' },
        ],
        triceps: [
          { name: 'Skull Crushers', category: 'UPPER', bodyPart: 'TRICEPS' },
          { name: 'Kick Backs', category: 'UPPER', bodyPart: 'TRICEPS' },
          { name: 'Floor Tricep Extensions', category: 'UPPER', bodyPart: 'TRICEPS' },
          { name: 'Pull Downs', category: 'UPPER', bodyPart: 'TRICEPS' },
        ],
        back: [
          { name: 'Alternating Rows', category: 'UPPER', bodyPart: 'BACK' },
          { name: 'Back Flys', category: 'UPPER', bodyPart: 'BACK' },
          { name: 'Rows', category: 'UPPER', bodyPart: 'BACK' },
          { name: 'Pull Ups', category: 'UPPER', bodyPart: 'BACK' },
        ],
        shoulders: [
          { name: 'Shrugs', category: 'UPPER', bodyPart: 'SHOULDERS' },
          { name: 'Side Raises', category: 'UPPER', bodyPart: 'SHOULDERS' },
          { name: 'Front Raises', category: 'UPPER', bodyPart: 'SHOULDERS' },
          { name: 'Arnold Press', category: 'UPPER', bodyPart: 'SHOULDERS' },
        ],
        chest: [
          { name: 'Flys', category: 'UPPER', bodyPart: 'CHEST' },
          { name: 'Incline Flys', category: 'UPPER', bodyPart: 'CHEST' },
          { name: 'Floor Press', category: 'UPPER', bodyPart: 'CHEST' },
          { name: 'Deficit Push Ups', category: 'UPPER', bodyPart: 'CHEST' },
        ],
      },
      lower: {
        calves: [
          { name: 'Calf Raise', category: 'LOWER', bodyPart: 'CALVES' },
          { name: 'Elevated Calf Raise', category: 'LOWER', bodyPart: 'CALVES' },
          { name: 'Single Leg Calf Raise', category: 'LOWER', bodyPart: 'CALVES' },
        ],
        quads: [
          { name: 'Narrow Squat', category: 'LOWER', bodyPart: 'QUADS' },
          { name: 'Goblet Squat', category: 'LOWER', bodyPart: 'QUADS' },
          { name: 'Step Ups', category: 'LOWER', bodyPart: 'QUADS' },
          { name: 'Narrow Elevated Squat', category: 'LOWER', bodyPart: 'QUADS' },
        ],
        hamstrings: [
          { name: 'Wide Squat', category: 'LOWER', bodyPart: 'HAMSTRINGS' },
          { name: 'Good Morning', category: 'LOWER', bodyPart: 'HAMSTRINGS' },
          { name: 'Single Leg Good Morning', category: 'LOWER', bodyPart: 'HAMSTRINGS' },
          { name: 'Reverse Lunge', category: 'LOWER', bodyPart: 'HAMSTRINGS' },
        ],
        glutes: [
          { name: 'Hip Thrust', category: 'LOWER', bodyPart: 'GLUTES' },
          { name: 'Split Squat', category: 'LOWER', bodyPart: 'GLUTES' },
          { name: 'Glute Kickback', category: 'LOWER', bodyPart: 'GLUTES' },
          { name: 'Skier\'s Lunge', category: 'LOWER', bodyPart: 'GLUTES' },
        ],
      },
    };
    
    // Create all supplemental exercises
    for (const category of Object.values(supplementalExercises)) {
      for (const bodyPart of Object.values(category)) {
        for (const exercise of bodyPart) {
          await prisma.supplementalWorkout.create({
            data: {
              name: exercise.name,
              category: exercise.category as any, // Convert string to enum
              bodyPart: exercise.bodyPart as any, // Convert string to enum
              description: ''
            },
          });
        }
      }
    }
    
    console.log('Created supplemental exercises');
    
    // Get all supplemental workouts for creating schemes
    const upperExercises = await prisma.supplementalWorkout.findMany({
      where: {
        category: 'UPPER',
      },
    });
    
    const lowerExercises = await prisma.supplementalWorkout.findMany({
      where: {
        category: 'LOWER',
      },
    });
    
    // Create workout schemes for each week and workout type (UPPER/LOWER)
    const days = [1, 2, 3, 4]; // Monday, Tuesday, Wednesday, Thursday
    
    for (const scheme of weekSchemes) {
      // Create upper body workouts (Monday, Wednesday)
      // Monday
      const mondaySupplementalIds = selectSupplementalWorkouts(upperExercises, scheme.week, 1);
      
      await prisma.workoutScheme.create({
        data: {
          programId: program.id,
          week: scheme.week,
          day: 1, // Monday
          liftType: 'UPPER',
          sets: scheme.sets,
          reps: scheme.reps,
          percentages: scheme.percentages,
          restTime: scheme.restTime,
          supplementalWorkouts: mondaySupplementalIds,
        },
      });
      
      // Wednesday
      const wednesdaySupplementalIds = selectSupplementalWorkouts(upperExercises, scheme.week, 3);
      
      await prisma.workoutScheme.create({
        data: {
          programId: program.id,
          week: scheme.week,
          day: 3, // Wednesday
          liftType: 'UPPER',
          sets: scheme.sets,
          reps: scheme.reps,
          percentages: scheme.percentages,
          restTime: scheme.restTime,
          supplementalWorkouts: wednesdaySupplementalIds,
        },
      });
      
      // Create lower body workouts (Tuesday, Thursday)
      // Tuesday
      const tuesdaySupplementalIds = selectSupplementalWorkouts(lowerExercises, scheme.week, 2);
      
      await prisma.workoutScheme.create({
        data: {
          programId: program.id,
          week: scheme.week,
          day: 2, // Tuesday
          liftType: 'LOWER',
          sets: scheme.sets,
          reps: scheme.reps,
          percentages: scheme.percentages,
          restTime: scheme.restTime,
          supplementalWorkouts: tuesdaySupplementalIds,
        },
      });
      
      // Thursday
      const thursdaySupplementalIds = selectSupplementalWorkouts(lowerExercises, scheme.week, 4);
      
      await prisma.workoutScheme.create({
        data: {
          programId: program.id,
          week: scheme.week,
          day: 4, // Thursday
          liftType: 'LOWER',
          sets: scheme.sets,
          reps: scheme.reps,
          percentages: scheme.percentages,
          restTime: scheme.restTime,
          supplementalWorkouts: thursdaySupplementalIds,
        },
      });
    }
    
    console.log('Created workout schemes');
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    });
    
    console.log('Created admin user:', adminUser.id);
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Function to select supplemental workouts based on week and day
function selectSupplementalWorkouts(exercises: any[], week: number, day: number): string[] {
  // Group exercises by body part
  const exercisesByBodyPart: { [key: string]: any[] } = {};
  
  for (const exercise of exercises) {
    if (!exercisesByBodyPart[exercise.bodyPart]) {
      exercisesByBodyPart[exercise.bodyPart] = [];
    }
    exercisesByBodyPart[exercise.bodyPart].push(exercise);
  }
  
  const selectedExercises: string[] = [];
  
  // For each body part, select one exercise
  for (const [bodyPart, exerciseList] of Object.entries(exercisesByBodyPart)) {
    // Skip if we have step ups and hip thrusts in the same week
    if (
      bodyPart === 'QUADS' &&
      selectedExercises.some(id => {
        const exercise = exercises.find(e => e.id === id);
        return exercise && exercise.name === 'Hip Thrust';
      }) &&
      exerciseList.some(e => e.name === 'Step Ups')
    ) {
      // Select an exercise other than step ups
      const filteredList = exerciseList.filter(e => e.name !== 'Step Ups');
      if (filteredList.length > 0) {
        const selected = filteredList[Math.floor(Math.random() * filteredList.length)];
        selectedExercises.push(selected.id);
      }
      continue;
    }
    
    if (
      bodyPart === 'GLUTES' &&
      selectedExercises.some(id => {
        const exercise = exercises.find(e => e.id === id);
        return exercise && exercise.name === 'Step Ups';
      }) &&
      exerciseList.some(e => e.name === 'Hip Thrust')
    ) {
      // Select an exercise other than hip thrust
      const filteredList = exerciseList.filter(e => e.name !== 'Hip Thrust');
      if (filteredList.length > 0) {
        const selected = filteredList[Math.floor(Math.random() * filteredList.length)];
        selectedExercises.push(selected.id);
      }
      continue;
    }
    
    // Use a deterministic but varied selection based on week and day
    const index = (week * day + parseInt(bodyPart, 36)) % exerciseList.length;
    selectedExercises.push(exerciseList[index].id);
  }
  
  return selectedExercises;
}

// Import bcrypt for password hashing
import bcrypt from 'bcrypt';

// Run the seeding function
seedDatabase()
  .then(() => console.log('Done'))
  .catch(e => console.error(e));