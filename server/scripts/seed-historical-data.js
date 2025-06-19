const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedHistoricalData() {
  try {
    console.log('Starting historical data seeding...');

    // Create a test user for historical data
    const testUser = await prisma.user.upsert({
      where: { email: 'testuser@example.com' },
      update: {},
      create: {
        email: 'testuser@example.com',
        passwordHash: '$2b$10$example.hash.for.testing.purposes.only',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        maxBench: 225,
        maxOHP: 135,
        maxSquat: 315,
        maxDeadlift: 405,
      },
    });

    console.log(`Test user created/found: ${testUser.id}`);

    // Generate historical workout data for the past 6 months
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const liftTypes = ['BENCH', 'OHP', 'SQUAT', 'DEADLIFT'];
    const baseWeights = {
      BENCH: 185,
      OHP: 115,
      SQUAT: 255,
      DEADLIFT: 315,
    };

    const progressionRates = {
      BENCH: 1.2,
      OHP: 0.8,
      SQUAT: 1.5,
      DEADLIFT: 2.0,
    };

    const workoutLogs = [];

    // Generate data for each lift type
    for (const liftType of liftTypes) {
      let currentWeight = baseWeights[liftType];
      const weeklyProgression = progressionRates[liftType];

      // Generate 2-3 workouts per week for 6 months (about 48-72 entries per lift)
      for (let week = 0; week < 24; week++) {
        const workoutsThisWeek = Math.floor(Math.random() * 2) + 2; // 2-3 workouts per week
        
        for (let workout = 0; workout < workoutsThisWeek; workout++) {
          const workoutDate = new Date(startDate);
          workoutDate.setDate(startDate.getDate() + (week * 7) + (workout * 2));
          
          // Add some variation to weights (±5-10 lbs)
          const weightVariation = (Math.random() - 0.5) * 20;
          const workoutWeight = Math.max(currentWeight + weightVariation, currentWeight * 0.8);
          
          // Generate realistic sets and reps
          const sets = Math.floor(Math.random() * 3) + 3; // 3-5 sets
          const reps = Math.floor(Math.random() * 8) + 3; // 3-10 reps
          
          workoutLogs.push({
            userId: testUser.id,
            liftType,
            weight: Math.round(workoutWeight),
            reps,
            sets,
            date: workoutDate,
            notes: `Week ${week + 1} training`,
          });
        }
        
        // Progress weight slightly each week
        currentWeight += weeklyProgression;
      }
    }

    // Insert all workout logs
    console.log(`Inserting ${workoutLogs.length} workout logs...`);
    
    // Insert in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < workoutLogs.length; i += batchSize) {
      const batch = workoutLogs.slice(i, i + batchSize);
      await prisma.workoutLog.createMany({
        data: batch,
        skipDuplicates: true,
      });
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(workoutLogs.length / batchSize)}`);
    }

    console.log('Historical data seeding completed successfully!');
    console.log(`Created ${workoutLogs.length} workout log entries for test user.`);
    console.log(`Test user credentials: testuser@example.com / password123`);
    
  } catch (error) {
    console.error('Error seeding historical data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedHistoricalData()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedHistoricalData };
