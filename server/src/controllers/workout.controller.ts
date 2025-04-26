import { Request, Response } from 'express';
import { prisma } from '../index';

// Get all workouts for a specific user
export const getUserWorkouts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { liftType } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const workouts = await prisma.workoutLog.findMany({
      where: {
        userId,
        ...(liftType ? { liftType: String(liftType) } : {}),
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    return res.status(200).json({ workouts });
  } catch (error) {
    console.error('Get workouts error:', error);
    return res.status(500).json({ error: 'Failed to get workout data' });
  }
};

// Create a new workout log entry
export const logWorkout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { liftType, weight, reps, sets, date, notes } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const workout = await prisma.workoutLog.create({
      data: {
        userId,
        liftType,
        weight,
        reps,
        sets,
        date: new Date(date),
        notes,
      },
    });
    
    return res.status(201).json({
      message: 'Workout logged successfully',
      workout,
    });
  } catch (error) {
    console.error('Log workout error:', error);
    return res.status(500).json({ error: 'Failed to log workout' });
  }
};

// Update a user's max lift values
export const updateMaxLifts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { maxBench, maxOHP, maxSquat, maxDeadlift } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(maxBench !== undefined ? { maxBench } : {}),
        ...(maxOHP !== undefined ? { maxOHP } : {}),
        ...(maxSquat !== undefined ? { maxSquat } : {}),
        ...(maxDeadlift !== undefined ? { maxDeadlift } : {}),
      },
    });
    
    // Return user data without password
    const { passwordHash: _, ...userData } = user;
    
    return res.status(200).json({
      message: 'Max lifts updated successfully',
      user: userData,
    });
  } catch (error) {
    console.error('Update max lifts error:', error);
    return res.status(500).json({ error: 'Failed to update max lifts' });
  }
};

// Get workout scheme for a specific week
export const getWorkoutScheme = async (req: Request, res: Response) => {
  try {
    const { week, day, liftType } = req.query;
    
    if (!week || !day || !liftType) {
      return res.status(400).json({ error: 'Week, day, and liftType are required' });
    }
    
    const scheme = await prisma.workoutScheme.findFirst({
      where: {
        week: Number(week),
        day: Number(day),
        liftType: String(liftType) as any,
      },
    });
    
    if (!scheme) {
      return res.status(404).json({ error: 'Workout scheme not found' });
    }
    
    return res.status(200).json({ scheme });
  } catch (error) {
    console.error('Get workout scheme error:', error);
    return res.status(500).json({ error: 'Failed to get workout scheme' });
  }
};

// Calculate the weight for a specific lift based on max and percentage
export const calculateLiftWeight = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { liftType, percentage } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!liftType || !percentage) {
      return res.status(400).json({ error: 'LiftType and percentage are required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let maxWeight: number | null = 0;
    
    switch (liftType) {
      case 'BENCH':
        maxWeight = user.maxBench;
        break;
      case 'OHP':
        maxWeight = user.maxOHP;
        break;
      case 'SQUAT':
        maxWeight = user.maxSquat;
        break;
      case 'DEADLIFT':
        maxWeight = user.maxDeadlift;
        break;
      default:
        return res.status(400).json({ error: 'Invalid lift type' });
    }
    
    if (!maxWeight) {
      return res.status(400).json({ error: `Max weight for ${liftType} not set` });
    }
    
    const weight = maxWeight * (Number(percentage) / 100);
    
    return res.status(200).json({
      liftType,
      maxWeight,
      percentage: Number(percentage),
      calculatedWeight: Math.round(weight * 2) / 2, // Round to nearest 0.5
    });
  } catch (error) {
    console.error('Calculate lift weight error:', error);
    return res.status(500).json({ error: 'Failed to calculate lift weight' });
  }
};