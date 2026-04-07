const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    
    const { recipientEmail, reportType, reportData, period } = await req.json()

    if (!recipientEmail || !reportType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build HTML report
    const reportTitle = getReportTitle(reportType)
    const tableRows = reportData?.data?.slice(1)?.map((row: any[]) => 
      `<tr>${row.map(cell => `<td style="border:1px solid #ddd;padding:12px;text-align:right;">${typeof cell === 'number' ? cell.toLocaleString() : cell}</td>`).join('')}</tr>`
    ).join('') || ''

    const headers = reportData?.data?.[0]?.map((h: string) => 
      `<th style="border:1px solid #ddd;padding:12px;text-align:right;background:#f5f5f5;font-weight:bold;">${h}</th>`
    ).join('') || ''

    const htmlContent = `
      <html dir="rtl">
        <head><meta charset="utf-8"></head>
        <body style="font-family:'Segoe UI',Tahoma,sans-serif;padding:40px;direction:rtl;background:#ffffff;">
          <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:30px;color:#fff;">
              <h1 style="margin:0;font-size:24px;">BATSHARK</h1>
              <p style="margin:5px 0 0;opacity:0.8;font-size:14px;">Economy Intelligence</p>
            </div>
            <div style="padding:30px;">
              <h2 style="color:#333;margin:0 0 5px;">${reportTitle}</h2>
              <p style="color:#888;font-size:13px;margin:0 0 25px;">
                الفترة: ${period?.start || ''} - ${period?.end || ''}
              </p>
              <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                <thead><tr>${headers}</tr></thead>
                <tbody>${tableRows}</tbody>
              </table>
              <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;color:#999;font-size:12px;">
                <p>تم الإرسال تلقائياً بواسطة نظام BatShark</p>
                <p>${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Use Lovable AI to send email via edge function pattern
    // For now, we'll use a simple approach - store the report and mark as sent
    // Since no email domain is configured, we'll use the LOVABLE_API_KEY approach
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    
    if (LOVABLE_API_KEY) {
      // Try sending via Lovable's built-in capabilities
      const response = await fetch('https://api.lovable.dev/v1/email/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: `تقرير ${reportTitle} - BatShark`,
          html: htmlContent,
        }),
      })

      if (response.ok) {
        return new Response(JSON.stringify({ success: true, message: 'تم إرسال التقرير بنجاح' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Fallback: save report for manual download
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'لم يتم إعداد نطاق البريد الإلكتروني بعد. يرجى إعداد نطاق بريد أولاً.',
      html: htmlContent 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error sending report:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function getReportTitle(type: string): string {
  const titles: Record<string, string> = {
    'monthly-financial': 'التقرير المالي الشهري',
    'projects-status': 'تقرير حالة المشاريع',
    'employee-performance': 'تقرير أداء الموظفين',
    'executive-summary': 'الملخص التنفيذي',
  }
  return titles[type] || 'تقرير'
}
