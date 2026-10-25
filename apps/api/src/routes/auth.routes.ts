import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/prisma';
import { CONFIG } from '../config';
import { validateRequest } from '../middleware/validate';
import { RegisterSchema, LoginSchema } from '@game-ai/validation';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRequest(RegisterSchema), async (req: Request, res: Response) => {
  const { username, email, password, displayName } = req.body;

  // Check if username or email already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { name: username }],
    },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'USER_ALREADY_EXISTS',
        message: existingUser.email === email ? 'Email is already registered' : 'Username is already taken',
      },
    });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name: username,
      email,
      passwordHash,
      role: 'PLAYER',
      profile: {
        create: {
          displayName,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
          currentDifficulty: 3, // Initial Medium difficulty
          totalGames: 0,
          totalScore: 0,
        },
      },
    },
    include: {
      profile: true,
    },
  });

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    CONFIG.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    },
  });
});

// POST /api/auth/login
router.post('/login', validateRequest(LoginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    CONFIG.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    },
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
  }

  return res.status(200).json({
    success: true,
    data: user,
  });
});

export default router;
