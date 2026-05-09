import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

function screenshotUrl(siteUrl: string) {
  try {
    const u = new URL(siteUrl);
    return `https://image.thum.io/get/width/800/crop/600/noanimate/${u.toString()}`;
  } catch { return ''; }
}

function faviconUrl(siteUrl: string) {
  try {
    const u = new URL(siteUrl);
    return `https://www.google.com/s2/favicons?sz=128&domain=${u.hostname}`;
  } catch { return ''; }
}

// Real HTTP verification of a user's site
async function verifySite(rawUrl: string) {
  if (!rawUrl) return { ok: false, error: 'no_url' };
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, { method: 'GET', signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'BatShark99-Verifier/1.0' } });
    clearTimeout(t);
    const ms = Date.now() - start;
    const html = await r.text().catch(() => '');
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
    const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i);
    return {
      ok: r.ok,
      status: r.status,
      response_time_ms: ms,
      final_url: r.url,
      title: titleMatch?.[1]?.trim().slice(0, 140) || null,
      description: descMatch?.[1]?.trim().slice(0, 240) || null,
      og_image: ogImg?.[1] || null,
      screenshot: screenshotUrl(url),
      favicon: faviconUrl(url),
      bytes: html.length,
      verified_at: new Date().toISOString(),
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'fetch_failed', screenshot: screenshotUrl(url), favicon: faviconUrl(url) };
  }
}

async function callAI(messages: any[], schema?: any, opts: { tools?: any[]; model?: string } = {}) {
  const body: any = { model: opts.model || 'google/gemini-2.5-flash', messages };
  if (schema) {
    body.tools = [{ type: 'function', function: { name: 'output', description: 'structured output', parameters: schema } }];
    body.tool_choice = { type: 'function', function: { name: 'output' } };
  } else if (opts.tools) body.tools = opts.tools;
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

async function webSearch(query: string) {
  try {
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'أجب بدقة بالعربية مع مصادر. اختصر بدون مقدمات.' },
          { role: 'user', content: query },
        ],
        tools: [{ google_search: {} }] as any,
      }),
    });
    const data = await r.json();
    const msg = data.choices?.[0]?.message;
    const answer = msg?.content || '';
    const grounding = (msg as any)?.grounding_metadata || data.choices?.[0]?.grounding_metadata || {};
    const chunks = grounding?.grounding_chunks || grounding?.groundingChunks || [];
    const sources = chunks.map((c: any) => c.web || c).filter((w: any) => w?.uri || w?.url)
      .map((w: any) => ({ title: w.title || w.uri || w.url, url: w.uri || w.url }));
    return { answer, sources };
  } catch (e) { console.error('webSearch failed', e); return { answer: '', sources: [] }; }
}

// ====== Visual examples (images of real platforms/concepts) ======
async function fetchVisualExamples(topic: string, limit = 6) {
  try {
    const data = await callAI([
      { role: 'system', content: 'أنت دليل أمثلة بصرية. أعد روابط مواقع رسمية حقيقية فقط (https://www.brand.com)، لا روابط ميتة ولا تخمين. الأمثلة عالمية ومعروفة.' },
      { role: 'user', content: `أعطني ${limit} أمثلة لمنصات/مواقع حقيقية تطابق: "${topic}". لكل واحدة: الاسم + الدومين الرسمي + سبب موجز.` },
    ], {
      type: 'object',
      properties: {
        items: { type: 'array', items: { type: 'object', properties: {
          label: { type: 'string' }, url: { type: 'string' }, why: { type: 'string' },
        }, required: ['label', 'url'] } },
      }, required: ['items'],
    });
    return {
      items: (data.items || []).slice(0, limit).map((it: any) => ({
        label: it.label, url: it.url, why: it.why,
        image: screenshotUrl(it.url), favicon: faviconUrl(it.url),
      })),
    };
  } catch (e) { console.error('visual_examples', e); return { items: [] }; }
}

// ====== YouTube video search via Gemini grounding ======
async function fetchVideos(topic: string, limit = 6) {
  try {
    const data = await callAI([
      { role: 'system', content: 'أنت مساعد بحث فيديوهات يوتيوب. أعد روابط فيديوهات حقيقية فقط بصيغة https://www.youtube.com/watch?v=XXXXXX. لا تخترع.' },
      { role: 'user', content: `ابحث عن ${limit} فيديوهات حقيقية في يوتيوب عن: "${topic}". أعد لكل فيديو: العنوان، الرابط الكامل، اسم القناة.` },
    ], {
      type: 'object',
      properties: {
        items: { type: 'array', items: { type: 'object', properties: {
          title: { type: 'string' }, url: { type: 'string' }, channel: { type: 'string' },
        }, required: ['title', 'url'] } },
      }, required: ['items'],
    });
    return (data.items || []).slice(0, limit).map((v: any) => {
      const id = (v.url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{6,})/) || [])[1];
      return {
        title: v.title, channel: v.channel, url: v.url, video_id: id,
        thumbnail: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '',
        embed: id ? `https://www.youtube.com/embed/${id}` : null,
      };
    }).filter((v: any) => v.video_id);
  } catch (e) { console.error('fetchVideos', e); return []; }
}

// ====== Image search via Gemini (returns direct image URLs) ======
async function fetchImages(topic: string, limit = 9) {
  try {
    const data = await callAI([
      { role: 'system', content: 'أنت مساعد بحث صور. أعد روابط مباشرة لصور حقيقية متاحة عامة (Unsplash, Pexels, Wikimedia). الروابط يجب أن تكون .jpg/.png/.webp مباشرة.' },
      { role: 'user', content: `أعطني ${limit} روابط صور حقيقية ذات صلة بـ: "${topic}".` },
    ], {
      type: 'object',
      properties: {
        items: { type: 'array', items: { type: 'object', properties: {
          url: { type: 'string' }, alt: { type: 'string' }, source: { type: 'string' },
        }, required: ['url'] } },
      }, required: ['items'],
    });
    return (data.items || []).slice(0, limit);
  } catch (e) { console.error('fetchImages', e); return []; }
}

// Visual inspirations: returns named platforms with screenshot URLs
async function fetchInspirations(topic: string, focus = 'overall') {
  const data = await callAI([
    { role: 'system', content: 'أنت مرشد تصميم منصات عالمي. اقترح 5 منصات حقيقية معروفة كمراجع بصرية. أعد روابط حقيقية فقط (https://...). كن دقيقاً.' },
    { role: 'user', content: `الفكرة: "${topic}". الجانب المطلوب كمرجع بصري: "${focus}" (مثلاً: شكل الصفحة الرئيسية، الدخول/التسجيل، صفحة المنتج، السلة). اقترح 5 منصات شهيرة بروابط رسمية + شرح مختصر لما يميز كل واحدة بصرياً.` },
  ], {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' }, url: { type: 'string' }, why: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
          },
          required: ['name', 'url', 'why'],
        },
      },
    },
    required: ['items'],
  });
  const items = (data.items || []).slice(0, 6).map((it: any) => ({
    ...it,
    screenshot: screenshotUrl(it.url),
    favicon: faviconUrl(it.url),
  }));
  return { focus, items };
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
    platform_id: platformId, level,
    client_api_key: apiKey, webhook_url: webhookUrl, ai_proxy_endpoint: aiProxyEndpoint,
    embed_snippet: embedSnippet, features, ...extras, status: 'active',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || new URL(req.url).searchParams.get('action');
    const payload = body.payload || {};

    if (action === 'verify_site') {
      const v = await verifySite(payload.url || '');
      return ok(v);
    }

    if (action === 'inspirations') {
      const ins = await fetchInspirations(payload.topic || '', payload.focus || 'overall');
      return ok(ins);
    }

    if (action === 'assistant') {
      const reply = await callAI([
        { role: 'system', content: 'أنت "بات شارك"، مساعد منصة بات شارك 99. ردودك قصيرة ومباشرة بالعربية. روابط ممكنة: /b99/level/1 /b99/level/2 /b99/level/3 /b99/ads /b99/platforms /b99/search.' },
        ...(payload.history || []).map((m: any) => ({ role: m.role, content: m.content })),
        { role: 'user', content: payload.message },
      ], {
        type: 'object',
        properties: { reply: { type: 'string' }, action_route: { type: 'string' }, suggestions: { type: 'array', items: { type: 'string' } } },
        required: ['reply'],
      });
      return ok(reply);
    }

    if (action === 'generate_platform') {
      const { level = 1, answers = {} } = payload;
      const blueprint = await callAI([
        { role: 'system', content: 'أنت معماري منصات. أنشئ blueprint احترافي بالعربية لمنصة فعلية، مستوحى من المرجعيات البصرية المختارة إن وُجدت. كل صفحة يجب أن تحوي 4-7 أقسام (sections) متكاملة (hero, features, pricing, stats, testimonials, faq, gallery, cta, contact) مع heading + body + items[] حقيقية.' },
        { role: 'user', content: `أنشئ منصة من إجابات هذا العميل: ${JSON.stringify(answers)}. نوع البناء: احترافي عميق وليس مبتدئ.` },
      ], {
        type: 'object',
        properties: {
          name: { type: 'string' }, tagline: { type: 'string' }, platform_type: { type: 'string' },
          pages: { type: 'array', items: { type: 'object', properties: {
            title: { type: 'string' }, icon: { type: 'string' },
            sections: { type: 'array', items: { type: 'object', properties: {
              type: { type: 'string' }, heading: { type: 'string' }, body: { type: 'string' },
              items: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, desc: { type: 'string' }, value: { type: 'string' } } } },
            }, required: ['type'] } },
          }, required: ['title'] } },
          features: { type: 'array', items: { type: 'string' } },
          brand: { type: 'object', properties: { primary_color: { type: 'string' }, accent_color: { type: 'string' }, logo_emoji: { type: 'string' }, mood: { type: 'string' } } },
        },
        required: ['name', 'tagline', 'pages'],
      });

      const slug = makeSlug(blueprint.name);
      const ownerPassword = answers.owner_password || makeKey('own').slice(0, 16);
      const ownerEmail = answers.owner_email || null;
      const dbChoice = answers.database_choice || 'bs99_hosted';

      const { data: platform, error } = await supabase.from('generated_platforms').insert({
        slug, name: blueprint.name, tagline: blueprint.tagline,
        platform_type: blueprint.platform_type || 'general',
        pages: blueprint.pages || [], features: blueprint.features || [],
        brand: blueprint.brand || {}, requirements: answers, build_level: `level_${level}`,
        level, status: 'live', is_public: dbChoice !== 'external', layout_mode: 'longform', theme_mode: 'light',
        owner_email: ownerEmail, owner_password: ownerPassword,
        meta: { database_choice: dbChoice, audience: answers.audience, brand_vibe: answers.brand_vibe },
      }).select().single();
      if (error) throw error;

      const integration = buildIntegration(platform.id, level, ['backend', 'ai_chat', ...(answers.features || [])], { database_choice: dbChoice });
      await supabase.from('b99_integrations').insert({ ...integration }).select();
      return ok({ platform: { ...platform, owner_password: ownerPassword }, integration });
    }

    if (action === 'update_platform') {
      const { slug, owner_password, patch } = payload;
      if (!slug || !owner_password) return ok({ error: 'missing_credentials' }, 400);
      const { data: existing } = await supabase.from('generated_platforms')
        .select('id, owner_password').eq('slug', slug).maybeSingle();
      if (!existing || existing.owner_password !== owner_password) {
        return ok({ error: 'invalid_credentials' }, 401);
      }
      const allowed: Record<string, any> = {};
      if (patch.name !== undefined) allowed.name = patch.name;
      if (patch.tagline !== undefined) allowed.tagline = patch.tagline;
      if (patch.brand !== undefined) allowed.brand = patch.brand;
      if (patch.pages !== undefined) allowed.pages = patch.pages;
      if (patch.is_public !== undefined) allowed.is_public = patch.is_public;
      if (patch.backend_link !== undefined) allowed.backend_link = patch.backend_link;
      const { data: updated, error: upErr } = await supabase.from('generated_platforms')
        .update(allowed).eq('id', existing.id).select().single();
      if (upErr) throw upErr;
      return ok({ platform: updated });
    }

    if (action === 'generate_integration') {
      const { level = 2, features = [], answers = {}, mode } = payload;
      // Real verification step
      const verification = answers.site_url ? await verifySite(answers.site_url) : null;

      let platformId: string | null = null;
      if (mode === 'connect' || level === 2) {
        const name = answers.business_name || verification?.title || 'موقعي';
        const slug = makeSlug(name);
        const { data: p } = await supabase.from('generated_platforms').insert({
          slug, name, tagline: answers.site_url || '',
          platform_type: 'connected', pages: [{ title: 'الرئيسية' }],
          requirements: { ...answers, verification }, build_level: `level_${level}_connect`,
          level, status: 'live', is_public: false, layout_mode: 'longform', theme_mode: 'light',
        }).select().single();
        platformId = p?.id || null;
      }
      const integration = buildIntegration(platformId, level, features, {
        external_site_url: answers.site_url,
        external_backend_type: answers.backend_type,
        verification,
      });
      await supabase.from('b99_integrations').insert({ ...integration });

      const steps = [
        'انسخ Embed Snippet والصقه داخل وسم <head> في موقعك.',
        'احفظ API Key في مكان آمن (لن يظهر مرة أخرى).',
        'فعّل الـ Webhook في إعدادات نظامك لإرسال الأحداث المهمة.',
        'افتح لوحة /b99/platforms لمتابعة البيانات الحية.',
      ];
      return ok({ integration, steps, verification });
    }

    if (action === 'hire_ai_employee') {
      const { business_name, owner_name, owner_email, site_url, tasks = [], data_sources = [], channels = [], schedule = 'daily' } = payload;
      const verification = site_url ? await verifySite(site_url) : null;

      const summary = await callAI([
        { role: 'system', content: 'أنت بات شارك. اكتب فقرة قصيرة بالعربية تخاطب فيها المالك بأنك تحققت من موقعه وأنك جاهز للبدء. اذكر مهامك وجدولك بثقة.' },
        { role: 'user', content: `الشركة: ${business_name}, المالك: ${owner_name}, الموقع: ${site_url || 'غير محدد'} (تحقق: ${verification ? `HTTP ${verification.status}, ${verification.response_time_ms}ms` : 'لا يوجد'}), المهام: ${tasks.join('، ')}, القنوات: ${channels.join('، ')}, الجدول: ${schedule}` },
      ]);

      const integration = buildIntegration(null, 3, tasks, { external_backend_type: 'ai_employee', external_site_url: site_url, verification });
      const { data: emp } = await supabase.from('b99_ai_employees').insert({
        owner_email, owner_name, business_name, tasks, data_sources, channels, schedule,
        config: { integration, verification, site_url }, status: 'active',
      }).select().single();
      await supabase.from('b99_integrations').insert({ ...integration });

      const next_actions = tasks.slice(0, 4).map((t: string) => ({
        title: ({ reports: 'يجهز التقرير الأول', emails: 'يرسل أول إيميل ملخص', employees: 'يقرأ بيانات الموظفين', data_processing: 'يفحص البيانات الواردة', alerts: 'يضبط حدود التنبيهات', forecasts: 'يبني نموذج التنبؤ', monitoring: 'يبدأ مراقبة الأداء', crm: 'ينظم قائمة العملاء' } as any)[t] || t,
        when: schedule === 'realtime' ? 'فوراً' : schedule === 'hourly' ? 'الساعة القادمة' : schedule === 'daily' ? 'غداً صباحاً' : 'الأسبوع القادم',
      }));
      return ok({ employee: emp, integration, summary, next_actions, verification });
    }

    if (action === 'generate_ad' || action === 'generate_video_ad') {
      const result = await callAI([
        { role: 'system', content: 'أنت مخرج إعلانات. أنشئ سكربت فيديو إعلاني احترافي بالعربية مع مشاهد وStoryboard.' },
        { role: 'user', content: JSON.stringify(payload) },
      ], {
        type: 'object',
        properties: {
          hook: { type: 'string' }, ad_copy: { type: 'string' }, voiceover_script: { type: 'string' }, video_prompt: { type: 'string' },
          video_scenes: { type: 'array', items: { type: 'object', properties: { scene: { type: 'string' }, visual: { type: 'string' }, voice: { type: 'string' }, text_on_screen: { type: 'string' }, duration_sec: { type: 'number' } } } },
          best_times: { type: 'array', items: { type: 'string' } }, hashtags: { type: 'array', items: { type: 'string' } }, cta: { type: 'string' },
        },
        required: ['hook', 'ad_copy', 'video_scenes'],
      });
      return ok(result);
    }

    if (action === 'search') {
      const q = (payload.query || '').trim();
      if (!q) return ok({ answer: '', sources: [], internal: { platforms: [], ads: [] }, inspirations: { items: [] } });
      const web = await webSearch(q);
      const [{ data: platforms }, { data: ads }] = await Promise.all([
        supabase.from('generated_platforms').select('id,name,tagline,slug,level').ilike('name', `%${q}%`).limit(6),
        supabase.from('ad_campaigns').select('id,name,business_type').ilike('name', `%${q}%`).limit(6),
      ]);
      const wantsInspirations = /(منصة|موقع|متجر|أمثلة|مشابه|شبيه|مرجع|reference|inspirat|similar|build|أفكار|تصميم)/i.test(q);
      const inspirations = wantsInspirations ? await fetchInspirations(q, 'overall').catch(() => ({ items: [] })) : { items: [] };
      return ok({ query: q, answer: web.answer, sources: web.sources, internal: { platforms: platforms || [], ads: ads || [] }, inspirations });
    }

    return ok({ error: 'unknown action' }, 400);
  } catch (e: any) {
    console.error(e);
    return ok({ error: e.message }, 500);
  }
});
