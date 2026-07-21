import * as LucideIcons from "lucide-react";
import { SubCategoryConfig } from "@/components/providers/SubCategoryProvider";
import { LucideIcon } from "lucide-react";

export const getCategoryDetails = (
  subCategory: string | null | undefined,
  config: SubCategoryConfig[]
): { Icon: LucideIcon; color: string } => {
  if (!subCategory) {
    return { Icon: LucideIcons.FileQuestion, color: "#9ca3af" }; // gray-400
  }
  
  // Backwards compatibility for old manifest uploads
  let normalized = subCategory.toLowerCase();
  if (normalized.includes("new - rental") || normalized.includes("new rental")) normalized = "delivery";
  if (normalized.includes("pickup and refund")) normalized = "pickup";
  if (normalized.includes("install")) normalized = "installation";
  if (normalized.includes("repair")) normalized = "repair";
  if (normalized.includes("replace")) normalized = "replace";
  if (normalized.includes("relocat")) normalized = "relocation";

  // Find matching config ignoring case
  const match = config.find((c) => c.name.toLowerCase() === normalized);
  if (match) {
    const icons = LucideIcons as Record<string, LucideIcon>;
    let IconComponent = icons[match.icon_name];
    
    // If exact match fails, try case-insensitive lookup
    if (!IconComponent) {
      const key = Object.keys(icons).find(k => k.toLowerCase() === match.icon_name.toLowerCase());
      if (key) IconComponent = icons[key];
    }
    
    IconComponent = IconComponent || LucideIcons.FileQuestion;
    return { Icon: IconComponent, color: match.color };
  }

  // Fallback
  return { Icon: LucideIcons.FileQuestion, color: "#9ca3af" };
};
