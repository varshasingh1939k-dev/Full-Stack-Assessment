import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { FolderKanban, Users, CheckSquare, Plus, CalendarDays, ArrowRight, ShieldOff, Info } from 'lucide-react';
import { PageHeader, Card, CardHeader, CardBody, Button, Input, Textarea, Alert, EmptyState, LoadingState, Badge, Avatar } from '../components/ui';

const Projects = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN';
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true); setFetchError(false);
      const { data } = await api.get('/projects');
      setProjects(data.data);
    } catch { setFetchError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!name.trim()) { setFormError('Project name is required.'); return; }
    setSubmitting(true);
    try {
      await api.post('/projects', { name, description });
      setFormSuccess('Project created successfully!');
      setName(''); setDescription('');
      fetchProjects();
      setTimeout(() => setFormSuccess(''), 3500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create project.');
    } finally { setSubmitting(false); }
  };

  const fmt = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) return <LoadingState label="Loading projects…" />;

  return (
    <div className="space-y-8 animate-in pb-12">
      <PageHeader
        title="Projects"
        subtitle={isAdmin ? 'All workspace projects — you can view and manage any project.' : 'Projects you have been added to by an admin.'}
      />
      {isAdmin && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300 shadow-sm backdrop-blur-md">
          <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-400" />
          <span><strong className="text-blue-200">Admin view:</strong> You can see and manage all projects in the workspace.</span>
        </div>
      )}
      {isAdmin ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/5 rounded-lg border border-white/10"><Plus className="w-4 h-4 text-slate-300" /></div>
              <h2 className="text-[15px] font-bold text-white">New Project</h2>
            </div>
          </CardHeader>
          <CardBody>
            {fetchError && <Alert variant="error" className="mb-4">Could not load projects.</Alert>}
            {formError   && <Alert variant="error"   className="mb-4">{formError}</Alert>}
            {formSuccess  && <Alert variant="success" className="mb-4">{formSuccess}</Alert>}
            <form onSubmit={handleCreate} className="space-y-5">
              <Input label="Project name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Redesign" />
              <Textarea label="Description (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" />
              <Button type="submit" loading={submitting}>Create Project</Button>
            </form>
          </CardBody>
        </Card>
      ) : (
        <div className="flex items-start gap-4 px-5 py-4 bg-[#0f172a]/90 border border-white/10 rounded-xl backdrop-blur-md shadow-xl shadow-black/20">
          <div className="h-10 w-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center flex-shrink-0">
            <ShieldOff className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-white">Member account</p>
            <p className="text-[13px] text-slate-400 mt-0.5">Projects appear here once an admin adds you to a team.</p>
          </div>
        </div>
      )}
      
      <div>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 bg-white/5 rounded-lg border border-white/10"><FolderKanban className="w-4 h-4 text-slate-300" /></div>
          <h2 className="text-[16px] font-bold text-white">{isAdmin ? 'All Projects' : 'My Projects'}</h2>
          <Badge variant="default">{projects.length}</Badge>
        </div>
        
        {projects.length === 0 ? (
          <Card>
            <EmptyState icon={FolderKanban} title={isAdmin ? 'No projects yet' : 'No projects assigned'} description={isAdmin ? 'Create your first project above.' : 'You will appear here once added.'} />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <Card key={p.id} hover className="flex flex-col group overflow-hidden">
                <div className="p-5 flex-1 flex flex-col relative z-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <FolderKanban className="w-5 h-5 text-blue-400" />
                    </div>
                    <Badge variant="active">Active</Badge>
                  </div>
                  <h3 className="text-[16px] font-bold text-white truncate mb-1.5 relative z-10 group-hover:text-blue-300 transition-colors">{p.name}</h3>
                  <p className="text-[13px] text-slate-400 line-clamp-2 flex-1 mb-5 relative z-10 leading-relaxed">{p.description || 'No description provided.'}</p>
                  
                  <div className="flex items-center gap-4 pt-4 border-t border-white/10 text-[12px] text-slate-400 relative z-10">
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-500" /><strong className="text-slate-200">{p._count?.members ?? 0}</strong> members</span>
                    <span className="flex items-center gap-1.5"><CheckSquare className="w-4 h-4 text-slate-500" /><strong className="text-slate-200">{p._count?.tasks ?? 0}</strong> tasks</span>
                  </div>
                </div>
                <div className="px-5 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between relative z-10">
                  <span className="flex items-center gap-1.5 text-[12px] text-slate-500"><CalendarDays className="w-3.5 h-3.5" />{fmt(p.createdAt)}</span>
                  <Link to={`/projects/${p.id}`} className="flex items-center gap-1.5 text-[13px] font-bold text-blue-400 hover:text-blue-300 transition-colors">
                    Open Project <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
