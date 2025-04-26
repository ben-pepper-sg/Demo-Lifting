import { Request, Response } from 'express';
import { prisma } from '../index';

// Get all schedule entries
export const getAllSchedules = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const schedules = await prisma.schedule.findMany({
      where: {
        ...(startDate && endDate ? {
          date: {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate)),
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
    
    const schedule = await prisma.schedule.create({
      data: {
        date: new Date(date),
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
      
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          currentParticipants: {
            decrement: 1,
          },
        },
      });
    });
    
    return res.status(200).json({
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ error: 'Failed to cancel booking' });
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
      },
    });
  } catch (error) {
    console.error('Get class details error:', error);
    return res.status(500).json({ error: 'Failed to get class details' });
  }
};