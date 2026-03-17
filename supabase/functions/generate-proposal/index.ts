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
    const { mode = "auto" } = body;

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

    const { count } = await supabase.from("business_proposals").select("*", { count: "exact", head: true });
    const cycleNumber = (count || 0) + 1;

    const systemPrompt = `أنت مستشار استثماري خبير ومحلل أعمال استراتيجي في منصة BatShark. مهمتك اقتراح فرصة بزنس جديدة مبتكرة ومربحة بناءً على بحث عميق وتحليل شامل للسوق.

## السياق:
- الشركة لديها ${companyContext.currentProjects.length} مشاريع حالية
- إجمالي الإيرادات: ${companyContext.totalRevenue.toLocaleString()} ريال
- إجمالي الأرباح: ${companyContext.totalProfit.toLocaleString()} ريال
- عدد الموظفين: ${companyContext.totalEmployees}
- المشاريع الحالية: ${JSON.stringify(companyContext.currentProjects)}
- الموظفين وأدائهم: ${JSON.stringify(companyContext.employees)}

## الاقتراحات السابقة (تجنب التكرار):
${companyContext.previousProposals.join(', ') || 'لا يوجد'}

## تعليمات البحث العميق والاحترافي:
أنت مطالب بتقديم دراسة جدوى احترافية وعميقة جداً كأنك فريق استشاري كامل. يجب أن تشمل:

1. **لماذا هذا البزنس**: اشرح بالتفصيل لماذا تقترح هذا البزنس تحديداً، ما الفرصة في السوق، ولماذا هو مناسب للشركة الآن.

2. **دراسة السوق العميقة**: حجم السوق الفعلي بالأرقام، معدل النمو، الفجوات، الطلب، التوجهات.

3. **الموردين والمصادر**: لكل مكون أو معدة مطلوبة:
   - من أين تُشترى (اسم المورد أو المنصة أو الموقع)
   - السعر التقريبي بالريال السعودي
   - البديل الأرخص إن وجد
   - نصائح للشراء (جملة/تجزئة، استيراد/محلي)
   مثال: "آلة إسبريسو احترافية - من شركة La Marzocca أو من علي إكسبريس - السعر 15,000-25,000 ريال - الأفضل شراؤها من موزع محلي للضمان"

4. **سيناريوهات متعددة**: قدم 3 سيناريوهات:
   - سيناريو متفائل (أفضل حالة)
   - سيناريو واقعي (الأرجح)
   - سيناريو متشائم (أسوأ حالة)
   لكل سيناريو: الإيرادات، المصاريف، الربح، فترة الاسترداد

5. **خطوات التنفيذ التفصيلية**: خطوة بخطوة من الصفر:
   - ماذا تفعل أولاً؟ ثانياً؟ ثالثاً؟
   - أين تذهب؟ من تتواصل معه؟
   - ما المستندات المطلوبة؟
   - كم يستغرق كل شيء؟

6. **التكاليف المفصلة بدقة**: كل بند مصروف مع:
   - المبلغ الدقيق
   - هل هو مرة واحدة أم شهري أم سنوي
   - من أين يُشترى
   - هل يمكن توفير المبلغ

7. **تحليل المنافسين الحقيقي**: أسماء منافسين فعليين في السوق السعودي مع نقاط قوتهم وضعفهم.

8. **نصائح ذهبية**: نصائح عملية من واقع السوق لضمان النجاح.

9. **روابط تعليمية**: قدم 5-8 روابط يوتيوب حقيقية تشرح هذا النوع من البزنس. ابحث عن فيديوهات عربية أو إنجليزية تعليمية تشرح:
   - كيف تبدأ هذا البزنس من الصفر
   - أخطاء يجب تجنبها
   - قصص نجاح في نفس المجال
   - شرح المعدات والأدوات المطلوبة
   ملاحظة: قدم روابط وصفية واضحة بعنوان كل فيديو ووصف مختصر

10. **شرح تفصيلي كامل**: اكتب شرحاً مفصلاً وعميقاً للبزنس (5 فقرات على الأقل) يغطي:
    - ما هو هذا البزنس بالضبط وكيف يعمل
    - من هم العملاء وكيف تصل لهم
    - ما المهارات المطلوبة وكيف تكتسبها
    - التحديات الشائعة وكيف تتغلب عليها
    - رؤية مستقبلية لنمو البزنس

كن محترفاً جداً وأعطِ تفاصيل حقيقية وعملية كأنك مستشار يتقاضى مليون ريال.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `اقترح فكرة بزنس جديدة رقم ${cycleNumber}. قدم دراسة جدوى عميقة واحترافية جداً مع تفاصيل الموردين والأسعار والسيناريوهات. خذ وقتك وأعطني نتائج احترافية.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "propose_business",
            description: "Propose a new business with deep professional feasibility study",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "اسم البزنس المقترح" },
                business_type: { type: "string", description: "نوع/قطاع البزنس" },
                sector: { type: "string", description: "القطاع الرئيسي" },
                location: { type: "string", description: "الموقع المقترح مع التفاصيل" },
                description: { type: "string", description: "وصف شامل ومفصل للفكرة (فقرتين على الأقل)" },
                why_this_business: { type: "string", description: "شرح مفصل لماذا هذا البزنس مناسب الآن - فقرتين على الأقل تشرح الفرصة والتوقيت" },
                feasibility_score: { type: "number", description: "درجة الجدوى 0-100" },
                risk_score: { type: "number", description: "درجة المخاطر 0-100" },
                recommendation: { type: "string", enum: ["strongly_recommended", "recommended", "cautious"] },
                market_research: {
                  type: "object",
                  properties: {
                    market_size: { type: "string", description: "حجم السوق بالأرقام الفعلية" },
                    growth_trend: { type: "string", description: "اتجاه النمو مع نسب" },
                    target_audience: { type: "string", description: "الفئة المستهدفة بالتفصيل" },
                    demand_analysis: { type: "string", description: "تحليل الطلب المفصل" },
                    market_gap: { type: "string", description: "الفجوة في السوق التي سنستغلها" },
                    market_trends: { type: "string", description: "التوجهات الحالية في السوق" },
                    customer_behavior: { type: "string", description: "سلوك العملاء المستهدفين" },
                  },
                },
                suppliers: {
                  type: "array",
                  description: "قائمة الموردين ومصادر الشراء التفصيلية",
                  items: {
                    type: "object",
                    properties: {
                      item_name: { type: "string", description: "اسم المنتج/المعدة" },
                      supplier_name: { type: "string", description: "اسم المورد أو المنصة" },
                      price_range: { type: "string", description: "نطاق السعر بالريال" },
                      alternative: { type: "string", description: "البديل الأرخص" },
                      purchase_advice: { type: "string", description: "نصيحة الشراء (جملة/تجزئة/استيراد)" },
                      where_to_buy: { type: "string", description: "من أين بالتحديد (موقع/محل/منصة)" },
                      warranty_info: { type: "string", description: "معلومات الضمان" },
                    },
                    required: ["item_name", "supplier_name", "price_range"],
                  },
                },
                scenarios: {
                  type: "object",
                  description: "3 سيناريوهات مالية",
                  properties: {
                    optimistic: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        monthly_revenue: { type: "number" },
                        monthly_expenses: { type: "number" },
                        monthly_profit: { type: "number" },
                        roi_months: { type: "number" },
                        description: { type: "string" },
                      },
                      required: ["label", "monthly_revenue", "monthly_expenses", "monthly_profit", "roi_months", "description"],
                    },
                    realistic: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        monthly_revenue: { type: "number" },
                        monthly_expenses: { type: "number" },
                        monthly_profit: { type: "number" },
                        roi_months: { type: "number" },
                        description: { type: "string" },
                      },
                      required: ["label", "monthly_revenue", "monthly_expenses", "monthly_profit", "roi_months", "description"],
                    },
                    pessimistic: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        monthly_revenue: { type: "number" },
                        monthly_expenses: { type: "number" },
                        monthly_profit: { type: "number" },
                        roi_months: { type: "number" },
                        description: { type: "string" },
                      },
                      required: ["label", "monthly_revenue", "monthly_expenses", "monthly_profit", "roi_months", "description"],
                    },
                  },
                  required: ["optimistic", "realistic", "pessimistic"],
                },
                golden_tips: {
                  type: "array",
                  description: "نصائح ذهبية عملية من واقع السوق",
                  items: { type: "string" },
                },
                step_by_step_guide: {
                  type: "array",
                  description: "دليل خطوة بخطوة للتنفيذ من الصفر",
                  items: {
                    type: "object",
                    properties: {
                      step_number: { type: "number" },
                      title: { type: "string" },
                      description: { type: "string", description: "شرح تفصيلي للخطوة" },
                      where_to_go: { type: "string", description: "أين تذهب أو من تتواصل معه" },
                      estimated_time: { type: "string", description: "الوقت المتوقع" },
                      estimated_cost: { type: "string", description: "التكلفة المتوقعة" },
                      documents_needed: { type: "string", description: "المستندات المطلوبة" },
                    },
                    required: ["step_number", "title", "description"],
                  },
                },
                competitors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "اسم المنافس الحقيقي في السوق السعودي" },
                      strengths: { type: "string" },
                      weaknesses: { type: "string" },
                      market_share: { type: "string" },
                      pricing: { type: "string", description: "تسعيرهم" },
                      location: { type: "string", description: "مواقعهم" },
                    },
                    required: ["name", "strengths", "weaknesses"],
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
                  description: "تفصيل المصاريف مع مصادر الشراء",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      amount: { type: "number" },
                      frequency: { type: "string", enum: ["once", "monthly", "yearly"] },
                      notes: { type: "string" },
                      where_to_buy: { type: "string", description: "من أين يُشترى" },
                      can_save: { type: "string", description: "هل يمكن التوفير وكيف" },
                    },
                    required: ["category", "amount", "frequency"],
                  },
                },
                revenue_streams: {
                  type: "array",
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
                      how_to_get: { type: "string", description: "كيف تحصل عليها خطوة بخطوة" },
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
                  items: {
                    type: "object",
                    properties: {
                      metric: { type: "string" },
                      target: { type: "string" },
                      timeframe: { type: "string" },
                    },
                  },
                },
                summary: { type: "string", description: "ملخص تنفيذي شامل واحترافي - 3 فقرات على الأقل" },
                detailed_explanation: { type: "string", description: "شرح تفصيلي كامل وعميق للبزنس - 5 فقرات على الأقل يغطي ماهية البزنس وكيف يعمل والعملاء والمهارات والتحديات والرؤية المستقبلية" },
                youtube_links: {
                  type: "array",
                  description: "روابط يوتيوب تعليمية تشرح هذا النوع من البزنس",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "عنوان الفيديو" },
                      description: { type: "string", description: "وصف مختصر لمحتوى الفيديو" },
                      search_query: { type: "string", description: "عبارة البحث المقترحة في يوتيوب للعثور على فيديوهات مشابهة" },
                      category: { type: "string", enum: ["beginner", "advanced", "success_story", "equipment", "marketing"], description: "تصنيف الفيديو" },
                    },
                    required: ["title", "description", "search_query"],
                  },
                },
              },
              required: ["title", "business_type", "description", "why_this_business", "feasibility_score", "risk_score", "recommendation", "market_research", "suppliers", "scenarios", "golden_tips", "step_by_step_guide", "financial_plan", "expense_breakdown", "revenue_streams", "risks", "action_plan", "summary", "detailed_explanation", "youtube_links"],
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
        golden_tips: result.golden_tips || [],
        step_by_step_guide: result.step_by_step_guide || [],
        suppliers: result.suppliers || [],
        scenarios: result.scenarios || {},
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
