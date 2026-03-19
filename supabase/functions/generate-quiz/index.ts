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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    let isCronCall = false;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
      if (token === anonKey) {
        isCronCall = true;
      } else {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error("Unauthorized");
        const { data: roleData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "ceo" });
        if (!roleData) throw new Error("Only CEO can generate quizzes");
      }
    } else {
      isCronCall = true; // Allow no-auth for cron
    }

    // Check which employees already have quizzes this week
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

    // Get all employees
    const { data: allEmployees, error: empError } = await supabase.from("employees").select("id, name, position, department");
    if (empError || !allEmployees?.length) throw new Error("No employees found");

    // Filter out employees who already have quizzes this week
    const { data: existingQuizzes } = await supabase
      .from("quizzes")
      .select("employee_id")
      .eq("week_number", weekNumber);
    const existingIds = new Set((existingQuizzes || []).map((q: any) => q.employee_id));
    const employees = allEmployees.filter(emp => !existingIds.has(emp.id));

    if (employees.length === 0) {
      console.log(`All employees already have quizzes for week ${weekNumber}`);
      return new Response(JSON.stringify({ success: true, message: `All quizzes already generated for week ${weekNumber}`, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deadline: next day 9AM Saudi (6AM UTC) = 12 hours
    const deadlineDate = new Date(now);
    deadlineDate.setUTCDate(deadlineDate.getUTCDate() + 1);
    deadlineDate.setUTCHours(6, 0, 0, 0);

    // Get CEO user for created_by
    const { data: ceoRole } = await supabase.from("user_roles").select("user_id").eq("role", "ceo").limit(1).single();
    const creatorId = ceoRole?.user_id || "00000000-0000-0000-0000-000000000000";

    const results: any[] = [];

    for (const emp of employees) {
      try {
        const systemPrompt = `أنت معلّم ومدرب محترف تقوم بإنشاء اختبار تعليمي أسبوعي مخصص للموظف "${emp.name}" (${emp.position} - ${emp.department}).

الهدف: تعليم الموظف وتطوير مهاراته. الأسئلة يجب أن تكون:
✅ تعليمية وعملية ومتنوعة
✅ تغطي مجالات مختلفة كل أسبوع

المجالات: إدارة الأعمال، مهارات قيادية، مفاهيم مالية، تواصل وعمل جماعي، إدارة مشاريع، تحليل بيانات، إدارة وقت، خدمة عملاء، تطوير ذاتي، أمن معلوماتي

📝 في "explanation" اكتب شرحاً تعليمياً مفصلاً (3-4 أسطر).

أنشئ 25 سؤال بالعربية:
- 15 اختيار من متعدد (4 خيارات A,B,C,D) - question_type: "mcq"
- 5 صح وخطأ - question_type: "true_false"
- 5 تحريرية قصيرة - question_type: "text"

JSON فقط:
{"questions":[{"question_text":"...","question_type":"mcq","options":[{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}],"correct_answer":"A","explanation":"شرح تعليمي مفصل","points":4}]}

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
          console.error(`AI error for ${emp.name}: ${response.status}`);
          continue;
        }

        const rawText = await response.text();
        let aiResult;
        try { aiResult = JSON.parse(rawText); } catch {
          console.error(`Parse error for ${emp.name}`);
          continue;
        }
        const content = aiResult.choices?.[0]?.message?.content || "";
        if (!content) continue;
        
        const parsed = extractJsonFromResponse(content);

        const { data: quiz, error: quizError } = await supabase.from("quizzes").insert({
          title: `اختبار ${emp.name} - الأسبوع ${weekNumber}`,
          description: `اختبار أسبوعي مخصص لـ ${emp.name}`,
          quiz_date: now.toISOString().split("T")[0],
          deadline: deadlineDate.toISOString(),
          total_questions: 25,
          duration_hours: 12,
          status: "active",
          created_by: creatorId,
          employee_id: emp.id,
          employee_name: emp.name,
          week_number: weekNumber,
        }).select().single();

        if (quizError) { console.error(`Quiz insert error for ${emp.name}:`, quizError); continue; }

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
        if (qError) console.error(`Questions insert error for ${emp.name}:`, qError);

        results.push({ employee: emp.name, quiz_id: quiz.id });
      } catch (empErr) {
        console.error(`Error generating quiz for ${emp.name}:`, empErr);
        continue;
      }
    }

    // Send notifications and auto-post news
    if (results.length > 0) {
      const { data: allProfiles } = await supabase.from("profiles").select("user_id, employee_id");
      
      const notifications = [];
      for (const profile of (allProfiles || [])) {
        if (profile.employee_id) {
          notifications.push({
            user_id: profile.user_id,
            title: '📝 اختبار أسبوعي جديد!',
            body: `تم إنشاء اختبارك التعليمي للأسبوع ${weekNumber}. لديك 12 ساعة لإكماله.`,
            type: 'quiz',
            link: '/quizzes',
          });
        }
      }
      
      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }

      // Auto-post news announcement
      await supabase.from("news").insert({
        title: `📝 اختبارات الأسبوع ${weekNumber} جاهزة!`,
        content: `تم إنشاء ${results.length} اختبار أسبوعي جديد لجميع الموظفين. الموعد النهائي للتسليم: 12 ساعة من الآن.\n\nالموظفين: ${results.map(r => r.employee).join('، ')}\n\nتوجه لصفحة الاختبارات لبدء اختبارك الآن! 🚀`,
        author_id: creatorId,
        author_name: '🤖 النظام التلقائي',
        content_type: 'text',
        is_pinned: false,
      });
    }

    return new Response(JSON.stringify({ success: true, quizzes_created: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("generate-quiz error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
