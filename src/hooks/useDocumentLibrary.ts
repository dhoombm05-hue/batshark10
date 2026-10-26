import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import type { DocumentFolder } from '@/lib/document-utils';

export interface LibraryDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
  folder_id: string | null;
  keywords: string[];
  content: string | null;
  source: string;
  business_name: string | null;
  section: string | null;
}

export function useDocumentLibrary() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuthContext();
  const docs = useQuery({ queryKey: ['documents'], queryFn: async () => {
    const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as LibraryDocument[];
  } });
  const folders = useQuery({ queryKey: ['document-folders'], queryFn: async () => {
    const { data, error } = await supabase.from('document_folders').select('*').order('name');
    if (error) throw error;
    return data as DocumentFolder[];
  } });
  const refresh = async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['documents'] }), queryClient.invalidateQueries({ queryKey: ['document-folders'] })]);
  };
  const saveFile = async (file: File, metadata: { title: string; description: string; category: string; folder_id: string | null; keywords: string[]; content?: string; source: string }) => {
    if (!user) throw new Error('سجل الدخول أولاً');
    const extension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('documents').upload(path, file, { contentType: file.type || 'application/octet-stream' });
    if (uploadError) throw uploadError;
    const { data: url } = supabase.storage.from('documents').getPublicUrl(path);
    const { error } = await supabase.from('documents').insert({ ...metadata, file_url: url.publicUrl, file_name: file.name, file_size: file.size, file_type: file.type, uploaded_by: profile?.display_name || '', created_by: user.id });
    if (error) {
      await supabase.storage.from('documents').remove([path]);
      throw error;
    }
  };
  return { docs: docs.data || [], folders: folders.data || [], isLoading: docs.isLoading || folders.isLoading, error: docs.error || folders.error, refresh, saveFile };
}