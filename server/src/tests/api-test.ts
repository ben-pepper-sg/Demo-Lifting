import axios from 'axios';

// Create a test instance
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set up a simple admin token for testing
// This would normally require actual authentication
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi10ZXN0LWlkIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNjE5NjQzODY3LCJleHAiOjE2MTk3MzAyNjd9.8HKR-EYlWnwU6cUQn7HOZXkHLM0Fnr9NXtKADimONF0';

// Add auth header to requests
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${adminToken}`;
  return config;
});

async function testAPI() {
  console.log('Starting API test for exercises feature...');
  let workoutId: string;
  let exerciseId: string;
  
  try {
    // 1. Create a supplemental workout
    console.log('\n1. Creating a supplemental workout...');
    const createWorkoutResponse = await api.post('/supplemental-workouts', {
      name: 'API Test Workout',
      category: 'UPPER',
      bodyPart: 'BICEPS',
      description: 'Created via API test',
    });
    
    workoutId = createWorkoutResponse.data.supplementalWorkout.id;
    console.log(`Created workout with ID: ${workoutId}`);
    
    // 2. Add an exercise to the workout
    console.log('\n2. Adding an exercise to the workout...');
    const addExerciseResponse = await api.post(`/supplemental-workouts/${workoutId}/exercises`, {
      name: 'API Test Exercise',
      description: 'Exercise created via API test',
    });
    
    exerciseId = addExerciseResponse.data.exercise.id;
    console.log(`Added exercise with ID: ${exerciseId}`);
    console.log('Response:', addExerciseResponse.data);
    
    // 3. Get workouts to verify exercise was added
    console.log('\n3. Getting workouts to verify exercise was added...');
    const getWorkoutsResponse = await api.get('/supplemental-workouts');
    const testWorkout = getWorkoutsResponse.data.supplementalWorkouts.find(
      (workout: any) => workout.id === workoutId
    );
    
    console.log('Test workout exercises:', testWorkout?.exercises);
    console.log(`Exercise count: ${testWorkout?.exercises?.length || 0}`);
    
    // 4. Update the exercise
    console.log('\n4. Updating the exercise...');
    const updateExerciseResponse = await api.put(`/supplemental-workouts/exercises/${exerciseId}`, {
      name: 'Updated API Test Exercise',
      description: 'Updated via API test',
    });
    
    console.log('Update response:', updateExerciseResponse.data);
    
    // 5. Delete the exercise
    console.log('\n5. Deleting the exercise...');
    const deleteExerciseResponse = await api.delete(`/supplemental-workouts/exercises/${exerciseId}`);
    console.log('Delete response:', deleteExerciseResponse.data);
    
    // 6. Clean up - delete the test workout
    console.log('\n6. Cleaning up - deleting test workout...');
    await api.delete(`/supplemental-workouts/${workoutId}`);
    console.log('Test workout deleted.');
    
    console.log('\nAPI test completed successfully!');
  } catch (error: any) {
    console.error('Error during API test:', error.response?.data || error.message);
  }
}

// Only run this test if the server is running
console.log('Note: This test assumes the server is running at http://localhost:3001');
testAPI().catch(console.error);