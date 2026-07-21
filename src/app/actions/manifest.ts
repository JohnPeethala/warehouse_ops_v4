"use server";

import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";

const FILTER_WRAPUP_STATUS = true;

// Format Phone to +91 xxxxx xxxxx
const formatPhone = (phoneStr: string) => {
  const digits = phoneStr.replace(/\D/g, "");
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
  }
  return phoneStr;
};

// Convert Ticket Age string (e.g., "1w 1d" or "2d 21h") into total days (integer)
const parseTicketAge = (ageStr: string) => {
  if (!ageStr) return 0;
  const str = ageStr.toLowerCase().trim();
  let days = 0;
  
  // Try to match "1w 1d" or "2d 21h" formats
  const parts = str.split(/\s+/);
  for (const part of parts) {
    const val = parseInt(part);
    if (isNaN(val)) continue;
    if (part.includes("w")) days += val * 7;
    else if (part.includes("d")) days += val;
    // Hours (h) or minutes (m) are ignored for days calculation
  }
  return days;
};

// Format name to Title Case
const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
};

// Extract just the date and format to YYYY-MM-DD for standard Postgres ingestion
const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const s = dateStr.trim();
  
  // If it's literally "-", pass it through as is
  if (s === "-") return "-";
  
  // Return empty if it's empty string
  if (s === "") return "";
  
  // 1. Handle "DD-MM-YYYY" (e.g. "05-12-2026")
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }
  
  // 2. Fallback for things like "31 May 2026 05:30 AM"
  const parts = s.split(/\s+/);
  if (parts.length >= 3) {
    const d = new Date(`${parts[0]} ${parts[1]} ${parts[2]}`);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  // If we can't parse it reliably, return empty so it falls back to today
  return "";
};

export async function processAndUploadManifest(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];

    // First 4 rows are report metadata — row at index 4 (5th line) is the header
    const allRows = XLSX.utils.sheet_to_json(ws, { range: 4, defval: "" });

    // Filter rows
    const rows = (allRows as Record<string, unknown>[]).filter((r) => {
      // 1. Drop blank Ticket IDs
      const tid = r["Ticket Id"];
      if (tid === undefined || tid === null || String(tid).trim() === "") {
        return false;
      }

      // 2. Drop "wrapup" status if the switch is on
      if (FILTER_WRAPUP_STATUS) {
        const status = String(r["Status (Ticket)"] || "").toLowerCase();
        if (status.includes("wrapup")) {
          return false;
        }
      }

      return true;
    });

    const supabase = await createClient();
    
    // Create a new batch
    const { data: batch, error: batchError } = await supabase
      .from("ops_manifest_batches")
      .insert({ ticket_count: rows.length })
      .select("id")
      .single();

    if (batchError || !batch) {
      console.error("Batch Error:", batchError);
      return { success: false, error: `Failed to create manifest batch: ${batchError?.message || 'Unknown error'}` };
    }

    const batchId = batch.id;

    // Map raw columns to final schema
    const processed = rows.map((row) => {
      const address1 = (row["Address 1"] as string) || "";
      const address2 = (row["Address 2"] as string) || "";
      const combinedAddress = [address1, address2].filter(Boolean).join(", ");
      
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

      const deliveryDate = formatDate(String(row["Delivery Scheduled Date"] || ""));
      const pickupDate = formatDate(String(row["Pickup Scheduled On"] || ""));
      const scheduledDate = formatDate(String(row["Scheduled Date"] || ""));

      let finalDate = "";
      if (category === "Delivery") {
        finalDate = deliveryDate;
      } else if (category === "Pickup") {
        finalDate = pickupDate;
      } else {
        finalDate = scheduledDate;
      }
      
      return {
        ticket_id: String(row["Ticket Id"] || ""),
        date: (finalDate && finalDate !== "-") ? finalDate : "1970-01-01",
        batch_id: batchId,
        contact_name: toTitleCase(String(row["Contact name"] || "")),
        phone: formatPhone(String(row["Phone (Contact)"] || "")),
        address1: combinedAddress,
        pincode: String(row["Pincode"] || ""),
        category: category,
        sub_category: subCategory,
        ticket_age: parseTicketAge(String(row["Ticket Age"] || "")),
        raw_tags: String(row["Tags"] || ""),
      };
    });

    // 1. Delete old staged tickets to keep only current active manifest (optional, but typical for v3)
    const { error: deleteError } = await supabase
      .from("ops_staged_tickets")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Just to delete everything

    if (deleteError) {
      console.error("Delete Error:", deleteError);
      return { success: false, error: `Failed to clear old staged data: ${deleteError.message || JSON.stringify(deleteError)}` };
    }

    // 2. Insert new rows in chunks of 500
    const chunkSize = 500;
    for (let i = 0; i < processed.length; i += chunkSize) {
      const chunk = processed.slice(i, i + chunkSize);
      const { error: insertError } = await supabase
        .from("ops_staged_tickets")
        .insert(chunk);

      if (insertError) {
        console.error("Insert Error:", insertError);
        return { success: false, error: `Failed to insert staged tickets: ${insertError.message || JSON.stringify(insertError)}` };
      }
    }

    return { success: true, count: processed.length };
  } catch (error: unknown) {
    console.error("Manifest Upload Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}
