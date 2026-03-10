import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization");

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    // Check CEO role
    const { data: roleData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "ceo" });
    if (!roleData) throw new Error("Only CEO can generate quizzes");

    const { title } = await req.json();

    // Get employees list for context
    const { data: employees } = await supabase.from("employees").select("name, position, department");
    
    // Calculate deadline: today + 9 hours
    const now = new Date();
    const deadline = new Date(now.getTime() + 9 * 60 * 60 * 1000);

    const systemPrompt = `أنت مسؤول عن إنشاء اختبارات أسبوعية للموظفين حول نظام إدارة الأعمال BatShark.
    
النظام يتضمن:
- لوحات تحكم (تنفيذية، تشغيلية، مشاريع) مع رسوم بيانية ومؤشرات أداء
- إدارة المشاريع (إضافة، تعديل، حذف مشاريع مع تتبع المصاريف والإيرادات)
- إدارة الموظفين (ملفات شخصية، تقييمات، أداء شهري)
- نظام المهام (إنشاء، توزيع، تتبع المهام مع أولويات وتواريخ)
- توزيع المهام الذكي بالذكاء الاصطناعي
- تحليل جدوى البزنس
- غرف النقاشات والرسائل الخاصة
- منصة الأخبار (نشر، تعليق، تفاعل)
- مختبر النمذجة المالية والتوقعات
- التقارير ومركز الملفات والاستيراد
- الجداول المخصصة (إنشاء جداول مرنة مع معادلات)
- نظام التنبيهات الذكية
- التحليل الاستراتيجي
- نظام سجل التعديلات (Audit Trail)
- قاموس البيانات

أنشئ 25 سؤال بالعربية:
- 15 سؤال اختيار من متعدد (4 خيارات A,B,C,D) - question_type: "mcq"
- 5 أسئلة صح وخطأ - question_type: "true_false"  
- 5 أسئلة تحريرية قصيرة - question_type: "text"

الأسئلة يجب أن تكون عملية عن كيفية استخدام النظام، مثل:
- كيف تضيف مشروع جديد؟
- أين تجد تقارير الأداء؟
- ما هو نظام سجل التعديلات؟
- كيف تنشر خبر في المنصة؟
- ما هي صلاحيات كل دور؟

أجب بصيغة JSON فقط بدون أي نص إضافي:
{
  "questions": [
    {
      "question_text": "نص السؤال",
      "question_type": "mcq",
      "options": [{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}],
      "correct_answer": "A",
      "explanation": "شرح مختصر",
      "points": 4
    }
  ]
}

لأسئلة صح/خطأ: options يكون [{"label":"صح","text":"صح"},{"label":"خطأ","text":"خطأ"}] و correct_answer إما "صح" أو "خطأ"
لأسئلة التحرير: options يكون [] و correct_answer يكون الإجابة المتوقعة (كلمات مفتاحية)`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `أنشئ اختبار بعنوان: "${title || 'اختبار الثلاثاء الأسبوعي'}" - تاريخ ${now.toLocaleDateString('ar-SA')}` },
        ],
        temperature: 0.7,
      }),
    });

    const aiResult = await response.json();
    let content = aiResult.choices?.[0]?.message?.content || "";
    
    // Robust JSON extraction
    const parsed = extractJsonFromResponse(content);

    // Create quiz
    const { data: quiz, error: quizError } = await supabase.from("quizzes").insert({
      title: title || "اختبار الثلاثاء الأسبوعي",
      description: `اختبار أسبوعي حول نظام BatShark - ${now.toLocaleDateString('ar-SA')}`,
      quiz_date: now.toISOString().split("T")[0],
      deadline: deadline.toISOString(),
      total_questions: 25,
      duration_hours: 9,
      status: "active",
      created_by: user.id,
    }).select().single();

    if (quizError) throw quizError;

    // Insert questions
    const questions = parsed.questions.map((q: any, i: number) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation || "",
      sort_order: i + 1,
      points: q.points || 4,
    }));

    const { error: qError } = await supabase.from("quiz_questions").insert(questions);
    if (qError) throw qError;

    return new Response(JSON.stringify({ success: true, quiz_id: quiz.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
