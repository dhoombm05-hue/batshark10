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

    const body = await req.json().catch(() => ({}));
    const { mode = "auto" } = body; // "auto" = scheduled, "manual" = on-demand

    // Get company context
    const { data: projects } = await supabase.from("projects").select("*");
    const { data: employees } = await supabase.from("employees").select("name, position, department, performance, kpi_achievement, salary");
    const { data: existingProposals } = await supabase.from("business_proposals").select("title, business_type, status");
    const { data: feasibilities } = await supabase.from("business_feasibility").select("title, business_type, ai_analysis");

    const companyContext = {
      currentProjects: (projects || []).map(p => ({
        name: p.name, status: p.status, revenue: p.total_revenue, expenses: p.total_expenses, profit: p.net_profit, growthRate: p.growth_rate,
      })),
      totalRevenue: (projects || []).reduce((s, p) => s + Number(p.total_revenue || 0), 0),
      totalProfit: (projects || []).reduce((s, p) => s + Number(p.net_profit || 0), 0),
      employees: (employees || []).map(e => ({
        name: e.name, position: e.position, department: e.department, performance: e.performance, kpi: e.kpi_achievement,
      })),
      totalEmployees: employees?.length || 0,
      previousProposals: (existingProposals || []).map(p => p.title),
      previousFeasibilities: (feasibilities || []).map(f => f.title),
    };

    // Get the current cycle number
    const { count } = await supabase.from("business_proposals").select("*", { count: "exact", head: true });
    const cycleNumber = (count || 0) + 1;

    const systemPrompt = `أنت مستشار استثماري خبير ومحلل أعمال استراتيجي في منصة BatShark. مهمتك اقتراح فرصة بزنس جديدة مبتكرة ومربحة بناءً على تحليل شامل للسوق وموارد الشركة الحالية.

## السياق:
- الشركة لديها ${companyContext.currentProjects.length} مشاريع حالية
- إجمالي الإيرادات: ${companyContext.totalRevenue.toLocaleString()} ريال
- إجمالي الأرباح: ${companyContext.totalProfit.toLocaleString()} ريال  
- عدد الموظفين: ${companyContext.totalEmployees}
- المشاريع الحالية: ${JSON.stringify(companyContext.currentProjects)}
- الموظفين وأدائهم: ${JSON.stringify(companyContext.employees)}

## الاقتراحات السابقة (تجنب التكرار):
${companyContext.previousProposals.join(', ') || 'لا يوجد'}

## المطلوب:
اقترح فكرة بزنس جديدة ومبتكرة تتناسب مع قدرات الشركة. يجب أن تكون:
1. فكرة واقعية وقابلة للتنفيذ
2. مختلفة عن الاقتراحات السابقة
3. تستفيد من موارد الشركة الحالية
4. مدروسة بالكامل من كل الجوانب

ابحث وحلل بنفسك: حجم السوق، المنافسين، التكاليف، التراخيص، الأرباح المتوقعة، المخاطر، خطة العمل، الموظفين المناسبين.`;

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
          { role: "user", content: `اقترح فكرة بزنس جديدة رقم ${cycleNumber}. قدم تحليلاً شاملاً ومفصلاً.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "propose_business",
            description: "Propose a new business opportunity with full analysis",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "اسم البزنس المقترح" },
                business_type: { type: "string", description: "نوع/قطاع البزنس" },
                sector: { type: "string", description: "القطاع الرئيسي" },
                location: { type: "string", description: "الموقع المقترح" },
                description: { type: "string", description: "وصف شامل للفكرة" },
                why_this_business: { type: "string", description: "لماذا هذا البزنس مناسب للشركة الآن" },
                feasibility_score: { type: "number", description: "درجة الجدوى 0-100" },
                risk_score: { type: "number", description: "درجة المخاطر 0-100" },
                recommendation: { type: "string", enum: ["strongly_recommended", "recommended", "cautious"] },
                market_research: {
                  type: "object",
                  properties: {
                    market_size: { type: "string" },
                    growth_trend: { type: "string" },
                    target_audience: { type: "string" },
                    demand_analysis: { type: "string" },
                    market_gap: { type: "string", description: "الفجوة في السوق" },
                  },
                },
                competitors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      strengths: { type: "string" },
                      weaknesses: { type: "string" },
                      market_share: { type: "string" },
                    },
                  },
                },
                financial_plan: {
                  type: "object",
                  properties: {
                    startup_cost: { type: "string" },
                    monthly_expenses: { type: "string" },
                    expected_monthly_revenue: { type: "string" },
                    expected_monthly_profit: { type: "string" },
                    roi_months: { type: "number" },
                    break_even_months: { type: "number" },
                    profit_margin: { type: "string" },
                    first_year_revenue: { type: "string" },
                    first_year_profit: { type: "string" },
                  },
                },
                expense_breakdown: {
                  type: "array",
                  description: "تفصيل المصاريف لجدول Excel",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      amount: { type: "number" },
                      frequency: { type: "string", enum: ["once", "monthly", "yearly"] },
                      notes: { type: "string" },
                    },
                    required: ["category", "amount", "frequency"],
                  },
                },
                revenue_streams: {
                  type: "array",
                  description: "مصادر الإيرادات لجدول Excel",
                  items: {
                    type: "object",
                    properties: {
                      source: { type: "string" },
                      expected_amount: { type: "number" },
                      frequency: { type: "string" },
                      notes: { type: "string" },
                    },
                    required: ["source", "expected_amount"],
                  },
                },
                licenses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      authority: { type: "string" },
                      cost: { type: "string" },
                      duration: { type: "string" },
                    },
                  },
                },
                legal_structure: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    reason: { type: "string" },
                    requirements: { type: "string" },
                  },
                },
                risks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      risk: { type: "string" },
                      severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                      probability: { type: "string", enum: ["low", "medium", "high"] },
                      mitigation: { type: "string" },
                    },
                    required: ["risk", "severity", "mitigation"],
                  },
                },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } },
                threats: { type: "array", items: { type: "string" } },
                suitable_employees: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      current_role: { type: "string" },
                      suggested_role: { type: "string" },
                      reason: { type: "string" },
                    },
                  },
                },
                action_plan: {
                  type: "array",
                  description: "خطة العمل المقترحة بالمراحل",
                  items: {
                    type: "object",
                    properties: {
                      phase: { type: "string" },
                      duration: { type: "string" },
                      tasks: { type: "array", items: { type: "string" } },
                      milestone: { type: "string" },
                      budget: { type: "string" },
                    },
                    required: ["phase", "duration", "tasks"],
                  },
                },
                kpis: {
                  type: "array",
                  description: "مؤشرات الأداء الرئيسية",
                  items: {
                    type: "object",
                    properties: {
                      metric: { type: "string" },
                      target: { type: "string" },
                      timeframe: { type: "string" },
                    },
                  },
                },
                summary: { type: "string", description: "ملخص تنفيذي شامل" },
              },
              required: ["title", "business_type", "description", "feasibility_score", "risk_score", "recommendation", "market_research", "financial_plan", "expense_breakdown", "revenue_streams", "risks", "action_plan", "summary"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "propose_business" } },
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

    // Save proposal to DB
    const { data: proposal, error: insertError } = await supabase.from("business_proposals").insert({
      title: result.title,
      business_type: result.business_type,
      sector: result.sector || result.business_type,
      location: result.location || "المملكة العربية السعودية",
      description: result.description,
      ai_research: {
        why_this_business: result.why_this_business,
        summary: result.summary,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        opportunities: result.opportunities || [],
        threats: result.threats || [],
        kpis: result.kpis || [],
        suitable_employees: result.suitable_employees || [],
      },
      ai_analysis: {
        market_research: result.market_research,
        legal_structure: result.legal_structure,
      },
      market_data: result.market_research || {},
      financial_plan: {
        ...result.financial_plan,
        expense_breakdown: result.expense_breakdown || [],
        revenue_streams: result.revenue_streams || [],
      },
      action_plan: { phases: result.action_plan || [] },
      competitors: result.competitors || [],
      licenses: result.licenses || [],
      risk_assessment: { risks: result.risks || [] },
      excel_data: result.expense_breakdown || [],
      feasibility_score: result.feasibility_score || 0,
      risk_score: result.risk_score || 0,
      recommendation: result.recommendation || "cautious",
      status: "pending",
      auto_generated: mode === "auto",
      generation_cycle: cycleNumber,
      next_generation_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    }).select().single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, data: proposal }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-proposal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
