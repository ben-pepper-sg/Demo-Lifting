import { PrismaClient } from '@prisma/client';

// Create a dedicated Prisma client for integration tests
export const testPrisma = new PrismaClient();