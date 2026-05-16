import prisma from '../config/prisma.js';

/**
 * Lookup the project-level membership record for a user.
 */
export const getProjectMember = async (projectId, userId) => {
  return await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
};

/**
 * Require the caller to have access to this project.
 * Account-level ADMINs always pass. Otherwise check ProjectMember.
 *
 * @param {string} projectId
 * @param {{ id: string, role: string }} user - full user object from req.user
 */
export const requireProjectMember = async (projectId, user) => {
  if (user.role === 'ADMIN') return { role: 'ADMIN' };   // account admin bypass
  const member = await getProjectMember(projectId, user.id);
  if (!member) throw new Error('NOT_MEMBER');
  return member;
};

/**
 * Require the caller to have project-admin access.
 * Account-level ADMINs always pass. Otherwise check ProjectMember.role === 'ADMIN'.
 *
 * @param {string} projectId
 * @param {{ id: string, role: string }} user - full user object from req.user
 */
export const requireProjectAdmin = async (projectId, user) => {
  if (user.role === 'ADMIN') return { role: 'ADMIN' };   // account admin bypass
  const member = await getProjectMember(projectId, user.id);
  if (!member) throw new Error('NOT_MEMBER');
  if (member.role !== 'ADMIN') throw new Error('NOT_ADMIN');
  return member;
};
