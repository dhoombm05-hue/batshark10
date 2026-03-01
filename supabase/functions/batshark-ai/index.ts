import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch live data in parallel
    const [{ data: projects }, { data: expenses }, { data: monthly }, { data: employees }, { data: journalLines }] = await Promise.all([
      sb.from("projects").select("*").order("name"),
      sb.from("project_expenses").select("*"),
      sb.from("project_monthly_data").select("*").order("month_order"),
      sb.from("employees").select("id, name, position, performance, kpi_achievement, salary, profit_contribution"),
      sb.from("journal_lines").select("debit, credit, account_type"),
    ]);

    // Compute from journal entries (real accounting data)
    const totalCredits = (journalLines || []).reduce((s: number, l: any) => s + Number(l.credit || 0), 0);
    const totalDebits = (journalLines || []).reduce((s: number, l: any) => s + Number(l.debit || 0), 0);

    const totalRevenue = (projects || []).reduce((s: number, p: any) => s + Number(p.override_total_revenue ?? p.total_revenue), 0);
    const totalExpenses = (projects || []).reduce((s: number, p: any) => s + Number(p.override_total_expenses ?? p.total_expenses), 0);
    const netProfit = totalRevenue - totalExpenses;

    const projectDetails = (projects || []).map((p: any) => {
      const pExpenses = (expenses || []).filter((e: any) => e.project_id === p.id);
      const pMonthly = (monthly || []).filter((m: any) => m.project_id === p.id);
      const rev = Number(p.override_total_revenue ?? p.total_revenue);
      const exp = Number(p.override_total_expenses ?? p.total_expenses);
      const profit = rev - exp;
      const expenseBreakdown = pExpenses.map((e: any) => `${e.category}: ${Number(e.amount).toLocaleString()} ريال`).join('، ');
      const lastMonths = pMonthly.slice(-3).map((m: any) => `${m.month}: إيراد ${Number(m.revenue).toLocaleString()} / مصروف ${Number(m.expenses).toLocaleString()}`).join(' | ');
      
      return `- **${p.name}**: إيرادات ${rev.toLocaleString()} | مصروفات ${exp.toLocaleString()} | ${profit >= 0 ? 'ربح' : 'خسارة'} ${profit.toLocaleString()} | نمو ${p.growth_rate}% | عملاء ${p.client_count} | حالة: ${p.status}
  المصروفات: ${expenseBreakdown || 'لا توجد'}
  آخر 3 أشهر: ${lastMonths || 'لا توجد بيانات'}`;
    }).join('\n\n');

    const employeeSummary = (employees || []).map((e: any) => 
      `- ${e.name} (${e.position}): أداء ${e.performance || 0}% | KPI ${e.kpi_achievement || 0}% | راتب ${Number(e.salary || 0).toLocaleString()} | مساهمة ربح ${e.profit_contribution || 0}%`
    ).join('\n');

    const healthScore = Math.min(100, Math.round(
      (netProfit > 0 ? 30 : 0) +
      20 +
      Math.min(25, Math.max(0, (netProfit / Math.max(totalRevenue, 1)) * 100 * 0.5)) +
      ((projects || []).filter((p: any) => p.status === 'profitable').length / Math.max((projects || []).length, 1)) * 25
    ));

    const displayName = userName || 'المستخدم';

    const COMPANY_CONTEXT = `أنت "BatShark AI" — المستشار المالي الذكي لشركة BatShark Economy.
اسم المستخدم الحالي: ${displayName}

## قواعدك:
- خاطب المستخدم باسمه "${displayName}" بشكل طبيعي واحترافي (مثلاً: "يا ${displayName}، وضعك المالي...")
- تجيب فقط عن أسئلة تتعلق بالشركة ومشاريعها وبياناتها المالية.
- إذا سُئلت عن شيء خارج نطاق الشركة، قل: "أنا متخصص في تحليل بيانات BatShark فقط."
- تحلل البيانات وتقدم توصيات عملية مبنية على الأرقام الفعلية.
- تستخدم اللغة العربية دائماً بأسلوب سعودي احترافي.
- أجب بشكل مختصر ومهني مع أرقام دقيقة.
- إذا لاحظت أزمة مالية (خسارة أو انخفاض حاد)، اقترح حلولاً عملية.
- حلل العلاقات بين المشاريع.
- قيّم أداء المشاريع نسبياً لبعضها البعض.
- عند سؤالك عن الموظفين، حلل أداءهم بناءً على البيانات.

## البيانات المالية الحية:

### المشاريع:
${projectDetails}

### الموظفين:
${employeeSummary || 'لا يوجد موظفين مسجلين'}

### الإجمالي:
- إجمالي الإيرادات: ${totalRevenue.toLocaleString()} ريال
- إجمالي المصروفات: ${totalExpenses.toLocaleString()} ريال
- صافي الربح: ${netProfit.toLocaleString()} ريال
- إجمالي القيود الدائنة: ${totalCredits.toLocaleString()} ريال
- إجمالي القيود المدينة: ${totalDebits.toLocaleString()} ريال
- عدد المشاريع: ${(projects || []).length}
- مشاريع مربحة: ${(projects || []).filter((p: any) => p.status === 'profitable').length}
- مشاريع خاسرة: ${(projects || []).filter((p: any) => p.status === 'loss').length}
- مؤشر صحة الشركة: ${healthScore}/100
- ROI: ${totalExpenses > 0 ? ((netProfit / totalExpenses) * 100).toFixed(1) : 0}%
- هامش الربح: ${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%

### تنبيهات:
${netProfit < 0 ? '⚠️ الشركة تحقق خسارة صافية! يجب اتخاذ إجراءات عاجلة.' : ''}
${(projects || []).filter((p: any) => p.status === 'loss').map((p: any) => `⚠️ مشروع "${p.name}" يحقق خسارة`).join('\n')}
${healthScore < 50 ? '🔴 مؤشر صحة الشركة منخفض جداً!' : healthScore < 70 ? '🟡 مؤشر صحة الشركة يحتاج تحسين' : '🟢 مؤشر صحة الشركة جيد'}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: COMPANY_CONTEXT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ في الذكاء الاصطناعي" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("batshark-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
