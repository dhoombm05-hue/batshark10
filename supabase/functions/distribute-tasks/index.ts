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

    const { action, distributionId, content, tasks: manualTasks } = await req.json();

    if (action === "analyze") {
      // Get employees data for smart assignment
      const { data: employees } = await supabase.from("employees").select("*");
      const { data: existingTasks } = await supabase.from("tasks").select("*").in("status", ["todo", "in_progress"]);
      const { data: activityLogs } = await supabase.from("activity_impact_log").select("*").order("created_at", { ascending: false }).limit(200);
      const { data: evaluations } = await supabase.from("employee_evaluations").select("*").order("created_at", { ascending: false });

      const employeeProfiles = (employees || []).map(emp => {
        const empTasks = (existingTasks || []).filter((t: any) => t.assigned_to_name === emp.name);
        const empActivity = (activityLogs || []).filter((a: any) => a.user_name === emp.name);
        const empEvals = (evaluations || []).filter((e: any) => e.employee_name === emp.name);
        const latestEval = empEvals[0];
        
        return {
          id: emp.id,
          name: emp.name,
          position: emp.position,
          department: emp.department,
          performance: emp.performance,
          kpiAchievement: emp.kpi_achievement,
          currentTaskCount: empTasks.length,
          pendingTasks: empTasks.filter((t: any) => t.status === "todo").length,
          inProgressTasks: empTasks.filter((t: any) => t.status === "in_progress").length,
          completedTasksTotal: (existingTasks || []).filter((t: any) => t.assigned_to_name === emp.name && t.status === "done").length,
          recentActivityCount: empActivity.length,
          topSections: [...new Set(empActivity.map((a: any) => a.section).filter(Boolean))].slice(0, 5),
          topEntityTypes: [...new Set(empActivity.map((a: any) => a.entity_type))].slice(0, 5),
          latestEvalScore: latestEval?.overall_score || null,
          strengths: emp.achievements || [],
          improvements: emp.improvements || [],
          experience: emp.experience,
        };
      });

      const systemPrompt = `أنت نظام ذكي لتوزيع المهام في منصة BatShark الإدارية. مهمتك:

1. تحليل المحتوى المقدم (ملف أو مهام) واستخراج المهام الفردية
2. تعيين كل مهمة للموظف الأنسب بناءً على:
   - أداء الموظف الحالي (performance, kpi)
   - عدد المهام الحالية (لتوزيع العبء بشكل عادل)
   - مجال تخصص الموظف ونشاطه الأخير
   - نقاط القوة والضعف
   - فرص التطوير (أسند مهام تساعد الموظف على التحسن)

3. لكل مهمة قدم:
   - عنوان واضح ومختصر
   - وصف تفصيلي
   - أولوية (low/medium/high/critical)
   - تصنيف (financial/operational/technical/marketing/strategic/administrative)
   - مهارات مطلوبة
   - ساعات تقديرية
   - سبب اختيار هذا الموظف (assignment_reason)
   - ملاحظات تطوير الموظف (كيف هذه المهمة تساعده على التطور)

4. قدم تحليل شامل يشمل:
   - ملخص التوزيع
   - رؤى تطوير الموظفين
   - مخاطر محتملة
   - توصيات

الموظفين المتاحين:
${JSON.stringify(employeeProfiles, null, 2)}

أجب بصيغة JSON فقط بالهيكل التالي:
{
  "tasks": [
    {
      "title": "...",
      "description": "...",
      "priority": "medium",
      "category": "operational",
      "required_skills": ["..."],
      "estimated_hours": 4,
      "assigned_employee_name": "اسم الموظف",
      "assignment_reason": "لأنه متخصص في...",
      "employee_development_notes": "هذه المهمة ستساعده على تطوير..."
    }
  ],
  "analysis": {
    "summary": "ملخص التوزيع...",
    "employee_insights": [
      {
        "name": "اسم الموظف",
        "assigned_count": 3,
        "development_areas": "مجالات التطوير...",
        "growth_notes": "ملاحظات النمو..."
      }
    ],
    "risks": ["..."],
    "recommendations": ["..."]
  }
}`;

      const userPrompt = content 
        ? `حلل المحتوى التالي واستخرج المهام ووزعها:\n\n${content}`
        : `وزع المهام التالية على الموظفين:\n\n${JSON.stringify(manualTasks)}`;

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
              name: "distribute_tasks",
              description: "Distribute tasks to employees with AI analysis",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        category: { type: "string" },
                        required_skills: { type: "array", items: { type: "string" } },
                        estimated_hours: { type: "number" },
                        assigned_employee_name: { type: "string" },
                        assignment_reason: { type: "string" },
                        employee_development_notes: { type: "string" },
                      },
                      required: ["title", "description", "priority", "assigned_employee_name", "assignment_reason"],
                    },
                  },
                  analysis: {
                    type: "object",
                    properties: {
                      summary: { type: "string" },
                      employee_insights: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            assigned_count: { type: "number" },
                            development_areas: { type: "string" },
                            growth_notes: { type: "string" },
                          },
                          required: ["name", "assigned_count"],
                        },
                      },
                      risks: { type: "array", items: { type: "string" } },
                      recommendations: { type: "array", items: { type: "string" } },
                    },
                    required: ["summary"],
                  },
                },
                required: ["tasks", "analysis"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "distribute_tasks" } },
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
        // Fallback: try to parse from content
        const content = aiData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) result = JSON.parse(jsonMatch[0]);
        else throw new Error("Could not parse AI response");
      }

      // Match employee names to IDs
      const enrichedTasks = (result.tasks || []).map((task: any) => {
        const matchedEmp = (employees || []).find(e => e.name === task.assigned_employee_name);
        return {
          ...task,
          assigned_to: matchedEmp?.id || null,
          assigned_to_name: task.assigned_employee_name,
        };
      });

      // Save to DB if distributionId provided
      if (distributionId) {
        // Insert items
        for (const task of enrichedTasks) {
          await supabase.from("task_distribution_items").insert({
            distribution_id: distributionId,
            title: task.title,
            description: task.description,
            priority: task.priority || "medium",
            category: task.category || "general",
            required_skills: task.required_skills || [],
            estimated_hours: task.estimated_hours || 0,
            assigned_to: task.assigned_to,
            assigned_to_name: task.assigned_to_name,
            assignment_reason: task.assignment_reason,
            employee_development_notes: task.employee_development_notes,
            status: "assigned",
          });
        }

        // Update distribution
        await supabase.from("task_distributions").update({
          status: "reviewed",
          ai_analysis: result.analysis || {},
          employee_insights: result.analysis?.employee_insights || [],
          total_tasks: enrichedTasks.length,
          assigned_tasks: enrichedTasks.filter((t: any) => t.assigned_to).length,
          updated_at: new Date().toISOString(),
        }).eq("id", distributionId);
      }

      return new Response(JSON.stringify({ success: true, data: { tasks: enrichedTasks, analysis: result.analysis } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "approve") {
      // Approve distribution - create actual tasks
      const { data: items } = await supabase.from("task_distribution_items").select("*").eq("distribution_id", distributionId);
      
      for (const item of (items || [])) {
        if (item.assigned_to) {
          // Get creator info from the distribution
          const { data: dist } = await supabase.from("task_distributions").select("created_by").eq("id", distributionId).single();
          
          await supabase.from("tasks").insert({
            title: item.title,
            description: item.description,
            priority: item.priority,
            category: item.category || "general",
            assigned_to: item.assigned_to,
            assigned_to_name: item.assigned_to_name,
            created_by: dist?.created_by,
            created_by_name: "نظام التوزيع الذكي",
            status: "todo",
            source_type: "distribution",
            source_id: distributionId,
            source_label: "توزيع ذكي",
          });
        }
      }

      await supabase.from("task_distributions").update({
        status: "distributed",
        updated_at: new Date().toISOString(),
      }).eq("id", distributionId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("distribute-tasks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
