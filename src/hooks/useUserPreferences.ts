import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'glass' | 'custom';
  custom_bg_url: string | null;
  section_backgrounds: Record<string, string>;
  chat_wallpaper_url: string | null;
  chat_wallpaper_opacity: number;
  chat_wallpaper_blur: number;
  chat_wallpaper_overlay: string;
  created_at: string;
  updated_at: string;
}

const DEFAULTS: Partial<UserPreferences> = {
  theme: 'light',
  custom_bg_url: null,
  section_backgrounds: {},
  chat_wallpaper_url: null,
  chat_wallpaper_opacity: 0.3,
  chat_wallpaper_blur: 8,
  chat_wallpaper_overlay: 'rgba(0,0,0,0.5)',
};

export function useUserPreferences() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as UserPreferences) || null;
    },
    enabled: !!user,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      if (!user) throw new Error('Not authenticated');
      
      // Try update first
      const { data: existing } = await supabase
        .from('user_preferences' as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences' as any)
          .update(updates as any)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences' as any)
          .insert({ user_id: user.id, ...DEFAULTS, ...updates } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
    onError: () => {
      toast.error('فشل في حفظ الإعدادات');
    },
  });
}

export function useUploadThemeImage() {
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'background' | 'wallpaper' }) => {
      if (!user) throw new Error('Not authenticated');
      const ext = file.name.split('.').pop();
      const path = `themes/${user.id}/${type}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      return urlData.publicUrl;
    },
  });
}
