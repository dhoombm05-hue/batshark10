// Batshark99 unified AI engine — handles: search, assistant chat, ad campaign generation,
// platform generation (full mini-site), idea generation (multi-level interactive)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function callAI(system: string, user: string, tool?: any, model = "google/gemini-2.5-flash") {
  const body: any = { model, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
  if (tool) { body.tools = [tool]; body.tool_choice = { type: "function", function: { name: tool.function.name } }; }
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    if (r.status === 429) throw new Error("الذكاء الاصطناعي مشغول حالياً، حاول بعد لحظات");
    if (r.status === 402) throw new Error("نفدت رصيد الذكاء الاصطناعي - أضف رصيداً للاستمرار");
    throw new Error(`AI error ${r.status}: ${t.slice(0,200)}`);
  }
  const d = await r.json();
  if (tool) {
    const a = d.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    return a ? JSON.parse(a) : {};
  }
  return d.choices?.[0]?.message?.content || "";
}

function slugify(s: string) {
  return s.replace(/[^\w\u0600-\u06FF\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase().slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, payload, userId } = await req.json();

    // ============ ASSISTANT CHAT ============
    if (action === "assistant") {
      const { history, message, context } = payload;
      const sys = `أنت BatShark Assistant — مرشد ذكي داخل منصة Batshark99. مهمتك التفاعل مع المستخدم وفهم احتياجه ثم توجيهه للقسم المناسب.
الأقسام المتاحة:
- /b99 (الرئيسية)
- /b99/generator (مولد الأفكار التفاعلي بـ4 مستويات)
- /b99/ads (ركن الحملات الإعلانية)
- /b99/platforms (مولد المنصات المستقلة)
- /b99/search (محرك البحث)
- /b99/dashboard (لوحة التحكم - للأعضاء)
رد بإيجاز شديد (سطرين كحد أقصى)، وعند الاقتراح أرفق فعل تنقّل واضح في الحقل action_route.`;
      const tool = {
        type: "function",
        function: {
          name: "respond",
          parameters: {
            type: "object",
            properties: {
              reply: { type: "string" },
              action_route: { type: "string", description: "رابط داخلي للانتقال أو فارغ" },
              suggestions: { type: "array", items: { type: "string" } },
            },
            required: ["reply"],
          },
        },
      };
      const histTxt = (history || []).slice(-6).map((m: any) => `${m.role}: ${m.content}`).join("\n");
      const result = await callAI(sys, `سياق:${context||""}\n${histTxt}\nuser: ${message}`, tool);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ SEARCH (semantic across own data + general) ============
    if (action === "search") {
      const { query } = payload;
      const [platformRows, campaignRows] = await Promise.all([
        supabase.from("generated_platforms").select("name, slug, tagline, platform_type, features, meta, build_level").eq("status", "live").limit(20),
        userId ? supabase.from("ad_campaigns").select("name, business_type, platforms, brief, status").eq("user_id", userId).limit(12) : Promise.resolve({ data: [] }),
      ]);
      const tool = {
        type: "function",
        function: {
          name: "search_results",
          parameters: {
            type: "object",
            properties: {
              direct_answer: { type: "string" },
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    snippet: { type: "string" },
                    category: { type: "string" },
                    relevance: { type: "number" },
                    action_route: { type: "string" },
                  },
                  required: ["title", "snippet", "category"],
                },
              },
              related_questions: { type: "array", items: { type: "string" } },
            },
            required: ["direct_answer", "results"],
          },
        },
      };
      const sys = `أنت محرك بحث داخلي تابع لـ Batshark99. ابحث داخل أقسام المنصة وداخل المنصات والحملات المحفوظة المرسلة لك. أعطِ إجابة مباشرة + نتائج عملية. إذا كانت النتيجة منصة محفوظة اجعل action_route=/p/slug، وإلا استخدم: /b99/generator, /b99/ads, /b99/platforms.`;
      const result = await callAI(sys, `بحث: ${query}\n\nمنصات محفوظة:\n${JSON.stringify(platformRows.data || [])}\n\nحملات محفوظة:\n${JSON.stringify((campaignRows as any).data || [])}`, tool);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ AD CAMPAIGN GENERATION ============
    if (action === "generate_campaign") {
      const { brief, businessType, goal, audience, budget, currentPlatforms, city, productOffer, tone, assets } = payload;
      const tool = {
        type: "function",
        function: {
          name: "build_campaign",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string" },
              ad_type: { type: "string" },
              platforms: { type: "array", items: { type: "string" }, description: "instagram, tiktok, snapchat, twitter, google_ads, youtube" },
              ad_copy: { type: "string", description: "نص الإعلان الجاهز للنشر" },
              cta: { type: "string" },
              hashtags: { type: "array", items: { type: "string" } },
              best_times: {
                type: "array",
                items: {
                  type: "object",
                  properties: { day: { type: "string" }, time: { type: "string" }, reason: { type: "string" } },
                  required: ["day", "time"],
                },
              },
              audience: {
                type: "object",
                properties: { age_range: { type: "string" }, interests: { type: "array", items: { type: "string" } }, locations: { type: "array", items: { type: "string" } } },
              },
              templates: {
                type: "array",
                description: "3-5 قوالب جاهزة للنشر مختلفة الزاوية",
                items: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    body: { type: "string" },
                    platform: { type: "string" },
                    visual_idea: { type: "string" },
                  },
                  required: ["headline", "body", "platform", "visual_idea"],
                },
              },
              ai_analysis: {
                type: "object",
                properties: {
                  positioning: { type: "string" },
                  expected_reach: { type: "string" },
                  expected_ctr: { type: "string" },
                  budget_split: { type: "string" },
                  risks: { type: "array", items: { type: "string" } },
                },
              },
            },
            required: ["name", "platforms", "ad_copy", "cta", "templates", "best_times"],
          },
        },
      };
      const sys = `أنت خبير حملات إعلانية في الخليج (السعودية تحديداً). تعرف خصوصية كل منصة، أوقات الذروة، اللهجة المحلية، وقواعد منصات الإعلانات. اقترح أفضل خليط من المنصات + قوالب نص جاهزة للنسخ والنشر مباشرة + أفضل أيام/أوقات بحسب نوع البزنس + تحليل ميزانية واقعي.`;
      const usrMsg = `النشاط: ${businessType}\nالهدف: ${goal}\nالجمهور: ${audience}\nالميزانية: ${budget} ر.س\nالمنصات الحالية: ${currentPlatforms||'لا يوجد'}\nالموجز: ${brief}`;
      const camp = await callAI(sys, usrMsg, tool);
      let saved = null;
      if (userId) {
        const { data } = await supabase.from("ad_campaigns").insert({
          user_id: userId, name: camp.name, ad_type: camp.ad_type || "social",
          platforms: camp.platforms, ad_copy: camp.ad_copy, cta: camp.cta,
          hashtags: camp.hashtags || [], best_times: camp.best_times || [],
          audience: camp.audience || {}, budget: budget || 0,
          ai_analysis: camp.ai_analysis || {}, templates: camp.templates || [],
          brief, business_type: businessType, status: "ready",
        }).select().single();
        saved = data;
      }
      return new Response(JSON.stringify({ campaign: camp, saved }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ PLATFORM GENERATION (build full mini-site) ============
    if (action === "generate_platform") {
      const { name, purpose, platformType, ownerEmail, accessCode, brand } = payload;
      const tool = {
        type: "function",
        function: {
          name: "build_platform",
          parameters: {
            type: "object",
            properties: {
              tagline: { type: "string" },
              brand: {
                type: "object",
                properties: {
                  primary_color: { type: "string" }, accent_color: { type: "string" },
                  logo_emoji: { type: "string" }, font_style: { type: "string" },
                },
              },
              features: { type: "array", items: { type: "string" } },
              pages: {
                type: "array",
                description: "4-6 صفحات كاملة (الرئيسية، عن، الخدمات، الأسعار، تواصل، إضافية حسب النوع)",
                items: {
                  type: "object",
                  properties: {
                    slug: { type: "string" },
                    title: { type: "string" },
                    icon: { type: "string", description: "lucide icon name" },
                    sections: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string", description: "hero, features, pricing, testimonials, cta, gallery, contact, faq, stats" },
                          heading: { type: "string" },
                          body: { type: "string" },
                          items: { type: "array", items: { type: "object", properties: { title: { type: "string" }, desc: { type: "string" }, value: { type: "string" } } } },
                        },
                        required: ["type"],
                      },
                    },
                  },
                  required: ["slug", "title", "sections"],
                },
              },
              meta: {
                type: "object",
                properties: {
                  seo_title: { type: "string" }, seo_description: { type: "string" },
                  target_audience: { type: "string" }, value_prop: { type: "string" },
                },
              },
            },
            required: ["tagline", "pages", "brand"],
          },
        },
      };
      const sys = `أنت مولّد منصات احترافية كاملة (Mini-Sites). لا تكتفِ بالكلام: ولّد منصة فعلية متكاملة بصفحات وأقسام جاهزة للعرض الفوري بمحتوى عربي احترافي مدروس. كل صفحة لها أقسام متنوعة (hero, features, pricing, gallery, testimonials, faq, contact, cta) وكل قسم له محتوى حقيقي وأرقام منطقية. صمّم الهوية البصرية (ألوان، إيموجي شعار) مناسبة لطبيعة المنصة.`;
      const result = await callAI(sys, `اسم: ${name}\nهدف: ${purpose}\nنوع: ${platformType}\nهوية مفضّلة: ${JSON.stringify(brand||{})}`, tool);
      const slug = slugify(name);
      const { data: saved, error } = await supabase.from("generated_platforms").insert({
        user_id: userId || null, owner_email: ownerEmail || null, slug, name,
        tagline: result.tagline, platform_type: platformType || "general",
        access_code: accessCode || null, is_public: !accessCode,
        brand: result.brand || {}, pages: result.pages || [],
        features: result.features || [], meta: result.meta || {}, status: "live",
      }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ platform: saved, url: `/p/${slug}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ INTERACTIVE IDEA WIZARD (level-aware, conversational) ============
    if (action === "generator_step") {
      // Conversational generator: AI suggests next question OR final result based on collected answers
      const { level, answers, mode } = payload; // mode: 'next_question' | 'final'
      if (mode === "final") {
        const tool = {
          type: "function",
          function: {
            name: "final_idea",
            parameters: {
              type: "object",
              properties: {
                idea_name: { type: "string" },
                positioning: { type: "string" },
                description: { type: "string" },
                match_score: { type: "number" },
                financial: {
                  type: "object",
                  properties: {
                    capital: { type: "number" }, monthly_revenue: { type: "number" },
                    break_even_months: { type: "number" }, year1_profit: { type: "number" },
                    roi_year1: { type: "number" },
                  },
                },
                swot: {
                  type: "object",
                  properties: {
                    strengths: { type: "array", items: { type: "string" } },
                    weaknesses: { type: "array", items: { type: "string" } },
                    opportunities: { type: "array", items: { type: "string" } },
                    threats: { type: "array", items: { type: "string" } },
                  },
                },
                competitors: { type: "array", items: { type: "object", properties: { name: { type: "string" }, note: { type: "string" } }, required: ["name", "note"] } },
                roadmap: { type: "array", items: { type: "object", properties: { phase: { type: "string" }, duration: { type: "string" }, actions: { type: "array", items: { type: "string" } } }, required: ["phase", "duration", "actions"] } },
                marketing_channels: { type: "array", items: { type: "string" } },
                first_30_days: { type: "array", items: { type: "string" } },
                generated_platform_brief: {
                  type: "object",
                  description: "موجز جاهز لتمريره لمولد المنصات لبناء منصة فعلية للفكرة",
                  properties: {
                    name: { type: "string" }, purpose: { type: "string" }, platform_type: { type: "string" },
                  },
                },
              },
              required: ["idea_name", "description", "match_score", "financial", "swot", "roadmap"],
            },
          },
        };
        const levelGuide: Record<string, string> = {
          beginner: "ركّز على البساطة، رأس مال صغير، دخل سريع، خطوات سهلة، روادمب 3 مراحل.",
          intermediate: "نموذج تنافسي، SWOT كامل، 4-5 مراحل روادمب، توقعات سنوية واقعية.",
          advanced: "نموذج عمل مبتكر، تسعير ذكي، استراتيجية نمو، روادمب 5-6، توقعات دقيقة.",
          analyst: "أرقام كمية دقيقة (CAC/LTV/Burn/Break-even)، حساسية، 3-4 منافسين معروفين، روادمب 6 مراحل.",
        };
        const sys = `أنت Batshare 99 — مولّد أفكار سيادي. ${levelGuide[level] || ""} ولّد فكرة واحدة عميقة جداً ومخصّصة بناءً على الحوار التفاعلي. أرقام منطقية للسعودية. الإجابة بالعربية.`;
        const result = await callAI(sys, `المستوى: ${level}\nالحوار:\n${JSON.stringify(answers, null, 2)}`, tool);
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } else {
        // suggest next question conversationally
        const tool = {
          type: "function",
          function: {
            name: "next_q",
            parameters: {
              type: "object",
              properties: {
                question: { type: "string" },
                input_type: { type: "string", description: "text, number, choice, slider" },
                placeholder: { type: "string" },
                choices: { type: "array", items: { type: "string" } },
                why_asking: { type: "string", description: "سبب قصير لطمأنة المستخدم" },
                progress_hint: { type: "number", description: "0-100 تقدم تقديري" },
                done: { type: "boolean", description: "true إذا كفت الأسئلة" },
                ai_observation: { type: "string", description: "ملاحظة ذكية مما قاله سابقاً" },
              },
              required: ["question", "input_type", "done"],
            },
          },
        };
        const sys = `أنت محاور ذكي يبني فكرة بزنس بأسلوب حواري طبيعي. المستوى: ${level}. اسأل سؤالاً واحداً ذكياً غير ممل، اعتماداً على ما قاله المستخدم سابقاً. لا تكرر. توقّف بعد 5-7 أسئلة بحسب المستوى ثم done=true. اقترح خيارات واقعية (3-5) عند الإمكان.`;
        const result = await callAI(sys, `الإجابات حتى الآن:\n${JSON.stringify(answers, null, 2)}`, tool);
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    throw new Error(`unknown action ${action}`);
  } catch (e: any) {
    console.error("b99-engine:", e);
    return new Response(JSON.stringify({ error: e.message || "خطأ" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
