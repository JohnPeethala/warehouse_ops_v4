
***

# 🗄️ Database Architecture — Warehouse OPs v4

## 1. Core Philosophy & Architecture
The v4 database transitions from a flat "storage bucket" to a rigid, 3-tier **Enterprise Data Platform**. It is designed to achieve three goals:
1. **Absolute Data Integrity:** Impossible to assign tickets to deleted users; impossible to have orphaned annotations.
2. **Infinite Scalability:** The operations team reading/writing live tickets will never be slowed down by the dashboard calculating 90-day analytics.
3. **Self-Healing Analytics:** If a supervisor updates a ticket from 3 days ago, the historical charts automatically correct themselves in real-time.

### Naming Conventions (Bounded Contexts)
To keep the schema organized, all tables use strict prefixes:
*   `core_` — Master data (Users, Vehicles). Rarely changes.
*   `cfg_` — System configuration & unified lookups.
*   `ops_` — High-volume daily operational data (Manifests, Dispatch, Routes).
*   `log_` — Immutable, append-only history and audit trails.
*   `fact_` — Pre-calculated, self-healing analytics for the dashboard.

---

## 2. Table Schemas by Layer

### Layer 1: Master Data & Configuration
*The foundational entities and rules of the business.*

| Table Name | Description | Key Mechanics & Constraints |
| :--- | :--- | :--- |
| `core_profiles` | All staff (Admins, Supervisors, Ground). | `role` is a strict `ENUM('admin','supervisor','ground')`. Uses `is_active` for soft deletes. Tracks `last_login_at`. |
| `core_vehicles` | The fleet. | Uses `is_active` for soft deletes. |
| `cfg_lookups` | **Unified Dictionary.** Replaces 5 separate status tables. | Uses `domain` ENUM (`'dt_status', 'gt_status', 'ticket_status', 'kra_status'`). Has `is_terminal` flag to trigger completion analytics. |
| `cfg_ticket_categories` | Sub-category metadata. | Tracks `icon_name`, `color`. Partial Unique Index on `name` (`WHERE is_active = true`) to allow safe soft-deletes. |

### Layer 2: Operations (OLTP)
*The fast, transactional layer. Built for constraints and real-time updates.*

| Table Name | Description | Key Mechanics & Constraints |
| :--- | :--- | :--- |
| `ops_manifest_batches` | Tracks Excel uploads. | `id`, `uploaded_by`, `uploaded_at`, `ticket_count`. |
| `ops_staged_tickets` | The raw manifest tickets. | Dates are native `date` type. Tied to `batch_id` via FK. |
| `ops_ticket_annotations` | Supervisor manual edits. | `UNIQUE(ticket_id)`. `ON DELETE CASCADE` ensures if a manifest ticket is deleted, the annotation dies with it. |
| `ops_route_sessions` | **(Formerly `gt_trips`)** Represents 1 Vehicle + 1 Crew + 1 Date. | `UNIQUE(trip_date, vehicle_id)`. Has FKs to `driver_id`, `gt1_id`, `gt2_id`. Holds total `km` driven. |
| `ops_dispatch_log` | Tickets attached to a route. | No longer holds driver/vehicle text. Uses `gt_trip_id` FK. `UNIQUE(ticket_id, scheduled_date)`. |
| `ops_warehouse_duty` | The master roster record for a date. | `duty_date` (PK). Tracks who generated it and when. |
| `ops_duty_crew` | Junction table for the roster. | Links `duty_id` to multiple `profile_id`s. Replaces comma-separated text blobs. |
| `ops_kra_master` | KRA definitions. | Priority is `ENUM`. Soft deletes enabled. |
| `ops_kra_logs` | Daily KRA tracking. | `UNIQUE(kra_id, target_date)`. |

### Layer 3: Audit & History
*Immutable logs tracking "who did what and when."*

| Table Name | Description | Key Mechanics & Constraints |
| :--- | :--- | :--- |
| `log_audit_trail` | The global security camera. | Populated 100% by Postgres Triggers. Tracks `actor_id`, `table_name`, `action`, `old_value`, `new_value`. |
| `log_ticket_lifecycle`| Tracks status transitions. | Trigger writes here when `ops_dispatch_log` statuses change. |

### Layer 4: Analytics (OLAP - Fact Tables)
*Pre-aggregated, lightning-fast tables for dashboard charts. No complex JOINs required.*

| Table Name | Description | Key Mechanics & Constraints |
| :--- | :--- | :--- |
| `fact_dispatch_lifecycle`| Flattened outcomes of completed tickets. | Self-healing via `UNIQUE(dispatch_log_id)` UPSERTs. Holds final statuses, crew IDs, and completion date. |
| `fact_crew_daily_stats` | Daily heatmap data per crew member. | `UNIQUE(profile_id, date)`. Stores `total_assigned`, `total_done`, `success_rate`. Self-heals on late updates. |

---

## 3. How It Works (System Mechanics)

### A. The "Route Session" Fix (Eliminating Update Anomalies)
In v3, if a driver was swapped mid-day, the supervisor had to manually update 20 distinct `dispatch_log` rows. 
**In v4:**
1. The supervisor selects 20 tickets and assigns them to "Route A".
2. The database creates ONE row in `ops_route_sessions` linking Route A to the specific Vehicle, Driver, and Ground Team for that date.
3. All 20 `ops_dispatch_log` tickets simply store that `gt_trip_id`.
4. If the truck breaks down and the vehicle is swapped, the supervisor updates the **single** `ops_route_sessions` row. All 20 tickets instantly reflect the new vehicle. 

### B. Self-Healing Analytics (Solving the "Late Arrival" Problem)
Dashboards need to be fast, which means they should read from pre-calculated `fact_` tables. But what if a GT member forgets to mark a ticket as "Done" on Tuesday, and updates it on Thursday?
**In v4:**
1. We do **not** use scheduled nightly cron jobs to build charts.
2. Instead, a Postgres Trigger watches `ops_dispatch_log`. 
3. When the late update happens on Thursday, the trigger fires an `UPSERT` (Insert on conflict, do update) into `fact_crew_daily_stats` for *Tuesday's* record. 
4. Tuesday's success rate instantly corrects itself. The dashboard is always 100% accurate, with zero manual syncing required.

### C. Safe Deletions (Partial Unique Indexes)
We use `is_active = false` instead of `DELETE` to preserve historical data. However, this creates a unique constraint problem (e.g., you can't have two sub-categories named "Delivery", even if one is deleted).
**In v4:**
We use Postgres Partial Indexes:
```sql
CREATE UNIQUE INDEX idx_active_category_name 
ON cfg_ticket_categories (name) 
WHERE is_active = true;
```
This allows infinite soft-deleted rows with the name "Delivery", but strictly enforces that only **one active** "Delivery" category can exist at a time.

### D. The Unified Lookup Dictionary
Instead of having 5 UI panels in the Settings page to manage Driver Statuses, GT Statuses, etc., v4 uses `cfg_lookups`. 
The frontend only needs one React Component: `<LookupManager domain="dt_status" />`. If the business operations expand next year, adding a new status domain requires zero database schema changes.

---

## 4. Security & RLS (Row Level Security)
Because this is built on Supabase, v4 will enforce security at the database level, not just the Next.js middleware.
*   **Service Role Key:** Will be completely removed from the frontend application.
*   **RLS Policies:** 
    *   `ground` users can only read `ops_route_sessions` where they are explicitly assigned as `gt1_id` or `gt2_id`.
    *   `supervisor` users can read/write `ops_` tables but cannot mutate `core_` or `cfg_` tables.
    *   `admin` users have full access.
    *   No user (not even admin) can UPDATE or DELETE rows in `log_audit_trail` or `log_ticket_lifecycle`.