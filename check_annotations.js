
const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: batch } = await supabase.from("ops_custom_batch").select("ticket_ids").eq("id", 1).single();
  console.log("ticket_ids:", batch?.ticket_ids?.slice(0, 5));
  
  if (batch?.ticket_ids?.length) {
    const { data: t } = await supabase.from("ops_ticket_annotations").select("*").in("ticket_id", batch.ticket_ids);
    console.log("annotations:", t);
  }
}
run();

