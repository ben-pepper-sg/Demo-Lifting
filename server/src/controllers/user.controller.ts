import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../index';

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        maxBench: true,
        maxOHP: true,
        maxSquat: true,
        maxDeadlift: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return res.status(200).json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ error: 'Failed to get users' });
  }
};

// Get a single user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        maxBench: true,
        maxOHP: true,
        maxSquat: true,
        maxDeadlift: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
};

// Update a user's information
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, password, role, maxBench, maxOHP, maxSquat, maxDeadlift } = req.body;
    
    // Check if the authenticated user is updating their own profile or is an admin
    const isOwnProfile = req.user?.userId === id;
    const isAdmin = req.user?.role === 'ADMIN';
    
    // Only admins can update roles
    if (role && !isAdmin) {
      return res.status(403).json({ error: 'Only admins can update user roles' });
    }
    
    // Prepare data for update
    let updateData: any = {};
    
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (maxBench !== undefined) updateData.maxBench = maxBench;
    if (maxOHP !== undefined) updateData.maxOHP = maxOHP;
    if (maxSquat !== undefined) updateData.maxSquat = maxSquat;
    if (maxDeadlift !== undefined) updateData.maxDeadlift = maxDeadlift;
    if (isAdmin && role) updateData.role = role;
    
    // Hash password if provided
    if (password) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(password, saltRounds);
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        maxBench: true,
        maxOHP: true,
        maxSquat: true,
        maxDeadlift: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete a user (admin only)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Delete the user
    await prisma.user.delete({
      where: { id },
    });
    
    return res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};