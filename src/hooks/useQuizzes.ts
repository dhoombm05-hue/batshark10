import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Get all quizzes (for CEO results view)
export function useAllQuizzes() {
  return useQuery({
    queryKey: ['all-quizzes'],
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

// Get quiz assigned to current user (by employee_id in profile)
export function useMyQuiz() {
  return useQuery({
    queryKey: ['my-quiz'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, employee_id')
        .eq('user_id', user.id)
        .single();

      if (!profile || !profile.employee_id) return null;

      // Get active quizzes matching this employee_id
      const now = new Date().toISOString();
      const { data: quizzes, error } = await supabase
        .from('quizzes' as any)
        .select('*')
        .eq('status', 'active')
        .eq('employee_id', profile.employee_id)
        .gte('deadline', now)
        .order('created_at', { ascending: false });

      if (error || !quizzes?.length) return null;

      return quizzes[0] as any;
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

// All attempts (CEO sees all, others see own)
export function useAllAttempts() {
  return useQuery({
    queryKey: ['all-quiz-attempts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_attempts' as any)
        .select('*')
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
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
          const keywords = q.correct_answer.split(/[,،\s]+/).filter(Boolean);
          isCorrect = keywords.some((kw: string) => userAnswer.toLowerCase().includes(kw.toLowerCase()));
        } else {
          isCorrect = userAnswer === q.correct_answer;
        }
        if (isCorrect) { correct++; earnedPoints += q.points; }
        totalPoints += q.points;
        return { attempt_id: attemptId, question_id: q.id, user_answer: userAnswer, is_correct: isCorrect, points_earned: isCorrect ? q.points : 0 };
      });

      const { error: aErr } = await supabase.from('quiz_answers' as any).insert(answerRows as any);
      if (aErr) throw aErr;

      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const { error: uErr } = await supabase
        .from('quiz_attempts' as any)
        .update({ status: 'submitted', submitted_at: new Date().toISOString(), score, total_points: totalPoints, correct_count: correct, wrong_count: questions.length - correct } as any)
        .eq('id', attemptId);
      if (uErr) throw uErr;
      return { score, correct, total: questions.length };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['quiz-attempt'] });
      qc.invalidateQueries({ queryKey: ['all-quiz-attempts'] });
      toast.success(`تم تسليم الاختبار! النتيجة: ${data.score}%`);
    },
    onError: () => toast.error('فشل تسليم الاختبار'),
  });
}

