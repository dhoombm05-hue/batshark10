import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Palette, Image as ImageIcon, Lock, Users, Bell, Save, Trash2 } from 'lucide-react';
import { useRoomSettings } from '@/hooks/useRoomSettings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const THEME_COLORS = [
  { value: '#1e90ff', label: 'أزرق', css: 'hsl(210,80%,56%)' },
  { value: '#10b981', label: 'أخضر', css: 'hsl(160,60%,40%)' },
  { value: '#8b5cf6', label: 'بنفسجي', css: 'hsl(265,80%,66%)' },
  { value: '#f59e0b', label: 'ذهبي', css: 'hsl(43,96%,50%)' },
  { value: '#ef4444', label: 'أحمر', css: 'hsl(0,84%,60%)' },
  { value: '#ec4899', label: 'وردي', css: 'hsl(330,80%,60%)' },
  { value: '#06b6d4', label: 'سماوي', css: 'hsl(190,90%,43%)' },
  { value: '#6366f1', label: 'نيلي', css: 'hsl(239,84%,67%)' },
];

const ROLES_OPTIONS = [
  { value: 'ceo', label: 'الرئيس التنفيذي' },
  { value: 'coo', label: 'مدير العمليات' },
  { value: 'strategic_director', label: 'المدير الاستراتيجي' },
  { value: 'marketing_director', label: 'مدير التسويق' },
  { value: 'tech_director', label: 'المدير التقني' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomName: string;
}

export default function RoomSettingsDialog({ open, onOpenChange, roomId, roomName }: Props) {
  const { settings, loading, upsertSettings } = useRoomSettings(roomId);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [themeColor, setThemeColor] = useState('#1e90ff');
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [wallpaperOpacity, setWallpaperOpacity] = useState(0.3);
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setThemeColor(settings.theme_color || '#1e90ff');
      setWallpaperUrl(settings.wallpaper_url);
      setWallpaperOpacity(settings.wallpaper_opacity ?? 0.3);
      setIsPrivate(settings.is_private ?? false);
      setAllowedRoles(settings.allowed_roles || []);
      setNotificationsEnabled(settings.notifications_enabled ?? true);
    }
  }, [settings]);

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `room-wallpapers/${roomId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('documents').upload(path, file);
    if (error) {
      toast({ title: 'خطأ في رفع الصورة', variant: 'destructive' });
      return;
    }
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
    setWallpaperUrl(urlData.publicUrl);
    toast({ title: '✅ تم رفع الخلفية' });
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await upsertSettings(roomId, {
      theme_color: themeColor,
      wallpaper_url: wallpaperUrl,
      wallpaper_opacity: wallpaperOpacity,
      is_private: isPrivate,
      allowed_roles: allowedRoles,
      notifications_enabled: notificationsEnabled,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'خطأ في حفظ الإعدادات', variant: 'destructive' });
    } else {
      toast({ title: '✅ تم حفظ إعدادات الغرفة' });
      onOpenChange(false);
    }
  };

  const toggleRole = (role: string) => {
    setAllowedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[hsl(220,20%,13%)] border-[hsl(220,18%,22%)] text-white" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-white font-heading flex items-center gap-2">
            ⚙️ سمات الغرفة: {roomName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Theme Color */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-[hsl(210,20%,80%)] text-sm">
              <Palette className="w-4 h-4 text-[hsl(210,80%,58%)]" />
              لون الغرفة
            </Label>
            <div className="flex gap-2 flex-wrap">
              {THEME_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setThemeColor(c.value)}
                  className={`w-9 h-9 rounded-xl transition-all ${
                    themeColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-[hsl(220,20%,13%)] scale-110' : 'hover:scale-105'
                  }`}
                  style={{ background: c.css }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Wallpaper */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-[hsl(210,20%,80%)] text-sm">
              <ImageIcon className="w-4 h-4 text-[hsl(152,60%,45%)]" />
              خلفية الغرفة
            </Label>
            <div className="flex gap-2 items-center">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleWallpaperUpload} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="bg-[hsl(220,18%,18%)] border-[hsl(220,18%,25%)] text-[hsl(210,20%,80%)] hover:bg-[hsl(220,18%,22%)]"
              >
                <ImageIcon className="w-3.5 h-3.5 ml-1" />
                اختر صورة
              </Button>
              {wallpaperUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWallpaperUrl(null)}
                  className="text-[hsl(0,72%,55%)] hover:bg-[hsl(0,72%,55%/0.1)]"
                >
                  <Trash2 className="w-3.5 h-3.5 ml-1" />
                  إزالة
                </Button>
              )}
            </div>
            {wallpaperUrl && (
              <div className="relative rounded-xl overflow-hidden h-20">
                <img src={wallpaperUrl} alt="" className="w-full h-full object-cover" style={{ opacity: wallpaperOpacity }} />
                <div className="absolute inset-0 bg-black/40" />
              </div>
            )}
            {wallpaperUrl && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-[hsl(220,10%,50%)]">شفافية</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={wallpaperOpacity}
                  onChange={e => setWallpaperOpacity(parseFloat(e.target.value))}
                  className="flex-1 accent-[hsl(210,80%,52%)]"
                />
                <span className="text-xs text-[hsl(220,10%,50%)] w-8">{Math.round(wallpaperOpacity * 100)}%</span>
              </div>
            )}
          </div>

          {/* Privacy */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-[hsl(210,20%,80%)] text-sm">
              <Lock className="w-4 h-4 text-[hsl(270,60%,55%)]" />
              خصوصية الغرفة
            </Label>
            <div className="flex items-center justify-between bg-[hsl(220,18%,16%)] rounded-xl p-3">
              <span className="text-sm text-[hsl(210,20%,80%)]">غرفة خاصة</span>
              <Switch
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>
          </div>

          {/* Allowed Roles */}
          {isPrivate && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-[hsl(210,20%,80%)] text-sm">
                <Users className="w-4 h-4 text-[hsl(43,65%,50%)]" />
                من يستطيع الدخول
              </Label>
              <div className="space-y-1.5">
                {ROLES_OPTIONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => toggleRole(r.value)}
                    className={`w-full text-right flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      allowedRoles.includes(r.value)
                        ? 'bg-[hsl(210,80%,52%/0.15)] border border-[hsl(210,80%,52%/0.3)] text-[hsl(210,80%,65%)]'
                        : 'bg-[hsl(220,18%,16%)] border border-transparent text-[hsl(210,20%,70%)] hover:bg-[hsl(220,18%,20%)]'
                    }`}
                  >
                    <span className="text-sm">{r.label}</span>
                    {allowedRoles.includes(r.value) && <span className="text-xs">✓</span>}
                  </button>
                ))}
              </div>
              {allowedRoles.length === 0 && isPrivate && (
                <p className="text-[10px] text-[hsl(43,65%,50%)]">⚠️ لم تحدد أي دور — لن يتمكن أحد من الدخول</p>
              )}
            </div>
          )}

          {/* Notifications */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-[hsl(210,20%,80%)] text-sm">
              <Bell className="w-4 h-4 text-[hsl(25,85%,52%)]" />
              إشعارات الغرفة
            </Label>
            <div className="flex items-center justify-between bg-[hsl(220,18%,16%)] rounded-xl p-3">
              <span className="text-sm text-[hsl(210,20%,80%)]">تفعيل الإشعارات</span>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </div>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-[hsl(190,80%,45%)] to-[hsl(210,80%,52%)] hover:from-[hsl(190,80%,50%)] hover:to-[hsl(210,80%,57%)] text-white font-bold"
          >
            <Save className="w-4 h-4 ml-2" />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
