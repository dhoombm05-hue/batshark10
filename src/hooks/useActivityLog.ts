import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the current logged-in user's display name for audit trails.
 * Falls back to email prefix or 'مجهول'.
 */
export async function getCurrentUserName(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return 'مجهول';

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', session.user.id)
    .single();

  if (profile?.display_name) return profile.display_name;
  if (session.user.email) return session.user.email.split('@')[0];
  return 'مجهول';
}

/**
 * Logs a user activity to the user_activity table.
 * Silently fails on error — never blocks the main operation.
 */
export async function logActivity(params: {
  userId: string;
  actionType: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
}) {
  try {
    await supabase.from('user_activity').insert({
      user_id: params.userId,
      action_type: params.actionType,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      details: params.details ?? null,
    } as any);
  } catch {
    // silent — activity log must never break core operations
  }
}
