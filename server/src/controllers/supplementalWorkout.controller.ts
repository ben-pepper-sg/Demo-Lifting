import { Request, Response } from 'express';
import { prisma } from '../index';
import { WorkoutCategory, BodyPart } from '@prisma/client';

// Get all supplemental workouts
export const getAllSupplementalWorkouts = async (req: Request, res: Response) => {
  try {
    const supplementalWorkouts = await prisma.supplementalWorkout.findMany({
      orderBy: [
        { category: 'asc' },
        { bodyPart: 'asc' },
        { name: 'asc' },
      ],
    });
    
    return res.status(200).json({ supplementalWorkouts });
  } catch (error) {
    console.error('Get supplemental workouts error:', error);
    return res.status(500).json({ error: 'Failed to get supplemental workouts' });
  }
};

// Create a new supplemental workout
export const createSupplementalWorkout = async (req: Request, res: Response) => {
  try {
    const { name, category, bodyPart, description } = req.body;
    
    // Validate required fields
    if (!name || !category || !bodyPart) {
      return res.status(400).json({ error: 'Name, category, and body part are required' });
    }
    
    // Validate category is a valid WorkoutCategory
    if (!Object.values(WorkoutCategory).includes(category)) {
      return res.status(400).json({ error: 'Invalid workout category' });
    }
    
    // Validate bodyPart is a valid BodyPart
    if (!Object.values(BodyPart).includes(bodyPart)) {
      return res.status(400).json({ error: 'Invalid body part' });
    }
    
    const supplementalWorkout = await prisma.supplementalWorkout.create({
      data: {
        name,
        category,
        bodyPart,
        description,
      },
    });
    
    return res.status(201).json({
      message: 'Supplemental workout created successfully',
      supplementalWorkout,
    });
  } catch (error) {
    console.error('Create supplemental workout error:', error);
    return res.status(500).json({ error: 'Failed to create supplemental workout' });
  }
};

// Update a supplemental workout
export const updateSupplementalWorkout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, bodyPart, description } = req.body;
    
    // Check if supplemental workout exists
    const existingWorkout = await prisma.supplementalWorkout.findUnique({
      where: { id },
    });
    
    if (!existingWorkout) {
      return res.status(404).json({ error: 'Supplemental workout not found' });
    }
    
    // Validate category if provided
    if (category && !Object.values(WorkoutCategory).includes(category)) {
      return res.status(400).json({ error: 'Invalid workout category' });
    }
    
    // Validate bodyPart if provided
    if (bodyPart && !Object.values(BodyPart).includes(bodyPart)) {
      return res.status(400).json({ error: 'Invalid body part' });
    }
    
    // Update the supplemental workout
    const supplementalWorkout = await prisma.supplementalWorkout.update({
      where: { id },
      data: {
        name,
        category,
        bodyPart,
        description,
      },
    });
    
    return res.status(200).json({
      message: 'Supplemental workout updated successfully',
      supplementalWorkout,
    });
  } catch (error) {
    console.error('Update supplemental workout error:', error);
    return res.status(500).json({ error: 'Failed to update supplemental workout' });
  }
};

// Delete a supplemental workout
export const deleteSupplementalWorkout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if supplemental workout exists
    const existingWorkout = await prisma.supplementalWorkout.findUnique({
      where: { id },
    });
    
    if (!existingWorkout) {
      return res.status(404).json({ error: 'Supplemental workout not found' });
    }
    
    // Delete the supplemental workout
    await prisma.supplementalWorkout.delete({
      where: { id },
    });
    
    return res.status(200).json({
      message: 'Supplemental workout deleted successfully',
    });
  } catch (error) {
    console.error('Delete supplemental workout error:', error);
    return res.status(500).json({ error: 'Failed to delete supplemental workout' });
  }
};