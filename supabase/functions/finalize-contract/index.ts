// Finalize a contract: create auth user for the party, assign role,
// generate a random password, post a news announcement, and return
// credentials so the CEO can share them.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function generatePassword(len = 12) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz@#$%";
  let out = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { contract_id, role_slug = "coo" } = await req.json();
    if (!contract_id) throw new Error("contract_id مطلوب");

    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, service);

    // Load contract
    const { data: contract, error: cErr } = await admin
      .from("contracts")
      .select("*")
      .eq("id", contract_id)
      .single();
    if (cErr || !contract) throw new Error("العقد غير موجود");
    if (!contract.party_email) throw new Error("بريد الطرف الآخر مطلوب لإنشاء الحساب");

    let userId = contract.generated_user_id as string | null;
    let password = generatePassword(12);

    if (!userId) {
      // Try create; if exists, look up
      const { data: created, error: uErr } = await admin.auth.admin.createUser({
        email: contract.party_email,
        password,
        email_confirm: true,
        user_metadata: { display_name: contract.party_name, from_contract: contract.contract_number },
      });
      if (uErr && !String(uErr.message || "").toLowerCase().includes("already")) {
        throw new Error("فشل إنشاء الحساب: " + uErr.message);
      }
      if (created?.user?.id) {
        userId = created.user.id;
      } else {
        // fetch existing
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users?.find((u) => u.email === contract.party_email);
        if (!existing) throw new Error("تعذر إنشاء أو إيجاد حساب المستخدم");
        userId = existing.id;
        // reset password so we always return a working one
        await admin.auth.admin.updateUserById(userId, { password });
      }

      // profile
      await admin.from("profiles").upsert({
        user_id: userId,
        display_name: contract.party_name,
        job_title: contract.type === "employment" ? "موظف" : "شريك",
        department: contract.type === "partnership" ? "شراكات" : "تعاقدات",
      }, { onConflict: "user_id" });

      // role
      await admin.from("user_roles").upsert(
        { user_id: userId, role: role_slug },
        { onConflict: "user_id,role" }
      );
    }

    // Update contract state
    await admin
      .from("contracts")
      .update({
        status: "active",
        generated_user_id: userId,
        credentials_sent_at: new Date().toISOString(),
      })
      .eq("id", contract_id);

    // Log activity
    await admin.from("contract_activity").insert({
      contract_id,
      action: "activated",
      actor_name: "النظام",
      details: { user_id: userId, role: role_slug },
    });

    // Auto news announcement
    const typeLabel: Record<string, string> = {
      partnership: "شراكة",
      service: "تعاقد خدمة",
      sponsorship: "عقد رعاية",
      employment: "عقد عمل",
    };
    await admin.from("news").insert({
      title: `🎉 تم توقيع ${typeLabel[contract.type] || "تعاقد"} جديد مع ${contract.party_name}`,
      content: `تم رسمياً إتمام ${contract.title} برقم ${contract.contract_number}. مرحباً بالطرف الجديد ضمن منظومة العمل.`,
      category: "announcement",
      is_pinned: false,
      author_id: contract.created_by,
    });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email: contract.party_email,
        password,
        contract_number: contract.contract_number,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
