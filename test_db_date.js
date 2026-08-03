
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('ops_dispatch_log').select('*').eq('scheduled_date', '2026-08-04');
  console.log('2026-08-04 count:', data?.length);
  const { data: data2, error: error2 } = await supabase.from('ops_dispatch_log').select('*').eq('scheduled_date', '2026-08-03');
  console.log('2026-08-03 count:', data2?.length);
}
check();

