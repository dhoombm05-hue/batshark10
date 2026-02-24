import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserName } from './useActivityLog';

/**
 * Auto-tracks page views. Logs to activity_impact_log silently.
 */
export function usePageViewTracker(section?: string, entityId?: string, entityName?: string) {
  const logged = useRef(false);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const userName = await getCurrentUserName();

        await supabase.from('activity_impact_log' as any).insert({
          user_id: session.user.id,
          user_name: userName,
          action_type: 'page_view',
          entity_type: 'statistics',
          entity_id: entityId ?? null,
          entity_name: entityName ?? null,
          section: section ?? null,
          field_name: null,
          old_value: null,
          new_value: null,
          numeric_difference: 0,
          is_manual_override: false,
          change_reason: null,
          impact_on_net_profit: 0,
          impact_on_liquidity: 0,
          impact_on_growth: 0,
          risk_level: 'low',
        } as any);
      } catch {
        // silent
      }
    })();
  }, [section, entityId, entityName]);
}
