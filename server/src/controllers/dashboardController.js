import prisma from '../config/prisma.js';

const cache = new Map();

const getCacheKey = (req, prefix) => {
  return `${prefix}_${req.user.id}_${req.user.role}_${req.query.from || ''}_${req.query.to || ''}`;
};

const getCached = (key) => {
  const item = cache.get(key);
  if (item && item.expiry > Date.now()) return item.data;
  if (item) cache.delete(key);
  return null;
};

const setCached = (key, data) => {
  cache.set(key, { data, expiry: Date.now() + 60000 });
};

const getBaseWhere = (req) => {
  const { id: userId, role: accountRole } = req.user;
  const where = {};
  if (accountRole !== 'ADMIN') {
    where.assignedToId = userId;
  }
  if (req.query.from || req.query.to) {
    where.createdAt = {};
    if (req.query.from) where.createdAt.gte = new Date(req.query.from);
    if (req.query.to) where.createdAt.lte = new Date(req.query.to);
  }
  return where;
};

export const getDashboardSummary = async (req, res) => {
  try {
    const cacheKey = getCacheKey(req, 'summary');
    const cached = getCached(cacheKey);
    if (cached) return res.json({ data: cached, error: null });

    const where = getBaseWhere(req);
    const tasks = await prisma.task.findMany({ where });
    
    const now = new Date();
    let totalTasks = tasks.length;
    let openTasks = 0;
    let inProgressTasks = 0;
    let completedTasks = 0;
    let overdueCount = 0;

    tasks.forEach(t => {
      if (t.status === 'TODO') openTasks++;
      if (t.status === 'IN_PROGRESS') inProgressTasks++;
      if (t.status === 'DONE') completedTasks++;
      if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE') overdueCount++;
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const data = { totalTasks, openTasks, inProgressTasks, completedTasks, overdueCount, completionRate };
    setCached(cacheKey, data);
    res.json({ data, error: null });
  } catch (error) {
    res.json({ data: null, error: error.message });
  }
};

export const getDashboardByStatus = async (req, res) => {
  try {
    const cacheKey = getCacheKey(req, 'bystatus');
    const cached = getCached(cacheKey);
    if (cached) return res.json({ data: cached, error: null });

    const where = getBaseWhere(req);
    const tasks = await prisma.task.findMany({ where, select: { status: true } });
    
    const total = tasks.length;
    const counts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    tasks.forEach(t => counts[t.status]++);

    const statuses = [
      { label: 'To Do', count: counts.TODO, percent: total > 0 ? Math.round((counts.TODO/total)*100) : 0, code: 'TODO' },
      { label: 'In Progress', count: counts.IN_PROGRESS, percent: total > 0 ? Math.round((counts.IN_PROGRESS/total)*100) : 0, code: 'IN_PROGRESS' },
      { label: 'Done', count: counts.DONE, percent: total > 0 ? Math.round((counts.DONE/total)*100) : 0, code: 'DONE' },
    ];

    const data = { statuses };
    setCached(cacheKey, data);
    res.json({ data, error: null });
  } catch (error) {
    res.json({ data: null, error: error.message });
  }
};

export const getDashboardByUser = async (req, res) => {
  try {
    const cacheKey = getCacheKey(req, 'byuser');
    const cached = getCached(cacheKey);
    if (cached) return res.json({ data: cached, error: null });

    const where = getBaseWhere(req);
    
    const tasks = await prisma.task.findMany({ 
      where, 
      include: { assignedTo: true }
    });

    const userMap = {};
    const now = new Date();

    tasks.forEach(t => {
      if (!t.assignedTo) return;
      const uid = t.assignedTo.id;
      if (!userMap[uid]) {
        userMap[uid] = {
          id: uid,
          name: t.assignedTo.name,
          avatarUrl: null,
          assigned: 0,
          completed: 0,
          overdue: 0
        };
      }
      userMap[uid].assigned++;
      if (t.status === 'DONE') userMap[uid].completed++;
      if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE') userMap[uid].overdue++;
    });

    const data = { users: Object.values(userMap).sort((a,b) => b.assigned - a.assigned) };
    setCached(cacheKey, data);
    res.json({ data, error: null });
  } catch (error) {
    res.json({ data: null, error: error.message });
  }
};

export const getDashboardOverdue = async (req, res) => {
  try {
    const cacheKey = getCacheKey(req, 'overdue');
    const cached = getCached(cacheKey);
    if (cached) return res.json({ data: cached, error: null });

    const where = getBaseWhere(req);
    const now = new Date();
    where.dueDate = { lt: now };
    where.status = { not: 'DONE' };

    const overdueTasks = await prisma.task.findMany({
      where,
      include: {
        project: true,
        assignedTo: true
      }
    });

    const tasks = overdueTasks.map(t => {
      const diffTime = Math.abs(now - new Date(t.dueDate));
      const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        id: t.id,
        title: t.title,
        projectName: t.project?.name || 'Unknown',
        assignee: t.assignedTo?.name || 'Unassigned',
        dueDate: t.dueDate,
        daysLate,
        priority: t.priority
      };
    }).sort((a, b) => b.daysLate - a.daysLate);

    const data = { tasks };
    setCached(cacheKey, data);
    res.json({ data, error: null });
  } catch (error) {
    res.json({ data: null, error: error.message });
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const { id: userId, role: accountRole } = req.user;
    const now = new Date(new Date().setHours(0, 0, 0, 0));

    let totalProjects;
    let tasks;

    if (accountRole === 'ADMIN') {
      totalProjects = await prisma.project.count();
      tasks = await prisma.task.findMany({
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          project: { select: { name: true } },
        },
      });
    } else {
      totalProjects = await prisma.project.count({
        where: { members: { some: { userId } } },
      });
      tasks = await prisma.task.findMany({
        where: { assignedToId: userId },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          project: { select: { name: true } },
        },
      });
    }

    let totalTasks = tasks.length;
    let assignedTasks = 0;
    let overdueTasks = 0;
    let unassignedTasks = 0;
    let highPriorityOpenTasks = 0;
    let overdueTaskList = [];

    const tasksByStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    const tasksByPriority = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    const tasksPerUserMap = {};

    for (const task of tasks) {
      if (task.assignedToId === userId) assignedTasks++;
      
      const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'DONE';
      if (isOverdue) {
        overdueTasks++;
        overdueTaskList.push({
          id: task.id,
          title: task.title,
          projectName: task.project?.name || 'Unknown Project',
          dueDate: task.dueDate,
          priority: task.priority,
          status: task.status,
        });
      }

      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;

      if (task.priority === 'HIGH' && task.status !== 'DONE') {
        highPriorityOpenTasks++;
      }

      if (!task.assignedToId) {
        unassignedTasks++;
      }

      if (task.assignedTo) {
        const uid = task.assignedTo.id;
        if (!tasksPerUserMap[uid]) {
          tasksPerUserMap[uid] = {
            userId: uid,
            name: task.assignedTo.name,
            email: task.assignedTo.email,
            taskCount: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            overdueTasks: 0,
            highPriorityTasks: 0,
            workloadLevel: 'No Tasks',
            completionRate: 0,
          };
        }
        
        const uStats = tasksPerUserMap[uid];
        uStats.taskCount++;
        if (task.status === 'DONE') uStats.completedTasks++;
        if (task.status === 'IN_PROGRESS') uStats.inProgressTasks++;
        if (task.priority === 'HIGH' && task.status !== 'DONE') uStats.highPriorityTasks++;
        if (isOverdue) uStats.overdueTasks++;
      }
    }

    let totalMembers = 0;
    let activeMembers = 0;
    let overloadedMembers = 0;
    let blockedOrAtRiskCount = 0;

    if (accountRole === 'ADMIN') {
      totalMembers = await prisma.user.count();
    }

    Object.values(tasksPerUserMap).forEach((u) => {
      activeMembers++;
      
      u.completionRate = u.taskCount > 0 ? Math.round((u.completedTasks / u.taskCount) * 100) : 0;
      
      const openTasks = u.taskCount - u.completedTasks;
      if (openTasks === 0) u.workloadLevel = 'No Tasks';
      else if (openTasks <= 2) u.workloadLevel = 'Light';
      else if (openTasks <= 5) u.workloadLevel = 'Balanced';
      else if (openTasks <= 8) u.workloadLevel = 'Heavy';
      else u.workloadLevel = 'Overloaded';

      if (u.workloadLevel === 'Overloaded') overloadedMembers++;
      if (u.overdueTasks > 0 || u.highPriorityTasks > 0 || ['Heavy', 'Overloaded'].includes(u.workloadLevel)) {
        blockedOrAtRiskCount++;
      }
    });

    const workloadDistribution = Object.values(tasksPerUserMap).sort((a, b) => b.taskCount - a.taskCount);

    let riskMessage = 'No major delivery risks detected.';
    if (overdueTasks > 0) riskMessage = `${overdueTasks} overdue task${overdueTasks === 1 ? '' : 's'} need attention.`;
    else if (highPriorityOpenTasks > 0) riskMessage = 'High priority work is currently open.';
    else if (overloadedMembers > 0) riskMessage = 'Some team members are overloaded with tasks.';

    const teamPerformance = {
      totalMembers,
      activeMembers,
      overloadedMembers,
      unassignedTasks,
      workloadDistribution,
      riskSummary: {
        overdueTasks,
        highPriorityOpenTasks,
        blockedOrAtRiskCount,
        message: riskMessage
      }
    };

    overdueTaskList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    overdueTaskList = overdueTaskList.slice(0, 5);

    const completionRate = totalTasks > 0 ? Math.round(((tasksByStatus.DONE || 0) / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      message: 'Dashboard stats fetched successfully',
      data: {
        totalProjects,
        totalTasks,
        assignedTasks,
        overdueTasks,
        tasksByStatus,
        tasksByPriority,
        tasksPerUser: workloadDistribution,
        teamPerformance,
        overdueTaskList,
        completionRate
      },
    });
  } catch (error) {
    next(error);
  }
};
