import { Request, Response } from 'express';
import { prisma } from '../index';
// Error monitoring removed

// Get all schedule entries
export const getAllSchedules = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('[GET /schedule] Query params:', { startDate, endDate });

    // Parse date ranges directly from strings to avoid timezone issues
    let startDateObj: Date | null = null;
    let endDateObj: Date | null = null;
    
    if (startDate && typeof startDate === 'string') {
      const parts: number[] = startDate.split('T')[0].split('-').map(p => parseInt(p));
      startDateObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0));
    }
    
    if (endDate && typeof endDate === 'string') {
      const parts: number[] = endDate.split('T')[0].split('-').map(p => parseInt(p));
      endDateObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 23, 59, 59));
    }
    
    console.log('Date range for query:', { 
      startDate: startDateObj?.toISOString(),
      endDate: endDateObj?.toISOString()
    });
    
    const schedules = await prisma.schedule.findMany({
      where: {
        ...(startDateObj && endDateObj ? {
          date: {
            gte: startDateObj,
            lte: endDateObj,
          },
        } : {}),
      },
      include: {
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                maxBench: true,
                maxOHP: true,
                maxSquat: true,
                maxDeadlift: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
    
    return res.status(200).json({ schedules });
  } catch (error) {
    console.error('Get schedules error:', error);
    return res.status(500).json({ error: 'Failed to get schedules' });
  }
};

// Create a new schedule entry
export const createSchedule = async (req: Request, res: Response) => {
  try {
    const { date, time, capacity, coachId, workoutType } = req.body;
    
    console.log('Creating schedule with raw date:', date);
    
    // Parse the date value - ensuring we preserve the exact day specified
    // For example, if date is '2025-04-28' or '2025-04-28T00:00:00.000Z'
    let parts: number[] = [];
    if (typeof date === 'string') {
      if (date.includes('T')) {
        parts = date.split('T')[0].split('-').map(p => parseInt(p));
      } else {
        parts = date.split('-').map(p => parseInt(p));
      }
    }
    
    console.log('Date parts:', parts);
    
    // Use date parts directly to create the date - avoiding any timezone conversion
    // Months are 0-indexed in JavaScript Date object
    const normalizedDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    
    console.log('Creating schedule with normalized date:', {
      rawDate: date,
      normalizedDate,
      isoString: normalizedDate.toISOString(),
      localDate: normalizedDate.toString()
    });
    
    const schedule = await prisma.schedule.create({
      data: {
        date: normalizedDate,
        time,
        capacity: capacity || 8,
        coachId,
        workoutType,
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
    console.error('Create schedule error:', error);
    return res.status(500).json({ error: 'Failed to create schedule' });
  }
};

// Book a time slot
export const bookTimeSlot = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { scheduleId } = req.params;
    const { workoutType } = req.body; // Get the selected workout type if provided
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if schedule exists and has available spots
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    if (schedule.currentParticipants >= schedule.capacity) {
      return res.status(400).json({ error: 'No available spots' });
    }
    
    // Check if it's a Friday or Saturday (5 = Friday, 6 = Saturday)
    const scheduleDate = new Date(schedule.date);
    const dayOfWeek = scheduleDate.getDay();
    const isFridayOrSaturday = dayOfWeek === 5 || dayOfWeek === 6;
    
    // Validate workout type selection for Friday/Saturday
    if (isFridayOrSaturday && !workoutType) {
      return res.status(400).json({ 
        error: 'Please select a workout type (Upper or Lower) for Friday/Saturday sessions',
        requiresWorkoutType: true,
        dayOfWeek
      });
    }
    
    // For Friday/Saturday, validate the workout type is either UPPER or LOWER
    if (isFridayOrSaturday && workoutType && !['UPPER', 'LOWER'].includes(workoutType)) {
      return res.status(400).json({ 
        error: 'Invalid workout type. Must be either UPPER or LOWER',
        requiresWorkoutType: true,
        dayOfWeek
      });
    }
    
    // Check if user already booked this slot
    const existingBooking = await prisma.booking.findFirst({
      where: {
        scheduleId,
        userId,
      },
    });
    
    if (existingBooking) {
      return res.status(400).json({ error: 'Already booked this time slot' });
    }
    
    // Create booking and update schedule participants count
    const booking = await prisma.$transaction(async (prisma) => {
      const newBooking = await prisma.booking.create({
        data: {
          scheduleId,
          userId,
          // Add workoutType if it's Friday/Saturday
          ...(isFridayOrSaturday ? { workoutType } : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          schedule: true,
        },
      });
      
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          currentParticipants: {
            increment: 1,
          },
        },
      });
      
      return newBooking;
    });
    
    return res.status(200).json({
      message: 'Time slot booked successfully',
      booking,
      workoutTypeSelected: isFridayOrSaturday ? workoutType : schedule.workoutType,
    });
  } catch (error) {
    console.error('Book time slot error:', error);
    return res.status(500).json({ error: 'Failed to book time slot' });
  }
};

// Cancel a booking
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { scheduleId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if booking exists
    const booking = await prisma.booking.findFirst({
      where: {
        scheduleId,
        userId,
      },
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Delete booking and update schedule participants count
    await prisma.$transaction(async (prisma) => {
      await prisma.booking.delete({
        where: { id: booking.id },
      });
      
      // Get the schedule to check current participants and capacity
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
      });
      
      if (schedule) {
        // Ensure we don't go below 0 participants
        const newParticipantCount = Math.max(0, schedule.currentParticipants - 1);
        
        await prisma.schedule.update({
          where: { id: scheduleId },
          data: {
            currentParticipants: newParticipantCount,
          },
        });
      }
    });
    
    return res.status(200).json({
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

// Delete a schedule (admin/coach only)
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        bookings: true,
      },
    });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Delete all bookings related to this schedule and then delete the schedule
    await prisma.$transaction(async (prisma) => {
      // Delete all bookings first
      await prisma.booking.deleteMany({
        where: { scheduleId: id },
      });
      
      // Then delete the schedule
      await prisma.schedule.delete({
        where: { id },
      });
    });
    
    return res.status(200).json({
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    return res.status(500).json({ error: 'Failed to delete schedule' });
  }
};

// Get class details for the next hour
export const getClassDetails = async (req: Request, res: Response) => {
  try {
    // Get current date and time
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    
    // Calculate the target hour (next hour)
    const targetHour = currentHour + 1;
    const targetTime = `${targetHour}:00`;
    
    // Find the schedule for the next hour
    const schedule = await prisma.schedule.findFirst({
      where: {
        date: {
          equals: new Date(now.setHours(0, 0, 0, 0)),
        },
        time: targetTime,
      },
      include: {
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                maxBench: true,
                maxOHP: true,
                maxSquat: true,
                maxDeadlift: true,
              },
            },
          },
        },
      },
    });
    
    if (!schedule) {
      return res.status(404).json({ error: 'No class scheduled for the next hour' });
    }
    
    // Get current week number (1-8)
    // Assuming week 1 starts from a specific date stored in config
    // For now, let's assume it's the current week number of the year mod 8 + 1
    const weekNumber = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) % 8 + 1;
    
    // Get workout scheme for the current week and workout type
    const workoutScheme = await prisma.workoutScheme.findFirst({
      where: {
        week: weekNumber,
        day: currentDay,
        liftType: schedule.workoutType,
      },
    });
    
    if (!workoutScheme) {
      return res.status(404).json({ error: 'Workout scheme not found for this week and day' });
    }
    
    // Get weekly supplemental workouts based on the current week number
    // This ensures the same supplemental workouts are used all week, but change every Monday
    
    // Find the start of the current week (Monday)
    const currentDate = new Date();
    const daysSinceMonday = (currentDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - daysSinceMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Use the Monday date as a seed for selecting supplemental workouts
    // This ensures consistency within the week
    const mondayTimestamp = startOfWeek.getTime();
    const weekIdentifier = Math.floor(mondayTimestamp / (7 * 24 * 60 * 60 * 1000));
    
    // Get appropriate supplemental workouts for this week and workout type
    const supplementalWorkouts = await prisma.supplementalWorkout.findMany({
      where: {
        category: schedule.workoutType
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    // Select 2-3 supplemental workouts based on the week number
    // Use modulo to cycle through all available supplemental workouts over time
    // This ensures every week has different supplemental workouts
    const supplementals = [];
    if (supplementalWorkouts.length > 0) {
      const numWorkouts = Math.min(3, supplementalWorkouts.length);
      for (let i = 0; i < numWorkouts; i++) {
        const index = (weekIdentifier + i) % supplementalWorkouts.length;
        supplementals.push(supplementalWorkouts[index]);
      }
    }
    
    // Prepare class details with participant information
    const participants = schedule.bookings.map((booking) => {
      const user = booking.user;
      
      // Calculate weights based on the user's max lifts and workout percentages
      // This calculation depends on the day of the week and workout type
      let liftWeights = {};
      
      if (schedule.workoutType === 'UPPER') {
        if (user.maxBench && user.maxOHP) {
          const benchWeight = user.maxBench * (workoutScheme.percentages[0] / 100);
          const ohpWeight = user.maxOHP * (workoutScheme.percentages[0] / 100);
          
          liftWeights = {
            bench: Math.round(benchWeight * 2) / 2, // Round to nearest 0.5
            ohp: Math.round(ohpWeight * 2) / 2,
          };
        }
      } else if (schedule.workoutType === 'LOWER') {
        if (user.maxSquat && user.maxDeadlift) {
          const squatWeight = user.maxSquat * (workoutScheme.percentages[0] / 100);
          const deadliftWeight = user.maxDeadlift * (workoutScheme.percentages[0] / 100);
          
          liftWeights = {
            squat: Math.round(squatWeight * 2) / 2,
            deadlift: Math.round(deadliftWeight * 2) / 2,
          };
        }
      }
      
      return {
        userId: user.id,
        firstName: user.firstName,
        lastInitial: user.lastName.charAt(0),
        weights: liftWeights,
      };
    });
    
    return res.status(200).json({
      class: {
        id: schedule.id,
        date: schedule.date,
        time: schedule.time,
        workoutType: schedule.workoutType,
        participants,
        scheme: {
          sets: workoutScheme.sets,
          reps: workoutScheme.reps,
          percentages: workoutScheme.percentages,
          restTime: workoutScheme.restTime,
        },
        supplementalWorkouts: supplementals,
      },
    });
  } catch (error) {
    console.error('Get class details error:', error);
    return res.status(500).json({ error: 'Failed to get class details' });
  }
};