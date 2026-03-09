import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { feasibilityId, answers } = await req.json();

    // Get company context
    const { data: projects } = await supabase.from("projects").select("*");
    const { data: employees } = await supabase.from("employees").select("name, position, department, performance, kpi_achievement");
    const { data: tasks } = await supabase.from("tasks").select("*").in("status", ["todo", "in_progress"]);

    const companyContext = {
      totalProjects: projects?.length || 0,
      projects: (projects || []).map(p => ({
        name: p.name,
        status: p.status,
        revenue: p.total_revenue,
        expenses: p.total_expenses,
        profit: p.net_profit,
        growthRate: p.growth_rate,
      })),
      totalEmployees: employees?.length || 0,
      employees: (employees || []).map(e => ({
        name: e.name,
        position: e.position,
        department: e.department,
        performance: e.performance,
        kpi: e.kpi_achievement,
      })),
      currentTaskLoad: tasks?.length || 0,
    };

    const systemPrompt = `أنت محلل أعمال خبير في منصة BatShark. مهمتك تحليل جدوى بزنس جديد بناءً على إجابات المستخدم وبيانات الشركة الحالية.

بيانات الشركة الحالية:
${JSON.stringify(companyContext, null, 2)}

حلل الإجابات التالية وقدم تحليل شامل يشمل:

1. **نقاط القوة** - ما الذي يجعل هذا البزنس فرصة جيدة
2. **المخاطر** - المخاطر المحتملة وكيفية التخفيف منها
3. **التحليل المالي** - تقدير التكاليف والإيرادات المتوقعة والعائد على الاستثمار
4. **التوافق مع الشركة** - هل يتوافق مع موارد وقدرات الشركة الحالية
5. **الموظفين المناسبين** - من يمكنه إدارة هذا البزنس من الفريق الحالي
6. **الجدول الزمني** - خطة تنفيذ مقترحة
7. **التوصية النهائية** - هل يُنصح بالمضي قدماً أم لا ولماذا
8. **درجة الجدوى** - من 0 إلى 100
9. **درجة المخاطر** - من 0 إلى 100`;

    const userPrompt = `إجابات المستخدم على أسئلة تحليل البزنس الجديد:\n\n${JSON.stringify(answers, null, 2)}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_business_feasibility",
            description: "Analyze business feasibility and return structured results",
            parameters: {
              type: "object",
              properties: {
                feasibility_score: { type: "number", description: "0-100 feasibility score" },
                risk_score: { type: "number", description: "0-100 risk score" },
                recommendation: { type: "string", enum: ["strongly_recommended", "recommended", "cautious", "not_recommended"] },
                recommendation_text: { type: "string", description: "التوصية النهائية بالعربي" },
                strengths: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "object", properties: { risk: { type: "string" }, severity: { type: "string", enum: ["low", "medium", "high", "critical"] }, mitigation: { type: "string" } }, required: ["risk", "severity", "mitigation"] } },
                financial_analysis: {
                  type: "object",
                  properties: {
                    estimated_startup_cost: { type: "string" },
                    estimated_monthly_expenses: { type: "string" },
                    estimated_monthly_revenue: { type: "string" },
                    estimated_roi_months: { type: "number" },
                    break_even_months: { type: "number" },
                    profit_margin_estimate: { type: "string" },
                  },
                },
                company_fit: { type: "string", description: "تحليل التوافق مع الشركة" },
                suitable_employees: { type: "array", items: { type: "object", properties: { name: { type: "string" }, reason: { type: "string" }, role_suggestion: { type: "string" } }, required: ["name", "reason"] } },
                timeline: { type: "array", items: { type: "object", properties: { phase: { type: "string" }, duration: { type: "string" }, tasks: { type: "array", items: { type: "string" } } }, required: ["phase", "duration", "tasks"] } },
                key_metrics: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" }, status: { type: "string", enum: ["positive", "neutral", "negative"] } }, required: ["label", "value", "status"] } },
                summary: { type: "string", description: "ملخص تنفيذي شامل" },
              },
              required: ["feasibility_score", "risk_score", "recommendation", "recommendation_text", "strengths", "risks", "financial_analysis", "summary"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_business_feasibility" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول لاحقاً" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للمتابعة" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error: " + status);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result;

    if (toolCall) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
      else throw new Error("Could not parse AI response");
    }

    // Save to DB
    if (feasibilityId) {
      await supabase.from("business_feasibility").update({
        ai_analysis: result,
        feasibility_score: result.feasibility_score || 0,
        risk_score: result.risk_score || 0,
        recommendation: result.recommendation || "cautious",
        status: "analyzed",
        updated_at: new Date().toISOString(),
      }).eq("id", feasibilityId);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("analyze-business error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
