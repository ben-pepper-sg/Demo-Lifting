import { Request, Response } from 'express';
import { prisma } from '../index';

// Get all default schedules
export const getAllDefaultSchedules = async (req: Request, res: Response) => {
  try {
    const defaultSchedules = await prisma.defaultSchedule.findMany({
      where: {
        isActive: true,
      },
      include: {
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { time: 'asc' },
      ],
    });
    
    return res.status(200).json({ defaultSchedules });
  } catch (error) {
    console.error('Get default schedules error:', error);
    return res.status(500).json({ error: 'Failed to get default schedules' });
  }
};

// Create a new schedule entry from a default schedule
export const createScheduleFromDefault = async (req: Request, res: Response) => {
  try {
    const { defaultScheduleId, date } = req.body;
    
    // Validate required fields
    if (!defaultScheduleId || !date) {
      return res.status(400).json({ error: 'Default schedule ID and date are required' });
    }
    
    // Find the default schedule
    const defaultSchedule = await prisma.defaultSchedule.findUnique({
      where: { id: defaultScheduleId },
      include: {
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    if (!defaultSchedule) {
      return res.status(404).json({ error: 'Default schedule not found' });
    }
    
    // Parse date parts to ensure consistent date handling
    let parts: number[] = [];
    if (typeof date === 'string') {
      if (date.includes('T')) {
        parts = date.split('T')[0].split('-').map(p => parseInt(p));
      } else {
        parts = date.split('-').map(p => parseInt(p));
      }
    }
    
    // Create date at noon UTC to avoid timezone issues
    const scheduleDateUTC = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    
    // Verify the day of week matches
    const dayOfWeek = scheduleDateUTC.getUTCDay();
    if (dayOfWeek !== defaultSchedule.dayOfWeek) {
      return res.status(400).json({ 
        error: 'Selected date does not match the day of week for this default schedule',
        requestedDay: dayOfWeek,
        expectedDay: defaultSchedule.dayOfWeek
      });
    }
    
    // Check if schedule already exists for this day and time
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        date: scheduleDateUTC,
        time: defaultSchedule.time,
      },
    });
    
    if (existingSchedule) {
      return res.status(409).json({ 
        error: 'A schedule already exists for this date and time',
        scheduleId: existingSchedule.id
      });
    }
    
    // Create the new schedule
    const schedule = await prisma.schedule.create({
      data: {
        date: scheduleDateUTC,
        time: defaultSchedule.time,
        capacity: defaultSchedule.capacity,
        coachId: defaultSchedule.coachId,
        workoutType: defaultSchedule.workoutType,
      },
      include: {
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    return res.status(201).json({
      message: 'Schedule created successfully',
      schedule,
    });
  } catch (error) {
    console.error('Create schedule from default error:', error);
    return res.status(500).json({ error: 'Failed to create schedule' });
  }
};

// Admin only: Create/update default schedules
export const upsertDefaultSchedule = async (req: Request, res: Response) => {
  try {
    const { id, dayOfWeek, time, capacity, workoutType, coachId, isActive } = req.body;
    
    // Validate required fields
    if (dayOfWeek === undefined || !time || !workoutType) {
      return res.status(400).json({ error: 'Day of week, time, and workout type are required' });
    }
    
    // If no coach ID is provided, use the current admin user's ID
    const actualCoachId = coachId || req.user?.userId;
    if (!actualCoachId) {
      return res.status(400).json({ error: 'Coach ID is required' });
    }
    
    // Check if day of week is valid (0-6)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Day of week must be between 0 (Sunday) and 6 (Saturday)' });
    }
    
    // Check if time format is valid (HH:MM)
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      return res.status(400).json({ error: 'Time must be in HH:MM format' });
    }
    
    // Create or update the default schedule
    const defaultSchedule = await prisma.defaultSchedule.upsert({
      where: { id: id || '' },
      update: {
        dayOfWeek,
        time,
        capacity: capacity || 8,
        workoutType,
        coachId: actualCoachId,
        isActive: isActive !== undefined ? isActive : true,
      },
      create: {
        dayOfWeek,
        time,
        capacity: capacity || 8,
        workoutType,
        coachId: actualCoachId,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    return res.status(200).json({
      message: id ? 'Default schedule updated successfully' : 'Default schedule created successfully',
      defaultSchedule,
    });
  } catch (error) {
    console.error('Upsert default schedule error:', error);
    return res.status(500).json({ error: 'Failed to create/update default schedule' });
  }
};

// Admin only: Delete a default schedule
export const deleteDefaultSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if default schedule exists
    const defaultSchedule = await prisma.defaultSchedule.findUnique({
      where: { id },
    });
    
    if (!defaultSchedule) {
      return res.status(404).json({ error: 'Default schedule not found' });
    }
    
    // Delete the default schedule
    await prisma.defaultSchedule.delete({
      where: { id },
    });
    
    return res.status(200).json({
      message: 'Default schedule deleted successfully',
    });
  } catch (error) {
    console.error('Delete default schedule error:', error);
    return res.status(500).json({ error: 'Failed to delete default schedule' });
  }
};