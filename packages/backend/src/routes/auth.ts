// Authentication routes

import express, { type Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { loginSchema, registerSchema, forgotPasswordSchema } from '@farm-commons/shared';
import db from '../db/connection.js';
import { generateToken, authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { logAuthEvent } from '../middleware/auditLog.js';
import redis from '../lib/redis.js';

const router: Router = express.Router();

// Login
router.post('/login', async (req: AuthRequest, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await db('users').where({ email }).first();

    if (!user) {
      // Log failed login attempt
      await logAuthEvent('login_failed', req, undefined, { email, reason: 'user_not_found' });
      throw new AppError('Invalid credentials', 401);
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      // Log failed login attempt
      await logAuthEvent('login_failed', req, user.id, { email, reason: 'invalid_password' });
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      farm_id: user.farm_id,
    });

    // Log successful login
    await logAuthEvent('login', req, user.id, { email, role: user.role });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          farm_id: user.farm_id,
        },
        access_token: token,
        expires_in: 604_800, // 7 days in seconds
      },
    });
  } catch (error) {
    next(error);
  }
});

// Register
router.post('/register', async (req: AuthRequest, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db('users').where({ email: data.email }).first();

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const [user] = await db('users')
      .insert({
        email: data.email,
        password_hash: passwordHash,
        role: data.role,
        farm_id: data.farm_id,
      })
      .returning(['id', 'email', 'role', 'farm_id']);

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      farm_id: user.farm_id,
    });

    // Log user registration
    await logAuthEvent('login', req, user.id, {
      email: user.email,
      role: user.role,
      action: 'register',
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          farm_id: user.farm_id,
        },
        access_token: token,
        expires_in: 604_800,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', async (_req, res, next) => {
  try {
    // This would use authenticateToken middleware
    res.json({
      success: true,
      message: 'User profile endpoint - requires authentication',
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Check if the current token is blacklisted
    const tokenBlacklisted = await redis.get(
      `blacklist:${req.headers.authorization?.split(' ')[1]}`
    );
    if (tokenBlacklisted) {
      throw new AppError('Token has been revoked', 401);
    }

    // Fetch fresh user data from database
    const user = await db('users').where({ id: req.user.id }).first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate new token
    const newToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      farm_id: user.farm_id,
    });

    res.json({
      success: true,
      data: {
        access_token: newToken,
        expires_in: 604_800, // 7 days in seconds
      },
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('No token provided', 400);
    }

    // Add token to blacklist in Redis with expiration (7 days)
    await redis.setEx(`blacklist:${token}`, 604_800, 'true');

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Forgot password - initiate password reset
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Find user by email
    const user = await db('users').where({ email }).first();

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
      return;
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3_600_000); // 1 hour from now

    // Store reset token in database
    await db('password_reset_tokens').insert({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt,
      used: false,
    });

    // NOTE: Email functionality not yet implemented
    // In production, send an email here with:
    // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await emailService.sendPasswordResetEmail(user.email, resetLink);

    res.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
      // In development, include the token for testing
      ...(process.env.NODE_ENV === 'development' && { reset_token: resetToken }),
    });
  } catch (error) {
    next(error);
  }
});

// Reset password - complete password reset
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      throw new AppError('Token and new password are required', 400);
    }

    if (new_password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    // Find valid reset token
    const resetToken = await db('password_reset_tokens')
      .where({ token, used: false })
      .where('expires_at', '>', new Date())
      .first();

    if (!resetToken) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, 10);

    // Update user password
    await db('users').where({ id: resetToken.user_id }).update({ password_hash: passwordHash });

    // Mark token as used
    await db('password_reset_tokens').where({ id: resetToken.id }).update({ used: true });

    res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
