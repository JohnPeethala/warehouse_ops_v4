const fs = require('fs');
let data = fs.readFileSync('src/app/schedule/_components/ScheduleTable.tsx', 'utf8');

const groupRowRegex = /<tr className="bg-muted\/40 border-b border-border shadow-\[0_1px_2px_rgba\(0,0,0,0\.05\)\]">([\s\S]*?)<\/tr>/;

const newGroupRow = `<tr className="bg-accent/30 dark:bg-accent/20 border-y border-border/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] relative z-10">
                      <td colSpan={13} className="px-3 py-2 align-middle">
                        <div className="flex items-center justify-between min-h-[36px]">
                          <div className="flex items-center gap-4">
                            {isUnassigned ? (
                              <div className="flex items-center gap-3 px-1">
                                <span className="font-bold text-muted-foreground uppercase text-xs tracking-widest bg-muted/50 px-3 py-1 rounded-md border border-border/50">Unassigned Queue</span>
                                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  {group.tickets.length} TICKETS
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-background border border-border shadow-sm px-2 py-1 rounded-md">
                                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Route</span>
                                  <div className="bg-primary text-primary-foreground font-black w-6 h-6 rounded text-sm flex items-center justify-center shadow-sm">
                                    {group.route}
                                  </div>
                                </div>
                                <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                                  {group.tickets.length} TICKETS
                                </span>
                              </div>
                            )}
                          </div>

                          {!isUnassigned && (
                            <div className="flex items-center gap-4 bg-background/50 border border-border/50 p-1 rounded-lg shadow-sm">
                              <div className="flex items-center gap-2 pl-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle/Driver</span>
                                <EntityDropdown
                                  value={routeSession.vehicle_id}
                                  onChange={(val) => {
                                    const selectedVehicle = vehicles.find(v => v.id === val);
                                    const updates = { vehicle_id: val || null };
                                    if (selectedVehicle?.default_driver_id) {
                                      updates.driver_id = selectedVehicle.default_driver_id;
                                    } else if (!val) {
                                      updates.driver_id = null;
                                    }
                                    onUpdateRouteSession(group.route, tripDate, updates);
                                  }}
                                  options={vehicleDriverOptions}
                                  placeholder="Select..."
                                />
                              </div>
                              <div className="w-px h-5 bg-border/60"></div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GT1</span>
                                <EntityDropdown
                                  value={routeSession.gt1_id}
                                  onChange={(val) => onUpdateRouteSession(group.route, tripDate, { gt1_id: val || null })}
                                  options={gtProfiles.map(p => ({ id: p.id, label: p.name }))}
                                  placeholder="Select..."
                                />
                              </div>
                              <div className="w-px h-5 bg-border/60"></div>
                              <div className="flex items-center gap-2 pr-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GT2</span>
                                <EntityDropdown
                                  value={routeSession.gt2_id}
                                  onChange={(val) => onUpdateRouteSession(group.route, tripDate, { gt2_id: val || null })}
                                  options={gtProfiles.map(p => ({ id: p.id, label: p.name }))}
                                  placeholder="Select..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>`;

data = data.replace(groupRowRegex, newGroupRow);
fs.writeFileSync('src/app/schedule/_components/ScheduleTable.tsx', data);
