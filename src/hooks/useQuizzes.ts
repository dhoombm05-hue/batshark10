import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useQuizzes() {
  return useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useQuizQuestions(quizId: string) {
  return useQuery({
    queryKey: ['quiz-questions', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions' as any)
        .select('*')
        .eq('quiz_id', quizId)
        .order('sort_order');
      if (error) throw error;
      return data as any[];
    },
    enabled: !!quizId,
  });
}

export function useMyAttempt(quizId: string) {
  return useQuery({
    queryKey: ['quiz-attempt', quizId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('quiz_attempts' as any)
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!quizId,
  });
}

export function useQuizAttempts(quizId: string) {
  return useQuery({
    queryKey: ['quiz-attempts-all', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_attempts' as any)
        .select('*')
        .eq('quiz_id', quizId)
        .order('score', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!quizId,
  });
}

export function useMyAnswers(attemptId: string) {
  return useQuery({
    queryKey: ['quiz-answers', attemptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_answers' as any)
        .select('*')
        .eq('attempt_id', attemptId);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!attemptId,
  });
}

export function useStartQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ quizId, employeeName }: { quizId: string; employeeName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('quiz_attempts' as any)
        .insert({ quiz_id: quizId, user_id: user.id, employee_name: employeeName, status: 'in_progress' } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz-attempt'] }),
    onError: (e: any) => toast.error(e.message?.includes('duplicate') ? 'لقد بدأت هذا الاختبار مسبقاً' : 'فشل بدء الاختبار'),
  });
}

export function useSubmitQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ attemptId, answers, questions }: {
      attemptId: string;
      answers: Record<string, string>;
      questions: any[];
    }) => {
      let correct = 0;
      let totalPoints = 0;
      let earnedPoints = 0;

      const answerRows = questions.map((q: any) => {
        const userAnswer = answers[q.id] || '';
        let isCorrect = false;

        if (q.question_type === 'text') {
          // For text questions, check if key words match
          const keywords = q.correct_answer.split(/[,،\s]+/).filter(Boolean);
          isCorrect = keywords.some((kw: string) => userAnswer.toLowerCase().includes(kw.toLowerCase()));
        } else {
          isCorrect = userAnswer === q.correct_answer;
        }

        if (isCorrect) {
          correct++;
          earnedPoints += q.points;
        }
        totalPoints += q.points;

        return {
          attempt_id: attemptId,
          question_id: q.id,
          user_answer: userAnswer,
          is_correct: isCorrect,
          points_earned: isCorrect ? q.points : 0,
        };
      });

      // Insert answers
      const { error: aErr } = await supabase.from('quiz_answers' as any).insert(answerRows as any);
      if (aErr) throw aErr;

      // Update attempt
      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const { error: uErr } = await supabase
        .from('quiz_attempts' as any)
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          score,
          total_points: totalPoints,
          correct_count: correct,
          wrong_count: questions.length - correct,
        } as any)
        .eq('id', attemptId);
      if (uErr) throw uErr;

      return { score, correct, total: questions.length };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['quiz-attempt'] });
      qc.invalidateQueries({ queryKey: ['quiz-attempts-all'] });
      toast.success(`تم تسليم الاختبار! النتيجة: ${data.score}%`);
    },
    onError: () => toast.error('فشل تسليم الاختبار'),
  });
}

export function useGenerateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await supabase.functions.invoke('generate-quiz', {
        body: { title },
      });

      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('تم إنشاء الاختبار بنجاح! 🎯');
    },
    onError: (e: any) => toast.error(`فشل إنشاء الاختبار: ${e.message}`),
  });
}
