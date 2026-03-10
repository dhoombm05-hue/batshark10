import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function extractJsonFromResponse(response: string): any {
  let cleaned = response.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const jsonStart = cleaned.search(/[\{\[]/);
  const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === '[' ? ']' : '}');
  if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  try { return JSON.parse(cleaned); } catch {
    cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(cleaned);
  }
}

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

    // Support both: cron calls (with anon key) and user calls (with user token)
    const authHeader = req.headers.get("Authorization");
    let isCronCall = false;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
      if (token === anonKey) {
        // Cron call with anon key - allowed
        isCronCall = true;
      } else {
        // User call - verify CEO role
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error("Unauthorized");
        const { data: roleData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "ceo" });
        if (!roleData) throw new Error("Only CEO can generate quizzes");
      }
    } else {
      throw new Error("No authorization");
    }

    // Get all employees
    const { data: employees, error: empError } = await supabase.from("employees").select("id, name, position, department");
    if (empError || !employees?.length) throw new Error("No employees found");

    const now = new Date();
    const deadline = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    // Calculate week number (ISO week)
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

    const results: any[] = [];

    // Generate a unique quiz for each employee
    for (const emp of employees) {
      const systemPrompt = `أنت مسؤول عن إنشاء اختبار أسبوعي مخصص للموظف "${emp.name}" (${emp.position} - ${emp.department}) حول نظام إدارة الأعمال BatShark.

النظام يتضمن:
- لوحات تحكم (تنفيذية، تشغيلية، مشاريع)
- إدارة المشاريع (إضافة، تعديل، حذف مع تتبع المصاريف والإيرادات)
- إدارة الموظفين (ملفات شخصية، تقييمات، أداء شهري)
- نظام المهام (إنشاء، توزيع، تتبع)
- توزيع المهام الذكي بالذكاء الاصطناعي
- تحليل جدوى البزنس
- غرف النقاشات والرسائل الخاصة
- منصة الأخبار (نشر، تعليق، تفاعل)
- مختبر النمذجة المالية والتوقعات
- التقارير ومركز الملفات والاستيراد
- الجداول المخصصة (إنشاء جداول مرنة مع معادلات)
- نظام التنبيهات الذكية
- التحليل الاستراتيجي وسجل التعديلات

أنشئ 25 سؤال فريد بالعربية مختلف عن باقي الموظفين:
- 15 سؤال اختيار من متعدد (4 خيارات A,B,C,D) - question_type: "mcq"
- 5 أسئلة صح وخطأ - question_type: "true_false"
- 5 أسئلة تحريرية قصيرة - question_type: "text"

ركز على أسئلة عملية حول كيفية استخدام النظام بشكل يومي.

أجب بصيغة JSON فقط:
{"questions":[{"question_text":"...","question_type":"mcq","options":[{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}],"correct_answer":"A","explanation":"...","points":4}]}

لأسئلة صح/خطأ: options=[{"label":"صح","text":"صح"},{"label":"خطأ","text":"خطأ"}]
لأسئلة التحرير: options=[] و correct_answer=كلمات مفتاحية`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `أنشئ اختبار فريد للموظف ${emp.name} - الأسبوع ${weekNumber} - تاريخ ${now.toLocaleDateString('ar-SA')}` },
          ],
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI gateway error:", response.status, errText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const rawText = await response.text();
      let aiResult;
      try {
        aiResult = JSON.parse(rawText);
      } catch (parseErr) {
        console.error("Failed to parse AI response:", rawText.substring(0, 500));
        throw new Error("Failed to parse AI gateway response");
      }
      const content = aiResult.choices?.[0]?.message?.content || "";
      if (!content) throw new Error("Empty AI response content");
      console.log("AI content for", emp.name, "length:", content.length);
      const parsed = extractJsonFromResponse(content);

      // Create quiz for this employee
      const { data: quiz, error: quizError } = await supabase.from("quizzes").insert({
        title: `اختبار ${emp.name} - الأسبوع ${weekNumber}`,
        description: `اختبار أسبوعي مخصص لـ ${emp.name}`,
        quiz_date: now.toISOString().split("T")[0],
        deadline: deadline.toISOString(),
        total_questions: 25,
        duration_hours: 9,
        status: "active",
        created_by: user.id,
        employee_id: emp.id,
        employee_name: emp.name,
        week_number: weekNumber,
      }).select().single();

      if (quizError) throw quizError;

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

      results.push({ employee: emp.name, quiz_id: quiz.id });
    }

    return new Response(JSON.stringify({ success: true, quizzes_created: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
