import React, { useState, useEffect, useCallback } from 'react';
import { supplementalWorkoutService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

type Exercise = {
  id: string;
  name: string;
  description?: string;
  supplementalWorkoutId: string;
  createdAt: string;
  updatedAt: string;
};

type SupplementalWorkout = {
  id: string;
  name: string;
  category: 'UPPER' | 'LOWER';
  bodyPart: string;
  description?: string;
  exercises: Exercise[];
};

const SupplementalWorkoutAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [supplementalWorkouts, setSupplementalWorkouts] = useState<SupplementalWorkout[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: 'UPPER',
    bodyPart: 'BICEPS',
    description: '',
  });
  
  const [exerciseFormData, setExerciseFormData] = useState({
    id: '',
    name: '',
    description: '',
    supplementalWorkoutId: '',
  });
  
  const [selectedWorkout, setSelectedWorkout] = useState<SupplementalWorkout | null>(null);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isEditingExercise, setIsEditingExercise] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('ALL');

  const fetchSupplementalWorkouts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await supplementalWorkoutService.getAllSupplementalWorkouts();
      setSupplementalWorkouts(response.data.supplementalWorkouts);
    } catch (err: any) {
      console.error('Fetch supplemental workouts error:', err);
      setError(err.response?.data?.error || 'Failed to fetch supplemental workouts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupplementalWorkouts();
  }, [fetchSupplementalWorkouts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError('');
      setSuccessMessage('');
      
      if (isEditMode) {
        await supplementalWorkoutService.updateSupplementalWorkout(formData.id, formData);
        setSuccessMessage('Supplemental workout updated successfully!');
      } else {
        await supplementalWorkoutService.createSupplementalWorkout(formData);
        setSuccessMessage('Supplemental workout created successfully!');
      }
      
      // Reset form
      setFormData({
        id: '',
        name: '',
        category: 'UPPER',
        bodyPart: 'BICEPS',
        description: '',
      });
      
      setIsEditMode(false);
      
      // Refresh the workout list
      fetchSupplementalWorkouts();
    } catch (err: any) {
      console.error('Submit supplemental workout error:', err);
      setError(err.response?.data?.error || 'Failed to save supplemental workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (workout: SupplementalWorkout) => {
    setFormData({
      id: workout.id,
      name: workout.name,
      category: workout.category,
      bodyPart: workout.bodyPart,
      description: workout.description || '',
    });
    
    setIsEditMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplemental workout?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      await supplementalWorkoutService.deleteSupplementalWorkout(id);
      
      setSuccessMessage('Supplemental workout deleted successfully!');
      fetchSupplementalWorkouts();
    } catch (err: any) {
      console.error('Delete supplemental workout error:', err);
      setError(err.response?.data?.error || 'Failed to delete supplemental workout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      id: '',
      name: '',
      category: 'UPPER',
      bodyPart: 'BICEPS',
      description: '',
    });
    
    setIsEditMode(false);
  };
  
  // Exercise Management Functions
  const handleExerciseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExerciseFormData({ ...exerciseFormData, [name]: value });
  };
  
  const handleAddExercise = (workout: SupplementalWorkout) => {
    setSelectedWorkout(workout);
    setExerciseFormData({
      id: '',
      name: '',
      description: '',
      supplementalWorkoutId: workout.id,
    });
    setIsAddingExercise(true);
    setIsEditingExercise(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleEditExercise = (exercise: Exercise) => {
    setExerciseFormData({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description || '',
      supplementalWorkoutId: exercise.supplementalWorkoutId,
    });
    setIsEditingExercise(true);
    setIsAddingExercise(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelExercise = () => {
    setIsAddingExercise(false);
    setIsEditingExercise(false);
    setExerciseFormData({
      id: '',
      name: '',
      description: '',
      supplementalWorkoutId: '',
    });
    setSelectedWorkout(null);
  };
  
  const handleSubmitExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError('');
      setSuccessMessage('');
      
      if (isEditingExercise) {
        await supplementalWorkoutService.updateExercise(
          exerciseFormData.id,
          {
            name: exerciseFormData.name,
            description: exerciseFormData.description,
          }
        );
        setSuccessMessage('Exercise updated successfully!');
      } else {
        await supplementalWorkoutService.addExercise(
          exerciseFormData.supplementalWorkoutId,
          {
            name: exerciseFormData.name,
            description: exerciseFormData.description,
          }
        );
        setSuccessMessage('Exercise added successfully!');
      }
      
      // Reset form
      setExerciseFormData({
        id: '',
        name: '',
        description: '',
        supplementalWorkoutId: '',
      });
      
      setIsAddingExercise(false);
      setIsEditingExercise(false);
      setSelectedWorkout(null);
      
      // Refresh the workout list
      fetchSupplementalWorkouts();
    } catch (err: any) {
      console.error('Submit exercise error:', err);
      setError(err.response?.data?.error || 'Failed to save exercise');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteExercise = async (exerciseId: string) => {
    if (!window.confirm('Are you sure you want to delete this exercise?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      await supplementalWorkoutService.deleteExercise(exerciseId);
      
      setSuccessMessage('Exercise deleted successfully!');
      fetchSupplementalWorkouts();
    } catch (err: any) {
      console.error('Delete exercise error:', err);
      setError(err.response?.data?.error || 'Failed to delete exercise');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter workouts based on selected filter
  const filteredWorkouts = supplementalWorkouts.filter(workout => {
    if (filter === 'ALL') return true;
    if (filter === 'UPPER') return workout.category === 'UPPER';
    if (filter === 'LOWER') return workout.category === 'LOWER';
    return true;
  });

  // Group workouts by body part
  const workoutsByBodyPart: Record<string, SupplementalWorkout[]> = {};
  filteredWorkouts.forEach(workout => {
    if (!workoutsByBodyPart[workout.bodyPart]) {
      workoutsByBodyPart[workout.bodyPart] = [];
    }
    workoutsByBodyPart[workout.bodyPart].push(workout);
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manage Supplemental Workouts</h1>
      
      {/* Import and use AdminNavigation */}
      {React.createElement(require('../components/admin/AdminNavigation').default)}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {isAddingExercise ? (
            <div className="card mb-6">
              <h2 className="text-2xl font-semibold mb-4">
                {isEditingExercise ? 'Edit Exercise' : 'Add Exercise'}
                {selectedWorkout && <span className="text-base font-normal ml-2">for {selectedWorkout.name}</span>}
              </h2>
              
              <form onSubmit={handleSubmitExercise}>
                <div className="mb-4">
                  <label htmlFor="exerciseName" className="form-label">Exercise Name</label>
                  <input
                    type="text"
                    id="exerciseName"
                    name="name"
                    className="form-input"
                    value={exerciseFormData.name}
                    onChange={handleExerciseInputChange}
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="exerciseDescription" className="form-label">Description</label>
                  <textarea
                    id="exerciseDescription"
                    name="description"
                    className="form-input"
                    value={exerciseFormData.description}
                    onChange={handleExerciseInputChange}
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="btn-primary w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting 
                      ? 'Saving...' 
                      : isEditingExercise 
                        ? 'Update Exercise' 
                        : 'Add Exercise'
                    }
                  </button>
                  
                  <button
                    type="button"
                    className="btn-secondary w-full"
                    onClick={handleCancelExercise}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : null}
          
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">
              {isEditMode ? 'Edit Supplemental Workout' : 'Create Supplemental Workout'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="form-label">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="category" className="form-label">Category</label>
                <select
                  id="category"
                  name="category"
                  className="form-input"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="UPPER">Upper Body</option>
                  <option value="LOWER">Lower Body</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="bodyPart" className="form-label">Body Part</label>
                <select
                  id="bodyPart"
                  name="bodyPart"
                  className="form-input"
                  value={formData.bodyPart}
                  onChange={handleInputChange}
                  required
                >
                  <optgroup label="Upper Body">
                    <option value="BICEPS">Biceps</option>
                    <option value="TRICEPS">Triceps</option>
                    <option value="BACK">Back</option>
                    <option value="SHOULDERS">Shoulders</option>
                    <option value="CHEST">Chest</option>
                  </optgroup>
                  <optgroup label="Lower Body">
                    <option value="CALVES">Calves</option>
                    <option value="QUADS">Quads</option>
                    <option value="HAMSTRINGS">Hamstrings</option>
                    <option value="GLUTES">Glutes</option>
                  </optgroup>
                </select>
              </div>
              
              <div className="mb-6">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-input"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? 'Saving...' 
                    : isEditMode 
                      ? 'Update Workout' 
                      : 'Create Workout'
                  }
                </button>
                
                {isEditMode && (
                  <button
                    type="button"
                    className="btn-secondary w-full"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        <div>
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Supplemental Workouts</h2>
              <div>
                <label htmlFor="filter" className="mr-2">Filter:</label>
                <select
                  id="filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="form-select text-sm"
                >
                  <option value="ALL">All</option>
                  <option value="UPPER">Upper Body</option>
                  <option value="LOWER">Lower Body</option>
                </select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-4">Loading workouts...</div>
            ) : Object.keys(workoutsByBodyPart).length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No supplemental workouts found.
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(workoutsByBodyPart).map(([bodyPart, workouts]) => (
                  <div key={bodyPart}>
                  <h3 className="text-lg font-medium mb-2">{bodyPart}</h3>
                  <div className="bg-white rounded-lg shadow overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                  <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Exercises</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Actions</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {workouts.map((workout) => (
                  <tr key={workout.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{workout.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  workout.category === 'UPPER'
                  ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {workout.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 truncate max-w-xs">
                    {workout.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                  <div className="text-sm flex items-center">
                    <span className="font-semibold mr-2">{workout.exercises.length}</span> exercises
                    <button
                      className="ml-auto px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 text-xs rounded border border-green-200 flex items-center"
                      onClick={() => handleAddExercise(workout)}
                    >
                      <span className="mr-1">+</span> Add
                    </button>
                  </div>
                  {workout.exercises.length > 0 && (
                    <div className="mt-2 pl-2 border-l-2 border-gray-200 max-h-40 overflow-y-auto">
                        {workout.exercises.map(exercise => (
                            <div key={exercise.id} className="text-xs py-1 flex justify-between items-center">
                                <div className="truncate max-w-[120px]">
                                    {exercise.name}
                                    </div>
                                    <div className="flex space-x-1">
                                    <button 
                                    className="text-indigo-600 hover:text-indigo-900 text-xs px-2 py-1"
                                    onClick={() => handleEditExercise(exercise)}
                                    >
                                    Edit
                                    </button>
                                    <button 
                                    className="text-red-600 hover:text-red-900 text-xs px-2 py-1"
                                    onClick={() => handleDeleteExercise(exercise.id)}
                                    >
                                    Delete
                                    </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                              <button
                                className="text-indigo-600 hover:text-indigo-900 px-3 py-1 text-sm border border-indigo-200 rounded-md"
                                  onClick={() => handleEdit(workout)}
                              >
                                  Edit
                                </button>
                              <button
                                className="text-red-600 hover:text-red-900 px-3 py-1 text-sm border border-red-200 rounded-md"
                                  onClick={() => handleDelete(workout.id)}
                              >
                                  Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplementalWorkoutAdminPage;