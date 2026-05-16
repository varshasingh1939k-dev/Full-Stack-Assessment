import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, Users, LayoutGrid, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button, Input, Alert } from '../components/ui';

const RoleCard = ({ selected, title, description, icon: Icon, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 relative overflow-hidden group ${
      selected 
        ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
        : 'bg-slate-900/40 border-white/10 hover:border-white/20 hover:bg-slate-800/40'
    }`}
  >
    {selected && <div className="absolute top-0 right-0 w-0 h-0 border-t-[30px] border-l-[30px] border-t-blue-500 border-l-transparent">
      <CheckCircle2 className="w-3 h-3 text-white absolute -top-[25px] -left-[12px]" />
    </div>}
    
    <div className="flex items-start gap-3">
      <div className={`p-2.5 rounded-lg border ${selected ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className={`text-sm font-bold mb-1 ${selected ? 'text-white' : 'text-slate-300'}`}>{title}</h4>
        <p className={`text-[12px] leading-snug ${selected ? 'text-slate-300' : 'text-slate-500'}`}>{description}</p>
      </div>
    </div>
  </div>
);

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN'); // Default to ADMIN
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLocalError('');
    setIsSubmitting(true);
    try {
      await signup(name, email, password, role);
    } catch (err) {
      setLocalError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans overflow-hidden text-slate-200">
      
      {/* Decorative background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-5" />
      </div>

      <div className="w-full flex items-center justify-center p-6 sm:p-12 relative z-10 min-h-screen">
        
        {/* Mobile Logo */}
        <div className="absolute top-6 left-6 flex items-center">
          <span className="text-sm font-bold text-white tracking-wide">Task Manager</span>
        </div>

        <div className="w-full max-w-lg animate-in" style={{ animationDelay: '0.1s' }}>
          <div className="bg-slate-950/80 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 opacity-50" />
            
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">Create your workspace</h2>
              <p className="text-sm text-slate-400 font-medium">Start managing projects in seconds.</p>
            </div>

            {localError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
                <p className="text-[13px] font-medium text-rose-200 leading-relaxed">{localError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Full name"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (localError) setLocalError('');
                }}
                placeholder="John Doe"
              />
              
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
              />
              
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-300 mb-3">Choose your role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <RoleCard 
                    selected={role === 'ADMIN'}
                    onClick={() => setRole('ADMIN')}
                    title="Admin"
                    description="Create projects, manage teams, and assign work."
                    icon={ShieldCheck}
                  />
                  <RoleCard 
                    selected={role === 'MEMBER'}
                    onClick={() => setRole('MEMBER')}
                    title="Member"
                    description="Join assigned projects and update your tasks."
                    icon={Users}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  variant="white"
                  className="w-full text-[14px] py-2.5 font-semibold group" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                  Sign in instead
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
