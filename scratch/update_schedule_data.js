const fs = require('fs');
let data = fs.readFileSync('src/app/schedule/_components/ScheduleData.tsx', 'utf8');

// Update signature
const oldSignature = /export async function ScheduleData\(\) {/;
const newSignature = `export async function ScheduleData({ date }: { date?: string }) {
  // Use provided date or default to today's local date (YYYY-MM-DD)
  const targetDate = date || new Date().toLocaleDateString('en-CA'); // 'en-CA' outputs YYYY-MM-DD
`;

data = data.replace(oldSignature, newSignature);

// Update query
const oldQuery = /supabase\s*\n\s*\.from\("ops_dispatch_log"\)\s*\n\s*\.select/;
const newQuery = `supabase
      .from("ops_dispatch_log")
      .select`;
data = data.replace(oldQuery, newQuery);

const oldOrder = /\.order\("scheduled_date", \{ ascending: false \}\)\s*\n\s*\.order\("created_at", \{ ascending: false \}\)/;
const newOrder = `.eq("scheduled_date", targetDate)
      .order("scheduled_date", { ascending: false })
      .order("created_at", { ascending: false })`;
data = data.replace(oldOrder, newOrder);

fs.writeFileSync('src/app/schedule/_components/ScheduleData.tsx', data);
