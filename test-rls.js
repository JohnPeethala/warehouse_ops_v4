const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  console.log('Testing ops_ticket_annotations insertion...');
  const { data: annData, error: annError } = await supabase
    .from('ops_ticket_annotations')
    .upsert({ ticket_id: 'TEST-123', location: 'TestArea', pincode: '123456' }, { onConflict: 'ticket_id' });
  
  console.log('Annotation result:', annError || 'Success');
}

test();
