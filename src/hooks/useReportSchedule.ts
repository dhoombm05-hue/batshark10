import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ReportScheduleSettings {
  id?: string;
  enabled: boolean;
  weekdays: number[];
  sends_per_week: number;
  recipient_emails: string[];
  report_types: string[];
  send_hour: number;
  timezone: string;
}

const WEEKDAY_NAMES: Record<number, string> = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

export const getWeekdayName = (day: number) => WEEKDAY_NAMES[day] || '';

const defaultSettings: ReportScheduleSettings = {
  enabled: true,
  weekdays: [0, 3],
  sends_per_week: 2,
  recipient_emails: [],
  report_types: ['executive-summary'],
  send_hour: 9,
  timezone: 'Asia/Riyadh',
};

export function useReportSchedule() {
  const { user } = useAuthContext();
  const [settings, setSettings] = useState<ReportScheduleSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('report_email_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (data) {
      setSettings({
        id: data.id,
        enabled: data.enabled,
        weekdays: data.weekdays,
        sends_per_week: data.sends_per_week,
        recipient_emails: data.recipient_emails,
        report_types: data.report_types,
        send_hour: data.send_hour,
        timezone: data.timezone,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (newSettings: Partial<ReportScheduleSettings>) => {
    if (!user) return;
    setSaving(true);
    
    const merged = { ...settings, ...newSettings };

    try {
      if (settings.id) {
        const { error } = await supabase
          .from('report_email_settings')
          .update({
            enabled: merged.enabled,
            weekdays: merged.weekdays,
            sends_per_week: merged.sends_per_week,
            recipient_emails: merged.recipient_emails,
            report_types: merged.report_types,
            send_hour: merged.send_hour,
            timezone: merged.timezone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('report_email_settings')
          .insert({
            enabled: merged.enabled,
            weekdays: merged.weekdays,
            sends_per_week: merged.sends_per_week,
            recipient_emails: merged.recipient_emails,
            report_types: merged.report_types,
            send_hour: merged.send_hour,
            timezone: merged.timezone,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) merged.id = data.id;
      }

      setSettings(merged as ReportScheduleSettings);
      toast.success('تم حفظ إعدادات الجدولة');
    } catch (error: any) {
      toast.error('خطأ في حفظ الإعدادات: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const sendReportNow = async (reportType: string, reportData: any, period: any, email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-report', {
        body: {
          recipientEmail: email,
          reportType,
          reportData,
          period,
        },
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success('تم إرسال التقرير بنجاح');
      } else {
        toast.info(data?.message || 'يرجى إعداد نطاق البريد الإلكتروني');
      }
      return data;
    } catch (error: any) {
      toast.error('خطأ في إرسال التقرير: ' + error.message);
      return null;
    }
  };

  return { settings, loading, saving, saveSettings, sendReportNow };
}
