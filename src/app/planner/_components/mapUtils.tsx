import React from 'react';
import { renderToStaticMarkup } from "react-dom/server";
import * as LucideIcons from "lucide-react";
import { Category, LocationGroup } from "./RoutePlannerContext";

function getIconForCategory(categoryName: string, categories: Category[]) {
  const match = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
  if (match) {
    const icons = LucideIcons as Record<string, React.FC<any>>;
    let IconComponent = icons[match.icon_name];
    
    if (!IconComponent) {
      const key = Object.keys(icons).find(k => k.toLowerCase() === match.icon_name.toLowerCase());
      if (key) IconComponent = icons[key];
    }
    
    return { Icon: IconComponent || LucideIcons.HelpCircle, color: match.color };
  }
  return { Icon: LucideIcons.HelpCircle, color: "#9ca3af" };
}

export function generateBarPinSVG(group: LocationGroup, pinColor: string, isAssigned: boolean, categories: Category[], isSelected: boolean = false) {
  const typeSummary: Record<string, number> = {};
  group.tickets?.forEach((t) => {
    const k = (t.sub_category || 'general').toLowerCase().trim();
    typeSummary[k] = (typeSummary[k] || 0) + 1;
  });

  const types = Object.keys(typeSummary);
  const serialText = String(group.serial || '0');
  
  const textColor = isAssigned ? '#ffffff' : '#4b5563';
  const dividerColor = isAssigned ? '#ffffff40' : '#e5e7eb';
  const bgColor = isAssigned ? pinColor : '#ffffff';
  
  let svgContent = '';
  let currentX = 6;
  
  types.forEach(t => {
    const count = typeSummary[t];
    const { Icon, color: hex } = getIconForCategory(t, categories);
    
    if (types.indexOf(t) > 0) {
      svgContent += `<line x1="${currentX}" y1="5" x2="${currentX}" y2="19" stroke="${dividerColor}" stroke-width="1.5" />`;
      currentX += 8;
    }

    if (Icon) {
      const iconMarkup = renderToStaticMarkup(<Icon size={12} color={isAssigned ? '#ffffff' : hex} strokeWidth={2.5} />);
      svgContent += `<g transform="translate(${currentX}, 6)">${iconMarkup}</g>`;
      currentX += 16;
    } else {
      const short = t.charAt(0).toUpperCase();
      svgContent += `<circle cx="${currentX + 6}" cy="12" r="6" fill="${isAssigned ? '#ffffff30' : hex}" />`;
      svgContent += `<text x="${currentX + 6}" y="15.5" font-family="sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">${short}</text>`;
      currentX += 16;
    }
    
    const countText = String(count);
    svgContent += `<text x="${currentX}" y="15.5" font-family="sans-serif" font-size="11" font-weight="bold" fill="${textColor}">${countText}</text>`;
    currentX += (countText.length * 7) + 6;
  });

  const boxWidth = Math.max(currentX + 2, 24);
  const boxHeight = 24;
  
  const badgeWidth = Math.max(16, serialText.length * 7 + 8);
  const badgeHeight = 16;
  
  const topPadding = 4;
  const totalWidth = boxWidth + (badgeWidth / 2) + 8; // Added some width for selection ring
  const totalHeight = topPadding + (badgeHeight / 2) + boxHeight + 8; // Added some height for selection ring

  const svg = `
    <svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.1"/>
        </filter>
      </defs>
      
      <g transform="translate(4, ${topPadding + badgeHeight / 2})">
        ${isSelected ? `<rect x="-3" y="-3" width="${boxWidth + 6}" height="${boxHeight + 6}" rx="7" fill="none" stroke="#3b82f6" stroke-width="3" stroke-opacity="0.9" />` : ''}
        <rect x="0" y="0" width="${boxWidth}" height="${boxHeight}" rx="4" fill="${bgColor}" stroke="${pinColor}" stroke-width="2" filter="url(#shadow)"/>
        <polygon points="${boxWidth / 2 - 5},${boxHeight - 1} ${boxWidth / 2 + 5},${boxHeight - 1} ${boxWidth / 2},${boxHeight + 5}" fill="${pinColor}" />
        ${svgContent}
      </g>
      
      <g transform="translate(${boxWidth - (badgeWidth / 2) + 2}, ${topPadding})">
        <rect x="0" y="0" width="${badgeWidth}" height="${badgeHeight}" rx="${badgeHeight / 2}" fill="#1f2937" stroke="#ffffff" stroke-width="2" />
        <text x="${badgeWidth / 2}" y="11.5" font-family="sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">${serialText}</text>
      </g>
    </svg>
  `;
  
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`,
    width: totalWidth,
    height: totalHeight,
    anchorX: (boxWidth / 2) + 2,
    anchorY: totalHeight
  };
}
