require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { error: sqlError } = await supabase.rpc('execute_sql', {
    sql: 
      CREATE TABLE IF NOT EXISTS cfg_settings (
        key text PRIMARY KEY,
        value text NOT NULL
      );
      
      -- Seed the table
      INSERT INTO cfg_settings (key, value) VALUES (
        'manifest_processing_script', 
        '// 1. Filter out bad rows
const validRows = rows.filter(r => r["Ticket Id"] && !r["Status (Ticket)"]?.toLowerCase().includes("wrapup"));

// 2. Create a batch record
const { data: batch, error: batchErr } = await supabase
  .from("ops_manifest_batches")
  .insert({ ticket_count: validRows.length })
  .select("id")
  .single();

if (batchErr) throw new Error("Failed to create batch: " + batchErr.message);

// 3. Clean and map data
const processed = validRows.map(row => {
   let cat = "Others";
   let subCatStr = String(row["Sub Category"] || "").toLowerCase();
   
   if (subCatStr.includes("new") && subCatStr.includes("rental")) cat = "Delivery";
   else if (subCatStr.includes("pickup")) cat = "Pickup";
   else if (subCatStr.includes("install") || subCatStr.includes("repair") || subCatStr.includes("replace") || subCatStr.includes("relocat")) cat = "Service";
   
   return {
      ticket_id: String(row["Ticket Id"]),
      batch_id: batch.id,
      category: cat,
      sub_category: String(row["Sub Category"] || ""),
      date: helpers.formatDate(String(row["Scheduled Date"] || "")),
      phone: helpers.formatPhone(String(row["Phone (Contact)"] || "")),
      contact_name: helpers.toTitleCase(String(row["Contact name"] || "")),
      address1: [String(row["Address 1"] || ""), String(row["Address 2"] || "")].filter(Boolean).join(", "),
      ticket_age: helpers.parseTicketAge(String(row["Ticket Age"] || "")),
      raw_tags: String(row["Tags"] || ""),
   };
});

// 4. Wipe old data
const { error: delErr } = await supabase.from("ops_staged_tickets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
if (delErr) throw new Error("Failed to delete old data: " + delErr.message);

// 5. Insert new data in chunks of 500
const chunkSize = 500;
for (let i = 0; i < processed.length; i += chunkSize) {
  const chunk = processed.slice(i, i + chunkSize);
  const { error: insErr } = await supabase.from("ops_staged_tickets").insert(chunk);
  if (insErr) throw new Error("Failed to insert tickets: " + insErr.message);
}

// 6. Return success
return { success: true, count: processed.length };'
      ) ON CONFLICT (key) DO NOTHING;
    
  });
  
  if (sqlError) {
    console.error("SQL Error:", sqlError);
  } else {
    console.log("Table created and seeded.");
  }
}

run();
