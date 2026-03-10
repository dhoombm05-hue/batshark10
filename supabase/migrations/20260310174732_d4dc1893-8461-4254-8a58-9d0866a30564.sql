
-- Quiz system tables

-- Main quizzes table (one per week)
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  quiz_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 25,
  duration_hours INTEGER NOT NULL DEFAULT 9,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq', -- mcq, true_false, text
  options JSONB DEFAULT '[]'::jsonb, -- for MCQ: [{label: "A", text: "..."}, ...]
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 4
);

-- Employee quiz attempts
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  employee_name TEXT NOT NULL DEFAULT '',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC DEFAULT 0,
  total_points NUMERIC DEFAULT 100,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, submitted, expired
  UNIQUE(quiz_id, user_id)
);

-- Individual answers
CREATE TABLE public.quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN DEFAULT false,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Quizzes: all authenticated can view, CEO can manage
CREATE POLICY "Authenticated can view quizzes" ON public.quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "CEO can insert quizzes" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can update quizzes" ON public.quizzes FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can delete quizzes" ON public.quizzes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'ceo'::app_role));

-- Questions: all authenticated can view, CEO can manage
CREATE POLICY "Authenticated can view questions" ON public.quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "CEO can insert questions" ON public.quiz_questions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can update questions" ON public.quiz_questions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can delete questions" ON public.quiz_questions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'ceo'::app_role));

-- Attempts: users can create/view own, CEO can view all
CREATE POLICY "Users can create own attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own or CEO all" ON public.quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "Users can update own attempt" ON public.quiz_attempts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Answers: users can create/view own, CEO can view all
CREATE POLICY "Users can create own answers" ON public.quiz_answers FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.quiz_attempts WHERE id = quiz_answers.attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Users can view own or CEO all" ON public.quiz_answers FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.quiz_attempts WHERE id = quiz_answers.attempt_id AND (user_id = auth.uid() OR has_role(auth.uid(), 'ceo'::app_role)))
);
