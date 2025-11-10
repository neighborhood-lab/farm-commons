// Authentication routes

import express from 'express';
import bcrypt from 'bcrypt';
import { loginSchema, registerSchema } from '@farm-commons/shared';
import db from '../db/connection.js';
import { generateToken, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { logAuthEvent } from '../middleware/auditLog.js';

const router = express.Router();

// Login
router.post('/login', async (req: AuthRequest, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await db('users')
      .where({ email })
      .first();

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
        expires_in: 604800, // 7 days in seconds
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
    const existingUser = await db('users')
      .where({ email: data.email })
      .first();

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
    await logAuthEvent('login', req, user.id, { email: user.email, role: user.role, action: 'register' });

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
        expires_in: 604800,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', async (req, res, next) => {
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

export default router;
