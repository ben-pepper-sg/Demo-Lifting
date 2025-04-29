import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
      },
    });

    // Create and sign JWT token
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
    const options: SignOptions = { expiresIn };
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      options
    );

    // Return user data without password
    const { passwordHash: _, ...userData } = newUser;
    
    return res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
};

// Admin function to create a new user
export const adminCreateUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user with optional role
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || 'USER', // Default to USER if not specified
      },
    });

    // Return user data without password
    const { passwordHash: _, ...userData } = newUser;
    
    return res.status(201).json({
      message: 'User created successfully',
      user: userData,
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create and sign JWT token
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
    const options: SignOptions = { expiresIn };
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      options
    );

    // Return user data without password
    const { passwordHash: _, ...userData } = user;
    
    return res.status(200).json({
      message: 'Login successful',
      user: userData,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // User ID should be available from the auth middleware
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data without password
    const { passwordHash: _, ...userData } = user;
    
    return res.status(200).json({
      user: userData,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to get user data' });
  }
};

// Request a password reset
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // In a real application, we would send an email here with the reset link
    // For this demo, we'll just return the token (in production, you would NOT return this)
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    // Import the email service here to avoid circular dependencies
    const { sendPasswordResetEmail } = await import('../services/email');
    await sendPasswordResetEmail(user.email, resetToken, resetUrl);
    
    console.log(`Reset token for ${user.email}: ${resetToken}`); // For development purposes

    return res.status(200).json({ 
      message: 'If a user with that email exists, a password reset link has been sent.',
      // Only return the token and resetUrl in development environment
      ...(process.env.NODE_ENV !== 'production' ? {
        resetToken,
        resetUrl: `${process.env.CLIENT_URL}/reset-password/${resetToken}`
      } : {})
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

// Reset the password using token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    // Find user with this token and token not expired
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token not expired
        }
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user with new password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
};