import { corsHeaders } from '@supabase/supabase-js/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function makeKey(prefix: string) {
  const a = crypto.randomUUID().replace(/-/g, '');
  return `${prefix}_${a.slice(0, 32)}`;
}

function makeSlug(name: string) {
  const base = (name || 'platform').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'platform';
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

async function callAI(messages: any[], schema?: any) {
  const body: any = {
    model: 'google/gemini-2.5-flash',
    messages,
  };
  if (schema) {
    body.tools = [{ type: 'function', function: { name: 'output', description: 'structured output', parameters: schema } }];
    body.tool_choice = { type: 'function', function: { name: 'output' } };
  }
  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`AI ${r.status}: ${await r.text()}`);
  const data = await r.json();
  if (schema) {
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    return args ? JSON.parse(args) : {};
  }
  return data.choices?.[0]?.message?.content || '';
}

function buildIntegration(platformId: string | null, level: number, features: string[] = [], extras: Record<string, any> = {}) {
  const apiKey = makeKey('b99sk_live');
  const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
  const fnsBase = `https://${projectRef}.functions.supabase.co`;
  const webhookUrl = `${fnsBase}/b99-engine?action=ingest&key=${apiKey}`;
  const aiProxyEndpoint = `${fnsBase}/b99-engine?action=ai_proxy&key=${apiKey}`;
  const embedSnippet = `<!-- Batshark 99 — Embed -->
<script>
(function(){
  window.BS99_KEY="${apiKey}";
  window.BS99_LEVEL=${level};
  var s=document.createElement('script');
  s.src="https://batshark99.lovable.app/bs99-embed.js";
  s.async=true; document.head.appendChild(s);
})();
</script>`;
  return {
    platform_id: platformId,
    level,
    client_api_key: apiKey,
    webhook_url: webhookUrl,
    ai_proxy_endpoint: aiProxyEndpoint,
    embed_snippet: embedSnippet,
    features,
    ...extras,
    status: 'active',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || new URL(req.url).searchParams.get('action');
    const payload = body.payload || {};

    // ===== assistant chat =====
    if (action === 'assistant') {
      const reply = await callAI([
        { role: 'system', content: 'أنت "بات شارك"، مساعد منصة بات شارك 99. ردودك قصيرة ومباشرة بالعربية، وتقترح أزراراً للمستخدم. عند الحاجة، اقترح route من: /b99/level/1 /b99/level/2 /b99/level/3 /b99/ads /b99/platforms /b99/search.' },
        ...(payload.history || []).map((m: any) => ({ role: m.role, content: m.content })),
        { role: 'user', content: payload.message },
      ], {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          action_route: { type: 'string' },
          suggestions: { type: 'array', items: { type: 'string' } },
        },
        required: ['reply'],
      });
      return ok(reply);
    }

    // ===== generate platform (level 1 scratch) =====
    if (action === 'generate_platform') {
      const { level = 1, answers = {} } = payload;
      const blueprint = await callAI([
        { role: 'system', content: 'أنت معماري منصات. أنشئ blueprint احترافي بالعربية لمنصة فعلية.' },
        { role: 'user', content: `أنشئ منصة من إجابات هذا العميل: ${JSON.stringify(answers)}` },
      ], {
        type: 'object',
        properties: {
          name: { type: 'string' },
          tagline: { type: 'string' },
          platform_type: { type: 'string' },
          pages: {
            type: 'array',
            items: {
              type: 'object',
              properties: { title: { type: 'string' }, sections: { type: 'array', items: { type: 'string' } } },
              required: ['title'],
            },
          },
          features: { type: 'array', items: { type: 'string' } },
          brand: { type: 'object', properties: { primary: { type: 'string' }, mood: { type: 'string' } } },
        },
        required: ['name', 'tagline', 'pages'],
      });

      const slug = makeSlug(blueprint.name);
      const { data: platform, error } = await supabase.from('generated_platforms').insert({
        slug, name: blueprint.name, tagline: blueprint.tagline,
        platform_type: blueprint.platform_type || 'general',
        pages: blueprint.pages || [], features: blueprint.features || [],
        brand: blueprint.brand || {}, requirements: answers, build_level: `level_${level}`,
        level, status: 'live', is_public: true, layout_mode: 'longform', theme_mode: 'light',
      }).select().single();
      if (error) throw error;

      const integration = buildIntegration(platform.id, level, ['backend', 'ai_chat']);
      await supabase.from('b99_integrations').insert({ ...integration }).select();

      return ok({ platform, integration });
    }

    // ===== generate integration (level 1 connect / level 2) =====
    if (action === 'generate_integration') {
      const { level = 2, features = [], answers = {}, mode } = payload;
      let platformId: string | null = null;
      // For connect mode also create a lightweight platform record to track
      if (mode === 'connect' || level === 2) {
        const name = answers.business_name || 'موقعي';
        const slug = makeSlug(name);
        const { data: p } = await supabase.from('generated_platforms').insert({
          slug, name, tagline: answers.site_url || '',
          platform_type: 'connected', pages: [{ title: 'الرئيسية' }],
          requirements: answers, build_level: `level_${level}_connect`,
          level, status: 'live', is_public: false, layout_mode: 'longform', theme_mode: 'light',
        }).select().single();
        platformId = p?.id || null;
      }
      const integration = buildIntegration(platformId, level, features, {
        external_site_url: answers.site_url,
        external_backend_type: answers.backend_type,
      });
      await supabase.from('b99_integrations').insert({ ...integration });

      const steps = [
        'انسخ Embed Snippet والصقه داخل وسم <head> في موقعك.',
        'احفظ API Key في مكان آمن (لن يظهر مرة أخرى).',
        'فعّل الـ Webhook في إعدادات نظامك لإرسال الأحداث المهمة.',
        'افتح لوحة /b99/platforms لمتابعة البيانات الحية.',
      ];
      return ok({ integration, steps });
    }

    // ===== hire AI employee (level 3) =====
    if (action === 'hire_ai_employee') {
      const { business_name, owner_name, owner_email, tasks = [], data_sources = [], channels = [], schedule = 'daily' } = payload;
      const summary = await callAI([
        { role: 'system', content: 'أنت بات شارك. اكتب فقرة قصيرة بالعربية تخاطب فيها المالك بأنك جاهز للبدء، تذكر فيها مهامك وجدولك.' },
        { role: 'user', content: `الشركة: ${business_name}, المالك: ${owner_name}, المهام: ${tasks.join('، ')}, القنوات: ${channels.join('، ')}, الجدول: ${schedule}` },
      ]);

      const integration = buildIntegration(null, 3, tasks, { external_backend_type: 'ai_employee' });
      const { data: emp } = await supabase.from('b99_ai_employees').insert({
        owner_email, owner_name, business_name, tasks, data_sources, channels, schedule,
        config: { integration }, status: 'active',
      }).select().single();
      await supabase.from('b99_integrations').insert({ ...integration });

      const next_actions = tasks.slice(0, 4).map((t: string) => ({
        title: ({ reports: 'يجهز التقرير الأول', emails: 'يرسل أول إيميل ملخص', employees: 'يقرأ بيانات الموظفين', data_processing: 'يفحص البيانات الواردة', alerts: 'يضبط حدود التنبيهات', forecasts: 'يبني نموذج التنبؤ', monitoring: 'يبدأ مراقبة الأداء', crm: 'ينظم قائمة العملاء' } as any)[t] || t,
        when: schedule === 'realtime' ? 'فوراً' : schedule === 'hourly' ? 'الساعة القادمة' : schedule === 'daily' ? 'غداً صباحاً' : 'الأسبوع القادم',
      }));
      return ok({ employee: emp, integration, summary, next_actions });
    }

    // ===== ads generation =====
    if (action === 'generate_ad' || action === 'generate_video_ad') {
      const result = await callAI([
        { role: 'system', content: 'أنت مخرج إعلانات. أنشئ سكربت فيديو إعلاني احترافي بالعربية مع مشاهد وStoryboard.' },
        { role: 'user', content: JSON.stringify(payload) },
      ], {
        type: 'object',
        properties: {
          hook: { type: 'string' },
          ad_copy: { type: 'string' },
          voiceover_script: { type: 'string' },
          video_prompt: { type: 'string' },
          video_scenes: { type: 'array', items: { type: 'object', properties: { scene: { type: 'string' }, visual: { type: 'string' }, voice: { type: 'string' }, text_on_screen: { type: 'string' }, duration_sec: { type: 'number' } } } },
          best_times: { type: 'array', items: { type: 'string' } },
          hashtags: { type: 'array', items: { type: 'string' } },
          cta: { type: 'string' },
        },
        required: ['hook', 'ad_copy', 'video_scenes'],
      });
      return ok(result);
    }

    // ===== search =====
    if (action === 'search') {
      const q = payload.query || '';
      const [{ data: platforms }, { data: ads }] = await Promise.all([
        supabase.from('generated_platforms').select('id,name,tagline,slug,level').ilike('name', `%${q}%`).limit(8),
        supabase.from('ad_campaigns').select('id,name,business_type,ad_copy').ilike('name', `%${q}%`).limit(8),
      ]);
      const answer = await callAI([
        { role: 'system', content: 'أنت محرك بحث ذكي بالعربية. أجب بإجابة مباشرة قصيرة ومفيدة.' },
        { role: 'user', content: q },
      ]);
      return ok({ answer, platforms: platforms || [], ads: ads || [] });
    }

    return ok({ error: 'unknown action' }, 400);
  } catch (e: any) {
    console.error(e);
    return ok({ error: e.message }, 500);
  }
});
