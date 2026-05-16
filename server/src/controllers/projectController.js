import { z } from 'zod';
import prisma from '../config/prisma.js';
import { requireProjectAdmin, requireProjectMember } from '../utils/projectPermissions.js';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional().nullable(),
});

// @desc    Create a project
// @route   POST /api/projects
// @access  Private (Account ADMIN only)
export const createProject = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      res.status(403);
      throw new Error('Only admin accounts can create projects.');
    }

    const validatedData = projectSchema.parse(req.body);
    const { name, description } = validatedData;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        createdById: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors[0].message));
    }
    next(error);
  }
};

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res, next) => {
  try {
    // Account ADMIN sees ALL projects; MEMBER sees only projects they are in
    const whereClause =
      req.user.role === 'ADMIN'
        ? {}  // no filter — see everything
        : { members: { some: { userId: req.user.id } } };

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project details
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    // Account ADMIN can access any project; MEMBER must be a project member
    try {
      await requireProjectMember(projectId, req.user);
    } catch (err) {
      res.status(403);
      throw new Error('Not authorized to access this project');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Compute stats
    const now = new Date(new Date().setHours(0, 0, 0, 0));
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === 'DONE').length;
    const inProgressTasks = project.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const todoTasks = project.tasks.filter((t) => t.status === 'TODO').length;
    const overdueTasks = project.tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    ).length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      message: 'Project retrieved successfully',
      data: {
        ...project,
        stats: { totalTasks, completedTasks, inProgressTasks, todoTasks, overdueTasks, progressPercentage },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Project Admin or Account Admin)
export const updateProject = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const validatedData = projectSchema.parse(req.body);

    try {
      await requireProjectAdmin(projectId, req.user);
    } catch (err) {
      res.status(403);
      if (err.message === 'NOT_ADMIN') throw new Error('Not authorized as project admin');
      throw new Error('Not authorized to access this project');
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: validatedData,
    });

    res.status(200).json({ success: true, message: 'Project updated successfully', data: project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors[0].message));
    }
    if (error.code === 'P2025') {
      res.status(404);
      return next(new Error('Project not found'));
    }
    next(error);
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (Project Admin or Account Admin)
export const deleteProject = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    try {
      await requireProjectAdmin(projectId, req.user);
    } catch (err) {
      res.status(403);
      if (err.message === 'NOT_ADMIN') throw new Error('Not authorized as project admin');
      throw new Error('Not authorized to access this project');
    }

    await prisma.$transaction([
      prisma.task.deleteMany({ where: { projectId } }),
      prisma.projectMember.deleteMany({ where: { projectId } }),
      prisma.project.delete({ where: { id: projectId } }),
    ]);

    res.status(200).json({ success: true, message: 'Project deleted successfully', data: null });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404);
      return next(new Error('Project not found'));
    }
    next(error);
  }
};
