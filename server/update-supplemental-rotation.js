// Update the schedule controller to show both upper and lower body supplementals for all classes
// with weekly rotation every Monday
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Path to the controller file
    const controllerPath = path.join(__dirname, 'src', 'controllers', 'schedule.controller.ts');
    
    // Create a backup of the original file
    const backupPath = `${controllerPath}.backup-rotation`;
    fs.copyFileSync(controllerPath, backupPath);
    console.log(`Backup created at ${backupPath}`);
    
    // Read the controller file
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    
    // Find and replace the section that gets supplemental workouts
    const updatedContent = controllerContent.replace(
      // Find the section where supplemental workouts are retrieved
      /\/\/ Get appropriate supplemental workouts for this week and workout type[\s\S]*?const supplementals = \[\];[\s\S]*?\}\s*\}/,
      `// Get BOTH upper and lower body supplemental workouts for all classes
    // These will rotate every Monday for all classes that week
    const upperSupplementalWorkouts = await prisma.supplementalWorkout.findMany({
      where: {
        category: 'UPPER'
      },
      include: {
        exercises: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    const lowerSupplementalWorkouts = await prisma.supplementalWorkout.findMany({
      where: {
        category: 'LOWER'
      },
      include: {
        exercises: true
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    // Always prioritize showing Leg Circuit Complex for LOWER workouts
    const legCircuitWorkout = await prisma.supplementalWorkout.findFirst({
      where: {
        name: 'Leg Circuit Complex'
      },
      include: {
        exercises: true
      }
    });
    
    // Select 2 workouts from each category based on the week number
    const supplementals = [];
    
    // Get upper body supplemental workouts (2 per week, rotating weekly)
    if (upperSupplementalWorkouts.length > 0) {
      const numUpperWorkouts = Math.min(2, upperSupplementalWorkouts.length);
      for (let i = 0; i < numUpperWorkouts; i++) {
        const index = (weekIdentifier + i) % upperSupplementalWorkouts.length;
        supplementals.push(upperSupplementalWorkouts[index]);
      }
    }
    
    // Get lower body supplemental workouts (2 per week, rotating weekly)
    if (lowerSupplementalWorkouts.length > 0) {
      // Prioritize Leg Circuit Complex if it exists
      if (legCircuitWorkout && schedule.workoutType === 'LOWER') {
        supplementals.push(legCircuitWorkout);
        
        // Remove it from consideration for second spot if it was chosen
        const remainingLowerWorkouts = lowerSupplementalWorkouts.filter(
          workout => workout.id !== legCircuitWorkout.id
        );
        
        // Add one more lower body workout
        if (remainingLowerWorkouts.length > 0) {
          const index = weekIdentifier % remainingLowerWorkouts.length;
          supplementals.push(remainingLowerWorkouts[index]);
        }
      } else {
        // Just choose two normally, cycling based on week
        const numLowerWorkouts = Math.min(2, lowerSupplementalWorkouts.length);
        for (let i = 0; i < numLowerWorkouts; i++) {
          const index = (weekIdentifier + i) % lowerSupplementalWorkouts.length;
          supplementals.push(lowerSupplementalWorkouts[index]);
        }
      }
    }`
    );
    
    // Write the updated controller back to the file
    fs.writeFileSync(controllerPath, updatedContent, 'utf8');
    console.log('Controller updated to show both upper and lower body supplementals with weekly rotation');
  } catch (error) {
    console.error('Error updating controller:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());