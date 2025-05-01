// Update the controller to ensure our complete supplemental workouts are always shown
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Find our complete supplemental workouts
    const upperCircuit = await prisma.supplementalWorkout.findFirst({
      where: {
        name: 'Upper Body Complete Circuit'
      },
      include: {
        exercises: true
      }
    });
    
    const lowerCircuit = await prisma.supplementalWorkout.findFirst({
      where: {
        name: 'Leg Circuit Complex'
      },
      include: {
        exercises: true
      }
    });
    
    if (!upperCircuit || !lowerCircuit) {
      console.log('Could not find one or both of the complete circuit workouts');
      return;
    }
    
    console.log('Found Upper Body Complete Circuit with', upperCircuit.exercises.length, 'exercises');
    console.log('Found Leg Circuit Complex with', lowerCircuit.exercises.length, 'exercises');
    
    // Update the schedule controller
    const controllerPath = path.join(__dirname, 'src', 'controllers', 'schedule.controller.ts');
    
    // Create a backup of the original file
    const backupPath = `${controllerPath}.backup-ensure`;
    fs.copyFileSync(controllerPath, backupPath);
    console.log(`Backup created at ${backupPath}`);
    
    // Read the controller file
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    
    // Find and replace the part where supplemental workouts are selected
    const updatedContent = controllerContent.replace(
      // Find the section where supplementals are selected after getting the supplemental workouts
      /\/\/ Select 2 workouts from each category[\s\S]*?const supplementals = \[\];[\s\S]*?\}\s*\}/,
      `// Always include our complete supplemental workouts (Upper and Lower) for all classes
    const supplementals = [];
    
    // Find our complete upper and lower body circuits
    const upperBodyCircuit = upperSupplementalWorkouts.find(w => w.name === 'Upper Body Complete Circuit');
    const legCircuitComplex = lowerSupplementalWorkouts.find(w => w.name === 'Leg Circuit Complex');
    
    // Always include the complete circuits as first priority
    if (upperBodyCircuit) {
      supplementals.push(upperBodyCircuit);
    }
    
    if (legCircuitComplex) {
      supplementals.push(legCircuitComplex);
    }
    
    // Add 1-2 additional workouts from each category based on weekly rotation
    // Upper Body extras (only add 1 more since we already have the circuit)
    if (upperSupplementalWorkouts.length > 1) {
      const remainingUpper = upperSupplementalWorkouts.filter(w => w.name !== 'Upper Body Complete Circuit');
      if (remainingUpper.length > 0) {
        const index = weekIdentifier % remainingUpper.length;
        supplementals.push(remainingUpper[index]);
      }
    }
    
    // Lower Body extras (only add 1 more since we already have the circuit)
    if (lowerSupplementalWorkouts.length > 1) {
      const remainingLower = lowerSupplementalWorkouts.filter(w => w.name !== 'Leg Circuit Complex');
      if (remainingLower.length > 0) {
        const index = weekIdentifier % remainingLower.length;
        supplementals.push(remainingLower[index]);
      }
    }`
    );
    
    // Write the updated controller back to the file
    fs.writeFileSync(controllerPath, updatedContent, 'utf8');
    console.log('Controller updated to always show complete supplemental workouts');
  } catch (error) {
    console.error('Error updating controller:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());