import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Zap, LayoutDashboard, Users, Activity, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';
import { Button, Input, Alert } from '../components/ui';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLocalError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setLocalError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setLocalError('');
    setIsSubmitting(true);
    try {
      await login(demoEmail, demoPassword);
    } catch (err) {
      setLocalError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans overflow-hidden text-slate-200">
      
      {/* Decorative background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-5" />
      </div>

      {/* Left side - Brand/Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[48%] flex-col justify-between p-12 xl:p-16 relative z-10 border-r border-white/5 bg-slate-900/40 backdrop-blur-md">
        <div className="animate-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center mb-16">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-amber-400 text-white flex items-center justify-center mr-3 shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">FlowDesk</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.05] mb-5">
              Work boards that feel calm and clear.
            </h1>
            <p className="text-[15px] text-slate-400 font-medium leading-relaxed mb-10">
              A cleaner workspace for assigning work, tracking deadlines, and seeing team load without the old dark dashboard look.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: LayoutDashboard, text: "Project workspaces", desc: "Organize tasks by initiative" },
                { icon: Users, text: "Role-based collaboration", desc: "Control who sees what" },
                { icon: Activity, text: "Task progress tracking", desc: "Monitor work in real-time" },
                { icon: Zap, text: "Team workload visibility", desc: "Balance assignments easily" }
              ].map((ft, i) => (
                <div key={i} className="rounded-2xl bg-slate-900/70 border border-white/10 p-4 shadow-sm">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-cyan-300 w-fit mb-3">
                    <ft.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-slate-100">{ft.text}</p>
                    <p className="text-[12px] text-slate-500 font-medium">{ft.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Subtle Preview Card */}
        <div className="mt-12 p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-white animate-in max-w-sm shadow-xl" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-300" />
              <span className="text-[13px] font-bold text-white">Workspace Overview</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/15 rounded-full overflow-hidden mb-2">
            <div className="h-full w-[65%] bg-cyan-400 rounded-full" />
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Total tasks, overdue work, and team progress in one place.</p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-[52%] flex items-center justify-center p-6 sm:p-12 relative z-10">
        
        {/* Mobile Logo */}
        <div className="absolute top-6 left-6 lg:hidden">
          <span className="text-sm font-black text-white tracking-wide">FlowDesk</span>
        </div>

        <div className="w-full max-w-[420px] animate-in" style={{ animationDelay: '0.2s' }}>
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Secure workspace access
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Welcome back</h2>
            <p className="text-[14px] text-slate-400 font-medium">Sign in to continue managing your projects and tasks.</p>
          </div>

          {localError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <div className="text-rose-400 mt-0.5"><AlertTriangle className="w-4 h-4" /></div>
              <p className="text-[13px] font-medium text-rose-200 leading-relaxed">{localError}</p>
            </div>
          )}

          <div className="bg-slate-900/50 p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (localError) setLocalError('');
                }}
                placeholder="you@company.com"
                className="bg-slate-950/50 border-white/10"
              />
              
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (localError) setLocalError('');
                }}
                placeholder="••••••••"
                className="bg-slate-950/50 border-white/10"
              />
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  variant="white"
                  className="w-full text-[14px] py-2.5 font-semibold group" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            </form>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-widest font-bold">
                <span className="bg-slate-900/50 backdrop-blur-xl px-3 text-slate-500">or use demo access</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => handleDemoLogin('admin@example.com', 'password123')}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 hover:border-white/25 transition-colors disabled:opacity-50 group"
              >
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-white mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" /> Continue as Admin
                </div>
                <div className="text-[11px] font-medium text-slate-500 transition-colors">Manage projects and teams</div>
              </button>
              
              <button 
                type="button"
                onClick={() => handleDemoLogin('member@example.com', 'password123')}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 hover:border-white/25 transition-colors disabled:opacity-50 group"
              >
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-white mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Continue as Member
                </div>
                <div className="text-[11px] font-medium text-slate-500 transition-colors">View assigned work</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[13px] text-slate-500 font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="text-white hover:text-cyan-300 font-bold transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
