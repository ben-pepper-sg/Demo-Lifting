import { PrismaClient, WorkoutCategory, BodyPart } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing supplemental workouts
    await prisma.supplementalWorkout.deleteMany({});
    console.log('Cleared existing supplemental workouts');

    // Define supplemental workouts
    const supplementalWorkouts = [
      // Upper Body - Biceps
      {
        name: 'Dumbbell Bicep Curl',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.BICEPS,
        description: 'Classic bicep curl with dumbbells. Stand or sit with a dumbbell in each hand, arms fully extended. Curl the weights up to shoulder level while keeping elbows fixed.',
      },
      {
        name: 'Hammer Curl',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.BICEPS,
        description: 'Hold dumbbells with palms facing each other. Curl the weights while maintaining the neutral grip throughout the movement.',
      },
      {
        name: 'Preacher Curl',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.BICEPS,
        description: 'Using a preacher bench, curl the weight up while keeping your arms on the angled pad.',
      },

      // Upper Body - Triceps
      {
        name: 'Tricep Pushdown',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.TRICEPS,
        description: 'Using a cable machine with a straight or rope attachment, push the weight down by extending your elbows.',
      },
      {
        name: 'Dumbbell Tricep Extension',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.TRICEPS,
        description: 'Hold a dumbbell with both hands above your head, lower it behind your head by bending your elbows, then extend back up.',
      },
      {
        name: 'Close-Grip Bench Press',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.TRICEPS,
        description: 'Perform a bench press with hands placed shoulder-width apart or closer to target the triceps.',
      },

      // Upper Body - Back
      {
        name: 'Lat Pulldown',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.BACK,
        description: 'Using a cable machine, pull the bar down to your upper chest while keeping your back straight.',
      },
      {
        name: 'Dumbbell Row',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.BACK,
        description: 'With one knee and hand on a bench, row a dumbbell up to your side with the other hand.',
      },
      {
        name: 'Pull-Ups',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.BACK,
        description: 'Grip a pull-up bar with palms facing away, pull yourself up until your chin is over the bar.',
      },

      // Upper Body - Shoulders
      {
        name: 'Dumbbell Shoulder Press',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.SHOULDERS,
        description: 'Sit or stand with dumbbells at shoulder level, press them upward until arms are extended.',
      },
      {
        name: 'Lateral Raises',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.SHOULDERS,
        description: 'With dumbbells at your sides, raise them laterally until arms are parallel to the floor.',
      },
      {
        name: 'Face Pulls',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.SHOULDERS,
        description: 'Using a cable machine with a rope attachment, pull the rope toward your face with elbows high.',
      },

      // Upper Body - Chest
      {
        name: 'Dumbbell Chest Press',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.CHEST,
        description: 'Lie on a bench with dumbbells at chest level, press them up until arms are extended.',
      },
      {
        name: 'Push-Ups',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.CHEST,
        description: 'Start in a plank position with hands shoulder-width apart, lower your body until chest nearly touches the floor, then push back up.',
      },
      {
        name: 'Cable Chest Fly',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.CHEST,
        description: 'Using a cable machine, perform a fly motion by bringing your hands together in front of your chest.',
      },

      // Lower Body - Calves
      {
        name: 'Standing Calf Raise',
        category: WorkoutCategory.LOWER,
        bodyPart: BodyPart.CALVES,
        description: 'Stand on the edge of a platform with heels hanging off, raise up onto your toes, then lower back down.',
      },
      {
        name: 'Seated Calf Raise',
        category: WorkoutCategory.LOWER,
        bodyPart: BodyPart.CALVES,
        description: 'Sit on a calf raise machine with the pad on your knees, raise your heels by pushing up with your toes.',
      },

      // Lower Body - Quads
      {
        name: 'Leg Extension',
        category: WorkoutCategory.LOWER,
        bodyPart: BodyPart.QUADS,
        description: 'Sit on a leg extension machine, extend your legs until they are straight, then lower back down.',
      },
      {
        name: 'Front Squat',
        category: WorkoutCategory.LOWER,
        bodyPart: BodyPart.QUADS,
        description: 'With a barbell across the front of your shoulders, squat down until thighs are parallel to the floor, then stand back up.',
      },
      {
        name: 'Leg Press',
        category: WorkoutCategory.LOWER,
        bodyPart: BodyPart.QUADS,
        description: 'Sit on a leg press machine, press the platform away by extending your legs, then control it back to the starting position.',
      },

      // Lower Body - Hamstrings
      {
        name: 'Leg Curl',
        category: WorkoutCategory.LOWER,
        bodyPart: BodyPart.HAMSTRINGS,
        description: 'Lie face down on a leg curl machine, curl your legs up by bending your knees, then lower back down.',
      },
      {
        name: 'Romanian Deadlift',
        category: WorkoutCategory.LOWER,
        bodyPart: BodyPart.HAMSTRINGS,
        description: 'Hold a barbell or dumbbells in front of your thighs, hinge at the hips while keeping your back straight, lower the weight, then return to standing.',
      },
      {
        name: 'Good Morning',
        category: WorkoutCategory.LOWER,
        bodyPart: BodyPart.HAMSTRINGS,
        description: 'With a barbell across your upper back, bend forward at the hips while keeping your back straight, then return to standing.',
      },

      // Lower Body - Glutes
      {
        name: 'Hip Thrust',
        category: WorkoutCategory.LOWER,
        bodyPart: BodyPart.GLUTES,
        description: 'Sit with your upper back against a bench, weight on your hips, thrust your hips upward until your body forms a straight line, then lower back down.',
      },
      {
        name: 'Glute Bridge',
        category: WorkoutCategory.LOWER,
        bodyPart: BodyPart.GLUTES,
        description: 'Lie on your back with knees bent, feet flat on the floor, lift your hips up until your body forms a straight line from shoulders to knees.',
      },
      {
        name: 'Bulgarian Split Squat',
        category: WorkoutCategory.LOWER,
        bodyPart: BodyPart.GLUTES,
        description: 'Stand in a split stance with one foot on a bench behind you, lower your back knee toward the floor, then push back up.',
      },
    ];

    // Create the supplemental workouts
    let createdCount = 0;
    for (const workout of supplementalWorkouts) {
      await prisma.supplementalWorkout.create({
        data: workout,
      });
      createdCount++;
      console.log(`Created supplemental workout: ${workout.name} (${workout.category} - ${workout.bodyPart})`);
    }

    console.log(`Supplemental workouts seeded successfully (${createdCount} workouts created)`);
  } catch (error) {
    console.error('Error seeding supplemental workouts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Seeding complete'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });