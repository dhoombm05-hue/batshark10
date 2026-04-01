import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Mail, Plus, X, Settings2, CheckCircle2 } from 'lucide-react';
import { useReportSchedule, getWeekdayName } from '@/hooks/useReportSchedule';
import { motion, AnimatePresence } from 'framer-motion';

const WEEKDAYS = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
];

const REPORT_TYPES = [
  { value: 'monthly-financial', label: 'التقرير المالي الشهري' },
  { value: 'projects-status', label: 'حالة المشاريع' },
  { value: 'employee-performance', label: 'أداء الموظفين' },
  { value: 'executive-summary', label: 'الملخص التنفيذي' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, '0')}:00`,
}));

export default function ReportScheduleDialog() {
  const { settings, loading, saving, saveSettings } = useReportSchedule();
  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const toggleWeekday = (day: number) => {
    const days = localSettings.weekdays.includes(day)
      ? localSettings.weekdays.filter(d => d !== day)
      : [...localSettings.weekdays, day].sort();
    setLocalSettings(s => ({ ...s, weekdays: days, sends_per_week: days.length }));
  };

  const toggleReportType = (type: string) => {
    const types = localSettings.report_types.includes(type)
      ? localSettings.report_types.filter(t => t !== type)
      : [...localSettings.report_types, type];
    if (types.length > 0) setLocalSettings(s => ({ ...s, report_types: types }));
  };

  const addEmail = () => {
    const email = newEmail.trim();
    if (email && email.includes('@') && !localSettings.recipient_emails.includes(email)) {
      setLocalSettings(s => ({ ...s, recipient_emails: [...s.recipient_emails, email] }));
      setNewEmail('');
    }
  };

  const removeEmail = (email: string) => {
    setLocalSettings(s => ({ ...s, recipient_emails: s.recipient_emails.filter(e => e !== email) }));
  };

  const handleSave = async () => {
    await saveSettings(localSettings);
    setOpen(false);
  };

  const selectedDaysText = localSettings.weekdays.map(d => getWeekdayName(d)).join('، ');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2">
          <Settings2 className="w-4 h-4" />
          إعدادات الجدولة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            جدولة الإرسال التلقائي
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
            <div>
              <p className="font-medium text-sm">تفعيل الإرسال التلقائي</p>
              <p className="text-xs text-muted-foreground">إرسال التقارير تلقائياً حسب الجدول</p>
            </div>
            <Switch
              checked={localSettings.enabled}
              onCheckedChange={(checked) => setLocalSettings(s => ({ ...s, enabled: checked }))}
            />
          </div>

          {/* Weekdays */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              أيام الإرسال
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map(day => (
                <motion.button
                  key={day.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleWeekday(day.value)}
                  className={`px-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                    localSettings.weekdays.includes(day.value)
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {day.label}
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {localSettings.weekdays.length > 0 
                ? `سيتم الإرسال: ${selectedDaysText} (${localSettings.weekdays.length} مرات/أسبوع)`
                : 'اختر يوم واحد على الأقل'}
            </p>
          </div>

          {/* Send Hour */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              وقت الإرسال
            </label>
            <Select
              value={localSettings.send_hour.toString()}
              onValueChange={(v) => setLocalSettings(s => ({ ...s, send_hour: parseInt(v) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map(h => (
                  <SelectItem key={h.value} value={h.value.toString()}>
                    {h.label} (توقيت الرياض)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Report Types */}
          <div className="space-y-2">
            <label className="text-sm font-medium">أنواع التقارير المرسلة</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map(type => (
                <motion.button
                  key={type.value}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleReportType(type.value)}
                  className={`p-2.5 rounded-lg text-xs font-medium text-right transition-all border ${
                    localSettings.report_types.includes(type.value)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-card border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {localSettings.report_types.includes(type.value) && (
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span>{type.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Recipient Emails */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              عناوين البريد الإلكتروني
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="example@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={addEmail} disabled={!newEmail.includes('@')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <AnimatePresence>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {localSettings.recipient_emails.map(email => (
                  <motion.div
                    key={email}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge variant="secondary" className="gap-1 pl-1 text-xs">
                      {email}
                      <button onClick={() => removeEmail(email)} className="hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
            {localSettings.recipient_emails.length === 0 && (
              <p className="text-xs text-amber-500">أضف بريد إلكتروني واحد على الأقل</p>
            )}
          </div>

          {/* Save */}
          <Button 
            onClick={handleSave} 
            disabled={saving || localSettings.recipient_emails.length === 0 || localSettings.weekdays.length === 0}
            className="w-full"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
