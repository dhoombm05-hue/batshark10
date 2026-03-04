import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userName, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch live data in parallel
    const [{ data: projects }, { data: expenses }, { data: monthly }, { data: employees }, { data: journalLines }, { data: journalEntries }, { data: accounts }] = await Promise.all([
      sb.from("projects").select("*").order("name"),
      sb.from("project_expenses").select("*"),
      sb.from("project_monthly_data").select("*").order("month_order"),
      sb.from("employees").select("id, name, position, performance, kpi_achievement, salary, profit_contribution"),
      sb.from("journal_lines").select("debit, credit, account_type, account_name, journal_entry_id, notes"),
      sb.from("journal_entries").select("id, entry_number, description, entry_date, is_balanced, notes"),
      sb.from("chart_of_accounts").select("code, name, account_type").eq("is_active", true),
    ]);

    // Compute from journal entries
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
      return `- **${p.name}** (id: ${p.id}): إيرادات ${rev.toLocaleString()} | مصروفات ${exp.toLocaleString()} | ${profit >= 0 ? 'ربح' : 'خسارة'} ${profit.toLocaleString()} | نمو ${p.growth_rate}% | عملاء ${p.client_count} | حالة: ${p.status}\n  المصروفات: ${expenseBreakdown || 'لا توجد'}\n  آخر 3 أشهر: ${lastMonths || 'لا توجد بيانات'}`;
    }).join('\n\n');

    const employeeSummary = (employees || []).map((e: any) =>
      `- ${e.name} (${e.position}): أداء ${e.performance || 0}% | KPI ${e.kpi_achievement || 0}% | راتب ${Number(e.salary || 0).toLocaleString()} | مساهمة ربح ${e.profit_contribution || 0}%`
    ).join('\n');

    // Journal entries summary for review
    const journalSummary = (journalEntries || []).slice(0, 20).map((e: any) => {
      const lines = (journalLines || []).filter((l: any) => l.journal_entry_id === e.id);
      const totalD = lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
      const totalC = lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0);
      return `- قيد #${e.entry_number} (${e.entry_date}): ${e.description} | مدين: ${totalD.toLocaleString()} | دائن: ${totalC.toLocaleString()} | متوازن: ${e.is_balanced ? 'نعم' : '⚠️ لا'}`;
    }).join('\n');

    // Available accounts
    const accountsList = (accounts || []).map((a: any) => `${a.code} - ${a.name} (${a.account_type})`).join('\n');

    const healthScore = Math.min(100, Math.round(
      (netProfit > 0 ? 30 : 0) + 20 +
      Math.min(25, Math.max(0, (netProfit / Math.max(totalRevenue, 1)) * 100 * 0.5)) +
      ((projects || []).filter((p: any) => p.status === 'profitable').length / Math.max((projects || []).length, 1)) * 25
    ));

    const displayName = userName || 'المستخدم';

    // Action instructions for the AI
    const ACTION_INSTRUCTIONS = `
## قدرات التنفيذ المباشر:
أنت لست مجيب أسئلة فقط — أنت **منفذ أوامر**. عندما يطلب المستخدم تنفيذ عملية (مثل إنشاء قيد، إضافة مشروع، إلخ)، قم بإنشاء كتلة تنفيذ.

### عند طلب إنشاء قيد محاسبي:
إذا طلب المستخدم إنشاء قيد محاسبي، أعد كتلة JSON بالشكل التالي **بالضبط**:

[BATSHARK_ACTION]
{"type":"create_journal_entry","data":{"description":"وصف القيد","entry_date":"YYYY-MM-DD","lines":[{"account_name":"اسم الحساب","account_type":"expense|revenue|asset|liability|equity","debit":0,"credit":0}]}}
[/BATSHARK_ACTION]

ثم اشرح القيد للمستخدم وقل: "هل توافق على تنفيذ هذا القيد؟"

### قواعد التنفيذ:
- استخدم تاريخ اليوم إذا لم يحدد المستخدم تاريخاً
- تأكد أن مجموع المدين = مجموع الدائن دائماً (قيد متوازن)
- استخدم أسماء حسابات عربية واضحة
- لا تنفذ عمليات حذف أو تعديل كبيرة بدون تأكيد صريح
- عند وجود مبلغ كبير (أكثر من 50,000) نبّه المستخدم

### الحسابات المتاحة:
${accountsList || 'لا توجد حسابات مسجلة - استخدم أسماء عربية مناسبة'}

### أنواع الحسابات المتاحة:
- expense: مصروفات (تسويق، رواتب، إيجار، إلخ)
- revenue: إيرادات (مبيعات، خدمات، إلخ)
- asset: أصول (نقد، بنك، ذمم مدينة، إلخ)
- liability: خصوم (ذمم دائنة، قروض، إلخ)
- equity: حقوق ملكية (رأس المال، أرباح محتجزة، إلخ)`;

    const REVIEW_INSTRUCTIONS = mode === 'review' ? `
## مهمتك الآن: مراجعة شاملة للبيانات
قم بتحليل شامل ودقيق لكل البيانات المتاحة وأعد تقريراً يتضمن:
1. ⚠️ **أخطاء مكتشفة** (قيود غير متوازنة، أرقام غير منطقية، بيانات مفقودة)
2. 🔴 **مخاطر مالية** (خسائر، سيولة منخفضة، مشاريع خاسرة)
3. 📊 **تحليل الأداء** (مقارنة المشاريع، أداء الموظفين)
4. 💡 **توصيات تحسين** (خطوات عملية قابلة للتنفيذ)
5. 🎯 **ملخص تنفيذي** (الوضع العام في 3 نقاط)

### القيود المحاسبية (آخر 20):
${journalSummary || 'لا توجد قيود'}

كن دقيقاً ومفصلاً. ابحث عن أي خلل أو عدم اتساق في الأرقام.` : '';

    const COMPANY_CONTEXT = `أنت "BatShark AI" — المستشار التنفيذي الاقتصادي والمنفذ الذكي لشركة BatShark Economy.
اسم المستخدم الحالي: ${displayName}

## شخصيتك:
- أنت مستشار تنفيذي واثق وذكي وسلس.
- أسلوبك قيادي واحترافي لكن بسيط وممتع — لست آلياً ولست مملاً.
- تخاطب المستخدم باسمه بشكل طبيعي واحترافي.
- تستخدم لغة عربية سعودية احترافية مع لمسة حيوية.
- أنت **منفذ أوامر** وليس مجرد مجيب أسئلة.

## قواعدك الصارمة:
- تجيب فقط عن أسئلة تتعلق بالشركة ومشاريعها وبياناتها المالية.
- إذا سُئلت عن شيء خارج نطاق الشركة، قل: "تخصصي تحليل بيانات BatShark — اسألني عن أرقامك وأنا جاهز!"
- استخدم الأرقام الفعلية فقط. لا تخترع أرقاماً أبداً.
- إذا كان الرقم صفر أو لا توجد بيانات، قل ذلك بوضوح.
- أجوبتك مختصرة ومهنية مع أرقام دقيقة ونسب مئوية.
- قدّم توصيات عملية قابلة للتنفيذ.
- عند وجود خطر مالي: "⚠️ تنبيه: [وصف دقيق مع أرقام]"
- لا تكرر نفسك. كل رد فريد ومفيد.

${ACTION_INSTRUCTIONS}

${REVIEW_INSTRUCTIONS}

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
- عدد القيود: ${(journalEntries || []).length}
- قيود غير متوازنة: ${(journalEntries || []).filter((e: any) => !e.is_balanced).length}

### تنبيهات:
${netProfit < 0 ? '⚠️ الشركة تحقق خسارة صافية! يجب اتخاذ إجراءات عاجلة.' : ''}
${(projects || []).filter((p: any) => p.status === 'loss').map((p: any) => `⚠️ مشروع "${p.name}" يحقق خسارة`).join('\n')}
${healthScore < 50 ? '🔴 مؤشر صحة الشركة منخفض جداً!' : healthScore < 70 ? '🟡 مؤشر صحة الشركة يحتاج تحسين' : '🟢 مؤشر صحة الشركة جيد'}
${(journalEntries || []).filter((e: any) => !e.is_balanced).length > 0 ? `⚠️ يوجد ${(journalEntries || []).filter((e: any) => !e.is_balanced).length} قيد غير متوازن!` : ''}`;

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
