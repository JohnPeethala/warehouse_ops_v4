import { createClient } from '@/lib/supabase/server'
import { AssignRoutePayload, UpdateTicketStatusPayload } from '@/lib/schema/dispatch.schema'
import { Database } from '@/lib/supabase/database.types'

/**
 * Assigns a batch of tickets to a specific route session (Vehicle + Driver on a Date).
 * Automatically creates the route session if it doesn't exist.
 */
export async function assignRouteService(payload: AssignRoutePayload, currentUserId: string) {
  const supabase = await createClient()

  // 1. Find or create the ops_route_sessions record for this date and vehicle
  // Because of the UNIQUE(trip_date, vehicle_id) constraint, we can try to insert and catch, 
  // or use an upsert/RPC. For simplicity, we query first, then insert if not found.
  let { data: session } = await supabase
    .from('ops_route_sessions')
    .select('id')
    .eq('trip_date', payload.date)
    .eq('vehicle_id', payload.vehicleId)
    .single()

  if (!session) {
    const { data: newSession, error: insertError } = await supabase
      .from('ops_route_sessions')
      .insert({
        trip_date: payload.date,
        vehicle_id: payload.vehicleId,
        driver_id: payload.driverId,
        gt1_id: payload.gt1Id || null,
        gt2_id: payload.gt2Id || null,
      })
      .select('id')
      .single()

    if (insertError) throw new Error(`Failed to create route session: ${insertError.message}`)
    session = newSession
  } else {
    // If it exists, we might want to update the crew if it changed, but for now we just link it.
    // In a full implementation, you'd compare and update the session crew if they passed new ones.
  }

  if (!session) throw new Error('Could not resolve route session')

  // 2. Link the selected tickets to this session
  // This uses an IN clause to update all selected tickets for the given date.
  const { error: updateError } = await supabase
    .from('ops_dispatch_log')
    .update({ 
      gt_trip_id: session.id,
      updated_by: currentUserId,
      updated_at: new Date().toISOString()
    })
    .in('ticket_id', payload.ticketIds)
    .eq('scheduled_date', payload.date)

  if (updateError) throw new Error(`Failed to assign tickets: ${updateError.message}`)

  return { success: true, sessionId: session.id }
}

/**
 * Updates a specific status field on a ticket.
 * This will fire the Postgres Triggers we set up (Audit Log, Ticket Lifecycle, Analytics Sync).
 */
export async function updateTicketStatusService(payload: UpdateTicketStatusPayload, currentUserId: string) {
  const supabase = await createClient()

  // Dynamically build the update object based on the statusType
  const updateData: Database['public']['Tables']['ops_dispatch_log']['Update'] = {
    updated_by: currentUserId,
    updated_at: new Date().toISOString()
  }
  
  if (payload.statusType === 'dt_status') updateData.dt_status = payload.newStatus
  else if (payload.statusType === 'gt_status') updateData.gt_status = payload.newStatus
  else if (payload.statusType === 'ticket_status') updateData.ticket_status = payload.newStatus

  const { error } = await supabase
    .from('ops_dispatch_log')
    .update(updateData)
    .eq('ticket_id', payload.ticketId)
    .eq('scheduled_date', payload.scheduledDate)

  if (error) throw new Error(`Failed to update status: ${error.message}`)

  return { success: true }
}
