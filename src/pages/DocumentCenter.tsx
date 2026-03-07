import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Trash2, Download, Pencil, Check, X, FolderOpen, Search, Loader2, Building2, FolderTree, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import PrintButton from '@/components/PrintButton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'financial', label: '💰 مالي', color: 'bg-success/10 text-success border-success/20' },
  { value: 'legal', label: '⚖️ قانوني', color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'investment', label: '📈 استثماري', color: 'bg-gold/10 text-gold border-gold/20' },
  { value: 'projects', label: '📂 مشاريع', color: 'bg-section-revenue/10 text-section-revenue border-section-revenue/20' },
  { value: 'hr', label: '👥 موارد بشرية', color: 'bg-section-employees/10 text-section-employees border-section-employees/20' },
  { value: 'operations', label: '⚙️ تشغيل', color: 'bg-warning/10 text-warning border-warning/20' },
  { value: 'contracts', label: '📋 عقود', color: 'bg-purple/10 text-purple border-purple/20' },
  { value: 'general', label: '📋 عام', color: 'bg-muted text-muted-foreground border-border' },
];

const DEFAULT_BUSINESSES = ['البادل', 'أومبركس', 'الشاشات'];
const DEFAULT_SECTIONS = ['مالية', 'تشغيل', 'عقود', 'استثمارات', 'أخرى'];

interface Doc {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
  business_name: string | null;
  section: string | null;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentCenter() {
  const { profile, isCEO } = useAuthContext();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newDescription, setNewDescription] = useState('');
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newSection, setNewSection] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [customBusiness, setCustomBusiness] = useState('');
  const [showAddBusiness, setShowAddBusiness] = useState(false);

  const { data: docs, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Doc[];
    },
  });

  // Derive available businesses from DB + defaults
  const businesses = useMemo(() => {
    const fromDb = docs?.map(d => d.business_name).filter(Boolean) as string[] || [];
    return [...new Set([...DEFAULT_BUSINESSES, ...fromDb])];
  }, [docs]);

  const deleteMutation = useMutation({
    mutationFn: async (doc: Doc) => {
      const path = doc.file_url.split('/documents/')[1];
      if (path) await supabase.storage.from('documents').remove([path]);
      const { error } = await supabase.from('documents' as any).delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('تم حذف الملف');
    },
    onError: () => toast.error('فشل حذف الملف'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description: string }) => {
      const { error } = await supabase.from('documents' as any).update({ title, description } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setEditingId(null);
      toast.success('تم التحديث');
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('documents').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);

      const { error: dbError } = await supabase.from('documents' as any).insert({
        title: file.name.replace(/\.[^.]+$/, ''),
        description: newDescription || null,
        category: newCategory,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: profile?.display_name || 'مجهول',
        business_name: newBusinessName || null,
        section: newSection || null,
      } as any);
      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('تم رفع الملف بنجاح');
      setNewDescription('');
      setNewCategory('general');
      setNewBusinessName('');
      setNewSection('');
    } catch (err) {
      console.error(err);
      toast.error('فشل رفع الملف');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const filtered = docs?.filter(d => {
    if (filter !== 'all' && d.category !== filter) return false;
    if (selectedBusiness && d.business_name !== selectedBusiness) return false;
    if (selectedSection && d.section !== selectedSection) return false;
    if (search && !d.title.includes(search) && !d.file_name.includes(search)) return false;
    return true;
  }) || [];

  const getCategoryStyle = (cat: string) => CATEGORIES.find(c => c.value === cat)?.color || CATEGORIES[7].color;
  const getCategoryLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label || '📋 عام';

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/15">
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">مركز الملفات</h1>
              <p className="text-sm text-muted-foreground">إدارة ورفع وتصنيف ملفات الشركة — بزنس {'>'} قسم {'>'} ملف</p>
            </div>
          </div>
          <div className="flex gap-2">
            <PrintButton title="طباعة مركز الملفات" />
            <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Upload className="w-4 h-4 ml-1" />}
              رفع ملف
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Business Hierarchy Navigation */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-heading text-muted-foreground">البزنس</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => { setSelectedBusiness(null); setSelectedSection(null); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${!selectedBusiness ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-secondary/30 border-border text-muted-foreground'}`}>
            الكل
          </button>
          {businesses.map(b => {
            const count = docs?.filter(d => d.business_name === b).length || 0;
            return (
              <button key={b} onClick={() => { setSelectedBusiness(b); setSelectedSection(null); }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${selectedBusiness === b ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-secondary/30 border-border text-muted-foreground'}`}>
                🏢 {b} ({count})
              </button>
            );
          })}
          <button onClick={() => setShowAddBusiness(!showAddBusiness)}
            className="text-xs px-2 py-1.5 rounded-lg border border-dashed border-border text-muted-foreground hover:text-primary">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {showAddBusiness && (
          <div className="flex gap-2 mb-3">
            <input value={customBusiness} onChange={e => setCustomBusiness(e.target.value)}
              placeholder="اسم البزنس الجديد..."
              className="bg-secondary/30 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground" />
            <button onClick={() => {
              if (customBusiness.trim()) {
                setNewBusinessName(customBusiness.trim());
                setShowAddBusiness(false);
              }
            }} className="text-xs px-2 py-1.5 bg-success/20 text-success rounded-lg">إضافة</button>
          </div>
        )}

        {selectedBusiness && (
          <div className="flex flex-wrap gap-2 mb-3">
            <FolderTree className="w-4 h-4 text-muted-foreground mt-0.5" />
            <button onClick={() => setSelectedSection(null)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${!selectedSection ? 'bg-gold/15 border-gold/30 text-gold' : 'bg-secondary/30 border-border text-muted-foreground'}`}>
              كل الأقسام
            </button>
            {DEFAULT_SECTIONS.map(s => {
              const count = docs?.filter(d => d.business_name === selectedBusiness && d.section === s).length || 0;
              return (
                <button key={s} onClick={() => setSelectedSection(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${selectedSection === s ? 'bg-gold/15 border-gold/30 text-gold' : 'bg-secondary/30 border-border text-muted-foreground'}`}>
                  📁 {s} ({count})
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Upload config */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 bg-card rounded-xl border border-border p-4 shadow-card">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground mb-1 block">البزنس</label>
            <select value={newBusinessName} onChange={e => setNewBusinessName(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground">
              <option value="">بدون بزنس</option>
              {businesses.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground mb-1 block">القسم</label>
            <select value={newSection} onChange={e => setNewSection(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground">
              <option value="">بدون قسم</option>
              {DEFAULT_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground mb-1 block">تصنيف الملف</label>
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground mb-1 block">وصف (اختياري)</label>
            <input value={newDescription} onChange={e => setNewDescription(e.target.value)}
              placeholder="وصف مختصر للملف..."
              className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
          </div>
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg" />
      </motion.div>

      {/* Filter & Search */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filter === 'all' ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-secondary/30 border-border text-muted-foreground'}`}>
          الكل ({docs?.length || 0})
        </button>
        {CATEGORIES.map(c => {
          const count = docs?.filter(d => d.category === c.value).length || 0;
          return (
            <button key={c.value} onClick={() => setFilter(c.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filter === c.value ? `${c.color}` : 'bg-secondary/30 border-border text-muted-foreground'}`}>
              {c.label} ({count})
            </button>
          );
        })}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث في الملفات..."
              className="w-full bg-secondary/30 border border-border rounded-lg pr-10 pl-3 py-1.5 text-sm text-foreground" />
          </div>
        </div>
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">لا توجد ملفات</p>
          <p className="text-xs text-muted-foreground mt-1">اضغط على "رفع ملف" لإضافة ملف جديد</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc, i) => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-elevated transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === doc.id ? (
                    <div className="space-y-2">
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        className="w-full bg-background border border-primary/30 rounded px-2 py-1 text-sm text-foreground" />
                      <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                        placeholder="وصف..."
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground" />
                      <div className="flex gap-1">
                        <button onClick={() => updateMutation.mutate({ id: doc.id, title: editTitle, description: editDesc })}
                          className="flex items-center gap-1 px-2 py-0.5 text-xs bg-success/20 text-success rounded">
                          <Check className="w-3 h-3" /> حفظ
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 px-2 py-0.5 text-xs bg-destructive/20 text-destructive rounded">
                          <X className="w-3 h-3" /> إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-sm font-heading font-bold text-foreground truncate">{doc.title}</h4>
                      {doc.description && <p className="text-xs text-muted-foreground truncate">{doc.description}</p>}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full border ${getCategoryStyle(doc.category)}`}>{getCategoryLabel(doc.category)}</span>
                        {doc.business_name && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">🏢 {doc.business_name}</span>}
                        {doc.section && <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">📁 {doc.section}</span>}
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>{doc.uploaded_by}</span>
                        <span>{new Date(doc.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </>
                  )}
                </div>
                {editingId !== doc.id && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="تحميل">
                      <Download className="w-4 h-4" />
                    </a>
                    <button onClick={() => { setEditingId(doc.id); setEditTitle(doc.title); setEditDesc(doc.description || ''); }}
                      className="p-2 rounded-lg hover:bg-accent/10 text-accent transition-colors" title="تعديل">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذا الملف؟')) deleteMutation.mutate(doc); }}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  );
}
