'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/guards'
import { AssignRouteSchema, UpdateTicketStatusSchema } from '@/lib/schema/dispatch.schema'
import { assignRouteService, updateTicketStatusService } from '@/services/dispatch.service'

/**
 * Server Action: Assigns a batch of tickets to a route.
 * Can only be called by admins or supervisors.
 */
export async function assignRouteAction(_formData: FormData) {
  try {
    // 1. Role Guard: Throw error if not admin or supervisor
    const _user = await requireRole(['admin', 'supervisor'])

    // 2. Parse FormData into an object (assuming it's a JSON payload stringified in a hidden field, 
    // or standard form fields. For simplicity, we assume we receive a plain object in a real app, 
    // but since this is a Next.js action receiving FormData, we reconstruct it).
    // Note: If calling this from a Client Component via a transition, it's easier to pass an object directly.
    // We will support direct object passing for modern React 19 useActionState.
    throw new Error('Use assignRouteActionDirect instead for JSON payloads')
  } catch (error: unknown) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unknown error' }
  }
}

/**
 * Server Action: Assigns a batch of tickets to a route (Direct JSON Payload)
 * Preferred method for modern Client Components.
 */
export async function assignRouteActionDirect(payload: unknown) {
  try {
    // 1. Role Guard
    const user = await requireRole(['admin', 'supervisor'])

    // 2. Strict Zod Validation
    const parsed = AssignRouteSchema.safeParse(payload)
    if (!parsed.success) {
      return { success: false, error: 'Invalid payload format', details: parsed.error.flatten() }
    }

    // 3. Execute Business Logic via Service
    const result = await assignRouteService(parsed.data, user.id)

    // 4. Revalidate cache so UI updates instantly
    revalidatePath('/dashboard/schedule') // adjust path as needed
    
    return { success: true, data: result }
  } catch (error: unknown) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unknown error' }
  }
}

/**
 * Server Action: Updates a ticket status
 */
export async function updateTicketStatusActionDirect(payload: unknown) {
  try {
    // 1. Role Guard (Ground team can also update status!)
    const user = await requireRole(['admin', 'supervisor', 'ground'])

    // 2. Zod Validation
    const parsed = UpdateTicketStatusSchema.safeParse(payload)
    if (!parsed.success) {
      return { success: false, error: 'Invalid payload format', details: parsed.error.flatten() }
    }

    // 3. Execute Service
    const result = await updateTicketStatusService(parsed.data, user.id)

    // 4. Revalidate
    revalidatePath('/dashboard/schedule')
    
    return { success: true, data: result }
  } catch (error: unknown) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unknown error' }
  }
}
