import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USERS = [
  { email: "ceo@batshark.com", password: "MESSIBAT10", display_name: "الرئيس", role: "ceo", job_title: "الرئيس التنفيذي", department: "الإدارة العليا" },
  { email: "mohammed@batshark.com", password: "SAM19", display_name: "محمد", role: "coo", job_title: "مدير العمليات", department: "العمليات" },
  { email: "fahad@batshark.com", password: "VACANCY", display_name: "فهد", role: "strategic_director", job_title: "المدير الاستراتيجي", department: "التخطيط" },
  { email: "saad@batshark.com", password: "LEO30", display_name: "سعد", role: "marketing_director", job_title: "مدير التسويق", department: "التسويق" },
  { email: "naif@batshark.com", password: "USA20", display_name: "نايف", role: "tech_director", job_title: "مدير التقنية", department: "التقنية" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const results: { name: string; status: string }[] = [];

    for (const u of USERS) {
      // Check if user already exists by email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);

      if (existing) {
        results.push({ name: u.display_name, status: "already exists" });
        continue;
      }

      // Create user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { display_name: u.display_name },
      });

      if (createError) {
        results.push({ name: u.display_name, status: `error: ${createError.message}` });
        continue;
      }

      // Update profile
      await supabaseAdmin.from("profiles").update({
        display_name: u.display_name,
        job_title: u.job_title,
        department: u.department,
      }).eq("user_id", newUser.user!.id);

      // Assign role
      await supabaseAdmin.from("user_roles").insert({
        user_id: newUser.user!.id,
        role: u.role,
      });

      results.push({ name: u.display_name, status: "created" });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
