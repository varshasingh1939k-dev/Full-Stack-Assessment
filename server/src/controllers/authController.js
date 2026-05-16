import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import generateToken from '../utils/generateToken.js';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res, next) => {
  try {
    const validatedData = signupSchema.parse(req.body);
    const { name, email, password, role } = validatedData;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      res.status(400);
      throw new Error('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    const token = generateToken(res, user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors[0].message));
    }
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(res, user.id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token,
        },
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors[0].message));
    }
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = req.user;

    if (user) {
      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};
