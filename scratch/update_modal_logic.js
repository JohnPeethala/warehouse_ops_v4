const fs = require('fs');
let data = fs.readFileSync('src/app/schedule/_components/ScheduleTable.tsx', 'utf8');

// 1. Add import for entities actions
if (!data.includes('createVehicle')) {
  data = data.replace('import { ExcelColumnFilter } from "@/components/ui/ExcelColumnFilter";', 'import { ExcelColumnFilter } from "@/components/ui/ExcelColumnFilter";\nimport { createVehicle, createProfile } from "@/app/actions/entities";\nimport { toast } from "sonner";');
}

// 2. Add local state for options
const propRegex = /export function ScheduleTable\({[\s\S]*?}\) {/s;
const hookStartRegex = /  const \[optimisticSessions, setOptimisticSessions\] = useState/;

// Wait, I can just replace `  const [createEntityModal` to add local state arrays.
const modalRegex = /  const \[createEntityModal, setCreateEntityModal\] = useState.*?handleCreateEntity = async \(\) => {[\s\S]*?};/s;

const newModalLogic = `  // Local state to hold dynamically created entities without full page refresh
  const [localVehicles, setLocalVehicles] = useState(vehicles);
  const [localProfiles, setLocalProfiles] = useState(profiles);

  useEffect(() => { setLocalVehicles(vehicles); }, [vehicles]);
  useEffect(() => { setLocalProfiles(profiles); }, [profiles]);

  const driverProfiles = localProfiles.filter(p => p.role === "driver" || p.role === "ground");
  const gtProfiles = localProfiles.filter(p => p.role === "ground" || p.role === "supervisor");

  const [createEntityModal, setCreateEntityModal] = useState<{ type: 'vehicle' | 'gt', search: string } | null>(null);
  const [newVehicleNo, setNewVehicleNo] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newGtName, setNewGtName] = useState("");
  
  const handleCreateEntity = async () => {
    if (createEntityModal?.type === 'vehicle' && newVehicleNo.trim()) {
      const res = await createVehicle(newVehicleNo, newDriverName);
      if (res.success && res.vehicle) {
        setLocalVehicles(prev => [...prev, res.vehicle]);
        toast.success("Vehicle created");
      } else {
        toast.error(res.error || "Failed to create vehicle");
      }
      setCreateEntityModal(null);
    } else if (createEntityModal?.type === 'gt' && newGtName.trim()) {
      const res = await createProfile(newGtName, 'ground');
      if (res.success && res.profile) {
        setLocalProfiles(prev => [...prev, res.profile]);
        toast.success("GT Profile created");
      } else {
        toast.error(res.error || "Failed to create GT");
      }
      setCreateEntityModal(null);
    }
  };`;

data = data.replace(modalRegex, newModalLogic);

// We need to remove the previous driverProfiles and gtProfiles declarations since we moved them down.
data = data.replace(/  const driverProfiles = profiles.filter\(p => p.role === "driver" \|\| p.role === "ground"\);\n/g, "");
data = data.replace(/  const gtProfiles = profiles.filter\(p => p.role === "ground" \|\| p.role === "supervisor"\);\n/g, "");

// We also need to change `vehicles` to `localVehicles` in the render loop.
data = data.replace(/vehicles\.find/g, "localVehicles.find");
data = data.replace(/vehicles\.map/g, "localVehicles.map");

fs.writeFileSync('src/app/schedule/_components/ScheduleTable.tsx', data);
