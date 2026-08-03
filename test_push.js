
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPush() {
  const { data: tickets, error: fetchError } = await supabase
    .from('ops_staged_tickets')
    .select(\
      ticket_id, 
      sub_category, 
      contact_name, 
      address1,
      ops_ticket_annotations!inner(
        priority_tag, 
        location, 
        pincode, 
        notes
      )
    \)
    .in('ops_ticket_annotations.priority_tag', ['s', 'schedule']);

  console.log('fetchError:', fetchError);
  console.log('tickets:', tickets?.length);
  
  if (!tickets || tickets.length === 0) return;

  const dispatchLogs = tickets.map((t) => {
    const ann = Array.isArray(t.ops_ticket_annotations) ? t.ops_ticket_annotations[0] : t.ops_ticket_annotations;
    return {
      ticket_id: t.ticket_id,
      scheduled_date: '2026-08-04',
      sub_category: t.sub_category || '',
      contact_name: ann?.contact_name || t.contact_name || '',
      location: ann?.location || t.city || '',
      address: t.address1 || '',
      pincode: ann?.pincode || '',
      notes: ann?.notes || '',
      gt_map: null,
      status: 'Pending', 
    };
  });

  console.log('Trying to upsert:', dispatchLogs.length);
  const { error: upsertError } = await supabase
    .from('ops_dispatch_log')
    .upsert(dispatchLogs, {
      onConflict: 'ticket_id, scheduled_date'
    });
  
  console.log('upsertError:', upsertError);
}
testPush();

