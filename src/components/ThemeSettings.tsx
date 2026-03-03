import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Sun, Moon, Sparkles, Upload, X, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUserPreferences, useUpdatePreferences, useUploadThemeImage, type UserPreferences } from '@/hooks/useUserPreferences';
import { toast } from 'sonner';

const THEMES = [
  { id: 'light' as const, label: 'فاتح احترافي', icon: Sun, preview: 'bg-gradient-to-br from-[hsl(222,18%,96%)] to-[hsl(215,25%,93%)]' },
  { id: 'dark' as const, label: 'داكن فاخر', icon: Moon, preview: 'bg-gradient-to-br from-[hsl(220,20%,14%)] to-[hsl(220,22%,8%)]' },
  { id: 'glass' as const, label: 'زجاجي', icon: Sparkles, preview: 'bg-gradient-to-br from-[hsl(210,30%,90%/0.6)] to-[hsl(220,20%,85%/0.4)]' },
  { id: 'custom' as const, label: 'صورة مخصصة', icon: Upload, preview: 'bg-gradient-to-br from-[hsl(270,40%,30%)] to-[hsl(210,50%,25%)]' },
];

const SECTIONS = [
  { key: 'chat', label: 'غرفة النقاش' },
  { key: 'dashboard', label: 'لوحة التحكم' },
  { key: 'employees', label: 'الموظفين' },
];

export default function ThemeSettings() {
  const { data: prefs } = useUserPreferences();
  const updatePrefs = useUpdatePreferences();
  const uploadImage = useUploadThemeImage();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sectionFileRef = useRef<HTMLInputElement>(null);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);

  const currentTheme = prefs?.theme || 'light';

  const handleThemeChange = (theme: UserPreferences['theme']) => {
    updatePrefs.mutate({ theme }, {
      onSuccess: () => toast.success('تم تغيير السمة')
    });
  };

  const handleCustomBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage.mutateAsync({ file, type: 'background' });
      await updatePrefs.mutateAsync({ theme: 'custom', custom_bg_url: url });
      toast.success('تم رفع الخلفية المخصصة');
    } catch {
      toast.error('فشل في رفع الصورة');
    }
  };

  const handleSectionBg = async (section: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSection(section);
    try {
      const url = await uploadImage.mutateAsync({ file, type: 'background' });
      const current = prefs?.section_backgrounds || {};
      await updatePrefs.mutateAsync({ section_backgrounds: { ...current, [section]: url } });
      toast.success('تم حفظ خلفية القسم');
    } catch {
      toast.error('فشل في رفع الصورة');
    }
    setUploadingSection(null);
  };

  const clearSectionBg = (section: string) => {
    const current = { ...(prefs?.section_backgrounds || {}) };
    delete current[section];
    updatePrefs.mutate({ section_backgrounds: current });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary/50 w-full">
          <Palette className="w-5 h-5 shrink-0" />
          <span className="font-body text-sm font-medium">السمات</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Palette className="w-5 h-5 text-section-ai" /> مركز السمات
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Theme Selection */}
          <div>
            <p className="text-xs text-muted-foreground mb-3">اختر سمة النظام</p>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => t.id === 'custom' ? fileRef.current?.click() : handleThemeChange(t.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    currentTheme === t.id
                      ? 'border-primary shadow-md'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className={`w-full h-12 rounded-lg mb-2 ${t.preview}`} />
                  <div className="flex items-center gap-2">
                    <t.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{t.label}</span>
                  </div>
                  {currentTheme === t.id && (
                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCustomBg} />
          </div>

          {/* Section Backgrounds */}
          <div>
            <p className="text-xs text-muted-foreground mb-3">خلفية مخصصة لكل قسم</p>
            <div className="space-y-2">
              {SECTIONS.map(s => {
                const hasBg = !!(prefs?.section_backgrounds as any)?.[s.key];
                return (
                  <div key={s.key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                    <span className="text-sm text-foreground">{s.label}</span>
                    <div className="flex items-center gap-2">
                      {hasBg && (
                        <button onClick={() => clearSectionBg(s.key)} className="text-xs text-destructive hover:underline">
                          إزالة
                        </button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setUploadingSection(s.key);
                          sectionFileRef.current?.click();
                        }}
                        disabled={uploadingSection === s.key}
                      >
                        {uploadingSection === s.key ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ImageIcon className="w-3 h-3" />
                        )}
                        <span className="mr-1 text-xs">{hasBg ? 'تغيير' : 'رفع'}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
              <input
                ref={sectionFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (uploadingSection) handleSectionBg(uploadingSection, e);
                }}
              />
            </div>
          </div>

          {/* Chat Wallpaper Settings */}
          {prefs?.chat_wallpaper_url && (
            <div>
              <p className="text-xs text-muted-foreground mb-3">إعدادات جدار غرفة النقاش</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">الشفافية</span>
                    <span className="text-foreground">{Math.round((prefs.chat_wallpaper_opacity || 0.3) * 100)}%</span>
                  </div>
                  <Slider
                    value={[prefs.chat_wallpaper_opacity * 100]}
                    onValueChange={v => updatePrefs.mutate({ chat_wallpaper_opacity: v[0] / 100 })}
                    min={10} max={90} step={5}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">الضبابية</span>
                    <span className="text-foreground">{prefs.chat_wallpaper_blur || 8}px</span>
                  </div>
                  <Slider
                    value={[prefs.chat_wallpaper_blur]}
                    onValueChange={v => updatePrefs.mutate({ chat_wallpaper_blur: v[0] })}
                    min={0} max={20} step={1}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
