const fs = require('fs');
let data = fs.readFileSync('src/app/schedule/_components/DateSelector.tsx', 'utf8');

// 1. Add import
if (!data.includes('@/lib/supabase/client')) {
  data = data.replace('import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";', 'import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\nimport { createClient } from "@/lib/supabase/client";\nimport { useEffect } from "react";');
}

// 2. Add state and effect for fetching counts
const stateRegex = /const year = currentMonth.getFullYear\(\);/;
const fetchLogic = `  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  useEffect(() => {
    async function fetchCounts() {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
      const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
      
      setIsLoadingCounts(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ops_dispatch_log')
        .select('scheduled_date')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate);
        
      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach(row => {
          if (row.scheduled_date) {
            counts[row.scheduled_date] = (counts[row.scheduled_date] || 0) + 1;
          }
        });
        setTicketCounts(counts);
      }
      setIsLoadingCounts(false);
    }
    
    if (open) {
      fetchCounts();
    }
  }, [currentMonth, open]);

  const year = currentMonth.getFullYear();`;

data = data.replace(stateRegex, fetchLogic);

// 3. Render count badge under the date
const renderRegex = /<button[\s\S]*?>[\s\S]*?\{d\}\n\s*<\/button>/g;
const newRender = `<button
                  key={d}
                  onClick={(e) => { e.preventDefault(); selectDate(dateStr); }}
                  className={\`relative aspect-square flex flex-col items-center justify-center text-sm rounded-md transition-all \${
                    isSelected 
                      ? 'bg-primary text-primary-foreground font-bold shadow-md' 
                      : 'hover:bg-muted text-foreground font-medium'
                  }\`}
                >
                  <span>{d}</span>
                  {ticketCounts[dateStr] > 0 && (
                    <div className={\`absolute -bottom-1 -right-1 text-[9px] px-1 rounded-sm leading-tight \${isSelected ? 'bg-primary-foreground text-primary font-bold shadow-sm' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'}\`}>
                      {ticketCounts[dateStr]}
                    </div>
                  )}
                </button>`;
data = data.replace(renderRegex, newRender);

fs.writeFileSync('src/app/schedule/_components/DateSelector.tsx', data);
