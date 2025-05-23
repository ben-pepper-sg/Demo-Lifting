import { Request, Response } from 'express';
import { AuthRequest } from '../types';

// For non-null assertion in the test environment
interface User {
  maxBench: number | null;
  maxOHP: number | null;
  maxSquat: number | null;
  maxDeadlift: number | null;
  [key: string]: any;
}
import { prisma } from '../lib/prisma';

// Create and book schedules

// Create a new schedule (coach/admin only)
export const createSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { date, time, capacity, workoutType } = req.body;

    // Validate required fields
    if (!date || !time || !workoutType) {
      return res.status(400).json({ error: 'Date, time, and workout type are required' });
    }

    // Format the date
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0); // Set to midnight for consistent storage

    // Check if a schedule already exists for this date and time
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        date: scheduleDate,
        time: time,
      },
    });

    if (existingSchedule) {
      return res.status(400).json({ error: 'A schedule already exists for this date and time' });
    }

    // Get coach ID from the authenticated user
    const coachId = req.user?.userId || 'default-coach-id';

    // Create the new schedule
    const schedule = await prisma.schedule.create({
      data: {
        date: scheduleDate,
        time: time,
        capacity: capacity || 8, // Default to 8 if not specified
        currentParticipants: 0,
        coachId: coachId,
        workoutType: workoutType,
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

// Book a time slot for a user
export const bookTimeSlot = async (req: AuthRequest, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user?.userId || 'default-user-id';
    const { workoutType } = req.body; // Optional for Friday/Saturday

    // Check if the schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { bookings: true },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Check if the user is already booked for this time slot
    const existingBooking = await prisma.booking.findFirst({
      where: {
        scheduleId: scheduleId,
        userId: userId,
      },
    });

    if (existingBooking) {
      return res.status(400).json({ error: 'You are already booked for this time slot' });
    }

    // Check if the class is at capacity
    if (schedule.currentParticipants >= schedule.capacity) {
      return res.status(400).json({ error: 'This class is at full capacity' });
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        scheduleId: scheduleId,
        userId: userId,
        workoutType: workoutType, // Store workout type selection if provided
      },
    });

    // Update the current participants count
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        currentParticipants: schedule.currentParticipants + 1,
      },
    });

    return res.status(200).json({
      message: 'Time slot booked successfully',
      booking,
    });
  } catch (error) {
    console.error('Book timeslot error:', error);
    return res.status(500).json({ error: 'Failed to book time slot' });
  }
};

// Cancel a booking
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user?.userId || 'default-user-id';

    // Check if the schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Check if the user has a booking for this schedule
    const booking = await prisma.booking.findFirst({
      where: {
        scheduleId: scheduleId,
        userId: userId,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Delete the booking
    await prisma.booking.delete({
      where: { id: booking.id },
    });

    // Update the current participants count (ensure it doesn't go below 0)
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        currentParticipants: Math.max(0, schedule.currentParticipants - 1),
      },
    });

    return res.status(200).json({
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

// Get all schedules
export const getAllSchedules = async (req: Request, res: Response) => {
  try {
    // Allow filtering by specific date (optional)
    let where = {};
    
    if (req.query.date) {
      const filterDate = new Date(req.query.date as string);
      filterDate.setHours(0, 0, 0, 0); // Set to midnight
      
      where = {
        date: {
          equals: filterDate
        }
      };
    }
    
    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        coach: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        bookings: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });
    
    return res.status(200).json({ schedules });
  } catch (error) {
    console.error('Get schedules error:', error);
    return res.status(500).json({ error: 'Failed to get schedules' });
  }
};

// Get class details for the current or upcoming hour
export const getClassDetails = async (req: Request, res: Response) => {
  try {
    // Get current date and time
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // If hour is specified in the query, use that instead
    let targetHour = currentHour;
    if (req.query.hour) {
      targetHour = parseInt(req.query.hour as string, 10);
    }
    
    // Calculate the target time string (padded with leading zero)
    const paddedHour = String(targetHour).padStart(2, '0');
    const targetTime = `${paddedHour}:00`;
    
    // If no specific hour is requested, find either the current hour's class
    // or the next upcoming class for today
    let schedule;
    
    if (req.query.hour) {
      // Find the specific requested hour
      schedule = await prisma.schedule.findFirst({
        where: {
          date: {
            // Find dates within the same day, regardless of exact time
            gte: new Date(currentDate.setHours(0, 0, 0, 0)),
            lt: new Date(new Date(currentDate).setHours(24, 0, 0, 0))
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
    } else {
      // Try current hour first
      schedule = await prisma.schedule.findFirst({
        where: {
          date: {
            // Find dates within the same day, regardless of exact time
            gte: new Date(currentDate.setHours(0, 0, 0, 0)),
            lt: new Date(new Date(currentDate).setHours(24, 0, 0, 0))
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
      
      // If no current hour class, find the next upcoming class today
      if (!schedule) {
        schedule = await prisma.schedule.findFirst({
          where: {
            date: { equals: currentDate },
            time: { gt: targetTime },  // Find classes later today
          },
          orderBy: { time: 'asc' },    // Get the next earliest one
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
      }
    }
    
    if (!schedule) {
      return res.status(404).json({ error: 'No class scheduled for the current or upcoming hour' });
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
    const currentDate2 = new Date();
    const daysSinceMonday = (currentDate2.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    const startOfWeek = new Date(currentDate2);
    startOfWeek.setDate(currentDate2.getDate() - daysSinceMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Use the Monday date as a seed for selecting supplemental workouts
    // This ensures consistency within the week
    const mondayTimestamp = startOfWeek.getTime();
    const weekIdentifier = Math.floor(mondayTimestamp / (7 * 24 * 60 * 60 * 1000));
    
    // Get BOTH upper and lower body supplemental workouts for all classes
    // These will rotate every Monday for all classes that week
    const upperSupplementalWorkouts = await prisma.supplementalWorkout.findMany({
      where: {
        category: 'UPPER'
      },
      include: {
        exercises: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    const lowerSupplementalWorkouts = await prisma.supplementalWorkout.findMany({
      where: {
        category: 'LOWER'
      },
      include: {
        exercises: true
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    // Always prioritize showing Leg Circuit Complex for LOWER workouts
    const legCircuitWorkout = await prisma.supplementalWorkout.findFirst({
      where: {
        name: 'Leg Circuit Complex'
      },
      include: {
        exercises: true
      }
    });
    
    // Always include our complete supplemental workouts (Upper and Lower) for all classes
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
    }
    
    // Get lower body supplemental workouts (2 per week, rotating weekly)
    if (lowerSupplementalWorkouts.length > 0) {
      // Prioritize Leg Circuit Complex if it exists
      if (legCircuitWorkout && schedule.workoutType === 'LOWER') {
        supplementals.push(legCircuitWorkout);
        
        // Remove it from consideration for second spot if it was chosen
        const remainingLowerWorkouts = lowerSupplementalWorkouts.filter(
          workout => workout.id !== legCircuitWorkout.id
        );
        
        // Add one more lower body workout
        if (remainingLowerWorkouts.length > 0) {
          const index = weekIdentifier % remainingLowerWorkouts.length;
          supplementals.push(remainingLowerWorkouts[index]);
        }
      } else {
        // Just choose two normally, cycling based on week
        const numLowerWorkouts = Math.min(2, lowerSupplementalWorkouts.length);
        for (let i = 0; i < numLowerWorkouts; i++) {
          const index = (weekIdentifier + i) % lowerSupplementalWorkouts.length;
          supplementals.push(lowerSupplementalWorkouts[index]);
        }
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
          // Calculate for each percentage in the workout scheme
          const benchWeights = workoutScheme.percentages.map(percentage => {
            const weight = (user.maxBench || 0) * (percentage / 100);
            return Math.round(weight / 5) * 5; // Round to nearest 5
          });
          
          const ohpWeights = workoutScheme.percentages.map(percentage => {
            const weight = (user.maxOHP || 0) * (percentage / 100);
            return Math.round(weight / 5) * 5; // Round to nearest 5
          });
          
          liftWeights = {
            bench: benchWeights,
            ohp: ohpWeights,
          };
        }
      } else if (schedule.workoutType === 'LOWER') {
        if (user.maxSquat && user.maxDeadlift) {
          // Calculate for each percentage in the workout scheme
          const squatWeights = workoutScheme.percentages.map(percentage => {
            const weight = (user.maxSquat || 0) * (percentage / 100);
            return Math.round(weight / 5) * 5; // Round to nearest 5
          });
          
          const deadliftWeights = workoutScheme.percentages.map(percentage => {
            const weight = (user.maxDeadlift || 0) * (percentage / 100);
            return Math.round(weight / 5) * 5; // Round to nearest 5
          });
          
          liftWeights = {
            squat: squatWeights,
            deadlift: deadliftWeights,
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
    
    // Directly add Leg Circuit Complex to supplementals if it's a LOWER workout
    const legCircuitId = '6a39e604-aba8-466d-be52-735e502eb48d';
    if (schedule.workoutType === 'LOWER' && !supplementals.some(w => w.id === legCircuitId)) {
      // Add Leg Circuit Complex as the first supplemental
      supplementals.unshift({"id":"6a39e604-aba8-466d-be52-735e502eb48d","name":"Leg Circuit Complex","category":"LOWER","bodyPart":"QUADS","description":"A comprehensive leg circuit combining exercises for quads, hamstrings and glutes: 10 squat jumps, 15 walking lunges, 20 bodyweight squats, and 15 lateral lunges. Complete all exercises without rest between them.","createdAt":"2025-05-01T13:30:39.935Z","updatedAt":"2025-05-01T13:30:39.935Z","exercises":[{"id":"04557f27-ae38-41f1-a6f0-db1d2e2ec453","name":"Squat Jumps","description":"Perform 10 explosive jumps from a squat position, landing softly back into a squat.","supplementalWorkoutId":"6a39e604-aba8-466d-be52-735e502eb48d","createdAt":"2025-05-01T13:31:17.127Z","updatedAt":"2025-05-01T13:31:17.127Z"},{"id":"6b39804d-6a00-4e2e-84e3-a8fe26f77267","name":"Walking Lunges","description":"Perform 15 walking lunges (total), alternating legs with each step.","supplementalWorkoutId":"6a39e604-aba8-466d-be52-735e502eb48d","createdAt":"2025-05-01T13:31:17.129Z","updatedAt":"2025-05-01T13:31:17.129Z"},{"id":"928df41a-d6d6-4f28-8538-92bb66685d42","name":"Bodyweight Squats","description":"Perform 20 deep bodyweight squats with proper form.","supplementalWorkoutId":"6a39e604-aba8-466d-be52-735e502eb48d","createdAt":"2025-05-01T13:31:17.130Z","updatedAt":"2025-05-01T13:31:17.130Z"},{"id":"defbac00-be38-491b-a48f-88165f490ca5","name":"Lateral Lunges","description":"Perform 15 lateral lunges (total), alternating sides.","supplementalWorkoutId":"6a39e604-aba8-466d-be52-735e502eb48d","createdAt":"2025-05-01T13:31:17.132Z","updatedAt":"2025-05-01T13:31:17.132Z"}]});
    }

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

// Delete a schedule (admin/coach only)
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const scheduleId = req.params.id;
    
    // Check if the schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { bookings: true }
    });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Delete all bookings related to this schedule
    if (schedule.bookings.length > 0) {
      await prisma.booking.deleteMany({
        where: {
          scheduleId: scheduleId
        }
      });
    }
    
    // Delete the schedule
    await prisma.schedule.delete({
      where: {
        id: scheduleId
      }
    });
    
    return res.status(200).json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    return res.status(500).json({ error: 'Failed to delete schedule' });
  }
};