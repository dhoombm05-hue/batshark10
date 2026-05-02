import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function callAI(systemPrompt: string, userPrompt: string, tool?: any) {
  const body: any = {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  if (tool) {
    body.tools = [tool];
    body.tool_choice = { type: "function", function: { name: tool.function.name } };
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${t}`);
  }
  const data = await res.json();
  if (tool) {
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    return args ? JSON.parse(args) : {};
  }
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, payload, userId } = await req.json();

    if (!action) throw new Error("action required");

    // ============ SMART ASSESSMENT ============
    if (action === "smart_assessment") {
      const { answers, track } = payload;
      const tool = {
        type: "function",
        function: {
          name: "generate_recommendations",
          description: "Generate personalized business recommendations",
          parameters: {
            type: "object",
            properties: {
              behavior_analysis: {
                type: "object",
                properties: {
                  thinking_pattern: { type: "string" },
                  risk_profile: { type: "string" },
                  decision_style: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                },
                required: ["thinking_pattern", "risk_profile", "decision_style", "strengths", "weaknesses"],
              },
              ai_summary: { type: "string" },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    business_type: { type: "string" },
                    match_percentage: { type: "number" },
                    required_budget: { type: "number" },
                    estimated_roi: { type: "number" },
                    difficulty: { type: "string" },
                    why_match: { type: "string" },
                    action_steps: { type: "array", items: { type: "string" } },
                    market_insight: { type: "string" },
                  },
                  required: ["title", "description", "business_type", "match_percentage", "required_budget", "estimated_roi", "difficulty", "why_match", "action_steps"],
                },
              },
            },
            required: ["behavior_analysis", "ai_summary", "recommendations"],
          },
        },
      };

      const systemPrompt = `أنت محلل أعمال خبير في منظومة Batshare 99 لباتشارك إيكانومي. مهمتك تحليل إجابات المستخدم بعمق وتحليل سلوكه ونمط تفكيره ثم اقتراح 3-5 أفكار بزنس مخصصة بدقة بناءً على ميزانيته ووقته ومهاراته وموقعه واهتماماته. كل اقتراح يجب أن يحمل نسبة توافق حقيقية (60-100). أجب بالعربية الفصحى.`;
      const userPrompt = `المسار: ${track}\nالإجابات:\n${JSON.stringify(answers, null, 2)}`;

      const result = await callAI(systemPrompt, userPrompt, tool);

      const { data: assessment, error: aErr } = await supabase
        .from("batshare_assessments")
        .insert({
          user_id: userId,
          track,
          answers,
          behavior_analysis: result.behavior_analysis,
          ai_summary: result.ai_summary,
          match_score: Math.round(
            result.recommendations.reduce((s: number, r: any) => s + r.match_percentage, 0) / result.recommendations.length,
          ),
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (aErr) throw aErr;

      const recsToInsert = result.recommendations.map((r: any) => ({
        user_id: userId,
        assessment_id: assessment.id,
        title: r.title,
        description: r.description,
        business_type: r.business_type,
        match_percentage: r.match_percentage,
        required_budget: r.required_budget,
        estimated_roi: r.estimated_roi,
        difficulty: r.difficulty,
        ai_analysis: { why_match: r.why_match, market_insight: r.market_insight },
        action_steps: r.action_steps,
        status: "suggested",
      }));
      const { data: recs } = await supabase.from("batshare_recommendations").insert(recsToInsert).select();

      return new Response(JSON.stringify({ assessment, recommendations: recs, behavior: result.behavior_analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============ DIAGNOSE EXISTING BUSINESS ============
    if (action === "diagnose_business") {
      const { businessName, currentState } = payload;
      const tool = {
        type: "function",
        function: {
          name: "diagnose",
          description: "Diagnose business weaknesses and create improvement roadmap",
          parameters: {
            type: "object",
            properties: {
              health_score: { type: "number" },
              weak_areas: { type: "array", items: { type: "object", properties: { area: { type: "string" }, severity: { type: "string" }, impact: { type: "string" } }, required: ["area", "severity", "impact"] } },
              strong_areas: { type: "array", items: { type: "string" } },
              improvement_roadmap: { type: "array", items: { type: "object", properties: { phase: { type: "string" }, actions: { type: "array", items: { type: "string" } }, duration: { type: "string" } }, required: ["phase", "actions", "duration"] } },
              ai_recommendations: { type: "object", properties: { priority: { type: "string" }, summary: { type: "string" } }, required: ["priority", "summary"] },
            },
            required: ["health_score", "weak_areas", "strong_areas", "improvement_roadmap", "ai_recommendations"],
          },
        },
      };
      const result = await callAI(
        "أنت مستشار تحول أعمال خبير. حلل البزنس بعمق وحدد نقاط الضعف والقوة وضع خارطة طريق محسنة.",
        `اسم البزنس: ${businessName}\nالوضع الحالي:\n${JSON.stringify(currentState, null, 2)}`,
        tool,
      );

      const { data, error } = await supabase
        .from("batshare_diagnostics")
        .insert({ user_id: userId, business_name: businessName, ...result })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ diagnostic: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ REVIVAL PLAN ============
    if (action === "revival_plan") {
      const { failedProjectName, failureContext } = payload;
      const tool = {
        type: "function",
        function: {
          name: "create_revival",
          description: "Create revival plan for failed project",
          parameters: {
            type: "object",
            properties: {
              failure_reasons: { type: "array", items: { type: "string" } },
              core_mistakes: { type: "array", items: { type: "string" } },
              revival_strategy: { type: "object", properties: { vision: { type: "string" }, key_changes: { type: "array", items: { type: "string" } }, timeline: { type: "string" } }, required: ["vision", "key_changes", "timeline"] },
              risk_reduction: { type: "array", items: { type: "string" } },
              ai_analysis: { type: "string" },
            },
            required: ["failure_reasons", "core_mistakes", "revival_strategy", "risk_reduction", "ai_analysis"],
          },
        },
      };
      const result = await callAI(
        "أنت خبير في إنعاش المشاريع الفاشلة. حلل أسباب الفشل واستخرج الأخطاء الجوهرية وضع خطة إنعاش محسنة.",
        `المشروع الفاشل: ${failedProjectName}\nالسياق:\n${JSON.stringify(failureContext, null, 2)}`,
        tool,
      );
      const { data, error } = await supabase
        .from("batshare_revival_plans")
        .insert({ user_id: userId, failed_project_name: failedProjectName, ...result, status: "ready" })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ revival: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ CREATE FULL PROJECT ============
    if (action === "create_full_project") {
      const { recommendationId } = payload;
      const { data: rec, error: recErr } = await supabase
        .from("batshare_recommendations")
        .select("*")
        .eq("id", recommendationId)
        .single();
      if (recErr || !rec) throw new Error("Recommendation not found");

      const slug = rec.title.replace(/[^\w\u0600-\u06FF\s-]/g, "").replace(/\s+/g, "-").toLowerCase().slice(0, 50) + "-" + Date.now().toString(36);

      const { data: project, error: pErr } = await supabase
        .from("projects")
        .insert({
          name: rec.title,
          slug,
          description: rec.description,
          status: "breakeven",
          total_revenue: 0,
          total_expenses: 0,
          net_profit: 0,
          growth_rate: 0,
        })
        .select()
        .single();
      if (pErr) throw pErr;

      // Initial capital journal
      if (rec.required_budget > 0) {
        const { data: je } = await supabase
          .from("journal_entries")
          .insert({
            description: `رأس مال تأسيسي - ${rec.title}`,
            project_id: project.id,
            notes: "تم إنشاؤه من Batshare 99",
          })
          .select()
          .single();
        if (je) {
          await supabase.from("journal_lines").insert([
            { journal_entry_id: je.id, account_name: `استثمار ${rec.title}`, account_type: "asset", debit: rec.required_budget, credit: 0 },
            { journal_entry_id: je.id, account_name: "رأس المال", account_type: "equity", debit: 0, credit: rec.required_budget },
          ]);
        }
      }

      // Project analysis
      await supabase.from("project_analysis").insert([
        { project_id: project.id, content: `لماذا هذا البزنس: ${rec.ai_analysis?.why_match || rec.description}`, sort_order: 1 },
        { project_id: project.id, content: `رؤية السوق: ${rec.ai_analysis?.market_insight || ""}`, sort_order: 2 },
        { project_id: project.id, content: `خطوات التنفيذ: ${(rec.action_steps || []).join(" | ")}`, sort_order: 3 },
      ]);

      // Update recommendation
      await supabase
        .from("batshare_recommendations")
        .update({ status: "activated", project_id: project.id })
        .eq("id", recommendationId);

      // Notify
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "🚀 تم إنشاء مشروعك!",
        body: `تم إنشاء "${rec.title}" بكامل بنيته من Batshare 99`,
        type: "project",
        link: `/projects/${slug}`,
        entity_id: project.id,
      });

      return new Response(JSON.stringify({ project, slug }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.error("batshare99-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
