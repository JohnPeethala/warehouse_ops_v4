// src/lib/manifestRules.ts

/**
 * Define which tickets should be completely ignored during upload.
 * Return true to KEEP the ticket, return false to DROP it.
 */
export function shouldKeepTicket(row: Record<string, unknown>): boolean {
  // 1. Drop blank Ticket IDs
  const tid = row["Ticket Id"];
  if (tid === undefined || tid === null || String(tid).trim() === "") {
    return false;
  }

  // 2. Drop "wrapup" and "done" statuses
  const status = String(row["Status (Ticket)"] || "").toLowerCase();
  if (status.includes("wrapup") || status.includes("done")) {
    return false;
  }

  return true;
}

/**
 * Define how raw Excel row data maps to Category and Sub-category.
 */
export function mapCategory(row: Record<string, unknown>): { category: string, subCategory: string } {
  const subCategoryStr = String(row["Sub Category"] || "").toLowerCase();
  let subCategory = String(row["Sub Category"] || "");
  let category = "Others";

  if (subCategoryStr.includes("new") && subCategoryStr.includes("rental")) {
    category = "Delivery";
    subCategory = "Delivery";
  } else if (subCategoryStr.includes("pickup")) {
    category = "Pickup";
    subCategory = "Pickup";
  } else if (subCategoryStr.includes("install")) {
    category = "Service";
    subCategory = "Installation";
  } else if (subCategoryStr.includes("repair")) {
    category = "Service";
    subCategory = "Repair";
  } else if (subCategoryStr.includes("replace")) {
    category = "Service";
    subCategory = "Replace";
  } else if (subCategoryStr.includes("relocat")) {
    category = "Service";
    subCategory = "Relocation";
  }

  return { category, subCategory };
}

/**
 * Determine the correct date column to use based on the mapped category.
 * Returns the raw string value from the Excel cell (before formatting).
 */
export function extractTargetDate(row: Record<string, unknown>, category: string): string {
  const deliveryDate = String(row["Delivery Scheduled Date"] || "");
  const pickupDate = String(row["Pickup Scheduled On"] || "");
  const scheduledDate = String(row["Scheduled Date"] || "");

  if (category === "Delivery") {
    return deliveryDate;
  } else if (category === "Pickup") {
    return pickupDate;
  } else {
    return scheduledDate;
  }
}
