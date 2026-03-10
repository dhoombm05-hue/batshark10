import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Plus, Clock, CheckCircle2, AlertCircle, Trophy, ChevronRight, Users, Loader2, Eye, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuizzes, useQuizQuestions, useMyAttempt, useQuizAttempts, useStartQuiz, useSubmitQuiz, useGenerateQuiz, useMyAnswers } from '@/hooks/useQuizzes';

function QuizCard({ quiz, isCEO, onTake, onViewResults }: { quiz: any; isCEO: boolean; onTake: (id: string) => void; onViewResults: (id: string) => void }) {
  const isExpired = new Date(quiz.deadline) < new Date();
  const isActive = quiz.status === 'active' && !isExpired;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                <h3 className="font-bold text-foreground truncate">{quiz.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {quiz.duration_hours} ساعات
                </span>
                <span>{quiz.total_questions} سؤال</span>
                <span>{new Date(quiz.quiz_date).toLocaleDateString('ar-SA')}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'نشط' : 'منتهي'}
              </Badge>
              <div className="flex gap-1">
                {isActive && (
                  <Button size="sm" onClick={() => onTake(quiz.id)} className="text-xs">
                    ابدأ الاختبار <ChevronRight className="h-3 w-3 mr-1" />
                  </Button>
                )}
                {isCEO && (
                  <Button size="sm" variant="outline" onClick={() => onViewResults(quiz.id)} className="text-xs">
                    <Eye className="h-3 w-3 ml-1" /> النتائج
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TakeQuizView({ quizId, onBack }: { quizId: string; onBack: () => void }) {
  const { profile } = useAuthContext();
  const { data: questions, isLoading } = useQuizQuestions(quizId);
  const { data: attempt } = useMyAttempt(quizId);
  const { data: existingAnswers } = useMyAnswers(attempt?.id || '');
  const startQuiz = useStartQuiz();
  const submitQuiz = useSubmitQuiz();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);

  const isSubmitted = attempt?.status === 'submitted';

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!questions?.length) return <div className="text-center py-20 text-muted-foreground">لا توجد أسئلة</div>;

  const handleStart = () => {
    startQuiz.mutate({ quizId, employeeName: profile?.display_name || 'موظف' });
  };

  const handleSubmit = async () => {
    if (!attempt) return;
    const res = await submitQuiz.mutateAsync({ attemptId: attempt.id, answers, questions });
    setResult(res);
    setSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack}>← العودة</Button>
        <Card className="border-primary/30">
          <CardContent className="p-8 text-center space-y-4">
            <Trophy className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">تم تسليم الاختبار</h2>
            <p className="text-4xl font-black text-primary">{attempt.score}%</p>
            <p className="text-muted-foreground">{attempt.correct_count} صحيح من {questions.length}</p>
            <Progress value={attempt.score} className="h-3 max-w-xs mx-auto" />
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
            <Trophy className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">نتيجتك</h2>
            <p className="text-5xl font-black text-primary">{result.score}%</p>
            <p className="text-muted-foreground">{result.correct} إجابة صحيحة من {result.total}</p>
            <Progress value={result.score} className="h-3 max-w-xs mx-auto" />
            <Button onClick={onBack} className="mt-4">العودة للاختبارات</Button>
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
            <p className="text-muted-foreground">الاختبار يحتوي على {questions.length} سؤال</p>
            <div className="flex gap-4 justify-center text-sm text-muted-foreground">
              <span>15 اختيارات</span>
              <span>5 صح/خطأ</span>
              <span>5 تحرير</span>
            </div>
            <Button size="lg" onClick={handleStart} disabled={startQuiz.isPending} className="mt-4">
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
          <span className="text-sm text-muted-foreground">{answeredCount}/{questions.length} مجاب</span>
          <Progress value={(answeredCount / questions.length) * 100} className="w-32 h-2" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {questions.map((_: any, i: number) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${
              i === currentQ
                ? 'bg-primary text-primary-foreground'
                : answers[questions[i].id]
                ? 'bg-accent text-accent-foreground border border-primary/30'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {i + 1}
          </button>
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
                <Textarea
                  placeholder="اكتب إجابتك هنا..."
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="min-h-[100px]"
                  dir="rtl"
                />
              ) : (
                <RadioGroup
                  value={answers[q.id] || ''}
                  onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}
                  className="space-y-2"
                >
                  {(q.options || []).map((opt: any) => (
                    <div
                      key={opt.label}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        answers[q.id] === opt.label
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <RadioGroupItem value={opt.label} id={`${q.id}-${opt.label}`} />
                      <Label htmlFor={`${q.id}-${opt.label}`} className="flex-1 cursor-pointer">
                        <span className="font-bold ml-2">{opt.label}.</span>
                        {opt.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>
                  السابق
                </Button>
                {currentQ < questions.length - 1 ? (
                  <Button size="sm" onClick={() => setCurrentQ(currentQ + 1)}>التالي</Button>
                ) : (
                  <Button size="sm" onClick={handleSubmit} disabled={submitQuiz.isPending}>
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

function ResultsView({ quizId, onBack }: { quizId: string; onBack: () => void }) {
  const { data: attempts, isLoading } = useQuizAttempts(quizId);
  const { data: questions } = useQuizQuestions(quizId);

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const submitted = attempts?.filter((a: any) => a.status === 'submitted') || [];
  const avgScore = submitted.length > 0 ? Math.round(submitted.reduce((s: number, a: any) => s + (a.score || 0), 0) / submitted.length) : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>← العودة</Button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-5 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-black text-foreground">{submitted.length}</p>
            <p className="text-sm text-muted-foreground">أكملوا الاختبار</p>
          </CardContent>
        </Card>
        <Card className="border-accent/40">
          <CardContent className="p-5 text-center">
            <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-black text-foreground">{avgScore}%</p>
            <p className="text-sm text-muted-foreground">المعدل العام</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardContent className="p-5 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-3xl font-black text-foreground">{(attempts?.length || 0) - submitted.length}</p>
            <p className="text-sm text-muted-foreground">لم يسلموا بعد</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            نتائج الموظفين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submitted.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد نتائج بعد</p>
          ) : (
            <div className="space-y-3">
              {submitted.map((a: any, i: number) => (
                <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <span className={`text-lg font-black w-8 text-center ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{a.employee_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.correct_count} صحيح · {a.wrong_count} خطأ · {a.submitted_at ? new Date(a.submitted_at).toLocaleString('ar-SA') : ''}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-2xl font-black ${a.score >= 70 ? 'text-primary' : 'text-destructive'}`}>
                      {a.score}%
                    </p>
                  </div>
                  <Progress value={a.score} className="w-24 h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Quizzes() {
  const { isCEO } = useAuthContext();
  const { data: quizzes, isLoading } = useQuizzes();
  const generateQuiz = useGenerateQuiz();
  const [view, setView] = useState<'list' | 'take' | 'results'>('list');
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [newTitle, setNewTitle] = useState('اختبار الثلاثاء الأسبوعي');
  const [showCreate, setShowCreate] = useState(false);

  const handleGenerate = async () => {
    await generateQuiz.mutateAsync(newTitle);
    setShowCreate(false);
    setNewTitle('اختبار الثلاثاء الأسبوعي');
  };

  if (view === 'take') return <Layout><TakeQuizView quizId={selectedQuiz} onBack={() => setView('list')} /></Layout>;
  if (view === 'results') return <Layout><ResultsView quizId={selectedQuiz} onBack={() => setView('list')} /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground">الاختبارات الأسبوعية</h1>
              <p className="text-sm text-muted-foreground">اختبر معرفتك بنظام BatShark كل ثلاثاء</p>
            </div>
          </div>
          {isCEO && (
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> إنشاء اختبار جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إنشاء اختبار جديد بالذكاء الاصطناعي</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>عنوان الاختبار</Label>
                    <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="mt-1" dir="rtl" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    سيتم إنشاء 25 سؤال تلقائياً: 15 اختيار من متعدد + 5 صح/خطأ + 5 تحرير.
                    مدة الاختبار 9 ساعات.
                  </p>
                  <Button onClick={handleGenerate} disabled={generateQuiz.isPending} className="w-full">
                    {generateQuiz.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري الإنشاء بالذكاء الاصطناعي...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 ml-2" /> إنشاء الاختبار</>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-foreground">
              <strong>كل يوم ثلاثاء</strong> يتم إصدار اختبار جديد. مدة الاختبار <strong>9 ساعات</strong> من لحظة الإصدار. 
              الأسئلة تغطي جميع أقسام النظام.
            </p>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !quizzes?.length ? (
          <Card>
            <CardContent className="p-12 text-center">
              <GraduationCap className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-bold text-muted-foreground">لا توجد اختبارات حالياً</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isCEO ? 'أنشئ أول اختبار بالضغط على الزر أعلاه' : 'انتظر حتى يتم إصدار الاختبار القادم'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz: any) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                isCEO={isCEO}
                onTake={(id) => { setSelectedQuiz(id); setView('take'); }}
                onViewResults={(id) => { setSelectedQuiz(id); setView('results'); }}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
