import { getServiceClient } from '@/lib/supabase'

export async function logActivity(
  db: ReturnType<typeof getServiceClient>,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: Record<string, any>
) {
  try {
    await db.from('activity_log').insert({ action, entity_type: entityType, entity_id: entityId, details: details || null, actor: 'admin' })
  } catch {
    // best-effort — table may not exist yet if the SQL migration hasn't been applied
  }
}
