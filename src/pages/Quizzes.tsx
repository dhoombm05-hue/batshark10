import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Clock, CheckCircle2, Trophy, ChevronRight, Loader2, CalendarDays, User, BarChart3 } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  useMyQuiz, useQuizQuestions, useMyAttempt, useAllQuizzes, useAllAttempts,
  useStartQuiz, useSubmitQuiz
} from '@/hooks/useQuizzes';

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
            <Trophy className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">تم تسليم اختبارك ✅</h2>
            <p className="text-5xl font-black text-primary">{attempt.score}%</p>
            <p className="text-muted-foreground">{attempt.correct_count} صحيح من {questions.length}</p>
            <Progress value={attempt.score} className="h-3 max-w-xs mx-auto" />
            <p className="text-sm text-muted-foreground mt-4">النتائج ستُعلن من قبل الإدارة</p>
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
            <p className="text-muted-foreground">{questions.length} سؤال · 15 اختيارات · 5 صح/خطأ · 5 تحرير</p>
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

/* ─── MAIN PAGE ─── */
export default function Quizzes() {
  const { isCEO, profile } = useAuthContext();
  const { data: myQuiz, isLoading: loadingMyQuiz } = useMyQuiz();
  const { data: allQuizzes, isLoading: loadingAll } = useAllQuizzes();
  const { data: allAttempts } = useAllAttempts();
  const [takingQuiz, setTakingQuiz] = useState('');

  if (takingQuiz) return <Layout><TakeQuizView quizId={takingQuiz} onBack={() => setTakingQuiz('')} /></Layout>;

  // Group results by week
  const weekGroups: Record<number, any[]> = {};
  allQuizzes?.forEach((q: any) => {
    const wk = q.week_number || 0;
    if (!weekGroups[wk]) weekGroups[wk] = [];
    weekGroups[wk].push(q);
  });

  const getAttemptForQuiz = (quizId: string) => allAttempts?.find((a: any) => a.quiz_id === quizId);

  // Calculate next Tuesday
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
            <h1 className="text-2xl font-black text-foreground">اختبار الثلاثاء</h1>
            <p className="text-sm text-muted-foreground">اختبار أسبوعي تلقائي كل ثلاثاء · ادخل اختبر واطلع</p>
          </div>
        </div>

        {isCEO ? (
          /* CEO VIEW: Just results */
          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-primary" />
                <p className="text-sm text-foreground">الاختبارات تُنشأ تلقائياً كل يوم ثلاثاء · النتائج تظهر هنا فقط لك</p>
              </CardContent>
            </Card>

            {/* My quiz if available */}
            {myQuiz && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-primary/30 overflow-hidden">
                  <div className="bg-primary/5 p-4 border-b border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-6 w-6 text-primary" />
                      <div>
                        <h2 className="text-lg font-bold text-foreground">اختبارك هذا الأسبوع</h2>
                        <p className="text-xs text-muted-foreground">{myQuiz.total_questions} سؤال · {myQuiz.duration_hours} ساعات</p>
                      </div>
                    </div>
                    <Button onClick={() => setTakingQuiz(myQuiz.id)} className="gap-2">
                      ابدأ <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Results by week */}
            {loadingAll ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : Object.keys(weekGroups).length === 0 ? (
              <Card><CardContent className="p-12 text-center text-muted-foreground">لا توجد اختبارات بعد · ستظهر تلقائياً يوم الثلاثاء</CardContent></Card>
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
        ) : (
          /* EMPLOYEE VIEW: Just their quiz */
          <div className="space-y-4">
            {loadingMyQuiz ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : myQuiz ? (
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
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {myQuiz.duration_hours} ساعات</span>
                      <span>{myQuiz.total_questions} سؤال</span>
                      <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {new Date(myQuiz.quiz_date).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                  <CardContent className="p-6 text-center">
                    <p className="text-lg font-bold text-foreground mb-2">مرحباً {profile?.display_name} 👋</p>
                    <p className="text-muted-foreground mb-6">اختبارك جاهز! اضغط لبدء الاختبار</p>
                    <Button size="lg" onClick={() => setTakingQuiz(myQuiz.id)} className="gap-2 text-lg px-8">
                      ابدأ الاختبار <ChevronRight className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
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
        )}
      </div>
    </Layout>
  );
}
