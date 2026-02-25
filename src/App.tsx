import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Trello, 
  DollarSign, 
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit2,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  LogOut,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  X,
  GripVertical,
  Search,
  List,
  Grid3x3,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn, type Client, type Opportunity, type Project, type Transaction, type ContactHistory, type Task } from './types';
import { auth, db, googleProvider, isFirebaseConfigured } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { initializeUsers } from './initializeUsers';

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode, className?: string, key?: string | number }) => (
  <div className={cn("bg-card border border-border rounded-xl shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger',
  className?: string,
  disabled?: boolean
}) => {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90"
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick} 
      disabled={disabled}
      className={cn("px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2", variants[variant], className)}
    >
      {children}
    </motion.button>
  );
};

const Input = ({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>}
    <input 
      {...props} 
      className="w-full bg-background text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
    />
  </div>
);

const Textarea = ({ label, className, ...props }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>}
    <textarea 
      {...props} 
      className={className || "w-full bg-background text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-vertical min-h-[120px]"}
    />
  </div>
);

const Select = ({ label, options, searchable, ...props }: { label?: string, options: { value: string, label: string }[], searchable?: boolean } & React.SelectHTMLAttributes<HTMLSelectElement>) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);
  
  const filteredOptions = searchable 
    ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={selectRef}>
      {label && <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>}
      {searchable ? (
        <div className="relative">
          <input
            type="text"
            placeholder="Digite para buscar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            className="w-full bg-background text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => {
                    props.onChange?.({ target: { value: opt.value } } as any);
                    setSearch('');
                    setIsOpen(false);
                  }}
                  className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <select 
          {...props} 
          className="w-full bg-background text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        >
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      )}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 40 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90%] max-w-lg bg-card border border-border rounded-2xl shadow-2xl z-50 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{title}</h2>
            <Button variant="ghost" onClick={onClose} className="p-2 h-auto rounded-full">
              <Plus className="rotate-45" size={20} />
            </Button>
          </div>
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const SlidePanel = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" 
        />
        <motion.div 
          initial={{ opacity: 0, x: 400 }} 
          animate={{ opacity: 1, x: 0 }} 
          exit={{ opacity: 0, x: 400 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 w-[90%] md:w-[500px] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
        >
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-xl font-bold">{title}</h2>
            <Button variant="ghost" onClick={onClose} className="p-2 h-auto rounded-full">
              <X size={20} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'crm' | 'finance' | 'projects' | 'clients'>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'client' | 'opportunity' | 'project' | 'transaction' | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // Form states
  const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '', company: '', cpf_cnpj: '' });
  const [oppForm, setOppForm] = useState({ title: '', client_id: '', value: '', status: 'lead', description: '' });
  const [projectForm, setProjectForm] = useState({ name: '', client_id: '', status: 'active', budget: '', startDate: '', deadline: '' });
  const [transForm, setTransForm] = useState({ type: 'income', category: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), description: '', is_recurring: false });
  const [selectedDayTransactions, setSelectedDayTransactions] = useState<{ date: Date, transactions: Transaction[] } | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [projectDetailView, setProjectDetailView] = useState(false);
  const [clientsViewMode, setClientsViewMode] = useState<'list' | 'card'>('card');
  const [clientSearch, setClientSearch] = useState('');
  const [newContactNotes, setNewContactNotes] = useState('');
  const [newContactType, setNewContactType] = useState<'email' | 'phone' | 'whatsapp' | 'visit' | 'other'>('email');
  const [newContactDate, setNewContactDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const allowedEmails = import.meta.env.VITE_ALLOWED_EMAILS?.split(',') || [];
        setIsAllowed(allowedEmails.includes(u.email || ''));
        initializeUsers(allowedEmails);
      } else {
        setIsAllowed(false);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isAllowed) {
      const clientsRef = ref(db, 'clients');
      const oppsRef = ref(db, 'opportunities');
      const projectsRef = ref(db, 'projects');
      const transRef = ref(db, 'transactions');
      const usersRef = ref(db, 'users');

      const unsubClients = onValue(clientsRef, (snapshot) => {
        const data = snapshot.val();
        const list = data ? Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })) : [];
        setClients(list.sort((a, b) => a.name.localeCompare(b.name)));
      });

      const unsubOpps = onValue(oppsRef, (snapshot) => {
        const data = snapshot.val();
        const list = data ? Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })) : [];
        setOpportunities(list);
      });

      const unsubProjects = onValue(projectsRef, (snapshot) => {
        const data = snapshot.val();
        const list = data ? Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })) : [];
        setProjects(list);
      });

      const unsubTrans = onValue(transRef, (snapshot) => {
        const data = snapshot.val();
        const list = data ? Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })) : [];
        setTransactions(list.sort((a, b) => b.date.localeCompare(a.date)));
      });

      const unsubUsers = onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        const list = data ? Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })) : [];
        setUsers(list);
      });

      return () => {
        unsubClients();
        unsubOpps();
        unsubProjects();
        unsubTrans();
        unsubUsers();
      };
    }
  }, [user, isAllowed]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);

  const handleEdit = (type: 'client' | 'opportunity' | 'project' | 'transaction', data: any) => {
    setModalType(type);
    setEditingId(data.id);
    if (type === 'client') {
      setClientForm({ name: data.name, email: data.email, phone: data.phone, company: data.company, cpf_cnpj: data.cpf_cnpj || '' });
    } else if (type === 'opportunity') {
      setOppForm({ title: data.title, client_id: data.client_id?.toString() || '', value: data.value.toString(), status: data.status, description: data.description });
    } else if (type === 'project') {
      setProjectForm({ name: data.name, client_id: data.client_id?.toString() || '', status: data.status, budget: data.budget.toString(), startDate: data.startDate || '', deadline: data.deadline });
    } else if (type === 'transaction') {
      setTransForm({ type: data.type, category: data.category, amount: data.amount.toString(), date: data.date, description: data.description, is_recurring: !!data.is_recurring });
    }
    setIsModalOpen(true);
  };

  const handleAdd = async () => {
    let path = '';
    let body = {};

    if (modalType === 'client') {
      path = 'clients';
      body = clientForm;
    } else if (modalType === 'opportunity') {
      path = 'opportunities';
      const client = clients.find(c => c.id.toString() === oppForm.client_id);
      body = { ...oppForm, client_id: oppForm.client_id, client_name: client?.name || '', client_email: client?.email || '', client_phone: client?.phone || '', value: parseFloat(oppForm.value), contactHistory: [] };
    } else if (modalType === 'project') {
      path = 'projects';
      const client = clients.find(c => c.id.toString() === projectForm.client_id);
      body = { ...projectForm, client_id: projectForm.client_id, client_name: client?.name || '', budget: parseFloat(projectForm.budget), tasks: [] };
    } else if (modalType === 'transaction') {
      path = 'transactions';
      body = { ...transForm, amount: parseFloat(transForm.amount) };
    }

    if (editingId) {
      await set(ref(db, `${path}/${editingId}`), { ...body, id: editingId });
    } else {
      const newRef = push(ref(db, path));
      await set(newRef, { ...body, id: newRef.key });
    }

    setIsModalOpen(false);
    resetForms();
  };

  const handleDelete = async (type: string, id: string | number) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    await remove(ref(db, `${type}/${id}`));
  };

  const resetForms = () => {
    setEditingId(null);
    setClientForm({ name: '', email: '', phone: '', company: '', cpf_cnpj: '' });
    setOppForm({ title: '', client_id: '', value: '', status: 'lead', description: '' });
    setProjectForm({ name: '', client_id: '', status: 'active', budget: '', startDate: '', deadline: '' });
    setTransForm({ type: 'income', category: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), description: '', is_recurring: false });
    setNewContactNotes('');
    setNewContactType('email');
    setNewContactDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingContactId(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setNewTaskAssignee('');
    setNewTaskDueDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const moveOpportunity = async (id: string | number, newStatus: Opportunity['status']) => {
    await update(ref(db, `opportunities/${id}`), { status: newStatus });
  };

  const saveProjectTask = async (projectId: string, task: Task) => {
    await set(ref(db, `projects/${projectId}/tasks/${task.id}`), task);
  };

  const deleteProjectTask = async (projectId: string, taskId: string) => {
    await remove(ref(db, `projects/${projectId}/tasks/${taskId}`));
  };

  const updateProjectTask = async (projectId: string, taskId: string, updates: Partial<Task>) => {
    await update(ref(db, `projects/${projectId}/tasks/${taskId}`), updates);
  };

  const saveProject = async (project: Project) => {
    await set(ref(db, `projects/${project.id}`), project);
  };

  // Task Modal Handlers
  const resetTaskForm = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setNewTaskAssignee('');
    setNewTaskDueDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingTaskId(null);
  };

  const openAddTaskModal = () => {
    resetTaskForm();
    setIsAddTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description);
    setNewTaskPriority(task.priority);
    setNewTaskAssignee(task.assignee);
    setNewTaskDueDate(task.dueDate);
    setEditingTaskId(task.id);
    setIsAddTaskModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!newTaskTitle.trim() || !selectedProject) return;

    if (editingTaskId) {
      // Update existing task
      const updatedTask = {
        id: editingTaskId,
        title: newTaskTitle,
        status: projectTasks.find(t => t.id === editingTaskId)?.status || 'backlog',
        description: newTaskDescription,
        priority: newTaskPriority,
        assignee: newTaskAssignee,
        dueDate: newTaskDueDate
      };
      const updatedTasks = projectTasks.map(t => t.id === editingTaskId ? updatedTask : t);
      setProjectTasks(updatedTasks);
      await updateProjectTask(selectedProject.id, editingTaskId, updatedTask);
    } else {
      // Add new task
      const newTask: Task = {
        id: Math.random().toString(),
        title: newTaskTitle,
        status: 'backlog',
        description: newTaskDescription,
        priority: newTaskPriority,
        assignee: newTaskAssignee,
        dueDate: newTaskDueDate
      };
      setProjectTasks(prev => [...prev, newTask]);
      await saveProjectTask(selectedProject.id, newTask);
    }

    setIsAddTaskModalOpen(false);
    resetTaskForm();
  };

  // --- Views ---

  const DashboardView = React.memo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;
    
    const projectsWon = projects.filter(p => p.status === 'won').length;
    const projectsLost = projects.filter(p => p.status === 'lost').length;
    const opportunitiesWon = opportunities.filter(o => o.status === 'closed_won').length;
    const opportunitiesValue = opportunities.filter(o => o.status === 'closed_won').reduce((acc, o) => acc + o.value, 0);

    const chartData = [
      { name: 'Entradas', value: totalIncome },
      { name: 'Saídas', value: totalExpense },
    ];
    
    const [projectCalendarMonth, setProjectCalendarMonth] = useState(new Date());
    const monthStart = startOfMonth(projectCalendarMonth);
    const monthEnd = endOfMonth(projectCalendarMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="flex flex-col gap-6 p-4 pb-24 md:p-8 max-w-7xl mx-auto">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Bem-vindo ao seu ERP de Software House.</p>
          </div>
          <Button variant="ghost" onClick={() => setDarkMode(!darkMode)} className="rounded-full p-2 h-auto">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between text-emerald-500">
              <span className="text-sm font-semibold uppercase tracking-wider">Faturamento Total</span>
              <TrendingUp size={20} />
            </div>
            <span className="text-3xl font-bold">R$ {totalIncome.toLocaleString()}</span>
          </Card>
          <Card className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between text-rose-500">
              <span className="text-sm font-semibold uppercase tracking-wider">Despesas Totais</span>
              <TrendingDown size={20} />
            </div>
            <span className="text-3xl font-bold">R$ {totalExpense.toLocaleString()}</span>
          </Card>
          <Card className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between text-primary">
              <span className="text-sm font-semibold uppercase tracking-wider">Saldo em Caixa</span>
              <DollarSign size={20} />
            </div>
            <span className={cn("text-3xl font-bold", balance < 0 ? "text-rose-500" : "text-emerald-500")}>
              R$ {balance.toLocaleString()}
            </span>
          </Card>
          <Card className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between text-amber-500">
              <span className="text-sm font-semibold uppercase tracking-wider">Projetos Ganhos</span>
              <CheckCircle2 size={20} />
            </div>
            <span className="text-3xl font-bold">{projectsWon}</span>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between text-rose-500">
              <span className="text-sm font-semibold uppercase tracking-wider">Projetos Perdidos</span>
              <X size={20} />
            </div>
            <span className="text-3xl font-bold">{projectsLost}</span>
          </Card>
          <Card className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between text-blue-500">
              <span className="text-sm font-semibold uppercase tracking-wider">Oportunidades Fechadas</span>
              <Briefcase size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold">{opportunitiesWon}</span>
              <span className="text-sm text-muted-foreground">R$ {opportunitiesValue.toLocaleString()}</span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Fluxo Financeiro</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Calendário de Prazos</h3>
            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold text-sm">{format(projectCalendarMonth, 'MMMM yyyy')}</span>
              <div className="flex gap-1">
                <Button variant="ghost" onClick={() => setProjectCalendarMonth(subMonths(projectCalendarMonth, 1))} className="p-2 h-auto">
                  <ChevronLeft size={18} />
                </Button>
                <Button variant="ghost" onClick={() => setProjectCalendarMonth(addMonths(projectCalendarMonth, 1))} className="p-2 h-auto">
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="bg-muted/50 p-2 text-center text-xs font-bold uppercase text-muted-foreground">
                  {day}
                </div>
              ))}
              {days.map(day => {
                const dayProjects = projects.filter(p => {
                  const deadline = parseISO(p.deadline);
                  return isSameDay(deadline, day);
                });
                const isCurrentMonth = day >= monthStart && day <= monthEnd;
                
                return (
                  <div 
                    key={day.toString()} 
                    className={cn(
                      "bg-card min-h-[80px] p-2 flex flex-col gap-1 transition-colors hover:bg-muted/20",
                      !isCurrentMonth && "opacity-30"
                    )}
                  >
                    <span className="text-xs font-medium">{format(day, 'd')}</span>
                    <div className="flex flex-col gap-1">
                      {dayProjects.slice(0, 2).map(p => (
                        <div 
                          key={p.id}
                          onClick={() => setSelectedProject(p)}
                          className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                        >
                          {p.name}
                        </div>
                      ))}
                      {dayProjects.length > 2 && (
                        <div className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                          +{dayProjects.length - 2} outros
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Próximas Entregas</h3>
          <div className="flex flex-col gap-3">
            {projects.filter(p => p.status === 'active').sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 5).map(project => (
              <div key={project.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setSelectedProject(project)}>
                <div>
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.client_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">R$ {project.budget.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{project.deadline}</p>
                </div>
              </div>
            ))}
            {projects.filter(p => p.status === 'active').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto ativo no momento.</p>
            )}
          </div>
        </Card>
      </div>
    );
  });

  const CRMView = React.memo(() => {
    const columns: { id: Opportunity['status'], title: string }[] = [
      { id: 'lead', title: 'Leads' },
      { id: 'proposal', title: 'Proposta' },
      { id: 'negotiation', title: 'Negociação' },
      { id: 'closed_won', title: 'Fechado (Ganho)' },
      { id: 'closed_lost', title: 'Fechado (Perdido)' },
    ];

    return (
      <div className="flex flex-col gap-6 p-4 pb-24 md:p-8 overflow-x-auto">
        <header className="flex justify-between items-center min-w-max md:min-w-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CRM Kanban</h1>
            <p className="text-muted-foreground">Gerencie suas oportunidades de negócio.</p>
          </div>
          <Button onClick={() => { resetForms(); setModalType('opportunity'); setIsModalOpen(true); }}>
            <Plus size={18} /> Nova Oportunidade
          </Button>
        </header>

        <div className="flex gap-6 min-w-max">
          {columns.map(col => (
            <div key={col.id} className="w-80 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">{col.title}</h3>
                <span className="bg-muted px-2 py-0.5 rounded text-xs font-bold">
                  {opportunities.filter(o => o.status === col.id).length}
                </span>
              </div>
              <div className="kanban-column">
                {opportunities.filter(o => o.status === col.id).map(opp => (
                  <motion.div 
                    layoutId={opp.id.toString()}
                    key={opp.id} 
                    className="kanban-card group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm">{opp.title}</h4>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit('opportunity', opp)} 
                          className="text-muted-foreground hover:text-primary p-1 hover:bg-muted rounded"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete('opportunities', opp.id)} className="text-rose-500 p-1 hover:bg-rose-50 rounded">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{opp.client_name || 'Sem cliente'}</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-sm font-bold text-primary">R$ {opp.value.toLocaleString()}</span>
                        <div className="flex gap-1">
                          {col.id !== 'lead' && (
                            <button 
                              onClick={() => moveOpportunity(opp.id, columns[columns.findIndex(c => c.id === col.id) - 1].id)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              <ChevronLeft size={14} />
                            </button>
                          )}
                          {col.id !== 'closed_lost' && col.id !== 'closed_won' && (
                            <button 
                              onClick={() => moveOpportunity(opp.id, columns[columns.findIndex(c => c.id === col.id) + 1].id)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="secondary" 
                        className="text-xs w-full"
                        onClick={() => setSelectedOpportunity(opp)}
                      >
                        Detalhes
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  });

  const FinanceView = React.memo(() => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const monthTransactions = transactions.filter(t => {
      const d = parseISO(t.date);
      return d >= monthStart && d <= monthEnd;
    });

    const income = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    return (
      <div className="flex flex-col gap-6 p-4 pb-24 md:p-8 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-muted-foreground">Controle de entradas, saídas e recorrências.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={() => { resetForms(); setModalType('transaction'); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700">
              <Plus size={18} /> Receita
            </Button>
            <Button onClick={() => { resetForms(); setModalType('transaction'); setTransForm(prev => ({...prev, type: 'expense'})); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700">
              <Plus size={18} /> Despesa
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
            <p className="text-xs font-bold uppercase text-emerald-600 mb-1">Entradas no Mês</p>
            <p className="text-2xl font-bold text-emerald-600">R$ {income.toLocaleString()}</p>
          </Card>
          <Card className="p-4 bg-rose-500/10 border-rose-500/20">
            <p className="text-xs font-bold uppercase text-rose-600 mb-1">Saídas no Mês</p>
            <p className="text-2xl font-bold text-rose-600">R$ {expense.toLocaleString()}</p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Calendário Financeiro</h3>
            <div className="flex items-center gap-4">
              <span className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</span>
              <div className="flex gap-1">
                <Button variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 h-auto">
                  <ChevronLeft size={20} />
                </Button>
                <Button variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 h-auto">
                  <ChevronRight size={20} />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="bg-muted/50 p-2 text-center text-xs font-bold uppercase text-muted-foreground">
                {day}
              </div>
            ))}
            {days.map(day => {
              const dayTransactions = transactions.filter(t => isSameDay(parseISO(t.date), day));
              const isCurrentMonth = day >= monthStart && day <= monthEnd;
              
              return (
                <div 
                  key={day.toString()} 
                  onClick={() => {
                    if (dayTransactions.length > 0) {
                      setSelectedDayTransactions({ date: day, transactions: dayTransactions });
                    }
                  }}
                  className={cn(
                    "bg-card min-h-[80px] md:min-h-[100px] p-2 flex flex-col gap-1 transition-colors hover:bg-muted/20 cursor-pointer",
                    !isCurrentMonth && "opacity-30"
                  )}
                >
                  <span className="text-xs font-medium">{format(day, 'd')}</span>
                  <div className="flex flex-col gap-1">
                    {dayTransactions.slice(0, 3).map(t => (
                      <div 
                        key={t.id} 
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded truncate font-medium hidden md:block",
                          t.type === 'income' ? "bg-emerald-500/20 text-emerald-600" : "bg-rose-500/20 text-rose-600"
                        )}
                      >
                        {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()}
                      </div>
                    ))}
                    {dayTransactions.length > 0 && (
                      <div className="md:hidden flex flex-wrap gap-1">
                        {dayTransactions.map(t => (
                          <div 
                            key={t.id}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              t.type === 'income' ? "bg-emerald-500" : "bg-rose-500"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Transações Recentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.slice(0, 10).map(t => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3 font-medium">{t.description}</td>
                    <td className="px-4 py-3">
                      <span className="bg-muted px-2 py-0.5 rounded text-xs">{t.category}</span>
                    </td>
                    <td className={cn("px-4 py-3 font-bold", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit('transaction', t)} className="text-muted-foreground hover:text-primary transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete('transactions', t.id)} className="text-muted-foreground hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  });

  const renderProjectsView = () => {
    if (projectDetailView && selectedProject) {
      // Kanban View
      return (
        <div className="flex flex-col gap-4 p-4 pb-24 md:p-8 min-h-screen bg-background">
          <header className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => { setProjectDetailView(false); setSelectedProject(null); }}>
                <ChevronLeft size={20} /> Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{selectedProject.name}</h1>
                <p className="text-muted-foreground">{selectedProject.client_name}</p>
              </div>
            </div>
            <Button onClick={openAddTaskModal} className="gap-2">
              <Plus size={18} /> Nova Tarefa
            </Button>
          </header>

          {/* Project Info */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h3 className="font-bold mb-3">Informações do Projeto</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase font-bold text-muted-foreground">Status</p>
                <p className="font-bold">{selectedProject.status}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-muted-foreground">Orçamento</p>
                <p className="font-bold">R$ {selectedProject.budget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-muted-foreground">Início</p>
                <p className="font-bold">{selectedProject.startDate}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-muted-foreground">Prazo</p>
                <p className="font-bold">{selectedProject.deadline}</p>
              </div>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
            {(['backlog', 'em_andamento', 'concluida', 'revisao'] as const).map(status => (
              <div key={status} className="bg-muted/30 rounded-lg p-4 min-h-[500px] flex-shrink-0 w-full md:w-auto md:flex-1">
                <h3 className="font-bold text-sm mb-4 uppercase tracking-wide">
                  {status === 'backlog' ? 'Backlog' : 
                   status === 'em_andamento' ? 'Em Andamento' : 
                   status === 'concluida' ? 'Concluída' : 
                   'Revisão'}
                </h3>
                <div className="space-y-2">
                  {projectTasks.filter(task => task.status === status).map(task => (
                    <div key={task.id} className="bg-background border border-border rounded-lg p-3 group hover:shadow-md transition-all">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <p className="text-sm font-bold flex-1">{task.title}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditTaskModal(task)}
                            className="text-blue-500 p-1 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
                              setProjectTasks(projectTasks.filter(t => t.id !== task.id));
                              if (selectedProject) {
                                await deleteProjectTask(selectedProject.id, task.id);
                              }
                            }}
                            className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                            title="Deletar"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                      )}
                      {task.priority && (
                        <p className={cn(
                          "text-xs font-bold mb-1",
                          task.priority === 'high' ? "text-rose-600" :
                          task.priority === 'medium' ? "text-amber-600" :
                          "text-blue-600"
                        )}>
                          {task.priority === 'high' ? '🔴 Alta' : task.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                        </p>
                      )}
                      {task.assignee && (
                        <p className="text-xs text-muted-foreground mb-1">👤 {task.assignee}</p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground">📅 {task.dueDate}</p>
                      )}
                      <div className="flex gap-1 mt-2">
                        {status !== 'backlog' && (
                          <Button
                            variant="ghost"
                            className="flex-1 text-xs py-1"
                            onClick={async () => {
                              const taskIndex = projectTasks.findIndex(t => t.id === task.id);
                              const statuses: Task['status'][] = ['backlog', 'em_andamento', 'concluida', 'revisao'];
                              const currentStatusIndex = statuses.indexOf(status);
                              if (currentStatusIndex > 0) {
                                const updatedTasks = [...projectTasks];
                                const newTask = { ...task, status: statuses[currentStatusIndex - 1] };
                                updatedTasks[taskIndex] = newTask;
                                setProjectTasks(updatedTasks);
                                if (selectedProject) {
                                  await updateProjectTask(selectedProject.id, task.id, { status: newTask.status });
                                }
                              }
                            }}
                          >
                            <ChevronLeft size={12} /> Voltar
                          </Button>
                        )}
                        {status !== 'revisao' && (
                          <Button
                            variant="ghost"
                            className="flex-1 text-xs py-1"
                            onClick={async () => {
                              const taskIndex = projectTasks.findIndex(t => t.id === task.id);
                              const statuses: Task['status'][] = ['backlog', 'em_andamento', 'concluida', 'revisao'];
                              const currentStatusIndex = statuses.indexOf(status);
                              if (currentStatusIndex < statuses.length - 1) {
                                const updatedTasks = [...projectTasks];
                                const newTask = { ...task, status: statuses[currentStatusIndex + 1] };
                                updatedTasks[taskIndex] = newTask;
                                setProjectTasks(updatedTasks);
                                if (selectedProject) {
                                  await updateProjectTask(selectedProject.id, task.id, { status: newTask.status });
                                }
                              }
                            }}
                          >
                            Próxima <ChevronRight size={12} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Modal
            isOpen={isAddTaskModalOpen}
            onClose={() => {
              setIsAddTaskModalOpen(false);
              resetTaskForm();
            }}
            title={editingTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}
          >
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Título</label>
                <input
                  type="text"
                  placeholder="Nome da tarefa..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Descrição</label>
                <Textarea
                  placeholder="Detalhes da tarefa..."
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Prioridade</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Responsável</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Selecione um usuário</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Vencimento</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" onClick={() => { setIsAddTaskModalOpen(false); resetTaskForm(); }} className="flex-1">Cancelar</Button>
                <Button onClick={handleSaveTask} className="flex-1">Salvar Tarefa</Button>
              </div>
            </div>
          </Modal>
        </div>
      );
    }

    // Grid View
    return (
      <div className="flex flex-col gap-6 p-4 pb-24 md:p-8 max-w-7xl mx-auto">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
            <p className="text-muted-foreground">Acompanhe o desenvolvimento da sua software house.</p>
          </div>
          <Button onClick={() => { resetForms(); setModalType('project'); setIsModalOpen(true); }}>
            <Plus size={18} /> Novo Projeto
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Card key={project.id} className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.client_name}</p>
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                  project.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : 
                  project.status === 'completed' ? "bg-blue-500/10 text-blue-600" : 
                  project.status === 'won' ? "bg-green-500/10 text-green-600" :
                  project.status === 'lost' ? "bg-rose-500/10 text-rose-600" :
                  "bg-amber-500/10 text-amber-600"
                )}>
                  {project.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-2 border-y border-border">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Orçamento</p>
                  <p className="font-bold">R$ {project.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Prazo</p>
                  <p className="font-bold text-sm">{project.deadline}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={() => handleEdit('project', project)} className="text-muted-foreground hover:text-primary p-2 h-auto">
                  <Edit2 size={18} />
                </Button>
                <Button variant="ghost" onClick={() => handleDelete('projects', project.id)} className="text-rose-500 hover:bg-rose-50 p-2 h-auto">
                  <Trash2 size={18} />
                </Button>
                <Button variant="secondary" className="text-xs px-3 py-1" onClick={() => { setSelectedProject(project); setProjectTasks(project.tasks || []); setProjectDetailView(true); }}>Detalhes</Button>
              </div>
            </Card>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <Briefcase className="mx-auto text-muted mb-4" size={48} />
              <p className="text-muted-foreground">Nenhum projeto cadastrado.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ClientsView = React.memo(() => {
    const filteredClients = clients.filter(client => 
      client.name.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const selectedClient = filteredClients.length > 0 && opportunities.filter(opp => 
      opp.client_id === selectedClientId
    );

    return (
      <div className="flex flex-col gap-6 p-4 pb-24 md:p-8 max-w-7xl mx-auto">
        <header className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
              <p className="text-muted-foreground">Base de dados de clientes e parceiros.</p>
            </div>
            <Button onClick={() => { resetForms(); setModalType('client'); setIsModalOpen(true); }}>
              <Plus size={18} /> Novo Cliente
            </Button>
          </div>

          {/* Search and View Toggle */}
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-1 border border-border rounded-lg p-1">
              <Button
                variant={clientsViewMode === 'list' ? 'default' : 'ghost'}
                className="px-3 py-2 text-xs"
                onClick={() => setClientsViewMode('list')}
              >
                <List size={14} />
              </Button>
              <Button
                variant={clientsViewMode === 'card' ? 'default' : 'ghost'}
                className="px-3 py-2 text-xs"
                onClick={() => setClientsViewMode('card')}
              >
                <Grid3x3 size={14} />
              </Button>
            </div>
          </div>
        </header>

        {/* Card View */}
        {clientsViewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(client => (
              <Card key={client.id} className="p-6 flex flex-col gap-4 group">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEdit('client', client)} className="text-muted-foreground p-2 hover:bg-muted rounded-full transition-all">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete('clients', client.id)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-full transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.company || 'Pessoa Física'}</p>
                </div>
                {client.cpf_cnpj && (
                  <div className="text-sm bg-muted/50 p-2 rounded text-muted-foreground">
                    <p className="text-[10px] uppercase font-bold">CPF/CNPJ</p>
                    <p className="font-mono">{client.cpf_cnpj}</p>
                  </div>
                )}
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail size={14} />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone size={14} />
                    <span>{client.phone}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button 
                    variant="secondary" 
                    className="flex-1 text-xs py-1 gap-1" 
                    onClick={() => window.open(`mailto:${client.email}`)}
                  >
                    <Mail size={14} /> Email
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="flex-1 text-xs py-1 gap-1" 
                    onClick={() => window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}`)}
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="flex-1 text-xs py-1 gap-1"
                    onClick={() => setSelectedClientId(client.id)}
                  >
                    <ChevronRight size={14} /> Detalhes
                  </Button>
                </div>
              </Card>
            ))}
            {filteredClients.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <Users className="mx-auto text-muted mb-4" size={48} />
                <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {clientsViewMode === 'list' && (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-bold">Nome</th>
                    <th className="text-left p-4 font-bold">Empresa</th>
                    <th className="text-left p-4 font-bold">Email</th>
                    <th className="text-left p-4 font-bold">Telefone</th>
                    <th className="text-left p-4 font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(client => (
                    <tr key={client.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-bold">{client.name}</td>
                      <td className="p-4 text-muted-foreground">{client.company || '-'}</td>
                      <td className="p-4 text-muted-foreground">{client.email}</td>
                      <td className="p-4 text-muted-foreground">{client.phone}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            className="text-xs py-1 px-2" 
                            onClick={() => handleEdit('client', client)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="text-xs py-1 px-2 text-rose-500" 
                            onClick={() => handleDelete('clients', client.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                          <Button 
                            variant="secondary" 
                            className="text-xs py-1 px-2"
                            onClick={() => setSelectedClientId(client.id)}
                          >
                            <ChevronRight size={14} /> Detalhes
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredClients.length === 0 && (
                <div className="py-20 text-center">
                  <Users className="mx-auto text-muted mb-4" size={48} />
                  <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Client Details SlidePanel */}
        {selectedClientId && (
          <SlidePanel
            isOpen={!!selectedClientId}
            onClose={() => setSelectedClientId(null)}
            title={clients.find(c => c.id === selectedClientId)?.name || 'Cliente'}
          >
            {clients.find(c => c.id === selectedClientId) && (
              <div className="flex flex-col gap-6">
                {/* Client Info */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs uppercase font-bold text-muted-foreground">Email</p>
                    <p className="font-bold text-sm">{clients.find(c => c.id === selectedClientId)?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-muted-foreground">Telefone</p>
                    <p className="font-bold text-sm">{clients.find(c => c.id === selectedClientId)?.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs uppercase font-bold text-muted-foreground">Empresa</p>
                    <p className="font-bold text-sm">{clients.find(c => c.id === selectedClientId)?.company || 'Não informado'}</p>
                  </div>
                  {clients.find(c => c.id === selectedClientId)?.cpf_cnpj && (
                    <div className="col-span-2">
                      <p className="text-xs uppercase font-bold text-muted-foreground">CPF/CNPJ</p>
                      <p className="font-mono text-sm">{clients.find(c => c.id === selectedClientId)?.cpf_cnpj}</p>
                    </div>
                  )}
                </div>

                {/* Contact Buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    className="flex-1 text-xs py-2 gap-1" 
                    onClick={() => window.open(`mailto:${clients.find(c => c.id === selectedClientId)?.email}`)}
                  >
                    <Mail size={14} /> Email
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="flex-1 text-xs py-2 gap-1" 
                    onClick={() => window.open(`https://wa.me/${clients.find(c => c.id === selectedClientId)?.phone?.replace(/\D/g, '')}`)}
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </Button>
                </div>

                {/* Associated Opportunities */}
                <div className="border-t border-border pt-4">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Briefcase size={16} /> Oportunidades Associadas
                  </h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {opportunities.filter(opp => opp.client_id === selectedClientId).length > 0 ? (
                      opportunities.filter(opp => opp.client_id === selectedClientId).map(opp => (
                        <div key={opp.id} className="border border-border rounded-lg p-3 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => { setSelectedOpportunity(opp); setSelectedClientId(null); }}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-bold text-sm">{opp.title}</span>
                            <span className={cn(
                              "text-xs font-bold px-2 py-1 rounded-full",
                              opp.status === 'lead' ? "bg-blue-500/10 text-blue-600" :
                              opp.status === 'proposal' ? "bg-amber-500/10 text-amber-600" :
                              opp.status === 'negotiation' ? "bg-purple-500/10 text-purple-600" :
                              opp.status === 'closed_won' ? "bg-green-500/10 text-green-600" :
                              "bg-rose-500/10 text-rose-600"
                            )}>
                              {opp.status === 'lead' ? 'Lead' :
                              opp.status === 'proposal' ? 'Proposta' :
                              opp.status === 'negotiation' ? 'Negociação' :
                              opp.status === 'closed_won' ? 'Ganho' :
                              'Perdido'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">R$ {opp.value.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{opp.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhuma oportunidade associada</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SlidePanel>
        )}
      </div>
    );
  });

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-8 flex flex-col items-center gap-6 text-center text-foreground border-amber-500/50 bg-amber-500/5">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
            <AlertCircle size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configuração Necessária</h1>
            <p className="text-muted-foreground mt-2">
              As chaves do Firebase não foram encontradas. Para continuar, você precisa configurar os <strong>Secrets</strong> no painel do AI Studio.
            </p>
          </div>
          
          <div className="w-full text-left bg-card border border-border rounded-lg p-4 font-mono text-xs space-y-2">
            <p className="font-bold text-amber-600 mb-2">// Variáveis necessárias:</p>
            <p>VITE_FIREBASE_API_KEY</p>
            <p>VITE_FIREBASE_AUTH_DOMAIN</p>
            <p>VITE_FIREBASE_PROJECT_ID</p>
            <p>VITE_FIREBASE_STORAGE_BUCKET</p>
            <p>VITE_FIREBASE_MESSAGING_SENDER_ID</p>
            <p>VITE_FIREBASE_APP_ID</p>
            <p>VITE_FIREBASE_DATABASE_URL</p>
            <p>VITE_ALLOWED_EMAILS</p>
          </div>

          <p className="text-sm text-muted-foreground">
            Após adicionar as chaves, a página irá recarregar automaticamente.
          </p>
        </Card>
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 flex flex-col items-center gap-6 text-center text-foreground">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20">
            <LayoutDashboard size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SoftERP</h1>
            <p className="text-muted-foreground mt-1">Acesse o ERP da sua Software House</p>
          </div>
          <Button onClick={handleLogin} className="w-full py-6 text-lg gap-3">
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Entrar com Google
          </Button>
          <p className="text-xs text-muted-foreground">
            Acesso restrito aos administradores autorizados.
          </p>
        </Card>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 flex flex-col items-center gap-6 text-center text-foreground">
          <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600">
            <Lock size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Acesso Negado</h1>
            <p className="text-muted-foreground mt-1">Seu email ({user.email}) não está na lista de acesso.</p>
          </div>
          <Button variant="secondary" onClick={handleLogout} className="w-full">
            Sair e tentar outra conta
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:flex flex-col p-6 gap-8 z-40">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <LayoutDashboard size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">SoftERP</span>
          </div>
          <Button variant="ghost" onClick={() => setDarkMode(!darkMode)} className="rounded-full p-2 h-auto">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'crm', icon: Trello, label: 'CRM Kanban' },
            { id: 'finance', icon: DollarSign, label: 'Financeiro' },
            { id: 'projects', icon: Briefcase, label: 'Projetos' },
            { id: 'clients', icon: Users, label: 'Clientes' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                activeTab === item.id ? "text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              )}
            >
              {activeTab === item.id && (
                <motion.div 
                  layoutId="sidebar-nav-pill"
                  className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon size={20} className={cn("transition-transform group-hover:scale-110", activeTab === item.id && "scale-110")} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl">
            <img src={user?.photoURL || ''} className="w-8 h-8 rounded-full border border-border" alt="Avatar" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold truncate">{user?.displayName}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
            </div>
            <button onClick={handleLogout} className="ml-auto text-muted-foreground hover:text-rose-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
          <Card className="p-4 bg-primary/5 border-primary/10">
            <p className="text-xs font-bold uppercase text-primary mb-1">Suporte Premium</p>
            <p className="text-xs text-muted-foreground mb-3">Precisa de ajuda com seu ERP?</p>
            <Button className="w-full text-xs py-2">Falar com Consultor</Button>
          </Card>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'crm' && <CRMView />}
            {activeTab === 'finance' && <FinanceView />}
            {activeTab === 'projects' && renderProjectsView()}
            {activeTab === 'clients' && <ClientsView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border h-20 px-4 flex items-center justify-around lg:hidden z-50">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
          { id: 'crm', icon: Trello, label: 'CRM' },
          { id: 'finance', icon: DollarSign, label: 'Money' },
          { id: 'projects', icon: Briefcase, label: 'Projetos' },
          { id: 'clients', icon: Users, label: 'Clientes' },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)} 
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 w-16 h-16 transition-colors",
              activeTab === item.id ? "text-primary" : "text-muted-foreground"
            )}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="mobile-nav-pill"
                className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <motion.div
              animate={{ 
                scale: activeTab === item.id ? 1.1 : 1,
                y: activeTab === item.id ? -2 : 0
              }}
            >
              <item.icon size={24} />
            </motion.div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-24 right-6 lg:hidden z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              className="flex flex-col items-end gap-2 mb-2"
            >
              {[
                { label: 'Transação', icon: DollarSign, color: 'bg-emerald-600', onClick: () => { resetForms(); setModalType('transaction'); setIsModalOpen(true); } },
                { label: 'Projeto', icon: Briefcase, color: 'bg-blue-600', onClick: () => { resetForms(); setModalType('project'); setIsModalOpen(true); } },
                { label: 'Oportunidade', icon: Trello, color: 'bg-amber-600', onClick: () => { resetForms(); setModalType('opportunity'); setIsModalOpen(true); } },
                { label: 'Cliente', icon: Users, color: 'bg-indigo-600', onClick: () => { resetForms(); setModalType('client'); setIsModalOpen(true); } },
              ].map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { action.onClick(); setIsFabOpen(false); }}
                  className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-full shadow-lg"
                >
                  <span className="text-xs font-bold uppercase tracking-wider">{action.label}</span>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", action.color)}>
                    <action.icon size={16} />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsFabOpen(!isFabOpen)}
          className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center"
        >
          <motion.div animate={{ rotate: isFabOpen ? 45 : 0 }}>
            <Plus size={28} />
          </motion.div>
        </motion.button>
      </div>

      {/* Day Details Modal */}
      <Modal 
        isOpen={!!selectedDayTransactions} 
        onClose={() => setSelectedDayTransactions(null)} 
        title={selectedDayTransactions ? `Transações - ${format(selectedDayTransactions.date, 'dd/MM/yyyy')}` : ''}
      >
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
          {selectedDayTransactions?.transactions.map(t => (
            <div key={t.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex flex-col">
                <span className="font-bold text-sm">{t.description}</span>
                <span className="text-xs text-muted-foreground">{t.category}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={cn("font-bold", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                  {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString()}
                </span>
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => { 
                      handleEdit('transaction', t); 
                      setSelectedDayTransactions(null); 
                    }} 
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => { 
                      handleDelete('transactions', t.id); 
                      setSelectedDayTransactions(null); 
                    }} 
                    className="text-rose-500 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {selectedDayTransactions?.transactions.length === 0 && (
            <p className="text-center text-muted-foreground py-4">Nenhuma transação neste dia.</p>
          )}
        </div>
      </Modal>

      {/* Modals */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); resetForms(); }} 
        title={
          modalType === 'client' ? (editingId ? 'Editar Cliente' : 'Novo Cliente') : 
          modalType === 'opportunity' ? (editingId ? 'Editar Oportunidade' : 'Nova Oportunidade') : 
          modalType === 'project' ? (editingId ? 'Editar Projeto' : 'Novo Projeto') : 
          (editingId ? 'Editar Transação' : 'Nova Transação')
        }
      >
        <div className="flex flex-col gap-4">
          {modalType === 'client' && (
            <>
              <Input label="Nome" value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} placeholder="Ex: João Silva" />
              <Input label="CPF/CNPJ" value={clientForm.cpf_cnpj} onChange={e => setClientForm({...clientForm, cpf_cnpj: e.target.value})} placeholder="000.000.000-00 ou 00.000.000/0000-00" />
              <Input label="Email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} placeholder="joao@email.com" />
              <Input label="Telefone" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} placeholder="(11) 99999-9999" />
              <Input label="Empresa" value={clientForm.company} onChange={e => setClientForm({...clientForm, company: e.target.value})} placeholder="Ex: Google" />
            </>
          )}
          {modalType === 'opportunity' && (
            <>
              <Input label="Título" value={oppForm.title} onChange={e => setOppForm({...oppForm, title: e.target.value})} placeholder="Ex: Desenvolvimento Web" />
              <Select 
                label="Cliente" 
                value={oppForm.client_id} 
                searchable={true}
                onChange={e => setOppForm({...oppForm, client_id: e.target.value})}
                options={[{ value: '', label: 'Selecione um cliente' }, ...clients.map(c => ({ value: c.id.toString(), label: c.name }))]} 
              />
              <Input label="Valor (R$)" type="number" value={oppForm.value} onChange={e => setOppForm({...oppForm, value: e.target.value})} placeholder="0.00" />
              <Select 
                label="Status" 
                value={oppForm.status} 
                onChange={e => setOppForm({...oppForm, status: e.target.value as any})}
                options={[
                  { value: 'lead', label: 'Lead' },
                  { value: 'proposal', label: 'Proposta' },
                  { value: 'negotiation', label: 'Negociação' },
                  { value: 'closed_won', label: 'Fechado (Ganho)' },
                  { value: 'closed_lost', label: 'Fechado (Perdido)' },
                ]} 
              />
              <Textarea label="Descrição" value={oppForm.description} onChange={e => setOppForm({...oppForm, description: e.target.value})} placeholder="Detalhes da oportunidade..." />
            </>
          )}
          {modalType === 'project' && (
            <>
              <Input label="Nome do Projeto" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} placeholder="Ex: App Mobile" />
              <Select 
                label="Cliente" 
                value={projectForm.client_id} 
                onChange={e => setProjectForm({...projectForm, client_id: e.target.value})}
                options={[{ value: '', label: 'Selecione um cliente' }, ...clients.map(c => ({ value: c.id.toString(), label: c.name }))]} 
              />
              <Input label="Orçamento (R$)" type="number" value={projectForm.budget} onChange={e => setProjectForm({...projectForm, budget: e.target.value})} placeholder="0.00" />
              <Input label="Data Início" type="date" value={projectForm.startDate} onChange={e => setProjectForm({...projectForm, startDate: e.target.value})} />
              <Input label="Data Término" type="date" value={projectForm.deadline} onChange={e => setProjectForm({...projectForm, deadline: e.target.value})} />
              <Select 
                label="Status" 
                value={projectForm.status} 
                onChange={e => setProjectForm({...projectForm, status: e.target.value as any})}
                options={[
                  { value: 'active', label: 'Ativo' },
                  { value: 'completed', label: 'Concluído' },
                  { value: 'on_hold', label: 'Em espera' },
                  { value: 'won', label: 'Ganho' },
                  { value: 'lost', label: 'Perdido' },
                ]} 
              />
            </>
          )}
          {modalType === 'transaction' && (
            <>
              <Select 
                label="Tipo" 
                value={transForm.type} 
                onChange={e => setTransForm({...transForm, type: e.target.value as any})}
                options={[
                  { value: 'income', label: 'Entrada (Receita)' },
                  { value: 'expense', label: 'Saída (Despesa)' },
                ]} 
              />
              <Input label="Descrição" value={transForm.description} onChange={e => setTransForm({...transForm, description: e.target.value})} placeholder="Ex: Pagamento Projeto X" />
              <Input label="Categoria" value={transForm.category} onChange={e => setTransForm({...transForm, category: e.target.value})} placeholder="Ex: Consultoria, Servidores, etc." />
              <Input label="Valor (R$)" type="number" value={transForm.amount} onChange={e => setTransForm({...transForm, amount: e.target.value})} placeholder="0.00" />
              <Input label="Data" type="date" value={transForm.date} onChange={e => setTransForm({...transForm, date: e.target.value})} />
              <div className="flex items-center gap-2 py-2">
                <input 
                  type="checkbox" 
                  id="recurring" 
                  checked={transForm.is_recurring} 
                  onChange={e => setTransForm({...transForm, is_recurring: e.target.checked})}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="recurring" className="text-sm font-medium">Despesa/Receita Recorrente</label>
              </div>
            </>
          )}
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleAdd} className="flex-1">Salvar</Button>
          </div>
        </div>
      </Modal>


      {/* Opportunity Details SlidePanel */}
      <SlidePanel 
        isOpen={!!selectedOpportunity} 
        onClose={() => setSelectedOpportunity(null)} 
        title={selectedOpportunity ? `${selectedOpportunity.title}` : ''}
      >
        <div className="flex flex-col gap-6">
          {/* Opportunity Info */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs uppercase font-bold text-muted-foreground">Cliente</p>
              <p className="font-bold">{selectedOpportunity?.client_name}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-muted-foreground">Valor</p>
              <p className="font-bold text-primary">R$ {selectedOpportunity?.value.toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase font-bold text-muted-foreground">Status</p>
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded-full inline-block mt-1",
                selectedOpportunity?.status === 'lead' ? "bg-blue-500/10 text-blue-600" :
                selectedOpportunity?.status === 'proposal' ? "bg-amber-500/10 text-amber-600" :
                selectedOpportunity?.status === 'negotiation' ? "bg-purple-500/10 text-purple-600" :
                selectedOpportunity?.status === 'closed_won' ? "bg-green-500/10 text-green-600" :
                "bg-rose-500/10 text-rose-600"
              )}>
                {selectedOpportunity?.status === 'lead' ? 'Lead' :
                selectedOpportunity?.status === 'proposal' ? 'Proposta' :
                selectedOpportunity?.status === 'negotiation' ? 'Negociação' :
                selectedOpportunity?.status === 'closed_won' ? 'Fechado (Ganho)' :
                'Fechado (Perdido)'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs uppercase font-bold text-muted-foreground mb-2">Descrição</p>
            <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">{selectedOpportunity?.description || 'Sem descrição'}</p>
          </div>

          {/* Contact Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              className="flex-1 text-xs py-2 gap-1" 
              onClick={() => window.open(`mailto:${selectedOpportunity?.client_email}`)}
            >
              <Mail size={14} /> Email
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 text-xs py-2 gap-1" 
              onClick={() => window.open(`https://wa.me/${selectedOpportunity?.client_phone?.replace(/\D/g, '')}`)}
            >
              <MessageCircle size={14} /> WhatsApp
            </Button>
          </div>

          {/* Add Contact History Form */}
          <div className="border-t border-border pt-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Plus size={14} /> {editingContactId ? 'Editar Contato' : 'Adicionar Contato'}
            </h3>
            
            {/* Contact Type Buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {(['email', 'phone', 'whatsapp', 'visit', 'other'] as const).map(type => (
                <Button
                  key={type}
                  className={cn(
                    "text-xs py-2 px-3 flex items-center gap-1 transition-all border",
                    newContactType === type 
                      ? "bg-primary text-primary-foreground border-primary shadow-md" 
                      : "bg-muted text-foreground border-border hover:bg-muted/80"
                  )}
                  onClick={() => setNewContactType(type)}
                >
                  {type === 'email' && <Mail size={12} />}
                  {type === 'phone' && <Phone size={12} />}
                  {type === 'whatsapp' && <MessageCircle size={12} />}
                  {type === 'visit' && <Briefcase size={12} />}
                  {type === 'other' && <AlertCircle size={12} />}
                  {type === 'email' ? 'Email' : type === 'phone' ? 'Telefone' : type === 'whatsapp' ? 'WhatsApp' : type === 'visit' ? 'Visita' : 'Outro'}
                </Button>
              ))}
            </div>

            {/* Date Input */}
            <div className="mb-3">
              <label className="text-xs font-bold text-muted-foreground mb-1 block">Data</label>
              <input
                type="date"
                value={newContactDate}
                onChange={(e) => setNewContactDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Notes Textarea */}
            <div className="mb-3">
              <label className="text-xs font-bold text-muted-foreground mb-1 block">Notas</label>
              <Textarea
                value={newContactNotes}
                onChange={(e) => setNewContactNotes(e.target.value)}
                placeholder="Descreva os detalhes do contato..."
                className="text-sm"
              />
            </div>

            {/* Save/Update Button */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  if (newContactNotes.trim() && selectedOpportunity) {
                    if (editingContactId) {
                      // Update existing contact
                      setSelectedOpportunity(prev => prev ? { 
                        ...prev, 
                        contactHistory: prev.contactHistory?.map(c => 
                          c.id === editingContactId ? { ...c, date: newContactDate, type: newContactType, notes: newContactNotes } : c
                        ) || [] 
                      } : null);
                      setEditingContactId(null);
                    } else {
                      // Add new contact
                      const contact: ContactHistory = {
                        id: Math.random().toString(),
                        date: newContactDate || format(new Date(), 'yyyy-MM-dd'),
                        type: newContactType,
                        notes: newContactNotes
                      };
                      setSelectedOpportunity(prev => prev ? { ...prev, contactHistory: [...(prev.contactHistory || []), contact] } : null);
                    }
                    setNewContactNotes('');
                    setNewContactType('email');
                    setNewContactDate(format(new Date(), 'yyyy-MM-dd'));
                  }
                }}
              >
                <Save size={14} /> {editingContactId ? 'Atualizar' : 'Salvar'} Contato
              </Button>
              {editingContactId && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditingContactId(null);
                    setNewContactNotes('');
                    setNewContactType('email');
                    setNewContactDate(format(new Date(), 'yyyy-MM-dd'));
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          {/* Contact History List */}
          <div className="border-t border-border pt-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Clock size={16} />
              Histórico de Contato
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {selectedOpportunity?.contactHistory && selectedOpportunity.contactHistory.length > 0 ? (
                selectedOpportunity.contactHistory.map(contact => (
                  <div key={contact.id} className="border border-border rounded-lg p-3 text-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {contact.type === 'email' && <Mail size={14} className="text-blue-600" />}
                        {contact.type === 'phone' && <Phone size={14} className="text-blue-600" />}
                        {contact.type === 'whatsapp' && <MessageCircle size={14} className="text-green-600" />}
                        {contact.type === 'visit' && <Briefcase size={14} className="text-amber-600" />}
                        {contact.type === 'other' && <AlertCircle size={14} className="text-muted-foreground" />}
                        <span className="font-bold capitalize">{contact.type === 'email' ? 'Email' : contact.type === 'phone' ? 'Telefone' : contact.type === 'whatsapp' ? 'WhatsApp' : contact.type === 'visit' ? 'Visita' : 'Outro'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{contact.date}</span>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap mb-2">{contact.notes}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="text-xs py-1 px-2 text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setEditingContactId(contact.id);
                          setNewContactNotes(contact.notes);
                          setNewContactType(contact.type);
                          setNewContactDate(contact.date);
                        }}
                      >
                        <Edit2 size={12} /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-xs py-1 px-2 text-rose-500 hover:bg-rose-50"
                        onClick={() => {
                          setSelectedOpportunity(prev => prev ? { ...prev, contactHistory: prev.contactHistory?.filter(c => c.id !== contact.id) || [] } : null);
                        }}
                      >
                        <Trash2 size={12} /> Excluir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum contato registrado</p>
              )}
            </div>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
