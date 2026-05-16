import { z } from 'zod';
import prisma from '../config/prisma.js';
import { requireProjectAdmin, requireProjectMember, getProjectMember } from '../utils/projectPermissions.js';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  assignedToId: z.string().uuid().optional().nullable(),
  assignedToIds: z.array(z.string().uuid()).optional(),
});

const memberUpdateTaskSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
});

// @desc    Create a task
// @route   POST /api/projects/:projectId/tasks
// @access  Private (Project Admin or Account Admin)
export const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const validatedData = taskSchema.parse(req.body);

    try {
      await requireProjectAdmin(projectId, req.user);
    } catch (err) {
      res.status(403);
      if (err.message === 'NOT_ADMIN') throw new Error('Not authorized as project admin');
      throw new Error('Not authorized to access this project');
    }

    const assignees = validatedData.assignedToIds || (validatedData.assignedToId ? [validatedData.assignedToId] : []);
    const uniqueAssignees = [...new Set(assignees)];

    if (uniqueAssignees.length > 0) {
      const existingMembers = await prisma.projectMember.findMany({
        where: { projectId, userId: { in: uniqueAssignees } },
      });
      const memberUserIds = existingMembers.map(m => m.userId);

      const validUsersCount = await prisma.user.count({
        where: { id: { in: uniqueAssignees } },
      });

      if (validUsersCount !== uniqueAssignees.length) {
        res.status(400);
        throw new Error('One or more assigned users do not exist');
      }

      const hasNonMember = uniqueAssignees.some(id => !memberUserIds.includes(id));
      if (hasNonMember && req.user.role !== 'ADMIN') {
        res.status(400);
        throw new Error('One or more selected users are not members of this project.');
      }
    }

    const { assignedToIds, assignedToId, ...taskData } = validatedData;
    const baseData = { ...taskData, projectId, createdById: req.user.id };

    if (uniqueAssignees.length > 1) {
      await prisma.$transaction(
        uniqueAssignees.map(id => prisma.task.create({
          data: { ...baseData, assignedToId: id }
        }))
      );
      
      const tasks = await prisma.task.findMany({
        where: { projectId, createdById: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: uniqueAssignees.length,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        }
      });

      return res.status(201).json({ 
        success: true, 
        message: 'Tasks created successfully', 
        data: { createdCount: uniqueAssignees.length, tasks } 
      });
    }

    const targetId = uniqueAssignees.length === 1 ? uniqueAssignees[0] : null;
    const task = await prisma.task.create({
      data: { ...baseData, assignedToId: targetId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Task created successfully', data: task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors[0].message));
    }
    next(error);
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Private
export const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    let effectiveRole;
    try {
      const result = await requireProjectMember(projectId, req.user);
      effectiveRole = result.role; // 'ADMIN' or 'MEMBER'
    } catch (err) {
      res.status(403);
      throw new Error('Not authorized to access this project');
    }

    const whereClause = { projectId };

    // Project-level MEMBER only sees their assigned tasks
    // Account-level ADMIN or project-level ADMIN sees all tasks
    if (effectiveRole === 'MEMBER') {
      whereClause.assignedToId = req.user.id;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, message: 'Tasks retrieved successfully', data: tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res, next) => {
  try {
    const taskId = req.params.id;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!task) { res.status(404); throw new Error('Task not found'); }

    let effectiveRole;
    try {
      const result = await requireProjectMember(task.projectId, req.user);
      effectiveRole = result.role;
    } catch (err) {
      res.status(403);
      throw new Error('Not authorized to access this project');
    }

    if (effectiveRole === 'MEMBER' && task.assignedToId !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to view this task. It is not assigned to you.');
    }

    res.status(200).json({ success: true, message: 'Task retrieved successfully', data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) { res.status(404); throw new Error('Task not found'); }

    let effectiveRole;
    try {
      const result = await requireProjectMember(task.projectId, req.user);
      effectiveRole = result.role;
    } catch (err) {
      res.status(403);
      throw new Error('Not authorized to access this project');
    }

    let updatedTask;

    if (effectiveRole === 'ADMIN') {
      const validatedData = taskSchema.partial().parse(req.body);

      if (validatedData.assignedToId) {
        const isMember = await prisma.projectMember.findUnique({
          where: { userId_projectId: { userId: validatedData.assignedToId, projectId: task.projectId } },
        });
        const targetUser = await prisma.user.findUnique({ where: { id: validatedData.assignedToId } });
        if (!targetUser) { res.status(400); throw new Error('Assigned user does not exist'); }
        if (!isMember && req.user.role !== 'ADMIN') {
          res.status(400);
          throw new Error('Assigned user must be a member of the project');
        }
      }

      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: validatedData,
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
      });
    } else {
      // MEMBER: can only update status of their own assigned task
      if (task.assignedToId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this task. It is not assigned to you.');
      }
      const validatedData = memberUpdateTaskSchema.parse(req.body);
      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { status: validatedData.status },
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
      });
    }

    res.status(200).json({ success: true, message: 'Task updated successfully', data: updatedTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors[0].message));
    }
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Project Admin or Account Admin)
export const deleteTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) { res.status(404); throw new Error('Task not found'); }

    try {
      await requireProjectAdmin(task.projectId, req.user);
    } catch (err) {
      res.status(403);
      if (err.message === 'NOT_ADMIN') throw new Error('Not authorized as project admin');
      throw new Error('Not authorized to access this project');
    }

    await prisma.task.delete({ where: { id: taskId } });

    res.status(200).json({ success: true, message: 'Task deleted successfully', data: null });
  } catch (error) {
    next(error);
  }
};
