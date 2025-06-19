// Create a fixed version of the schedule controller that focuses on supplemental workouts
const fs = require('fs');
const path = require('path');

// Path to the original controller
const controllerPath = path.join(__dirname, 'src', 'controllers', 'schedule.controller.ts');

// Read the original file
fs.readFile(controllerPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Find the line that loads supplemental workouts
  const updatedContent = data.replace(
    // Find the supplemental workouts query that uses weekIdentifier
    /const supplementalWorkouts = await prisma\.supplementalWorkout\.findMany\(\s*\{\s*where:\s*\{\s*category: schedule\.workoutType\s*\}\s*,\s*orderBy:\s*\{\s*id: 'asc'\s*\}\s*\}\);/s,
    `const supplementalWorkouts = await prisma.supplementalWorkout.findMany({
      where: {
        category: schedule.workoutType
      },
      include: {
        exercises: true
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    // Add Leg Circuit Complex to lower body workout if it exists
    if (schedule.workoutType === 'LOWER') {
      const legCircuitWorkout = await prisma.supplementalWorkout.findFirst({
        where: {
          name: 'Leg Circuit Complex'
        },
        include: {
          exercises: true
        }
      });
      
      if (legCircuitWorkout) {
        console.log('Found Leg Circuit Complex workout - adding to supplementals');
        // Add to beginning of array if not already present
        const workoutExists = supplementalWorkouts.some(w => w.id === legCircuitWorkout.id);
        if (!workoutExists) {
          supplementalWorkouts.unshift(legCircuitWorkout);
        }
      }
    }`
  );

  // Find the line that selects workouts for display and update to use up to 3
  const finalContent = updatedContent.replace(
    /const supplementals = \[\];\s*if \(supplementalWorkouts\.length > 0\) \{\s*const numWorkouts = Math\.min\(3, supplementalWorkouts\.length\);\s*for \(let i = 0; i < numWorkouts; i\+\+\) \{\s*const index = \(weekIdentifier \+ i\) % supplementalWorkouts\.length;\s*supplementals\.push\(supplementalWorkouts\[index\]\);\s*\}\s*\}/s,
    `const supplementals = [];
    if (supplementalWorkouts.length > 0) {
      // Always include Leg Circuit Complex for LOWER if it exists (should be first)
      if (schedule.workoutType === 'LOWER' && supplementalWorkouts[0]?.name === 'Leg Circuit Complex') {
        supplementals.push(supplementalWorkouts[0]);
      }
      
      // Add more workouts up to 3 total
      const remainingWorkouts = schedule.workoutType === 'LOWER' && supplementalWorkouts[0]?.name === 'Leg Circuit Complex' 
        ? supplementalWorkouts.slice(1) 
        : supplementalWorkouts;
        
      const numWorkouts = Math.min(3 - supplementals.length, remainingWorkouts.length);
      for (let i = 0; i < numWorkouts; i++) {
        const index = (weekIdentifier + i) % remainingWorkouts.length;
        supplementals.push(remainingWorkouts[index]);
      }
    }`
  );

  // Write the updated controller to a new file
  const fixedControllerPath = path.join(__dirname, 'src', 'controllers', 'schedule.controller.fixed.ts');
  fs.writeFile(fixedControllerPath, finalContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing fixed controller:', err);
      return;
    }
    console.log('Fixed controller written to:', fixedControllerPath);
    
    // Now replace the original controller with the fixed one
    fs.rename(fixedControllerPath, controllerPath, (err) => {
      if (err) {
        console.error('Error replacing controller:', err);
        return;
      }
      console.log('Original controller replaced with fixed version');
    });
  });
});