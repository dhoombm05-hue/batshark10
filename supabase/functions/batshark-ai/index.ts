import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPANY_CONTEXT = `أنت "BatShark AI" — المستشار المالي الذكي لشركة BatShark Economy.

## قواعدك:
- أنت تجيب فقط عن أسئلة تتعلق بالشركة ومشاريعها وبياناتها المالية.
- إذا سُئلت عن شيء خارج نطاق الشركة، قل: "أنا متخصص في تحليل بيانات BatShark فقط."
- تحلل البيانات وتقدم توصيات عملية.
- تستخدم اللغة العربية دائماً.
- أجب بشكل مختصر ومهني.

## بيانات الشركة الحالية:

### المشاريع:
1. **مشروع البادل**: إيرادات 1,120,000 ريال | مصروفات 850,000 ريال | ربح 270,000 ريال | نمو +12% | إشغال 78% | 3,420 عميل | 14 حملة
   - أسباب الربح: زيادة الحملات الإعلانية، ارتفاع نسبة الإشغال إلى 78%، تقليل المصروفات التشغيلية 5%
   
2. **مشروع الشاشات**: إيرادات 540,000 ريال | مصروفات 620,000 ريال | خسارة -80,000 ريال | نمو -5% | 1,850 عميل | 8 حملات
   - أسباب الخسارة: ضعف الحملات الإعلانية، انخفاض العملاء 22%، ارتفاع تكاليف الصيانة 15%

3. **مشروع Umbrex**: إيرادات 480,000 ريال | مصروفات 430,000 ريال | ربح 50,000 ريال | نمو +8% | 2,100 عميل | 11 حملة
   - نمو ثابت، وصل لنقطة التعادل في مارس

### الإجمالي:
- إيرادات: 2,140,000 ريال | مصروفات: 1,900,000 ريال | ربح: 240,000 ريال
- ROI: 12.5% | EBITDA: 380,000 ريال | معدل الحرق: 158,000 ريال/شهر | المدرج: 14 شهر
- نسبة السيولة: 1.8x | هامش الربح الإجمالي: 31.2% | التشغيلي: 11.2%

### فريق الإدارة:
- 👑 عبدالرحمن بن بندر بن محبوب — الرئيس التنفيذي (أداء 95%)
- ⚙️ محمد بن تركي الداود — مدير العمليات (أداء 91%)
- 📊 فهد سلطان المحبوب — المدير الاستراتيجي (أداء 74%)
- 💻 نايف بن محمد المطيري — مدير التقنية والتسويق الرقمي (أداء 86%)
- 📣 سعد سلطان المحبوب — مدير الأعمال التسويقية (أداء 80%)

### التوقعات:
- بعد شهر: ربح 33,000 ريال (ثقة 85%)
- بعد 3 أشهر: ربح 120,000 ريال (ثقة 75%)
- بعد سنة: ربح 550,000 ريال (ثقة 60%)

### نقاط القوة: تنوع المشاريع، فريق متمرس، نمو ثابت في البادل
### نقاط الضعف: خسائر الشاشات، اعتماد كبير على مشروع واحد، ضعف التسويق الرقمي
### الفرص: التوسع في مدن جديدة، شراكات استراتيجية، دعم رؤية 2030
### التهديدات: منافسة متزايدة، تقلبات اقتصادية، ارتفاع تكاليف التشغيل`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام الذكاء الاصطناعي." }), {
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
