import { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, Menu, X, LayoutGrid, Plus, RefreshCw } from 'lucide-react';
import { Avatar } from './ui';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
  ];

  const isActive = (path) => location.pathname === path || (path === '/projects' && location.pathname.startsWith('/projects'));

  let pageTitle = 'Overview';
  if (location.pathname.startsWith('/projects')) pageTitle = 'Projects';
  if (location.pathname.startsWith('/dashboard')) pageTitle = 'Dashboard';

  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-xl border-b border-white/10 shadow-sm transition-all h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      
      <div className="hidden sm:flex items-center gap-2">
        <h1 className="text-lg font-bold text-white">{pageTitle}</h1>
      </div>

      <div className="sm:hidden flex items-center justify-between w-full">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 shadow-md">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <span className="text-[14px] font-extrabold text-white tracking-wide">
            Task Manager
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-400 hover:bg-white/5 transition-colors focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="hidden sm:flex items-center gap-4">
         <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/85 border border-white/10 shadow-inner">
           <Avatar name={user.name} size="sm" />
           <span className="text-[13px] font-bold text-slate-200 pr-1">{user.name}</span>
         </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          
          <div className="relative w-[280px] max-w-[80%] bg-slate-950/95 h-full shadow-2xl border-r border-white/10 flex flex-col animate-in slide-in-from-left">
            <div className="p-6 border-b border-white/5 relative overflow-hidden">
               <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
               <div className="flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 shadow-md border border-white/10">
                    <LayoutGrid className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-[15px] font-extrabold text-white block leading-tight">Task Manager</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{isAdmin ? 'Admin Workspace' : 'Member Workspace'}</span>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>
               </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 space-y-8">
              <div className="px-4">
                <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Menu</p>
                <div className="space-y-1">
                  {navLinks.map(({ to, label, icon: Icon }) => {
                    const active = isActive(to);
                    return (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all relative overflow-hidden ${
                          active
                            ? 'bg-blue-500/10 text-white border border-blue-500/20 shadow-sm'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-violet-500 rounded-r-full" />}
                        <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              <div className="px-4">
                <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Actions</p>
                <div className="space-y-1">
                  {isAdmin ? (
                    <>
                      <Link to="/projects" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all">
                        <Plus className="w-4 h-4" /> Create Project
                      </Link>
                      <button onClick={() => { window.location.reload(); setMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent transition-all">
                        <RefreshCw className="w-4 h-4" /> Refresh Workspace
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all">
                        <LayoutDashboard className="w-4 h-4" /> My Dashboard
                      </Link>
                      <Link to="/projects" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all">
                        <FolderKanban className="w-4 h-4" /> My Projects
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </nav>

            <div className="p-4 border-t border-white/5 bg-white/[0.01]">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors border border-transparent hover:border-rose-500/20"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
