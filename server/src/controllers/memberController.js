import { z } from 'zod';
import prisma from '../config/prisma.js';
import { requireProjectAdmin, requireProjectMember } from '../utils/projectPermissions.js';

const addMemberSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  userId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
}).refine(data => data.email || data.userId || (data.userIds && data.userIds.length > 0), {
  message: 'At least one of email, userId, or userIds must be provided',
});

// @desc    Get all members of a project
// @route   GET /api/projects/:projectId/members
// @access  Private
export const getProjectMembers = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    try {
      await requireProjectMember(projectId, req.user);
    } catch (err) {
      res.status(403);
      throw new Error('Not authorized to access this project');
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ success: true, message: 'Project members retrieved successfully', data: members });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member(s) to a project
// @route   POST /api/projects/:projectId/members
// @access  Private (Project Admin or Account Admin)
export const addProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const validatedData = addMemberSchema.parse(req.body);
    const { email, userId, userIds, role } = validatedData;

    try {
      await requireProjectAdmin(projectId, req.user);
    } catch (err) {
      res.status(403);
      if (err.message === 'NOT_ADMIN') throw new Error('Not authorized as project admin');
      throw new Error('Not authorized to access this project');
    }

    let targetUserIds = [];

    if (userIds && userIds.length > 0) {
      targetUserIds = [...userIds];
    } else if (userId) {
      targetUserIds.push(userId);
    } else if (email) {
      const userToAdd = await prisma.user.findUnique({ where: { email } });
      if (!userToAdd) {
        res.status(404);
        throw new Error(`User with email ${email} not found`);
      }
      targetUserIds.push(userToAdd.id);
    }

    const existingMembers = await prisma.projectMember.findMany({
      where: {
        projectId,
        userId: { in: targetUserIds },
      },
    });

    const existingUserIds = existingMembers.map(m => m.userId);
    const userIdsToAdd = targetUserIds.filter(id => !existingUserIds.includes(id));

    const skippedCount = targetUserIds.length - userIdsToAdd.length;

    if (userIdsToAdd.length === 0) {
      if (email || userId) {
        res.status(400);
        throw new Error('User is already a member of this project');
      }
      return res.status(200).json({ 
        success: true, 
        message: 'No new members added', 
        data: { addedCount: 0, skippedCount, members: [] } 
      });
    }

    const dataToInsert = userIdsToAdd.map(id => ({
      userId: id,
      projectId,
      role
    }));

    await prisma.projectMember.createMany({
      data: dataToInsert,
    });

    const newMembers = await prisma.projectMember.findMany({
      where: {
        projectId,
        userId: { in: userIdsToAdd },
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if ((email || userId) && (!userIds || userIds.length === 0)) {
      return res.status(201).json({ success: true, message: 'Member added successfully', data: newMembers[0] });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Members added successfully', 
      data: {
        addedCount: newMembers.length,
        skippedCount,
        members: newMembers
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors[0].message));
    }
    next(error);
  }
};

// @desc    Remove a member from a project
// @route   DELETE /api/projects/:projectId/members/:userId
// @access  Private (Project Admin or Account Admin)
export const removeProjectMember = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;

    try {
      await requireProjectAdmin(projectId, req.user);
    } catch (err) {
      res.status(403);
      if (err.message === 'NOT_ADMIN') throw new Error('Not authorized as project admin');
      throw new Error('Not authorized to access this project');
    }

    const memberToRemove = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    if (!memberToRemove) {
      res.status(404);
      throw new Error('Member not found in this project');
    }

    if (memberToRemove.role === 'ADMIN') {
      const adminCount = await prisma.projectMember.count({
        where: { projectId, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        res.status(400);
        throw new Error('Cannot remove the only project admin. Assign another admin first.');
      }
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } },
    });

    res.status(200).json({ success: true, message: 'Member removed successfully', data: null });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with project membership status
// @route   GET /api/projects/:projectId/available-users
// @access  Private (Project Admin or Account Admin)
export const getAvailableUsers = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { search } = req.query;

    try {
      await requireProjectAdmin(projectId, req.user);
    } catch (err) {
      res.status(403);
      if (err.message === 'NOT_ADMIN') throw new Error('Not authorized as project admin');
      throw new Error('Not authorized to access this project');
    }

    const whereClause = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        projectMemberships: {
          where: { projectId },
          select: { role: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const mappedUsers = users.map(u => {
      const isProjectMember = u.projectMemberships.length > 0;
      const projectRole = isProjectMember ? u.projectMemberships[0].role : null;
      const { projectMemberships, ...userData } = u;
      return {
        ...userData,
        isProjectMember,
        projectRole
      };
    });

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: mappedUsers,
    });
  } catch (error) {
    next(error);
  }
};

