import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, GripVertical, Calendar, Flag, Trash2, CheckCircle2, Circle, Clock, User, FolderKanban, Filter, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import { useTasks, type Task } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuthContext } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  todo: { label: 'قيد الانتظار', icon: Circle, color: 'text-muted-foreground', bg: 'bg-secondary/50', border: 'border-border' },
  in_progress: { label: 'قيد التنفيذ', icon: Clock, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  done: { label: 'مكتملة', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: 'bg-muted text-muted-foreground' },
  medium: { label: 'متوسطة', color: 'bg-warning/15 text-warning' },
  high: { label: 'عالية', color: 'bg-destructive/15 text-destructive' },
  urgent: { label: 'عاجلة', color: 'bg-destructive text-destructive-foreground' },
};

function TaskCard({ task, onUpdate, onDelete, isCEO }: { task: Task; onUpdate: (updates: Partial<Task>) => void; onDelete: () => void; isCEO: boolean }) {
  const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-card transition-all group"
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => {
            const next = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
            onUpdate({ status: next });
          }}
          className={`mt-0.5 shrink-0 ${STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]?.color || 'text-muted-foreground'}`}
        >
          {task.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : task.status === 'in_progress' ? <Clock className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</p>
          {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="secondary" className={`text-[10px] ${pri.color}`}>{pri.label}</Badge>
            {task.assigned_to_name && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{task.assigned_to_name}</span>
            )}
            {task.due_date && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{task.due_date}</span>
            )}
            {task.source_label && (
              <span className="text-[10px] text-primary/70 flex items-center gap-1">🔗 {task.source_label}</span>
            )}
          </div>
        </div>
        {isCEO && (
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-destructive/50 hover:text-destructive transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function TasksBoard() {
  const { isCEO, profile, user } = useAuthContext();
  const { tasks, todoTasks, inProgressTasks, doneTasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
  const { data: projects } = useProjects();
  const { data: employees } = useEmployees();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', project_id: '', assigned_to_name: '', due_date: '' });

  const handleCreate = () => {
    if (!newTask.title.trim()) { toast.error('أدخل عنوان المهمة'); return; }
    createTask.mutate({
      title: newTask.title.trim(),
      description: newTask.description.trim() || null,
      priority: newTask.priority,
      project_id: newTask.project_id || null,
      assigned_to_name: newTask.assigned_to_name || null,
      due_date: newTask.due_date || null,
    });
    setNewTask({ title: '', description: '', priority: 'medium', project_id: '', assigned_to_name: '', due_date: '' });
    setCreateOpen(false);
  };

  const filterTasks = (list: Task[]) => {
    let filtered = list;
    if (search) filtered = filtered.filter(t => t.title.includes(search) || t.description?.includes(search));
    if (filterProject !== 'all') filtered = filtered.filter(t => t.project_id === filterProject);
    return filtered;
  };

  const columns = [
    { key: 'todo', tasks: filterTasks(todoTasks) },
    { key: 'in_progress', tasks: filterTasks(inProgressTasks) },
    { key: 'done', tasks: filterTasks(doneTasks) },
  ] as const;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-black text-foreground">📋 إدارة المهام</h1>
            <p className="text-sm text-muted-foreground">تتبع وإدارة المهام لجميع الفرق والمشاريع</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> مهمة جديدة</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>إنشاء مهمة جديدة</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="عنوان المهمة..." value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} />
                <Textarea placeholder="وصف المهمة..." value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} rows={3} />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue placeholder="الأولوية" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="urgent">عاجلة</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newTask.project_id} onValueChange={v => setNewTask(p => ({ ...p, project_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="المشروع" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون مشروع</SelectItem>
                      {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Input type="date" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} />
                <Input placeholder="تعيين إلى (اسم الموظف)..." value={newTask.assigned_to_name} onChange={e => setNewTask(p => ({ ...p, assigned_to_name: e.target.value }))} />
                <Button onClick={handleCreate} className="w-full" disabled={createTask.isPending}>
                  {createTask.isPending ? 'جاري الإنشاء...' : 'إنشاء المهمة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث في المهام..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
          </div>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-48"><FolderKanban className="w-4 h-4 ml-2" /><SelectValue placeholder="كل المشاريع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المشاريع</SelectItem>
              {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {columns.map(col => {
            const cfg = STATUS_CONFIG[col.key];
            return (
              <div key={col.key} className={`rounded-xl ${cfg.bg} border ${cfg.border} p-3 text-center`}>
                <p className={`text-2xl font-heading font-black ${cfg.color}`}>{col.tasks.length}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
              </div>
            );
          })}
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {columns.map(col => {
              const cfg = STATUS_CONFIG[col.key];
              return (
                <div key={col.key} className="space-y-3">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cfg.bg}`}>
                    <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                    <span className={`text-sm font-heading font-bold ${cfg.color}`}>{cfg.label}</span>
                    <Badge variant="secondary" className="mr-auto text-[10px]">{col.tasks.length}</Badge>
                  </div>
                  <AnimatePresence>
                    {col.tasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isCEO={isCEO}
                        onUpdate={(updates) => updateTask.mutate({ id: task.id, ...updates })}
                        onDelete={() => deleteTask.mutate(task.id)}
                      />
                    ))}
                  </AnimatePresence>
                  {col.tasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs rounded-xl border border-dashed border-border">
                      لا توجد مهام
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
