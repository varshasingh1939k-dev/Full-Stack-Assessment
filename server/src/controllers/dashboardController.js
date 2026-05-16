import prisma from '../config/prisma.js';

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
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

    // Process user workloads
    let totalMembers = 0;
    let activeMembers = 0;
    let overloadedMembers = 0;
    let blockedOrAtRiskCount = 0;

    if (accountRole === 'ADMIN') {
      totalMembers = await prisma.user.count();
    }

    Object.values(tasksPerUserMap).forEach((u) => {
      activeMembers++;
      
      // Calculate completion rate
      u.completionRate = u.taskCount > 0 ? Math.round((u.completedTasks / u.taskCount) * 100) : 0;
      
      // Workload Level
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
