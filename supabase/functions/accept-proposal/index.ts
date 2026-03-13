import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { proposalId, ceoNotes } = await req.json();
    if (!proposalId) throw new Error("proposalId is required");

    // Get proposal
    const { data: proposal, error: fetchError } = await supabase
      .from("business_proposals")
      .select("*")
      .eq("id", proposalId)
      .single();
    if (fetchError || !proposal) throw new Error("Proposal not found");

    // Create slug from title
    const slug = proposal.title
      .replace(/[^\w\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 50) + '-' + Date.now().toString(36);

    // 1. Create project
    const financialPlan = proposal.financial_plan || {};
    const monthlyRevenue = parseFloat(String(financialPlan.expected_monthly_revenue || '0').replace(/[^\d.]/g, '')) || 0;
    const monthlyExpenses = parseFloat(String(financialPlan.monthly_expenses || '0').replace(/[^\d.]/g, '')) || 0;

    const { data: project, error: projectError } = await supabase.from("projects").insert({
      name: proposal.title,
      slug,
      description: proposal.description,
      status: 'startup',
      total_revenue: 0,
      total_expenses: 0,
      net_profit: 0,
      growth_rate: 0,
    }).select().single();
    if (projectError) throw projectError;

    // 2. Create expense entries from breakdown
    const expenseBreakdown = financialPlan.expense_breakdown || proposal.excel_data || [];
    for (const item of expenseBreakdown) {
      if (item.category && item.amount) {
        await supabase.from("project_expenses").insert({
          project_id: project.id,
          category: item.category,
          amount: item.amount,
          notes: `${item.frequency || 'مرة واحدة'} - ${item.notes || 'من اقتراح AI'}`,
        });
      }
    }

    // 3. Create revenue entries from streams
    const revenueStreams = financialPlan.revenue_streams || [];
    for (const item of revenueStreams) {
      if (item.source && item.expected_amount) {
        await supabase.from("project_revenues").insert({
          project_id: project.id,
          source: item.source,
          amount: item.expected_amount,
          notes: item.notes || 'من اقتراح AI',
          category: 'projected',
        });
      }
    }

    // 4. Create initial journal entry
    const startupCost = parseFloat(String(financialPlan.startup_cost || '0').replace(/[^\d.]/g, '')) || 0;
    if (startupCost > 0) {
      const { data: journalEntry } = await supabase.from("journal_entries").insert({
        description: `رأس مال تأسيسي - ${proposal.title}`,
        project_id: project.id,
        notes: 'قيد تأسيسي تلقائي من نظام المقترحات الذكية',
      }).select().single();

      if (journalEntry) {
        await supabase.from("journal_lines").insert([
          {
            journal_entry_id: journalEntry.id,
            account_name: `استثمار - ${proposal.title}`,
            account_type: 'asset',
            debit: startupCost,
            credit: 0,
          },
          {
            journal_entry_id: journalEntry.id,
            account_name: 'رأس المال',
            account_type: 'equity',
            debit: 0,
            credit: startupCost,
          },
        ]);
      }
    }

    // 5. Update proposal status
    await supabase.from("business_proposals").update({
      status: "accepted",
      ceo_decision: "accepted",
      ceo_notes: ceoNotes || null,
      decided_at: new Date().toISOString(),
      project_id: project.id,
      updated_at: new Date().toISOString(),
    }).eq("id", proposalId);

    return new Response(JSON.stringify({
      success: true,
      project_id: project.id,
      project_slug: slug,
      message: `تم إنشاء مشروع "${proposal.title}" وربطه بالكامل`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("accept-proposal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
