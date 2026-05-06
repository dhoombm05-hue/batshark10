import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: list } = await admin.auth.admin.listUsers();
    const ceo = list?.users?.find((u: any) => u.email === "ceo@batshark.com");
    if (!ceo) return new Response(JSON.stringify({ error: "ceo not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { error } = await admin.auth.admin.updateUserById(ceo.id, { password: "messi19" });
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
