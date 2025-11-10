// Fields routes

import express from 'express';
import db from '../db/connection.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Get all fields for a farm
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;

    const fields = await db('fields')
      .where({ farm_id: farmId })
      .orderBy('name', 'asc');

    res.json({
      success: true,
      data: fields,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
