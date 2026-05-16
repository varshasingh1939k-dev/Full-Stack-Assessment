import { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { CheckSquare, AlertTriangle, Users, LayoutGrid, RefreshCw, Info, Clock, Calendar, ChevronRight, Search, X } from 'lucide-react';
import { Card, EmptyState, LoadingState, Alert, Avatar, Badge } from '../components/ui';

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Calculate days late
const getDaysLate = (dueDate) => {
  if (!dueDate) return 0;
  const now = new Date(new Date().setHours(0, 0, 0, 0));
  const due = new Date(dueDate);
  const diffTime = Math.abs(now - due);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};



const ProgressRow = ({ label, count, total, colorClass }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-24 text-[13px] font-bold text-slate-300 flex-shrink-0 group-hover:text-white transition-colors">{label}</div>
      <div className="flex-1 bg-slate-800/80 rounded-full h-3 overflow-hidden shadow-inner relative border border-white/5">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-16 text-right flex-shrink-0 flex items-center justify-end gap-2">
        <span className="text-[15px] font-black text-white">{count}</span>
        <span className="text-[11px] font-bold text-slate-500 w-8 text-left">{pct}%</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN';
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Tasks per user filter state
  const [userSearch, setUserSearch] = useState('');
  const [userWorkloadFilter, setUserWorkloadFilter] = useState('ALL');
  const [userSort, setUserSort] = useState('MOST_TASKS');

  const fetchDashboard = () => {
    setRefreshing(true);
    api.get('/dashboard')
      .then(({ data }) => setStats(data.data))
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!stats || !stats.tasksPerUser) return [];
    let result = [...stats.tasksPerUser];

    if (userSearch.trim()) {
      const term = userSearch.toLowerCase();
      result = result.filter(u => 
        u.name?.toLowerCase().includes(term) || 
        u.email?.toLowerCase().includes(term)
      );
    }

    if (userWorkloadFilter !== 'ALL') {
      result = result.filter(u => {
        const openTasks = u.taskCount - (u.completedTasks || 0);
        let wl = 'NO_TASKS';
        if (openTasks > 0 && openTasks <= 2) wl = 'LIGHT';
        else if (openTasks <= 5) wl = 'BALANCED';
        else if (openTasks <= 8) wl = 'HEAVY';
        else if (openTasks > 8) wl = 'OVERLOADED';
        return wl === userWorkloadFilter;
      });
    }

    result.sort((a, b) => {
      if (userSort === 'MOST_TASKS') return b.taskCount - a.taskCount;
      if (userSort === 'FEWEST_TASKS') return a.taskCount - b.taskCount;
      if (userSort === 'HIGHEST_COMPLETION') {
        const pctA = a.taskCount > 0 ? (a.completedTasks || 0)/a.taskCount : 0;
        const pctB = b.taskCount > 0 ? (b.completedTasks || 0)/b.taskCount : 0;
        return pctB - pctA;
      }
      if (userSort === 'MOST_OVERDUE') {
         return (b.overdueTasks || 0) - (a.overdueTasks || 0);
      }
      return 0;
    });

    return result;
  }, [stats, userSearch, userWorkloadFilter, userSort]);

  if (loading) return <LoadingState label="Loading Dashboard..." />;
  if (error || !stats) return (
    <div className="mt-8 max-w-2xl mx-auto">
      <Alert variant="error" className="bg-slate-900 border-white/10 text-white">
        <div className="flex flex-col items-start gap-3">
          <span>Unable to load dashboard. Please try again.</span>
          <button onClick={fetchDashboard} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors">Retry</button>
        </div>
      </Alert>
    </div>
  );

  const { totalTasks, overdueTasks, tasksByStatus, tasksPerUser, overdueTaskList, completionRate } = stats;

  const todoTasks = tasksByStatus?.TODO || 0;
  const inProgressTasks = tasksByStatus?.IN_PROGRESS || 0;
  const doneTasks = tasksByStatus?.DONE || 0;


  return (
    <div className="space-y-8 animate-in pb-12 bg-slate-950 min-h-screen">
      
      {/* 1. Header Section */}
      <div className="relative pb-6 border-b border-white/10 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Dashboard</h1>
              <Badge variant={isAdmin ? 'admin' : 'member'} className="bg-slate-800 text-slate-200 border-slate-700">
                {isAdmin ? 'Workspace Dashboard' : 'My Task Dashboard'}
              </Badge>
            </div>
            <p className="text-[15px] text-slate-400 font-medium max-w-2xl">
              {isAdmin 
                ? 'Workspace overview of total tasks, team workload, task status, and overdue risks.' 
                : 'Your assigned tasks, progress, and overdue work.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchDashboard} 
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-slate-300 transition-all hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium text-sm">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* NEW TOP DASHBOARD LAYOUT */}
      <div>
        <h2 className="text-[18px] font-extrabold text-white mb-5 tracking-tight">
          {isAdmin ? 'Workspace Summary' : 'My Task Summary'}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Left: Total Tasks with Donut */}
          <div 
            onClick={() => navigate('/projects')}
            className="col-span-1 sm:col-span-2 bg-slate-900/90 border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group cursor-pointer hover:-translate-y-1 hover:border-white/20 transition-all duration-300"
          >
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">View projects <ChevronRight className="w-3 h-3" /></span>
            </div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-blue-400/20 transition-all duration-700" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-[13px] font-bold text-slate-400 tracking-wider uppercase mb-1">Total Tasks</p>
                <p className="text-[12px] text-slate-500 font-medium mb-6">{isAdmin ? 'All tracked tasks in this workspace' : 'All assigned tasks tracked for you'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center shadow-inner">
                <CheckSquare className="w-5 h-5 text-cyan-400" />
              </div>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6 mt-2">
              <div className="relative w-28 h-28 flex-shrink-0 mx-auto sm:mx-0">
                <svg viewBox="0 0 80 80" className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="transparent" strokeWidth="12" className="stroke-slate-800" />
                  {totalTasks > 0 && (
                    <>
                      <circle cx="40" cy="40" r="32" fill="transparent" strokeWidth="12" className="stroke-blue-500 transition-all duration-1000" strokeDasharray={`${(todoTasks/totalTasks) * 201} 201`} strokeDashoffset={0} strokeLinecap="round" />
                      <circle cx="40" cy="40" r="32" fill="transparent" strokeWidth="12" className="stroke-amber-500 transition-all duration-1000" strokeDasharray={`${(inProgressTasks/totalTasks) * 201} 201`} strokeDashoffset={-((todoTasks/totalTasks) * 201)} strokeLinecap="round" />
                      <circle cx="40" cy="40" r="32" fill="transparent" strokeWidth="12" className="stroke-emerald-500 transition-all duration-1000" strokeDasharray={`${(doneTasks/totalTasks) * 201} 201`} strokeDashoffset={-(((todoTasks+inProgressTasks)/totalTasks) * 201)} strokeLinecap="round" />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[22px] font-black text-white leading-none">{totalTasks}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Tasks</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-3.5 w-full">
                <div className="flex items-center justify-between text-[13px] font-bold">
                  <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" /><span className="text-slate-300">To Do</span></div>
                  <span className="text-white">{todoTasks} <span className="text-[11px] text-slate-500 font-medium ml-2">{totalTasks > 0 ? Math.round(todoTasks/totalTasks*100) : 0}%</span></span>
                </div>
                <div className="flex items-center justify-between text-[13px] font-bold">
                  <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" /><span className="text-slate-300">In Progress</span></div>
                  <span className="text-white">{inProgressTasks} <span className="text-[11px] text-slate-500 font-medium ml-2">{totalTasks > 0 ? Math.round(inProgressTasks/totalTasks*100) : 0}%</span></span>
                </div>
                <div className="flex items-center justify-between text-[13px] font-bold">
                  <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /><span className="text-slate-300">Done</span></div>
                  <span className="text-white">{doneTasks} <span className="text-[11px] text-slate-500 font-medium ml-2">{totalTasks > 0 ? Math.round(doneTasks/totalTasks*100) : 0}%</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Overdue Risk */}
          <div 
            onClick={() => {
              document.getElementById('overdue-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`col-span-1 bg-slate-900/90 border border-white/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xl hover:-translate-y-1 hover:border-white/20 transition-all duration-300 cursor-pointer group ${overdueTasks > 0 ? 'shadow-rose-900/10' : ''}`}
          >
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity"><span className={`text-[11px] font-bold flex items-center gap-1 ${overdueTasks > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>View overdue tasks <ChevronRight className="w-3 h-3" /></span></div>
            {overdueTasks > 0 && <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-500/10 rounded-full blur-[30px] pointer-events-none" />}
            
            <div className="relative z-10">
              <h3 className="text-[14px] font-bold text-slate-300 tracking-tight mb-0.5">Overdue Risk</h3>
              <p className={`text-[12px] font-bold mb-6 ${overdueTasks > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {overdueTasks > 0 ? 'Needs attention' : 'On Track'}
              </p>
            </div>
            
            <div className="relative z-10 mt-auto flex items-end justify-between">
              <span className={`text-[40px] leading-none font-black ${overdueTasks > 0 ? 'text-rose-400' : 'text-white'}`}>{overdueTasks}</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${overdueTasks > 0 ? 'bg-rose-500/20 border-rose-500/20 text-rose-400' : 'bg-emerald-500/20 border-emerald-500/20 text-emerald-400'}`}>
                {overdueTasks > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
              </div>
            </div>
          </div>

          {/* Right: Completion */}
          <div 
            onClick={() => document.getElementById('tasks-per-user-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="col-span-1 bg-slate-900/90 border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden cursor-pointer hover:-translate-y-1 hover:border-white/20 transition-all duration-300 group"
          >
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">View team <ChevronRight className="w-3 h-3" /></span></div>
            <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-cyan-500/10 rounded-full blur-[30px] pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-[14px] font-bold text-slate-300 tracking-tight mb-0.5">Completion</h3>
              <p className="text-[12px] text-slate-500 font-medium mb-6">Percentage of work done</p>
            </div>
            
            <div className="relative z-10 mt-auto flex items-center justify-between">
              <span className="text-[40px] leading-none font-black text-white">{completionRate}%</span>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center shadow-inner text-cyan-400">
                <LayoutGrid className="w-5 h-5" />
              </div>
            </div>
            <div className="w-full bg-slate-800 h-1.5 mt-5 rounded-full overflow-hidden shadow-inner border border-white/5">
              <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 mt-8">
        
        {/* 3. Tasks by Status Section */}
        <Card className="flex flex-col overflow-hidden bg-slate-900/90 border-white/10 backdrop-blur-md">
          <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-white tracking-tight">Tasks by Status</h2>
              <p className="text-[12px] font-medium text-slate-400">Track task progress across To Do, In Progress, and Done.</p>
            </div>
          </div>
          <div className="p-6 md:p-8">
            {totalTasks === 0 ? (
              <EmptyState icon={LayoutGrid} title="No tasks yet." description="Create tasks inside a project to start tracking progress." />
            ) : (
              <div className="flex flex-col space-y-7 max-w-3xl">
                <ProgressRow label="To Do" count={todoTasks} total={totalTasks} colorClass="bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                <ProgressRow label="In Progress" count={inProgressTasks} total={totalTasks} colorClass="bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                <ProgressRow label="Done" count={doneTasks} total={totalTasks} colorClass="bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
              </div>
            )}
          </div>
        </Card>

        <div id="overdue-section" />
        <Card className="flex flex-col overflow-hidden bg-slate-900/85 border-white/10 backdrop-blur-md">
          <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${overdueTasks > 0 ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-slate-400 border-white/10'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-white tracking-tight">Overdue Tasks</h2>
              <p className="text-[12px] font-medium text-slate-400">Tasks past their due date and still not completed.</p>
            </div>
          </div>
          <div className="p-0 flex-1 overflow-y-auto max-h-[300px]">
            {overdueTasks === 0 ? (
              <div className="p-6 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mx-auto mb-3 shadow-inner">
                    <CheckSquare className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-[14px] font-bold text-slate-200">No overdue tasks.</p>
                  <p className="text-[12px] text-slate-500 mt-1">Your workspace is on track.</p>
                </div>
              </div>
            ) : (!overdueTaskList || overdueTaskList.length === 0) ? (
              <div className="p-6">
                <div className="text-center py-6">
                  <p className="text-[24px] font-extrabold text-rose-400 mb-2">{overdueTasks} Overdue</p>
                  <p className="text-sm text-slate-400">Open project boards to review overdue items.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {overdueTaskList.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => {
                      if (task.projectId) {
                        navigate(`/projects/${task.projectId}`);
                      }
                    }}
                    className={`p-4 hover:bg-white/[0.02] transition-colors group flex items-start gap-4 ${task.projectId ? 'cursor-pointer hover:bg-slate-800/50' : ''}`}
                  >
                    <div className="mt-1">
                      <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-[14px] font-bold text-slate-200 truncate transition-colors ${task.projectId ? 'group-hover:text-rose-300' : ''}`}>{task.title}</h4>
                        <Badge variant="danger" className="text-[10px] py-0 px-1.5 h-4.5 bg-rose-500/20 text-rose-400 border-rose-500/30 shrink-0">
                          {getDaysLate(task.dueDate)}d late
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[12px] text-slate-500 font-medium">
                        <span className="truncate">{task.projectName}</span>
                        <span className="flex items-center gap-1 shrink-0"><Calendar className="w-3 h-3" /> {formatDate(task.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700 text-slate-300">{task.priority}</Badge>
                      {task.projectId && (
                        <span className="text-[11px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1">Open project <ChevronRight className="w-3 h-3" /></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* 4. Tasks per User */}
        <div id="tasks-per-user-section" />
        <Card className="flex flex-col overflow-hidden bg-slate-900/85 border-white/10 backdrop-blur-md">
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-white tracking-tight">Tasks per User</h2>
                <p className="text-[12px] font-medium text-slate-400">See how work is distributed across team members.</p>
              </div>
            </div>
            <div className="text-[12px] text-slate-400 font-medium">
              {userSearch || userWorkloadFilter !== 'ALL' || userSort !== 'MOST_TASKS' ? `Showing ${filteredUsers.length} of ${tasksPerUser.length} users` : `${tasksPerUser?.length || 0} users`}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                className="block w-full pl-9 pr-8 py-2 text-[12px] bg-slate-900 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white placeholder-slate-500"
                placeholder="Search users by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
              />
              {userSearch && (
                <button onClick={() => setUserSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={userWorkloadFilter} onChange={e => setUserWorkloadFilter(e.target.value)}
              className="px-3 py-2 text-[12px] font-medium bg-slate-900 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer text-white"
            >
              <option value="ALL">All workloads</option>
              <option value="NO_TASKS">No Tasks</option>
              <option value="LIGHT">Light</option>
              <option value="BALANCED">Balanced</option>
              <option value="HEAVY">Heavy</option>
              <option value="OVERLOADED">Overloaded</option>
            </select>
            <select
              value={userSort} onChange={e => setUserSort(e.target.value)}
              className="px-3 py-2 text-[12px] font-medium bg-slate-900 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer text-white"
            >
              <option value="MOST_TASKS">Most tasks</option>
              <option value="FEWEST_TASKS">Fewest tasks</option>
              <option value="HIGHEST_COMPLETION">Highest completion</option>
              <option value="MOST_OVERDUE">Most overdue</option>
            </select>
            {(userSearch || userWorkloadFilter !== 'ALL' || userSort !== 'MOST_TASKS') && (
              <button 
                onClick={() => { setUserSearch(''); setUserWorkloadFilter('ALL'); setUserSort('MOST_TASKS'); }} 
                className="text-[12px] text-rose-400 hover:text-rose-300 font-bold px-3 py-2 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
        
        {filteredUsers.length === 0 ? (
          <div className="p-8">
            {tasksPerUser && tasksPerUser.length > 0 ? (
              <EmptyState icon={Users} title="No matching users found" description="Try adjusting your search or workload filter." />
            ) : (
              <EmptyState icon={Users} title="No assigned tasks yet." description="Tasks per user will appear when tasks are assigned." />
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5 overflow-x-auto">
            {filteredUsers.map(u => {
              let badgeStyle = "bg-slate-800 text-slate-400 border-slate-700";
              const openTasks = u.taskCount - u.completedTasks;
              let workloadLabel = "No Tasks";
              
              if (openTasks === 0) {
                 workloadLabel = "No Tasks";
                 badgeStyle = "bg-slate-800 text-slate-400 border-slate-700";
              } else if (openTasks <= 2) {
                 workloadLabel = "Light";
                 badgeStyle = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
              } else if (openTasks <= 5) {
                 workloadLabel = "Balanced";
                 badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
              } else if (openTasks <= 8) {
                 workloadLabel = "Heavy";
                 badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
              } else {
                 workloadLabel = "Overloaded";
                 badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20";
              }

              const userPct = totalTasks > 0 ? Math.round((u.taskCount / totalTasks) * 100) : 0;

              return (
                <div key={u.userId} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors group gap-4 relative min-w-[600px]">
                  <div className="flex items-center gap-4 w-[220px] flex-shrink-0">
                    <Avatar name={u.name} size="md" className="ring-2 ring-indigo-500/20" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-slate-200 group-hover:text-white transition-colors truncate">{u.name}</p>
                      <p className="text-[12px] font-medium text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex-1 w-full max-w-[250px] space-y-1.5 px-4 hidden md:block">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-slate-400">Share of Total Tasks</span>
                      <span className="text-slate-300">{userPct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5 shadow-inner">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ width: `${userPct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-between w-full sm:w-auto">
                    <div className="flex flex-col items-center w-16">
                      <span className="text-[18px] font-bold text-white">{u.taskCount}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">Tasks</span>
                    </div>
                    
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold border w-28 justify-center flex-shrink-0 ${badgeStyle}`}>
                      {workloadLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </Card>
      </div>
      
    </div>
  );
};

export default Dashboard;
