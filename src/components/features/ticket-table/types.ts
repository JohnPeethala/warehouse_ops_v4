export type StagedTicket = {
  id: string;
  ticket_id: string;
  date: string;
  contact_name: string | null;
  phone: string | null;
  address1: string | null;
  pincode: string | null;
  category: string | null;
  sub_category: string | null;
  ticket_age: number | null;
  raw_tags: string | null;
  batch_id: string | null;
};

export type TicketAnnotation = {
  ticket_id: string;
  contact_name?: string;
  location?: string;
  pincode?: string;
  notes?: string;
  link?: string;
  priority_tag?: string;
};

export type EnrichedTicket = StagedTicket & {
  annotation: TicketAnnotation | null;
  latest_schedule_date: string | null;
};

export type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;
