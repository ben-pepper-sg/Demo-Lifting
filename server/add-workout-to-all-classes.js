// Force add our Leg Circuit Complex to all classes including it manually in the controller response
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Find our Leg Circuit Complex workout
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

    // Update the controller.ts file to explicitly include this workout
    const fs = require('fs');
    const path = require('path');
    const controllerPath = path.join(__dirname, 'src', 'controllers', 'schedule.controller.ts');

    // Create a backup of the original file
    const backupPath = `${controllerPath}.backup`;
    fs.copyFileSync(controllerPath, backupPath);
    console.log(`Backup created at ${backupPath}`);

    // Read the file
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');

    // Find the section where the response is created and add our workout
    const updatedContent = controllerContent.replace(
      /return res\.status\(200\)\.json\(\{\s*class:\s*\{/,
      `// Directly add Leg Circuit Complex to supplementals if it's a LOWER workout
    const legCircuitId = '${legCircuitWorkout.id}';
    if (schedule.workoutType === 'LOWER' && !supplementals.some(w => w.id === legCircuitId)) {
      // Add Leg Circuit Complex as the first supplemental
      supplementals.unshift(${JSON.stringify(legCircuitWorkout)});
    }

    return res.status(200).json({
      class: {`
    );

    // Write the updated content back to the file
    fs.writeFileSync(controllerPath, updatedContent, 'utf8');
    console.log('Controller updated');
  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());