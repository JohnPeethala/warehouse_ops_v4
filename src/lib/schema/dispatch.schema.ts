import { z } from 'zod'

// Validates the payload for assigning a batch of tickets to a route session
export const AssignRouteSchema = z.object({
  ticketIds: z.array(z.string()),
  vehicleId: z.string().uuid('Invalid Vehicle ID'),
  driverId: z.string().uuid('Invalid Driver ID'),
  gt1Id: z.string().uuid('Invalid Ground Team 1 ID').optional().nullable(),
  gt2Id: z.string().uuid('Invalid Ground Team 2 ID').optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
})

export type AssignRoutePayload = z.infer<typeof AssignRouteSchema>

// Validates updating the status of a single ticket (often used by mobile/ground)
export const UpdateTicketStatusSchema = z.object({
  ticketId: z.string(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  statusType: z.enum(['dt_status', 'gt_status', 'ticket_status']),
  newStatus: z.string()
})

export type UpdateTicketStatusPayload = z.infer<typeof UpdateTicketStatusSchema>
