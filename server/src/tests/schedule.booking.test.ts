import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

import { Request, Response } from 'express';
import { bookTimeSlot, cancelBooking } from '../controllers/schedule.controller';

// Mock the prisma instance first
jest.mock('../lib/prisma', () => ({
  prisma: {
    schedule: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { createMockPrisma } from './helpers/testDatabase';
import { prisma } from '../lib/prisma';

// Cast to mock for type safety
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Schedule Controller Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: { userId: 'user123', role: 'USER' },
      params: { scheduleId: 'schedule123' },
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  test('bookTimeSlot should increment currentParticipants', async () => {
    // Setup mocks
    mockPrisma.schedule.findUnique.mockResolvedValue({
      id: 'schedule123',
      date: new Date(),
      time: '16:00',
      capacity: 8,
      currentParticipants: 5,
      workoutType: 'UPPER',
    });
    mockPrisma.booking.findFirst.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return await callback(mockPrisma);
    });

    // Call the function
    await bookTimeSlot(mockRequest as Request, mockResponse as Response);

    // Verify increment was called
    expect(mockPrisma.schedule.update).toHaveBeenCalledWith({
      where: { id: 'schedule123' },
      data: {
        currentParticipants: {
          increment: 1
        },
      },
    });
  });

  test('cancelBooking should decrement currentParticipants', async () => {
    // Setup mocks
    mockPrisma.booking.findFirst.mockResolvedValue({
      id: 'booking123',
      scheduleId: 'schedule123',
      userId: 'user123',
    });
    mockPrisma.schedule.findUnique.mockResolvedValue({
      id: 'schedule123',
      currentParticipants: 6,
      capacity: 8,
    });
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return await callback(mockPrisma);
    });

    // Call the function
    await cancelBooking(mockRequest as Request, mockResponse as Response);

    // Verify the update was called with correct data
    expect(mockPrisma.schedule.update).toHaveBeenCalledWith({
      where: { id: 'schedule123' },
      data: {
        currentParticipants: 5, // 6 - 1 = 5
      },
    });
  });
});