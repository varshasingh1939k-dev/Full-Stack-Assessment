import { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, LayoutGrid, Plus, RefreshCw, ChevronRight } from 'lucide-react';
import api from '../api/axios';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSidebarData = async () => {
    try {
      setLoading(true);
      const [dashRes, projRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/projects')
      ]);
      setStats(dashRes.data.data);
      setProjects(projRes.data.data.slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSidebarData();
    }
  }, [user]);

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
  ];

  const isActive = (path) => location.pathname === path || (path === '/projects' && location.pathname.startsWith('/projects'));

  return (
    <div className="hidden sm:flex flex-col w-[260px] h-screen bg-slate-950/95 backdrop-blur-xl border-r border-white/10 shadow-2xl z-40 relative flex-shrink-0">
      
      {/* Header & Logo */}
      <div className="p-6 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
        <Link to="/dashboard" className="flex items-center gap-3 group relative z-10">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all group-hover:scale-105 border border-white/10">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[15px] font-extrabold text-white tracking-wide group-hover:text-blue-400 transition-colors block leading-tight">
              Task Manager
            </span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Admin Workspace' : 'Member Workspace'}
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-6 space-y-8">
        
        {/* Main Menu */}
        <div className="px-4">
          <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Menu</p>
          <div className="space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 relative group overflow-hidden ${
                    active
                      ? 'text-white bg-blue-500/10 border border-blue-500/20 shadow-sm'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-violet-500 rounded-r-full" />}
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        {isAdmin && (
          <div className="px-4">
            <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Actions</p>
            <div className="space-y-1">
              <Link to="/projects" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all group">
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                Create Project
              </Link>
            </div>
          </div>
        )}

        {/* Recent Projects */}
        <div className="px-4">
          <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Recent</p>
          <div className="space-y-1">
            {loading && projects.length === 0 ? (
               <div className="px-3 py-2 text-[12px] text-slate-500">Loading...</div>
            ) : projects.length > 0 ? (
              projects.map(p => (
                <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group text-[13px] font-semibold text-slate-300 hover:text-white">
                  <div className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.5)] flex-shrink-0" />
                  <span className="truncate">{p.name}</span>
                </Link>
              ))
            ) : (
              <div className="px-3 py-2">
                <p className="text-[12px] font-medium text-slate-500">
                  {isAdmin ? 'No projects yet' : 'No assigned projects'}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* User Footer - Minimal Sign Out Only */}
      <div className="p-4 border-t border-white/5 bg-white/[0.01]">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors border border-transparent hover:border-rose-500/20"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
