const fs = require('fs');
let data = fs.readFileSync('src/app/schedule/_components/ScheduleCells.tsx', 'utf8');

// Replace EntityDropdown
const oldEntityDropdownRegex = /\/\/ --- Entity Dropdown.*?(?=\n\n|$)/s;
const newEntityDropdown = `// --- Entity Dropdown (for Route Header) ---
export const EntityDropdown = ({
  value,
  onChange,
  options,
  placeholder
}: {
  value: string;
  onChange: (val: string) => void;
  options: { id: string, label: string }[];
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.id === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={\`flex items-center justify-between w-full max-w-[200px] min-w-[140px] h-8 bg-background hover:bg-muted/50 border transition-all rounded-sm px-2 text-left outline-none shadow-sm \${open ? 'border-primary ring-1 ring-primary/20' : 'border-border'}\`}>
          <span className={\`text-xs truncate font-medium \${!selectedLabel && 'text-muted-foreground'}\`}>
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0 shadow-md rounded-md border border-border" align="start">
        <Command>
          <CommandInput placeholder="Search..." className="text-xs h-8 border-none focus:ring-0" />
          <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
            <CommandEmpty className="py-4 text-xs text-center text-muted-foreground">No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs py-1.5 px-2 cursor-pointer text-muted-foreground"
              >
                Clear selection
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className="text-xs py-1.5 px-2 cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};`;

data = data.replace(oldEntityDropdownRegex, newEntityDropdown);

data = data.replace('import { Link as LinkIcon, AlertCircle, Edit2 } from "lucide-react";', 'import { Link as LinkIcon, AlertCircle, Edit2, ChevronDown, Check } from "lucide-react";\nimport { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\nimport { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";');

fs.writeFileSync('src/app/schedule/_components/ScheduleCells.tsx', data);
