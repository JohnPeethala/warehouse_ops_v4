const fs = require('fs');
let data = fs.readFileSync('src/app/schedule/page.tsx', 'utf8');

if (!data.includes('DateSelector')) {
  data = data.replace('import { ScheduleSkeleton } from "./_components/ScheduleSkeleton";', 'import { ScheduleSkeleton } from "./_components/ScheduleSkeleton";\nimport { DateSelector } from "./_components/DateSelector";');
}

// Update component signature to accept searchParams
const oldSignature = /export default function SchedulePage\(\) {/;
const newSignature = `export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const dateParam = typeof params.date === 'string' ? params.date : undefined;`;

data = data.replace(oldSignature, newSignature);

// Pass date to ScheduleData
data = data.replace('<ScheduleData />', '<ScheduleData date={dateParam} />');

// Insert DateSelector in header
data = data.replace(/<div className="flex items-center gap-2" id="schedule-header-actions">\s*<\/div>/, '<div className="flex items-center gap-2" id="schedule-header-actions">\n          <DateSelector />\n        </div>');

fs.writeFileSync('src/app/schedule/page.tsx', data);
