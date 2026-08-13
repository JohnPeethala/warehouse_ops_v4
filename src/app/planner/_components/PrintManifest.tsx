"use client";
import React from 'react';
import { format, parseISO } from 'date-fns';
import { useRoutePlanner } from "./RoutePlannerContext";

export function PrintManifest() {
  const context = useRoutePlanner();
  
  // Guard against context being undefined
  if (!context) return null;

  const { groups, routes, ticketRoutes, city, date } = context;
  
  // Format the date to dd/mm/yy
  let displayDate = 'Not Selected';
  if (date) {
    try {
      displayDate = format(parseISO(date), 'dd/MM/yy');
    } catch (e) {
      displayDate = date; // fallback
    }
  }

  // Group tickets by route
  const routeToTickets: Record<string, { group: any, ticket: any }[]> = {};
  routes.forEach(v => routeToTickets[v] = []);
  routeToTickets['UNASSIGNED'] = [];

  groups.forEach(group => {
    group.tickets.forEach(ticket => {
      const v = ticketRoutes[`${group.id}::${ticket.id}`];
      if (v && routeToTickets[v]) {
        routeToTickets[v].push({ group, ticket });
      } else {
        routeToTickets['UNASSIGNED'].push({ group, ticket });
      }
    });
  });

  // Only show routes that have tickets, plus UNASSIGNED if it has tickets
  const activeRoutes = routes.filter(v => routeToTickets[v].length > 0);
  if (routeToTickets['UNASSIGNED'].length > 0) activeRoutes.push('UNASSIGNED');

  return (
    <div className="hidden print:block bg-white text-black font-sans w-full print:max-w-none print:p-6 print:m-0 mx-auto z-50">
      {/* Print Page Header */}
      <div className="flex justify-between items-end border-b border-black pb-2 mb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-black">Route Dispatch Manifest</h1>
          <p className="text-sm font-bold text-gray-600">{city || 'All Cities'}</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-none">Schedule Date</div>
          <div className="text-lg font-black text-black mt-1 leading-none">{displayDate}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        {activeRoutes.map(route => {
          const assignments = routeToTickets[route];
          return (
            <div key={route} className="border border-black p-3 bg-white text-black flex flex-col w-full min-w-0">
              {/* Card Header */}
              <div className="flex justify-between items-center mb-2">
                <div className="text-3xl font-black text-black leading-none truncate max-w-[70%]">{route}</div>
                <div className="border border-black px-2 py-1 font-bold text-xs uppercase tracking-wider text-black flex-shrink-0">
                  TOTAL TICKETS: {assignments.length}
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left text-[11px] border-collapse table-fixed">
                <thead>
                  <tr className="border-t border-b border-black">
                    <th className="py-1.5 px-1 font-black uppercase text-black w-6 text-center">#</th>
                    <th className="py-1.5 px-1 font-black uppercase text-black w-20">ID</th>
                    <th className="py-1.5 px-1 font-black uppercase text-black w-[140px]">CUSTOMER</th>
                    <th className="py-1.5 px-1 font-black uppercase text-black">AREA / LOC</th>
                    <th className="py-1.5 px-1 font-black uppercase text-black w-14 text-center">PIN</th>
                    <th className="py-1.5 px-1 font-black uppercase text-black w-16 text-right">TYPE</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(({ group, ticket }, idx) => {
                    return (
                      <tr key={idx} className="border-b border-gray-300 last:border-0 page-break-inside-avoid">
                        <td className="py-1 px-1 font-bold text-black text-center">{idx + 1}</td>
                        <td className="py-1 px-1 font-bold text-black truncate">{ticket.ticket_id}</td>
                        <td className="py-1 px-1 font-bold text-black">
                          <div className="truncate w-full uppercase" title={ticket.name}>
                            {ticket.name}
                          </div>
                        </td>
                        <td className="py-1 px-1 text-black uppercase">
                          <div className="truncate w-full" title={group.originalArea}>
                            {group.originalArea}
                          </div>
                        </td>
                        <td className="py-1 px-1 text-black text-center">{group.pincode}</td>
                        <td className="py-1 px-1 font-bold text-black text-right uppercase truncate">
                          {ticket.sub_category}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {activeRoutes.length === 0 && (
        <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest">
          No tickets available to print for this date.
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; }
          /* Ensure backgrounds print correctly */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { size: landscape; margin: 5mm; }
          .page-break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
        }
      `}} />
    </div>
  );
}
