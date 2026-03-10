import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Clock, CheckCircle2, Trophy, ChevronRight, Loader2, CalendarDays,
  User, BarChart3, BookOpen, Plus, Trash2, Edit3, Eye, EyeOff, Lightbulb, Star,
  BookMarked, Shield, Users, Zap, Target, Monitor, HeadphonesIcon, TrendingUp,
  ChevronLeft, Search, ArrowLeft
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  useMyQuiz, useQuizQuestions, useMyAttempt, useAllQuizzes, useAllAttempts,
  useStartQuiz, useSubmitQuiz
} from '@/hooks/useQuizzes';
import {
  useLearningMaterials, useAllLearningMaterials, useAddLearningMaterial,
  useUpdateLearningMaterial, useDeleteLearningMaterial
} from '@/hooks/useLearningMaterials';

const CATEGORIES = ['عام', 'النظام', 'إدارة المشاريع', 'المالية', 'المهارات القيادية', 'التقنية', 'خدمة العملاء', 'الأمن المعلوماتي'];

const CATEGORY_CONFIG: Record<string, { icon: any; gradient: string; bg: string; emoji: string }> = {
  'النظام':           { icon: Monitor,        gradient: 'from-blue-500 to-cyan-500',    bg: 'bg-blue-500/10',   emoji: '💻' },
  'إدارة المشاريع':  { icon: Target,         gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-500/10', emoji: '🎯' },
  'المالية':          { icon: TrendingUp,      gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-500/10', emoji: '💰' },
  'المهارات القيادية':{ icon: Users,           gradient: 'from-amber-500 to-orange-500',  bg: 'bg-amber-500/10',  emoji: '🏆' },
  'التقنية':          { icon: Zap,             gradient: 'from-rose-500 to-pink-500',     bg: 'bg-rose-500/10',   emoji: '⚡' },
  'خدمة العملاء':     { icon: HeadphonesIcon,  gradient: 'from-teal-500 to-cyan-500',     bg: 'bg-teal-500/10',   emoji: '🤝' },
  'الأمن المعلوماتي': { icon: Shield,          gradient: 'from-red-500 to-rose-500',      bg: 'bg-red-500/10',    emoji: '🔒' },
  'عام':              { icon: BookOpen,         gradient: 'from-indigo-500 to-blue-500',   bg: 'bg-indigo-500/10', emoji: '📚' },
};

/* ─── TAKE QUIZ VIEW ─── */
function TakeQuizView({ quizId, onBack }: { quizId: string; onBack: () => void }) {
  const { profile } = useAuthContext();
  const { data: questions, isLoading } = useQuizQuestions(quizId);
  const { data: attempt } = useMyAttempt(quizId);
  const startQuiz = useStartQuiz();
  const submitQuiz = useSubmitQuiz();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);

  const isSubmitted = attempt?.status === 'submitted';

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!questions?.length) return <div className="text-center py-20 text-muted-foreground">لا توجد أسئلة</div>;

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack}>← العودة</Button>
        <Card className="border-primary/30">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">تم تسليم اختبارك بنجاح ✅</h2>
            <p className="text-muted-foreground">شكراً لك! تم إرسال إجاباتك للمراجعة</p>
            <Button onClick={onBack} className="mt-4">العودة</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack}>← العودة</Button>
        <Card className="border-primary/30">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">تم تسليم اختبارك بنجاح ✅</h2>
            <p className="text-muted-foreground">شكراً لك! تم إرسال إجاباتك للمراجعة</p>
            <Button onClick={onBack} className="mt-4">العودة</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack}>← العودة</Button>
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <GraduationCap className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">هل أنت مستعد؟</h2>
            <p className="text-muted-foreground">{questions.length} سؤال تعليمي</p>
            <Button size="lg" onClick={() => startQuiz.mutate({ quizId, employeeName: profile?.display_name || '' })} disabled={startQuiz.isPending} className="mt-4">
              {startQuiz.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              ابدأ الاختبار الآن
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} size="sm">← العودة</Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{answeredCount}/{questions.length}</span>
          <Progress value={(answeredCount / questions.length) * 100} className="w-32 h-2" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {questions.map((_: any, i: number) => (
          <button key={i} onClick={() => setCurrentQ(i)}
            className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${
              i === currentQ ? 'bg-primary text-primary-foreground'
              : answers[questions[i].id] ? 'bg-accent text-accent-foreground border border-primary/30'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>{i + 1}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {q.question_type === 'mcq' ? 'اختيار من متعدد' : q.question_type === 'true_false' ? 'صح أو خطأ' : 'تحرير'}
                </Badge>
                <span className="text-xs text-muted-foreground">{q.points} نقاط</span>
              </div>
              <CardTitle className="text-lg leading-relaxed mt-2">{q.question_text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {q.question_type === 'text' ? (
                <Textarea placeholder="اكتب إجابتك هنا..." value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="min-h-[100px]" dir="rtl" />
              ) : (
                <RadioGroup value={answers[q.id] || ''} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })} className="space-y-2">
                  {(q.options || []).map((opt: any) => (
                    <div key={opt.label} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${answers[q.id] === opt.label ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}>
                      <RadioGroupItem value={opt.label} id={`${q.id}-${opt.label}`} />
                      <Label htmlFor={`${q.id}-${opt.label}`} className="flex-1 cursor-pointer">
                        <span className="font-bold ml-2">{opt.label}.</span>{opt.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              <div className="flex justify-between pt-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>السابق</Button>
                {currentQ < questions.length - 1 ? (
                  <Button size="sm" onClick={() => setCurrentQ(currentQ + 1)}>التالي</Button>
                ) : (
                  <Button size="sm" onClick={async () => { const res = await submitQuiz.mutateAsync({ attemptId: attempt.id, answers, questions }); setResult(res); setSubmitted(true); }} disabled={submitQuiz.isPending}>
                    {submitQuiz.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <CheckCircle2 className="h-4 w-4 ml-2" />}
                    تسليم الاختبار
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── ARTICLE VIEW ─── */
function ArticleView({ material, onBack }: { material: any; onBack: () => void }) {
  const config = CATEGORY_CONFIG[material.category] || CATEGORY_CONFIG['عام'];
  const IconComp = config.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> العودة لمركز التعلّم
      </Button>

      <div className={`rounded-2xl bg-gradient-to-br ${config.gradient} p-8 text-white`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
            <IconComp className="h-6 w-6" />
          </div>
          <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">{material.category}</Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-black leading-snug">{material.title}</h1>
      </div>

      {material.image_url && (
        <div className="rounded-xl overflow-hidden border border-border">
          <img src={material.image_url} alt={material.title} className="w-full max-h-96 object-cover" />
        </div>
      )}

      <Card className="border-border/50">
        <CardContent className="p-6 md:p-8">
          <div className="prose prose-lg max-w-none" dir="rtl">
            {material.content.split('\n').map((line: string, i: number) => {
              if (!line.trim()) return <div key={i} className="h-3" />;
              // Headers (lines with emoji at start or ending with :)
              const isHeader = /^[^\w\s]/.test(line.trim()) && line.trim().endsWith(':');
              const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('✅') || line.trim().startsWith('⚠️') || line.trim().startsWith('📌');
              const isNumbered = /^\d+\./.test(line.trim());

              if (isHeader) {
                return <h3 key={i} className="text-lg font-black text-foreground mt-6 mb-3">{line}</h3>;
              }
              if (isBullet) {
                return <p key={i} className="text-muted-foreground leading-relaxed pr-4 py-0.5">{line}</p>;
              }
              if (isNumbered) {
                return <p key={i} className="text-muted-foreground leading-relaxed pr-4 py-0.5 font-medium">{line}</p>;
              }
              // Check for box/table-like content
              if (line.includes('┌') || line.includes('│') || line.includes('└') || line.includes('├')) {
                return <pre key={i} className="text-sm text-muted-foreground font-mono bg-muted/50 rounded-lg px-4 py-1 my-0 leading-relaxed" dir="ltr">{line}</pre>;
              }
              return <p key={i} className="text-foreground leading-relaxed text-base">{line}</p>;
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── LEARNING CENTER ─── */
function LearningCenter() {
  const { isCEO } = useAuthContext();
  const { data: materials, isLoading } = isCEO ? useAllLearningMaterials() : useLearningMaterials();
  const addMaterial = useAddLearningMaterial();
  const updateMaterial = useUpdateLearningMaterial();
  const deleteMaterial = useDeleteLearningMaterial();
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'عام', image_url: '' });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewingArticle, setViewingArticle] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Group materials by category
  const grouped: Record<string, any[]> = {};
  materials?.forEach((m: any) => {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  });

  const filteredMaterials = selectedCategory
    ? materials?.filter((m: any) => m.category === selectedCategory && (
        !searchQuery || m.title.includes(searchQuery) || m.content.includes(searchQuery)
      ))
    : [];

  const handleAdd = () => {
    addMaterial.mutate({ title: form.title, content: form.content, category: form.category, image_url: form.image_url || undefined }, {
      onSuccess: () => { setAddOpen(false); setForm({ title: '', content: '', category: 'عام', image_url: '' }); }
    });
  };

  const handleUpdate = () => {
    if (!editingId) return;
    updateMaterial.mutate({ id: editingId, title: form.title, content: form.content, category: form.category, image_url: form.image_url || undefined }, {
      onSuccess: () => { setEditingId(null); setForm({ title: '', content: '', category: 'عام', image_url: '' }); }
    });
  };

  const startEdit = (m: any) => {
    setEditingId(m.id);
    setForm({ title: m.title, content: m.content, category: m.category, image_url: m.image_url || '' });
    setAddOpen(true);
  };

  // If viewing an article
  if (viewingArticle) {
    return <ArticleView material={viewingArticle} onBack={() => setViewingArticle(null)} />;
  }

  // If a category is selected, show its articles
  if (selectedCategory) {
    const config = CATEGORY_CONFIG[selectedCategory] || CATEGORY_CONFIG['عام'];
    const IconComp = config.icon;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient} text-white`}>
            <IconComp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">{selectedCategory}</h2>
            <p className="text-sm text-muted-foreground">{filteredMaterials?.length || 0} مادة تعليمية</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث في المواد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
            dir="rtl"
          />
        </div>

        <div className="space-y-3">
          {filteredMaterials?.map((m: any, i: number) => (
            <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card
                className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group ${!m.is_published ? 'opacity-60 border-dashed' : ''}`}
                onClick={() => setViewingArticle(m)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} text-white flex items-center justify-center shrink-0 text-xl`}>
                    {config.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{m.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{m.content.slice(0, 80)}...</p>
                    {!m.is_published && <Badge variant="secondary" className="text-xs mt-1">مخفي</Badge>}
                  </div>
                  <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </CardContent>
              </Card>
              {/* CEO inline actions */}
              {isCEO && (
                <div className="flex items-center gap-1 mt-1 mr-16" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(m)} className="h-7 text-xs gap-1 text-muted-foreground">
                    <Edit3 className="h-3 w-3" /> تعديل
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => updateMaterial.mutate({ id: m.id, is_published: !m.is_published })} className="h-7 text-xs gap-1 text-muted-foreground">
                    {m.is_published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {m.is_published ? 'إخفاء' : 'نشر'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm('حذف؟')) deleteMaterial.mutate(m.id); }} className="h-7 text-xs gap-1 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
          {filteredMaterials?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookMarked className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد مواد في هذا التصنيف</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Main: Category grid
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6 md:p-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 rounded-2xl bg-primary/10">
            <Lightbulb className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">مركز التعلّم</h2>
            <p className="text-muted-foreground">اختر الموضوع الذي تريد تعلّمه واستكشف المحتوى</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-4">
          <Badge variant="outline" className="gap-1"><BookOpen className="h-3 w-3" /> {materials?.length || 0} مادة</Badge>
          <Badge variant="outline" className="gap-1"><Star className="h-3 w-3" /> {Object.keys(grouped).length} تصنيف</Badge>
        </div>
      </div>

      {/* CEO: Add button */}
      {isCEO && (
        <Dialog open={addOpen || !!editingId} onOpenChange={(v) => { if (!v) { setAddOpen(false); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setAddOpen(true); setEditingId(null); setForm({ title: '', content: '', category: 'عام', image_url: '' }); }} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> إضافة مادة يدوية
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'تعديل المادة' : 'إضافة مادة تعليمية'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>العنوان</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: كيف تضيف مشروع جديد" dir="rtl" />
              </div>
              <div>
                <Label>التصنيف</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>رابط صورة توضيحية (اختياري)</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." dir="ltr" />
              </div>
              <div>
                <Label>المحتوى التعليمي</Label>
                <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="اكتب الشرح هنا..." className="min-h-[200px]" dir="rtl" />
              </div>
              <Button onClick={editingId ? handleUpdate : handleAdd} disabled={!form.title || !form.content || addMaterial.isPending || updateMaterial.isPending} className="w-full">
                {(addMaterial.isPending || updateMaterial.isPending) ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                {editingId ? 'حفظ التعديلات' : 'إضافة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Category Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(CATEGORY_CONFIG).map(([cat, config], i) => {
            const count = grouped[cat]?.length || 0;
            if (count === 0 && !isCEO) return null;
            const IconComp = config.icon;
            return (
              <motion.div key={cat} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
                <Card
                  className="cursor-pointer group hover:shadow-lg transition-all duration-300 overflow-hidden border-border/50 hover:border-primary/30"
                  onClick={() => setSelectedCategory(cat)}
                >
                  <div className={`h-24 bg-gradient-to-br ${config.gradient} flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <span className="text-4xl">{config.emoji}</span>
                  </div>
                  <CardContent className="p-4 text-center">
                    <h3 className="font-bold text-foreground text-sm mb-1">{cat}</h3>
                    <p className="text-xs text-muted-foreground">{count} {count === 1 ? 'مادة' : 'مواد'}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Recent / Featured */}
      {materials && materials.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            ابدأ من هنا
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {materials.slice(0, 4).map((m: any) => {
              const config = CATEGORY_CONFIG[m.category] || CATEGORY_CONFIG['عام'];
              return (
                <Card key={m.id} className="cursor-pointer hover:shadow-md transition-all group hover:border-primary/30" onClick={() => setViewingArticle(m)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.gradient} text-white flex items-center justify-center shrink-0 text-lg`}>
                      {config.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.category}</p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function Quizzes() {
  const { isCEO, profile } = useAuthContext();
  const { data: myQuiz, isLoading: loadingMyQuiz } = useMyQuiz();
  const { data: allQuizzes, isLoading: loadingAll } = useAllQuizzes();
  const { data: allAttempts } = useAllAttempts();
  const [takingQuiz, setTakingQuiz] = useState('');

  if (takingQuiz) return <Layout><TakeQuizView quizId={takingQuiz} onBack={() => setTakingQuiz('')} /></Layout>;

  const myAttempt = myQuiz ? allAttempts?.find((a: any) => a.quiz_id === myQuiz.id) : null;
  const hasSubmitted = myAttempt?.status === 'submitted';

  const weekGroups: Record<number, any[]> = {};
  allQuizzes?.forEach((q: any) => {
    const wk = q.week_number || 0;
    if (!weekGroups[wk]) weekGroups[wk] = [];
    weekGroups[wk].push(q);
  });

  const getAttemptForQuiz = (quizId: string) => allAttempts?.find((a: any) => a.quiz_id === quizId);

  const now = new Date();
  const daysUntilTuesday = (2 - now.getDay() + 7) % 7 || 7;
  const nextTuesday = new Date(now);
  nextTuesday.setDate(now.getDate() + daysUntilTuesday);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">التعلّم والاختبارات</h1>
            <p className="text-sm text-muted-foreground">نظام تعليمي متكامل · اختبارات أسبوعية · مركز تعلّم</p>
          </div>
        </div>

        <Tabs defaultValue="learn" dir="rtl">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="learn" className="gap-2">
              <BookOpen className="h-4 w-4" /> مركز التعلّم
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-2">
              <GraduationCap className="h-4 w-4" /> الاختبار الأسبوعي
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learn" className="mt-4">
            <LearningCenter />
          </TabsContent>

          <TabsContent value="quiz" className="space-y-6 mt-4">
            {/* MY QUIZ SECTION */}
            <div className="space-y-4">
              {loadingMyQuiz ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : myQuiz && !hasSubmitted ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-primary/20 overflow-hidden">
                    <div className="bg-primary/5 p-6 border-b border-primary/10">
                      <div className="flex items-center gap-3 mb-3">
                        <GraduationCap className="h-8 w-8 text-primary" />
                        <div>
                          <h2 className="text-xl font-black text-foreground">{myQuiz.title}</h2>
                          <p className="text-sm text-muted-foreground">{myQuiz.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {myQuiz.duration_hours} ساعة</span>
                        <span>{myQuiz.total_questions} سؤال</span>
                        <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {new Date(myQuiz.quiz_date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                    <CardContent className="p-6 text-center">
                      <p className="text-lg font-bold text-foreground mb-2">مرحباً {profile?.display_name} 👋</p>
                      <p className="text-muted-foreground mb-2">اختبارك التعليمي جاهز!</p>
                      <p className="text-xs text-muted-foreground mb-6">💡 الأسئلة تعليمية وتهدف لتطوير مهاراتك</p>
                      <Button size="lg" onClick={() => setTakingQuiz(myQuiz.id)} className="gap-2 text-lg px-8">
                        ابدأ الاختبار <ChevronRight className="h-5 w-5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : hasSubmitted ? (
                <Card className="border-primary/30">
                  <CardContent className="p-8 text-center space-y-3">
                    <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                    <h2 className="text-xl font-bold text-foreground">تم تسليم اختبارك بنجاح ✅</h2>
                    <p className="text-muted-foreground">شكراً لك! تم إرسال إجاباتك للمراجعة</p>
                    <p className="text-sm text-muted-foreground">الاختبار القادم يوم الثلاثاء {nextTuesday.toLocaleDateString('ar-SA')}</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CalendarDays className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-lg font-bold text-muted-foreground">لا يوجد اختبار حالياً</p>
                    <p className="text-sm text-muted-foreground mt-1">الاختبار القادم يوم الثلاثاء {nextTuesday.toLocaleDateString('ar-SA')}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RESULTS - CEO only */}
            {isCEO && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  نتائج الموظفين
                </h2>
                {loadingAll ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : Object.keys(weekGroups).length === 0 ? (
                  <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد نتائج بعد</CardContent></Card>
                ) : (
                  Object.entries(weekGroups)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([week, quizzes]) => (
                      <Card key={week} className="border-border/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            الأسبوع {week}
                            <Badge variant="outline" className="text-xs mr-auto">{quizzes.length} موظفين</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {quizzes.map((q: any) => {
                              const att = getAttemptForQuiz(q.id);
                              return (
                                <div key={q.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                                  <User className="h-5 w-5 text-muted-foreground shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-bold text-foreground">{q.employee_name}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(q.quiz_date).toLocaleDateString('ar-SA')}</p>
                                  </div>
                                  {att ? (
                                    <div className="flex items-center gap-3">
                                      <Progress value={att.score} className="w-20 h-2" />
                                      <span className={`text-xl font-black min-w-[50px] text-left ${att.score >= 70 ? 'text-primary' : 'text-destructive'}`}>
                                        {att.score}%
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {att.correct_count}/{q.total_questions}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">لم يختبر</Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
