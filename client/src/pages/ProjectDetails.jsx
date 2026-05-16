import { useState, useEffect, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { ArrowLeft, Users, ShieldCheck, UserPlus, Trash2, Plus, Clock, X, CheckSquare, Search, SlidersHorizontal, User } from 'lucide-react';
import { Button, Input, Textarea, Select, Card, CardHeader, CardBody, Badge, Alert, EmptyState, LoadingState, Avatar } from '../components/ui';

const priorityVariant = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
const isOverdue = (d, s) => d && s !== 'DONE' && new Date(d) < new Date(new Date().setHours(0,0,0,0));

const StatPill = ({ label, value, color }) => (
  <div className="flex flex-col items-center px-4 py-2.5 bg-[#0f172a]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-xl min-w-[70px]">
    <span className={`text-[17px] font-bold ${color}`}>{value}</span>
    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">{label}</span>
  </div>
);

const Modal = ({ children, onClose }) => {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

const TaskList = ({ tasks, user, isAdmin, onStatusChange, onDelete }) => {
  if (tasks.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-8 text-center flex flex-col items-center justify-center min-h-[250px]">
        <CheckSquare className="w-10 h-10 text-slate-600 mb-3 opacity-50" />
        <h3 className="text-[15px] font-bold text-white mb-1">{isAdmin ? 'No tasks yet' : 'No assigned tasks'}</h3>
        <p className="text-[13px] text-slate-400">{isAdmin ? 'Create a task to start tracking project work.' : 'Tasks assigned to you will appear here.'}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-[13px] text-slate-300">
          <thead className="bg-slate-950/80 border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
            <tr>
              <th className="px-5 py-4">Task</th>
              <th className="px-5 py-4">Assignee</th>
              <th className="px-5 py-4">Priority</th>
              <th className="px-5 py-4">Due Date</th>
              <th className="px-5 py-4">Status</th>
              {isAdmin && <th className="px-5 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tasks.map(task => {
              const overdue = isOverdue(task.dueDate, task.status);
              const due = fmtDate(task.dueDate);
              const isAssignedToMe = task.assignedTo?.id === user?.id;
              const canEdit = isAdmin || isAssignedToMe;
              
              return (
                <tr key={task.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">{task.title}</span>
                      {task.description && <span className="text-[11px] text-slate-500 truncate max-w-xs">{task.description}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {task.assignedTo ? <Avatar name={task.assignedTo.name} size="sm" className="w-5 h-5 text-[9px]" /> : <User className="w-4 h-4 text-slate-500" />}
                      <span className="text-[12px] font-medium">{task.assignedTo ? task.assignedTo.name : <span className="text-slate-500 italic">Unassigned</span>}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge></td>
                  <td className="px-5 py-3">
                    {due ? <span className={`flex items-center gap-1.5 text-[11px] font-bold ${overdue ? 'text-rose-400' : 'text-slate-400'}`}><Clock className="w-3.5 h-3.5" />{due}</span> : <span className="text-slate-600 italic">No due date</span>}
                  </td>
                  <td className="px-5 py-3">
                    {canEdit ? (
                      <select
                        value={task.status}
                        onChange={(e) => onStatusChange(task.id, e.target.value)}
                        className="px-2 py-1 text-[11px] font-bold bg-slate-800 border border-white/10 text-slate-300 rounded cursor-pointer hover:border-white/20 transition-colors outline-none"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    ) : (
                      <Badge variant="default" className="text-[10px]">{task.status}</Badge>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => onDelete(task.id)} className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="block sm:hidden divide-y divide-white/5">
        {tasks.map(task => {
          const overdue = isOverdue(task.dueDate, task.status);
          const due = fmtDate(task.dueDate);
          const isAssignedToMe = task.assignedTo?.id === user?.id;
          const canEdit = isAdmin || isAssignedToMe;
          
          return (
            <div key={task.id} className="p-4 hover:bg-white/[0.02] transition-colors flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-white text-[14px] truncate">{task.title}</span>
                  {task.description && <span className="text-[12px] text-slate-500 line-clamp-2 mt-0.5">{task.description}</span>}
                </div>
                {isAdmin && (
                  <button onClick={() => onDelete(task.id)} className="p-1.5 text-slate-500 hover:text-rose-400 bg-slate-800/50 rounded-lg shrink-0"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
                {canEdit ? (
                  <select
                    value={task.status}
                    onChange={(e) => onStatusChange(task.id, e.target.value)}
                    className="px-2 py-1 text-[11px] font-bold bg-slate-800 border border-white/10 text-slate-300 rounded cursor-pointer outline-none appearance-none"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                ) : (
                  <Badge variant="default" className="text-[10px]">{task.status}</Badge>
                )}
              </div>

              <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 min-w-0">
                  {task.assignedTo ? <Avatar name={task.assignedTo.name} size="sm" className="w-5 h-5 text-[9px] shrink-0" /> : <User className="w-4 h-4 text-slate-500 shrink-0" />}
                  <span className="text-[12px] font-medium text-slate-300 truncate">{task.assignedTo ? task.assignedTo.name : <span className="text-slate-500 italic">Unassigned</span>}</span>
                </div>
                {due ? <span className={`flex items-center gap-1.5 text-[11px] font-bold shrink-0 ${overdue ? 'text-rose-400' : 'text-slate-400'}`}><Clock className="w-3.5 h-3.5" />{due}</span> : <span className="text-[11px] text-slate-600 italic shrink-0">No due date</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

const CreateTaskPanel = ({ projectId, members, onSubmit, onClose, loading, error, refreshMembers }) => {
  const [f, setF] = useState({ title:'', description:'', dueDate:'', priority:'MEDIUM', status:'TODO', assignedToIds: [] });
  const [showAddMember, setShowAddMember] = useState(false);

  const set = (k, v) => setF(p => ({...p, [k]: v}));
  
  const handle = (e) => {
    e.preventDefault();
    onSubmit({...f, dueDate: f.dueDate ? new Date(f.dueDate).toISOString() : null});
  };

  const toggleAssignee = (id) => {
    setF(prev => {
       const has = prev.assignedToIds.includes(id);
       return { ...prev, assignedToIds: has ? prev.assignedToIds.filter(x => x !== id) : [...prev.assignedToIds, id] };
    });
  }

  const handleSelectAll = () => setF(p => ({...p, assignedToIds: members.map(m => m.user.id)}));
  const handleClear = () => setF(p => ({...p, assignedToIds: []}));

  return (
    <>
      <Card className="mb-6 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-violet-500" />
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 rounded-lg"><Plus className="w-4 h-4 text-blue-400" /></div>
            <h3 className="text-[15px] font-bold text-white">Create Task</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"><X className="w-4 h-4" /></button>
        </CardHeader>
        <CardBody>
          {error && <Alert variant="error" className="mb-4">{error}</Alert>}
          <form onSubmit={handle} className="space-y-4">
            <Input label="Title" required value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Task title…" />
            <Textarea label="Description" rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional details…" />
            
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assign To</label>
                <button type="button" onClick={() => setShowAddMember(true)} className="text-[11px] text-blue-400 hover:text-blue-300 font-bold transition-colors flex items-center gap-1"><Plus className="w-3 h-3" /> Add project member</button>
              </div>
              
              <div className="border border-white/10 rounded-xl bg-slate-900/50 overflow-hidden max-h-48 overflow-y-auto mb-2">
                {members.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-[13px] font-bold text-slate-300">No project members yet. Add members before assigning tasks.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {members.map(m => (
                      <div key={m.user.id} onClick={() => toggleAssignee(m.user.id)} className={`flex items-center gap-3 p-2.5 cursor-pointer hover:bg-white/5 transition-colors ${f.assignedToIds.includes(m.user.id) ? 'bg-blue-500/10' : ''}`}>
                        <input type="checkbox" checked={f.assignedToIds.includes(m.user.id)} readOnly className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer flex-shrink-0" />
                        <Avatar name={m.user.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-white truncate">{m.user.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{m.user.email}</p>
                        </div>
                        <Badge variant={m.role === 'ADMIN' ? 'admin' : 'member'}>{m.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {f.assignedToIds.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-slate-900 rounded-xl border border-white/5 mb-2 mt-2">
                  {f.assignedToIds.map(id => {
                    const u = members.find(m => m.user.id === id)?.user;
                    if (!u) return null;
                    return (
                      <div key={u.id} className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-md border border-blue-500/30">
                        <span>{u.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggleAssignee(u.id); }} className="hover:text-rose-400 hover:bg-rose-500/20 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                      </div>
                    )
                  })}
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <Button type="button" variant="secondary" className="flex-1 text-xs" onClick={handleSelectAll} disabled={members.length === 0}>Select All</Button>
                <Button type="button" variant="secondary" className="flex-1 text-xs" onClick={handleClear} disabled={f.assignedToIds.length === 0}>Clear</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input label="Due date" type="date" value={f.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
              <Select label="Priority" value={f.priority} onChange={(e) => set('priority', e.target.value)}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <Select label="Status" value={f.status} onChange={(e) => set('status', e.target.value)}>
                <option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="DONE">Done</option>
              </Select>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading} className="flex-1">
                {f.assignedToIds.length === 0 ? 'Create unassigned task' : f.assignedToIds.length === 1 ? 'Create task' : `Create tasks for ${f.assignedToIds.length} members`}
              </Button>
              <Button variant="secondary" type="button" onClick={onClose} className="flex-none">Cancel</Button>
            </div>
          </form>
        </CardBody>
      </Card>
      
      {showAddMember && (
        <Modal onClose={() => setShowAddMember(false)}>
          <AddMemberPanel 
            projectId={projectId} 
            onMemberAdded={async () => {
              await refreshMembers();
              setShowAddMember(false);
            }} 
          />
        </Modal>
      )}
    </>
  );
};

const AddMemberPanel = ({ projectId, onMemberAdded }) => {
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [role, setRole] = useState('MEMBER');
  
  const [emailFallback, setEmailFallback] = useState(false);
  const [email, setEmail] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/available-users${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setAvailableUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [projectId, search]);

  const toggleSelect = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(x => x !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleSelectAll = () => {
    const selectable = availableUsers.filter(u => !u.isProjectMember && !selectedUserIds.includes(u.id)).map(u => u.id);
    setSelectedUserIds([...selectedUserIds, ...selectable]);
  };

  const handleClear = () => {
    setSelectedUserIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailFallback && selectedUserIds.length === 0) return;
    if (emailFallback && !email) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = { role };
      if (emailFallback) {
        payload.email = email;
      } else {
        payload.userIds = selectedUserIds;
      }
      
      const res = await api.post(`/projects/${projectId}/members`, payload);
      setSuccess(res.data.message || 'Members added successfully');
      
      setSelectedUserIds([]);
      setEmail('');
      setEmailFallback(false);
      
      fetchUsers();
      onMemberAdded();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member(s).');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUsers = availableUsers.filter(u => selectedUserIds.includes(u.id));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col">
          <h2 className="text-[15px] font-bold text-white">Add Team Members</h2>
          <p className="text-[12px] text-slate-400 mt-1">Select existing users and add them to this project.</p>
        </div>
      </CardHeader>
      
      <CardBody className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        {emailFallback ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" />
            <Select value={role} onChange={e => setRole(e.target.value)}>
              <option value="MEMBER">MEMBER</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
            <div className="flex gap-2">
              <Button type="submit" loading={submitting} className="flex-1">Add by Email</Button>
              <Button type="button" variant="secondary" onClick={() => setEmailFallback(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="block w-full pl-9 pr-3 py-2.5 text-[13px] bg-slate-900 border border-white/10 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-slate-500 transition-all"
                placeholder="Search users by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <div className="border border-white/10 rounded-xl bg-slate-900/50 overflow-hidden max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-6 flex justify-center"><LoadingState label="Loading users..." /></div>
              ) : availableUsers.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm font-bold text-slate-300">{search ? 'No matching users found.' : 'No users found.'}</p>
                </div>
              ) : availableUsers.every(u => u.isProjectMember) && !search ? (
                <div className="p-6 text-center">
                  <p className="text-sm font-bold text-slate-300">All users are already part of this project.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {availableUsers.map(u => (
                    <div 
                      key={u.id} 
                      onClick={() => !u.isProjectMember && toggleSelect(u.id)}
                      className={`flex items-center gap-3 p-3 transition-colors ${u.isProjectMember ? 'opacity-50 cursor-not-allowed bg-slate-950/40' : 'cursor-pointer hover:bg-white/5'} ${selectedUserIds.includes(u.id) ? 'bg-blue-500/10' : ''}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={u.isProjectMember || selectedUserIds.includes(u.id)}
                        disabled={u.isProjectMember}
                        readOnly
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0"
                      />
                      <Avatar name={u.name} size="sm" className={u.isProjectMember ? "opacity-70" : ""} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-white truncate">{u.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                      </div>
                      <Badge variant={u.role === 'ADMIN' ? 'admin' : 'member'}>{u.role}</Badge>
                      {u.isProjectMember ? (
                        <Badge variant="default" className="text-[10px] ml-1">Already added</Badge>
                      ) : (
                        <Badge variant="active" className="text-[10px] ml-1">Available</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedUserIds.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-slate-900 rounded-xl border border-white/5">
                {selectedUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-md border border-blue-500/30">
                    <span>{u.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(u.id); }} className="hover:text-rose-400 hover:bg-rose-500/20 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Select value={role} onChange={e => setRole(e.target.value)} className="flex-1">
                <option value="MEMBER">MEMBER</option>
                <option value="ADMIN">ADMIN</option>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" className="flex-1 text-xs" onClick={handleSelectAll} disabled={availableUsers.length === 0 || availableUsers.every(u => u.isProjectMember)}>Select All</Button>
                <Button type="button" variant="secondary" className="flex-1 text-xs" onClick={handleClear} disabled={selectedUserIds.length === 0}>Clear</Button>
              </div>
              <Button onClick={handleSubmit} loading={submitting} disabled={selectedUserIds.length === 0} className="w-full">
                Add {selectedUserIds.length > 0 ? selectedUserIds.length : ''} {selectedUserIds.length === 1 ? 'Member' : 'Members'}
              </Button>
            </div>
            
            <div className="text-center mt-2">
              <button 
                type="button"
                onClick={() => setEmailFallback(true)}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
              >
                Add by email instead
              </button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskLoading, setTaskLoading]   = useState(false);
  const [taskError, setTaskError]       = useState('');
  const [taskSuccess, setTaskSuccess]   = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true); setPageError(false);
      const [pRes, mRes, tRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/members`),
        api.get(`/projects/${id}/tasks`),
      ]);
      setProject(pRes.data.data);
      setMembers(mRes.data.data);
      setTasks(tRes.data.data);
    } catch { setPageError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setMembers(members.filter(m => m.user.id !== userId));
    } catch (err) { alert(err.response?.data?.message || 'Failed.'); }
  };

  const handleCreateTask = async (payload) => {
    setTaskError('');
    setTaskSuccess('');
    if (!payload.title?.trim()) { setTaskError('Title is required.'); return; }
    setTaskLoading(true);
    try {
      const res = await api.post(`/projects/${id}/tasks`, payload);
      const tRes = await api.get(`/projects/${id}/tasks`);
      setTasks(tRes.data.data);
      setShowTaskForm(false);
      
      const count = res.data.data?.createdCount || 1;
      setTaskSuccess(`Created ${count} task${count > 1 ? 's' : ''} successfully.`);
      setTimeout(() => setTaskSuccess(''), 4000);
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to create task.');
    } finally { setTaskLoading(false); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? {...t, status: newStatus} : t));
    } catch (err) { alert(err.response?.data?.message || 'Failed.'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) { alert(err.response?.data?.message || 'Failed.'); }
  };

  const filtered = useMemo(() => tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee) {
      if (filterAssignee === 'unassigned') return !t.assignedToId;
      return t.assignedToId === filterAssignee;
    }
    return true;
  }), [tasks, search, filterStatus, filterPriority, filterAssignee]);

  const hasFilters = search || filterStatus || filterPriority || filterAssignee;

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const term = memberSearch.toLowerCase();
    return members.filter(m => 
      m.user.name.toLowerCase().includes(term) ||
      m.user.email.toLowerCase().includes(term) ||
      m.role.toLowerCase().includes(term) ||
      (m.user.role && m.user.role.toLowerCase().includes(term))
    );
  }, [members, memberSearch]);

  if (loading) return <LoadingState label="Loading project workspace…" />;
  if (pageError || !project) return (
    <div className="mt-8 space-y-4">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <Alert variant="error">Project not found or you don't have access.</Alert>
    </div>
  );

  const stats = project.stats || {};

  return (
    <div className="space-y-6 animate-in pb-16">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <div className="pb-6 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-extrabold text-white tracking-tight truncate">{project.name}</h1>
              <Badge variant={isAdmin ? 'admin' : 'member'}>
                {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                {isAdmin ? 'Admin' : 'Member'}
              </Badge>
            </div>
            <p className="text-[14px] text-slate-400 font-medium">{project.description || 'No description provided.'}</p>
            
            {stats.totalTasks !== undefined && (
              <div className="flex flex-wrap gap-3 mt-6">
                <StatPill label="Total" value={stats.totalTasks} color="text-white" />
                <StatPill label="Done" value={stats.completedTasks} color="text-emerald-400" />
                <StatPill label="In Progress" value={stats.inProgressTasks} color="text-blue-400" />
                <StatPill label="Overdue" value={stats.overdueTasks} color="text-rose-400" />
                {stats.totalTasks > 0 && (
                  <div className="flex flex-col items-center px-4 py-2.5 bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-500/20 rounded-xl shadow-lg min-w-[70px]">
                    <span className="text-[17px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">{stats.progressPercentage}%</span>
                    <span className="text-[10px] text-blue-300/80 font-bold uppercase tracking-wide mt-1">Progress</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {isAdmin && (
            <Button onClick={() => { setShowTaskForm(!showTaskForm); setTaskError(''); }}>
              {showTaskForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showTaskForm ? 'Cancel' : 'Add Task'}
            </Button>
          )}
        </div>
      </div>

      {taskSuccess && (
        <Alert variant="success" className="mb-6">{taskSuccess}</Alert>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0 space-y-6">
          {showTaskForm && isAdmin && (
            <CreateTaskPanel 
              projectId={id}
              members={members} 
              onSubmit={handleCreateTask} 
              onClose={() => setShowTaskForm(false)} 
              loading={taskLoading} 
              error={taskError} 
              refreshMembers={async () => {
                try {
                  const mRes = await api.get(`/projects/${id}/members`);
                  setMembers(mRes.data.data);
                } catch (err) {
                  console.error('Failed to refresh members', err);
                }
              }}
            />
          )}

          <div>
            <h2 className="text-xl font-bold text-white mb-1">Tasks</h2>
            <p className="text-[13px] text-slate-400 mb-4">Track assigned work, priorities, due dates, and progress.</p>
            
            <div className="flex flex-wrap gap-4 items-center bg-[#0f172a]/90 p-3.5 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md mb-6">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 text-slate-300 mr-1"><SlidersHorizontal className="w-4 h-4" /><span className="text-[13px] font-bold hidden sm:inline">Filters</span></div>
                <div className="relative flex-1 min-w-[140px] max-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    className="block w-full pl-9 pr-3 py-2 text-[12px] bg-slate-900 border border-white/10 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none text-white placeholder-slate-500"
                    placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-[12px] font-medium bg-slate-900 border border-white/10 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer text-white"
                >
                  <option value="">All statuses</option><option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="DONE">Done</option>
                </select>
                <select
                  value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                  className="px-3 py-2 text-[12px] font-medium bg-slate-900 border border-white/10 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer text-white"
                >
                  <option value="">All priorities</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
                </select>
                <select
                  value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
                  className="px-3 py-2 text-[12px] font-medium bg-slate-900 border border-white/10 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer text-white max-w-[160px] truncate"
                >
                  <option value="">All assignees</option>
                  <option value="unassigned">Unassigned</option>
                  {members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                </select>
                {hasFilters && (
                  <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); setFilterAssignee(''); }} className="text-[12px] text-rose-400 hover:text-rose-300 font-bold px-3 py-2 hover:bg-rose-500/10 rounded-lg transition-colors">Clear</button>
                )}
              </div>
            </div>

            <TaskList tasks={filtered} user={user} isAdmin={isAdmin} onStatusChange={handleStatusChange} onDelete={handleDeleteTask} />
          </div>
        </div>

        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-6">
          <Card>
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white/5 rounded-lg border border-white/10"><Users className="w-4 h-4 text-slate-300" /></div>
                    <div>
                      <h2 className="text-[15px] font-bold text-white leading-tight">Team Members</h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">People with access to this project</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => setShowAddMemberModal(true)} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0" title="Add Member">
                      <UserPlus className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
                
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    className="block w-full pl-9 pr-8 py-2 text-[12px] bg-slate-900/80 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 focus:outline-none text-white placeholder-slate-500 transition-all"
                    placeholder="Search members by name, email, or role..."
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                  />
                  {memberSearch && (
                    <button onClick={() => setMemberSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white bg-slate-800 rounded-md transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  {memberSearch ? `Showing ${filteredMembers.length} of ${members.length} members` : `${members.length} members`}
                </div>
              </div>
            </CardHeader>
            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <div className="p-6 text-center flex flex-col items-center">
                  <Users className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
                  <p className="text-[13px] font-bold text-slate-300">No matching members found</p>
                  <p className="text-[11px] text-slate-500 mt-1">Try searching by a different name, email, or role.</p>
                </div>
              ) : filteredMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={m.user.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-white truncate">{m.user.name}</p>
                      <p className="text-[11px] font-medium text-slate-500 truncate">{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 ml-3 flex-shrink-0">
                    <Badge variant={m.role === 'ADMIN' ? 'admin' : 'member'}>{m.role}</Badge>
                    {isAdmin && m.user.id !== user.id && (
                      <button onClick={() => handleRemoveMember(m.user.id)} className="text-[10px] text-rose-500 hover:text-rose-400 font-bold transition-colors">Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      
      {showAddMemberModal && isAdmin && (
        <Modal onClose={() => setShowAddMemberModal(false)}>
          <AddMemberPanel 
            projectId={id} 
            onMemberAdded={async () => {
              try {
                const mRes = await api.get(`/projects/${id}/members`);
                setMembers(mRes.data.data);
              } catch (err) {
                console.error(err);
              }
              setShowAddMemberModal(false);
            }} 
          />
        </Modal>
      )}
    </div>
  );
};

export default ProjectDetails;
