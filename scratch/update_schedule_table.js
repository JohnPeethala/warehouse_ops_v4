const fs = require('fs');
let data = fs.readFileSync('src/app/schedule/_components/ScheduleTable.tsx', 'utf8');

// 1. Add usedGtIds calculation
const logicReplacement = `  const statusOptions = lookups.filter(l => l.domain === "TICKET_STATUS" || l.domain === "TICKET");
  const driverProfiles = profiles.filter(p => p.role === "driver" || p.role === "ground");
  const gtProfiles = profiles.filter(p => p.role === "ground" || p.role === "supervisor");
  const allTicketIds = groupedData.flatMap(g => g.tickets.map(t => t.id));

  // Calculate used GTs for filtering
  const usedGtIds = new Set<string>();
  groupedData.forEach(g => {
    const tripDate = g.tickets[0]?.scheduled_date;
    const rs = optimisticSessions[g.route] || g.tickets[0]?.ops_route_sessions;
    if (rs) {
      if (rs.gt1_id) usedGtIds.add(rs.gt1_id);
      if (rs.gt2_id) usedGtIds.add(rs.gt2_id);
    }
  });

  const [createEntityModal, setCreateEntityModal] = useState<{ type: 'vehicle' | 'gt', search: string } | null>(null);
  const [newVehicleNo, setNewVehicleNo] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newGtName, setNewGtName] = useState("");
  
  const handleCreateEntity = async () => {
    if (createEntityModal?.type === 'vehicle' && newVehicleNo.trim()) {
      // Create vehicle
      setCreateEntityModal(null);
    } else if (createEntityModal?.type === 'gt' && newGtName.trim()) {
      // Create GT
      setCreateEntityModal(null);
    }
  };`;

data = data.replace(/  const statusOptions = lookups.filter[^;]*;\n.*const allTicketIds = [^\n]*;/s, logicReplacement);

// 2. Update Row Layout and pass filtering logic
const oldRowRegex = /<div className="flex items-center gap-4 bg-background\/50 border border-border\/50 p-1 rounded-lg shadow-sm">.*?<\/div>\s*<\/div>\s*<\/div>\s*<\/td>\s*<\/tr>/s;

const newRowLayout = `<div className="flex items-center gap-4 bg-background/50 border border-border/50 p-1 rounded-lg shadow-sm">
                              <div className="flex items-center gap-2 pl-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle</span>
                                <EntityDropdown
                                  value={routeSession.vehicle_id}
                                  onChange={(val) => {
                                    const selectedVehicle = vehicles.find(v => v.id === val);
                                    const updates: Record<string, string | null> = { vehicle_id: val || null };
                                    if (selectedVehicle?.driver_name) {
                                      updates.driver_name = selectedVehicle.driver_name;
                                    } else if (!val) {
                                      updates.driver_name = null;
                                    }
                                    onUpdateRouteSession(group.route, tripDate, updates);
                                  }}
                                  options={vehicles.map(v => ({ id: v.id, label: v.vehicle_no }))}
                                  placeholder="Select..."
                                  onCreateNew={(search) => {
                                    setNewVehicleNo(search);
                                    setNewDriverName("");
                                    setCreateEntityModal({ type: 'vehicle', search });
                                  }}
                                  createNewText="Create New Vehicle..."
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Driver</span>
                                <div className="w-24 h-8">
                                  <input 
                                    className="w-full h-full bg-background border border-border rounded-sm text-xs px-2 shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                                    placeholder="Driver name"
                                    defaultValue={routeSession.driver_name || ""}
                                    onBlur={(e) => {
                                      const val = e.target.value;
                                      if (val !== (routeSession.driver_name || "")) {
                                        onUpdateRouteSession(group.route, tripDate, { driver_name: val || null });
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') e.currentTarget.blur();
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="w-px h-5 bg-border/60"></div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GT1</span>
                                <EntityDropdown
                                  value={routeSession.gt1_id}
                                  onChange={(val) => onUpdateRouteSession(group.route, tripDate, { gt1_id: val || null })}
                                  options={gtProfiles
                                    .filter(p => !usedGtIds.has(p.id) || p.id === routeSession.gt1_id)
                                    .map(p => ({ id: p.id, label: p.name }))
                                  }
                                  placeholder="Select..."
                                  onCreateNew={(search) => {
                                    setNewGtName(search);
                                    setCreateEntityModal({ type: 'gt', search });
                                  }}
                                  createNewText="Create New GT..."
                                />
                              </div>
                              <div className="w-px h-5 bg-border/60"></div>
                              <div className="flex items-center gap-2 pr-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GT2</span>
                                <EntityDropdown
                                  value={routeSession.gt2_id}
                                  onChange={(val) => onUpdateRouteSession(group.route, tripDate, { gt2_id: val || null })}
                                  options={gtProfiles
                                    .filter(p => !usedGtIds.has(p.id) || p.id === routeSession.gt2_id)
                                    .map(p => ({ id: p.id, label: p.name }))
                                  }
                                  placeholder="Select..."
                                  onCreateNew={(search) => {
                                    setNewGtName(search);
                                    setCreateEntityModal({ type: 'gt', search });
                                  }}
                                  createNewText="Create New GT..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>`;
data = data.replace(oldRowRegex, newRowLayout);

// 3. Add Modal to the bottom
const modalHtml = `      </div>

      {createEntityModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-lg rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border font-bold">
              {createEntityModal.type === 'vehicle' ? 'Create New Vehicle' : 'Create New Ground Team (GT)'}
            </div>
            <div className="p-4 space-y-4">
              {createEntityModal.type === 'vehicle' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Vehicle No.</label>
                    <input 
                      value={newVehicleNo} 
                      onChange={e => setNewVehicleNo(e.target.value.toUpperCase())}
                      className="w-full h-9 bg-background border border-border rounded-md px-3 text-sm focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Default Driver Name</label>
                    <input 
                      value={newDriverName} 
                      onChange={e => setNewDriverName(e.target.value)}
                      className="w-full h-9 bg-background border border-border rounded-md px-3 text-sm focus:border-primary outline-none"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
                  <input 
                    value={newGtName} 
                    onChange={e => setNewGtName(e.target.value)}
                    className="w-full h-9 bg-background border border-border rounded-md px-3 text-sm focus:border-primary outline-none"
                  />
                </div>
              )}
            </div>
            <div className="p-4 bg-muted/30 flex justify-end gap-2 border-t border-border">
              <button 
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                onClick={() => setCreateEntityModal(null)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 transition-colors"
                onClick={handleCreateEntity}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

data = data.replace(/      <\/div>\s*<\/div>\s*\);\s*}\s*$/s, modalHtml);

fs.writeFileSync('src/app/schedule/_components/ScheduleTable.tsx', data);
