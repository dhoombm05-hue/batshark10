import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugify(name: string) {
  const base = (name || "employee")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "employee";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const { data: isCeo } = await supabaseAdmin.rpc("has_role", {
      _user_id: caller.id,
      _role: "ceo",
    });
    if (!isCeo) throw new Error("Only CEO can manage users");

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const {
        email,
        password,
        display_name,
        role,
        position,
        department,
        job_title,
        age,
        experience,
        salary,
        bonus,
        avatar_url,
        admin_notes,
      } = body;

      if (!email || !password || !display_name) {
        throw new Error("البريد الإلكتروني، الاسم وكلمة المرور مطلوبة");
      }

      // 1) create auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name },
      });
      if (createError) throw createError;
      const userId = newUser.user!.id;

      // 2) create employee record (full profile in HR system)
      const { data: employee, error: empErr } = await supabaseAdmin
        .from("employees")
        .insert({
          slug: slugify(display_name),
          name: display_name,
          position: position || job_title || "موظف",
          department: department || "الإدارة العامة",
          job_title: job_title || position || null,
          age: age ?? 30,
          experience: experience || "1 سنة",
          salary: salary ?? 0,
          bonus: bonus ?? 0,
          performance: 50,
          kpi_achievement: 50,
          profit_contribution: 0,
          monthly_rating: 5,
          achievements: [],
          improvements: [],
          projects: [],
          admin_notes: admin_notes || null,
          avatar_url: avatar_url || null,
        })
        .select()
        .single();
      if (empErr) console.error("employee insert", empErr);

      // 3) upsert profile (trigger creates it, but we enrich it)
      await supabaseAdmin.from("profiles").upsert(
        {
          user_id: userId,
          display_name,
          avatar_url: avatar_url || null,
          department: department || null,
          job_title: job_title || position || null,
          employee_id: employee?.id ?? null,
        },
        { onConflict: "user_id" },
      );

      // 4) assign role
      if (role) {
        await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
      }

      // 5) seed baseline monthly performance row (current month)
      if (employee?.id) {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        await supabaseAdmin.from("employee_monthly_performance").insert({
          employee_id: employee.id,
          month: monthKey,
          performance: 50,
          kpi_achievement: 50,
          rating: 5,
        }).select();
      }

      return new Response(
        JSON.stringify({ success: true, user_id: userId, employee_id: employee?.id ?? null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "delete") {
      const { user_id } = body;
      if (!user_id) throw new Error("user_id required");
      // unlink employee then delete auth user (cascades profile & roles)
      const { data: prof } = await supabaseAdmin
        .from("profiles").select("employee_id").eq("user_id", user_id).maybeSingle();
      if (prof?.employee_id) {
        await supabaseAdmin.from("employees").delete().eq("id", prof.employee_id);
      }
      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (delErr) throw delErr;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_role") {
      const { user_id, role } = body;
      if (!user_id || !role) throw new Error("user_id and role required");
      await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
      await supabaseAdmin.from("user_roles").insert({ user_id, role });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
